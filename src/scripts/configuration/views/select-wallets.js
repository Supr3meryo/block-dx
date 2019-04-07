const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const footerButtons = require('../snippets/footer-buttons');
const sidebar = require('../snippets/sidebar');
const configurationTypes = require('../constants/configuration-types');

class SelectWallets extends RouterView {

  constructor(options) {
    super(options);
  }

  render(state) {

    const { $target } = this;

    const configurationType = state.get('configurationType');
    const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
    const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;

    const selected = addingWallets ? state.get('addAbbrs') : updatingWallets ? state.get('updateAbbrs') : state.get('selectedAbbrs');
    const items = state
      .get('wallets')
      .filter(w => addingWallets ? !state.get('selectedAbbrs').has(w.abbr) : updatingWallets ? state.get('selectedAbbrs').has(w.abbr) : true)
      .reduce((arr, w) => {
        return arr.some(ww => ww.abbr === w.abbr) ? arr : [...arr, w];
      }, []);
    const skip = state.get('skipSetup');
    const html = `
      <h3>CONFIGURATION SETUP</h3>
      <div class="container">
        <div class="flex-container">
          <div class="col1">
            ${sidebar(0)}
          </div>
          <div class="col2">
            <p style="margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:10px;">${updatingWallets ? 'Select the wallets that you would like to update.' : 'In order to conduct peer-to-peer trades, Block DX requires the <a href="#" class="blocknet-link js-blocknetWalletLink">Blocknet wallet</a> and the wallets of any tokens you want to trade with. Select the wallets that are installed to begin setup.'}</p>
            <div id="js-mainConfigurationArea" class="main-area" style="position:relative;${skip ? 'opacity:.6;overflow-y:hidden;' : 'opacity:1;overflow-y:scroll;'}">
              ${items
      .map(i => {
        if(!updatingWallets && i.abbr === 'BLOCK') {
          return `<div class="main-area-item" style="cursor:default;opacity:1;"><i class="far fa-check-square radio-icon"></i> ${i.name} (${i.abbr})</div>`;
        } else {
          return `<div class="js-mainAreaItem main-area-item" data-id="${i.abbr}"><i class="far ${selected.has(i.abbr) ? 'fa-check-square' : 'fa-square'} radio-icon"></i> ${i.name} (${i.abbr})</div>`;
        }
      })
      .join('\n')
      }
            <div id="js-overlay" style="display:${skip ? 'block' : 'none'};position:absolute;left:0;top:0;width:100%;height:100%;background-color:#000;opacity:0;"></div>
          </div>
          <div style="display:${(updatingWallets || addingWallets) ? 'none' : 'block'};padding: 10px; cursor: pointer;padding-bottom:0;">
            <div id="js-skip" class="main-area-item"><i class="far ${skip ? 'fa-check-square' : 'fa-square'} radio-icon"></i> Skip and setup Block DX manually (not recommended)</div>
          </div>
          ${footerButtons()}
          </div>
        </div>
      </div>
    `;
    $target.html(html);
  }

  onMount(state, router) {
    const { $ } = this;

    $('.js-mainAreaItem')
      .off('click')
      .on('click', e => {
        e.preventDefault();

        const configurationType = state.get('configurationType');
        const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
        const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;

        const abbr = $(e.currentTarget).attr('data-id');
        const $target = $(e.currentTarget).find('i');
        const selectedListName = addingWallets ? 'addAbbrs' : updatingWallets ? 'updateAbbrs' : 'selectedAbbrs';
        const selectedAbbrs = state.get(selectedListName);
        if(selectedAbbrs.has(abbr)) { // it is checked
          $target.addClass('fa-square');
          $target.removeClass('fa-check-square');
          state.set(selectedListName, selectedAbbrs.delete(abbr));
        } else { // it is not checked
          $target.addClass('fa-check-square');
          $target.removeClass('fa-square');
          state.set(selectedListName, selectedAbbrs.add(abbr));
        }
      });

    $('#js-skip')
      .off('click')
      .on('click', e => {
        e.preventDefault();
        const skip = state.get('skipSetup');
        const $main = $('#js-mainConfigurationArea');
        const $overlay = $('#js-overlay');
        const $target = $(e.currentTarget).find('i');
        if(skip) { // it is checked
          $target.addClass('fa-square');
          $target.removeClass('fa-check-square');
          $main.css('overflow-y', 'scroll');
          $main.css('opacity', '1');
          state.set('skipSetup', false);
          $overlay.css('display', 'none');
        } else { // it is not checked
          $target.addClass('fa-check-square');
          $target.removeClass('fa-square');
          $main.css('opacity', '.3');
          $main.css('overflow-y', 'hidden');
          state.set('skipSetup', true);
          $overlay.css('display', 'block');
        }
      });

    $('#js-backBtn').on('click', e => {
      e.preventDefault();
      router.goTo(route.SELECT_SETUP_TYPE);
    });

    $('#js-continueBtn').on('click', e => {
      e.preventDefault();
      const skip = state.get('skipSetup');
      if(skip) {
        router.goTo(route.ENTER_BLOCKNET_CREDENTIALS);
      } else {
        router.goTo(route.EXPERT_SELECT_WALLET_VERSIONS);
      }
    });
  }

}

module.exports = SelectWallets;
