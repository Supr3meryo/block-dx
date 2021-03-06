import { Component, Input, TemplateRef, ViewChild, OnInit, NgZone } from '@angular/core';

import { BaseComponent } from './base.component';
import { AppService } from './app.service';
import { Openorder } from './openorder';
import { OpenordersService } from './openorders.service';
import { BreakpointService } from './breakpoint.service';
import * as math from 'mathjs';
import { PricingService } from './pricing.service';
import { Pricing } from './pricing';
import * as OrderStates from '../orderstates';

math.config({
  number: 'BigNumber',
  precision: 64
});

@Component({
  selector: 'app-openorders',
  templateUrl: './openorders.component.html',
  styleUrls: ['./open-orders.component.scss']
})
export class OpenordersComponent extends BaseComponent implements OnInit {
  public openorders: Openorder[];
  public selectable: boolean;
  public pricing: Pricing;
  public pricingEnabled = false;
  public pricingAvailable = false;
  public longestTokenLength: number;

  private _symbols: string[] = [];
  public get symbols(): string[] { return this._symbols; }
  public set symbols(val:string[]) {
    this._symbols = val;
  }

  constructor(
    private appService: AppService,
    private openorderService: OpenordersService,
    private breakpointService: BreakpointService,
    private pricingService: PricingService,
    private zone: NgZone
  ) { super(); }

  ngOnInit() {

    this.appService.marketPairChanges
      .takeUntil(this.$destroy)
      .subscribe((symbols) => {
        this.zone.run(() => {
          if(symbols) {
            this.symbols = symbols;
          }
        });
      });

    this.openorderService.getOpenorders()
      .takeUntil(this.$destroy)
      .subscribe(openorders => {
        this.zone.run(() => {
          const orders = openorders
            .filter(o => o.status !== OrderStates.Finished && 
                        o.status !== OrderStates.Canceled && 
                        o.status !== OrderStates.Expired && 
                        o.status !== OrderStates.Offline && 
                        o.status !== OrderStates.Invalid && 
                        o.status !== OrderStates.RolledBack)
            .map((o) => {
              o['row_class'] = o.side;
              return o;
            });
          this.openorders = orders;
          const tokens = openorders
            .reduce((arr, o) => {
              return [...arr, o.maker, o.taker];
            }, [])
            .sort((a, b) => a.length === b.length ? 0 : a.length > b.length ? -1 : 1);
          this.longestTokenLength = tokens.length > 0 ? tokens[0].length : 0;
        });
      });

    this.breakpointService.breakpointChanges.first()
      .takeUntil(this.$destroy)
      .subscribe((bp) => {
        this.zone.run(() => {
          this.selectable = ['xs', 'sm'].includes(bp);
        });
      });

    this.pricingService.getPricing()
      .takeUntil(this.$destroy)
      .subscribe(pricing => {
        this.zone.run(() => {
          this.pricing = pricing;
          this.pricingAvailable = pricing.enabled;
        });
      });
    this.pricingService.getPricingEnabled()
      .takeUntil(this.$destroy)
      .subscribe(enabled => {
        this.zone.run(() => {
          this.pricingEnabled = enabled;
        });
      });

  }

  cancelOrder(order) {
    const { electron } = window;
    order.canceled = true;
    order['row_class'] = 'canceled';
    electron.ipcRenderer
      .send('cancelOrder', order.id);
  }

  prepareNumber(num) {
    return math.round(num, 6);
  }

  cancelable(state) {
    return ![OrderStates.Finished, OrderStates.Canceled, OrderStates.Created,
      OrderStates.RollbackFailed, OrderStates.RolledBack].includes(state);
  }

  padToken(token) {
    const diff = this.longestTokenLength - token.length;
    for(let i = 0; i < diff; i++) {
      token += ' ';
    }
    return token;
  }

  // getStatusDotColor(status) {
  //   if([OrderStates.New].includes(status)) {
  //     return '#888';
  //   } else if([OrderStates.Accepting, OrderStates.Hold, OrderStates.Initialized,
  //     OrderStates.Created, OrderStates.Committed].includes(status)) {
  //     return '#ff0';
  //   } else if([OrderStates.Finished].includes(status)) {
  //     return '#0f0';
  //   } else if([OrderStates.Expired, OrderStates.Offline, OrderStates.Invalid,
  //     OrderStates.RolledBack].includes(status)) {
  //     return '#c00';
  //   } else if([OrderStates.RollbackFailed].includes(status)) {
  //     return '#ea00ff';
  //   } else if([OrderStates.Canceled].includes(status)) {
  //     return '#000';
  //   } else { // open
  //     return '#fff';
  //   }
  // }

}
