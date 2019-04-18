const { ipcRenderer } = require('electron');
const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const configurationTypes = require('../constants/configuration-types');

class ConfigurationMenu extends RouterView {

  constructor(options) {
    super(options);
  }

  render(state) {

    const { $target } = this;

    const configurationType = state.get('configurationType');

    const styles = {
      p: 'margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:20px;',
      flexContainer: 'display:flex;flex-direction:row;flex-wrap:no-wrap;justify-content:flex-start;',
      flexCol1: 'width: 30px;',
      mainArea: 'margin-top:-10px;padding-top:0;background-color:#0e2742;overflow-y:auto;'
    };

    const items = [
      {
        title: 'Add New Wallet(s)',
        text: 'We detected you have previously configured your wallets. Please select which of the following you would like to do:',
        value: configurationTypes.ADD_NEW_WALLETS
      },
      {
        title: 'Update Wallet(s)',
        text: 'Use this to reconfigure existing wallet(s).',
        value: configurationTypes.UPDATE_WALLETS
      },
      {
        title: 'Fresh Setup',
        text: 'Use this to reconfigure all your wallets. This will require all wallets to be restarted before trading, which will cancel any open and in-progress orders.',
        value: configurationTypes.FRESH_SETUP
      },
      {
        title: 'Update Blocknet RPC Settings',
        text: 'Use this to update the RPC credentials, port, and IP for the Blocknet wallet. This will require the Blocknet wallet to be restarted, which will cancel any open and in-progress orders.',
        value: configurationTypes.UPDATE_RPC_SETTINGS
      }
    ];

    const options = items.map(i => {
      return `
        <div class="js-selectConfigurationType main-area-item" data-value="${i.value}" style="${styles.flexContainer}">
          <div style="${styles.flexCol1}">
            <i class="${configurationType === i.value ? 'fa' : 'far'} fa-circle radio-icon"></i> 
          </div>
          <div>
            <div><strong>${i.title}</strong></div>
            <div>${i.text}</div>
          </div>
        </div>
      `;
    }).join('\n');

    const html = `
          <h3>CONFIGURATION SETUP</h3>
          <div class="container">
            <div class="flex-container">
              <div class="col2-no-margin">
            
                <p style="${styles.p}">We detected you have previously configured your wallets. Please select which of the following you would like to do:</p>

                <div class="main-area" style="${styles.mainArea}">
                
                  ${options}
                  
                </div>
              
                <div id="js-buttonContainer" class="button-container">
                  <button id="js-backBtn" type="button" class="gray-button">CANCEL</button>
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

    $('#js-backBtn').on('click', e => {
      e.preventDefault();
      ipcRenderer.send('configurationWindowCancel');
    });

    $('#js-continueBtn').on('click', e => {
      e.preventDefault();
      const configurationType = state.get('configurationType');
      switch(configurationType) {
        case configurationTypes.ADD_NEW_WALLETS:
          router.goTo(route.SELECT_SETUP_TYPE);
          break;
        case configurationTypes.UPDATE_WALLETS:
          router.goTo(route.SELECT_SETUP_TYPE);
          break;
        case configurationTypes.FRESH_SETUP:
          router.goTo(route.SELECT_SETUP_TYPE);
          break;
        case configurationTypes.UPDATE_RPC_SETTINGS:
          ipcRenderer.send('openSettings');
          break;
      }
    });

    $('.js-selectConfigurationType').on('click', e => {
      e.preventDefault();
      const configurationType = $(e.currentTarget).attr('data-value');
      state.set('configurationType', configurationType);
      const $items = $('.js-selectConfigurationType');
      for(let i = 0; i < $items.length; i++) {
        const $item = $($items[i]);
        const $i = $item.find('i');
        if($item.attr('data-value') === configurationType) {
          $i.addClass('fa');
          $i.removeClass('far');
        } else {
          $i.addClass('far');
          $i.removeClass('fa');
        }
      }
    });
  }

}

module.exports = ConfigurationMenu;
