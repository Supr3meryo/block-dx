/* global swal */

const { ipcRenderer } = require('electron');
const fs = require('fs-extra-promise');
const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const configurationTypes = require('../constants/configuration-types');

class SelectSetupType extends RouterView {

  constructor(options) {
    super(options);
  }

  render(state) {

    const { $target } = this;

    const configurationType = state.get('configurationType');
    const quickSetup = state.get('quickSetup');
    const isFirstRun = state.get('isFirstRun');

    const styles = {
      p: 'margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:20px;',
      flexContainer: 'display:flex;flex-direction:row;flex-wrap:no-wrap;justify-content:flex-start;',
      flexCol1: 'width: 30px;',
      mainArea: 'margin-top:-10px;padding-top:0;background-color:#0e2742;overflow-y:auto;'
    };

    const html = `
          <h3>CONFIGURATION SETUP</h3>
          <div class="container">
            <div class="flex-container">
              <div class="col2-no-margin">
            
                <p style="${styles.p}">Block DX is the fastest, most secure, most reliable, and most decentralized exchange, allowing for peer-to-peer trading directly from your wallet.</p>
                <p style="${styles.p}"><strong>Prerequisites</strong>: Block DX requires the <a href="#" class="text-link">latest Blocknet wallet</a> and the wallets of any tokens you want to trade with.</p>
                <div class="main-area" style="${styles.mainArea}">
                
                  <div id="js-automaticCredentials" class="main-area-item" style="${styles.flexContainer}">
                    <div style="${styles.flexCol1}">
                      <i class="${quickSetup ? 'fa' : 'far'} fa-circle radio-icon"></i> 
                    </div>
                    <div>
                      <div><strong>Quick Setup</strong> (recommended)</div>
                        ${configurationType === configurationTypes.UPDATE_WALLETS ?
                          '<div>This option reconfigures the wallets with default settings.</div>'
                          :
                          '<div>This option automatically detects the wallets installed and simplifies the process to configure them for trading.</div>'
                        }
                      </div>
                    </div>
                  
                  <div id="js-manualCredentials" class="main-area-item" style="${styles.flexContainer}">
                    <div style="${styles.flexCol1}">
                      <i class="${!quickSetup ? 'fa' : 'far'} fa-circle radio-icon"></i> 
                    </div>
                    <div>
                      <div><strong>Expert Setup</strong> (advanced users only)</div>
                        <div>
                        ${configurationType === configurationTypes.UPDATE_WALLETS ?
                          '<div>This option allows you to specify the wallet versions, data directory locations, and RPC credentials.</div>'
                          :
                          '<div>This option allows you to specify which wallets to configure, their data directory locations, and RPC credentials.</div>'
                          }
                      </div>
                    </div>
                  </div>
                
                </div>
              
                <div id="js-buttonContainer" class="button-container">
                  <button id="js-backBtn" type="button" class="gray-button">${isFirstRun ? 'CANCEL' : 'BACK'}</button>
                  <button id="js-continueBtn" type="button">CONTINUE</button>
                </div>
              
              </div>
            </div>
          </div>
        `;
    $target.html(html);
  }

  onMount(state, router) {
    const { $ } = this;
    const toggleCredentialGeneration = e => {
      e.preventDefault();
      const quickSetup = state.get('quickSetup');
      state.set('quickSetup', !quickSetup);
      const $automatic = $('#js-automaticCredentials').find('i');
      const $manual = $('#js-manualCredentials').find('i');
      if(quickSetup) {
        $automatic.addClass('far');
        $automatic.removeClass('fa');
        $manual.addClass('fa');
        $manual.removeClass('far');
      } else {
        $automatic.addClass('fa');
        $automatic.removeClass('far');
        $manual.addClass('far');
        $manual.removeClass('fa');
      }
    };
    $('#js-automaticCredentials').on('click', toggleCredentialGeneration);
    $('#js-manualCredentials').on('click', toggleCredentialGeneration);
    $('#js-backBtn').on('click', e => {
      e.preventDefault();
      const isFirstRun = state.get('isFirstRun');
      if(isFirstRun) {
        ipcRenderer.send('configurationWindowCancel');
      } else {
        router.goTo(route.CONFIGURATION_MENU);
      }
    });
    $('#js-continueBtn').on('click', e => {
      e.preventDefault();
      if(state.get('quickSetup')) {
        const wallets = state.get('wallets');
        const blocknetWallet = wallets.find(w => w.abbr === 'BLOCK');
        const dir = blocknetWallet.getDefaultDirectory();
        try {
          fs.statSync(dir);
          router.goTo(route.SELECT_WALLET_VERSIONS);
        } catch(err) {
          swal({
            text: 'An installation of the Blocknet wallet was not found, but is required to use Block DX. Please install the Blocknet wallet before continuing.',
            type: 'warning'
          });
        }
      } else {
        router.goTo(route.SELECT_WALLETS);
      }
    });
  }

}

module.exports = SelectSetupType;
