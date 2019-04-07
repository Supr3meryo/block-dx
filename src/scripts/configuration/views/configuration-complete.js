/* global swal */

const { ipcRenderer, remote } = require('electron');
const { RouterView } = require('../../modules/router');
const configurationTypes = require('../constants/configuration-types');

class ConfigurationComplete extends RouterView {

  constructor(options) {
    super(options);
  }

  render(state) {

    const { $target } = this;

    const configurationType = state.get('configurationType');
    const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;

    const styles = {
      p: 'margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:5px;',
      mainArea: ''
    };

    const html = `
      <h3>CONFIGURATION COMPLETE!</h3>
        <div class="container">
          <div class="flex-container">
            <!--div class="col1">
            </div-->
            <div class="col2-no-margin">
            ${addingWallets ?
              `
                <p style="${styles.p}">Before the newly added assets can be traded on Block DX, <strong>the wallets for each of the newly added assets must be restarted</strong> to load the new configurations.</p>
              `
            :
              `
                <p style="${styles.p}">Before Block DX can be used, these last few steps must be completed:</p>
                <p style="${styles.p}"><strong style="margin-right: 10px;">1)</strong> Open the wallets of any tokens to be traded. If any are already open, you will need to restart them in order to activate the new configurations. Make sure that the wallets have been encrypted (Settings > Encrypt) and are unlocked (Settings > Unlock Wallet).</p>
                <p style="${styles.p}"><strong style="margin-right: 10px;">2)</strong> Open the <a href="#" class="text-link js-blocknetWalletLink">Blocknet wallet</a>. If it is already open, you will need to restart it in order to activate the new configurations. Make sure that the wallet has been encrypted (Settings > Encrypt) and is unlocked (Settings > Unlock Wallet).</p>
                <p style="${styles.p}"><strong style="margin-right: 10px;">3)</strong> Select 'Restart' to restart Block DX and begin trading.</p>
              `
             }
          <div class="main-area" style="background-color:#0e2742;overflow-y:auto;"></div>
          <div id="js-buttonContainer" class="button-container">
            <button id="js-backBtn" type="button" class="gray-button">CLOSE</button>
            <button id="js-continueBtn" type="button">RESTART</button>
          </div>
              </div>
            </div>
          </div>
        `;

    $target.html(html);
  }

  onMount(state, router) {
    const { $ } = this;
    $('.js-blocknetWalletLink').on('click', e => {
      e.preventDefault();
      remote.shell.openExternal('https://github.com/BlocknetDX/BlockDX/releases/latest');
    });
    $('#js-backBtn').on('click', e => {
      e.preventDefault();
      ipcRenderer.send('quit');
    });
    $('#js-continueBtn').on('click', e => {
      e.preventDefault();
      ipcRenderer.send('restart');
    });
  }

}

module.exports = ConfigurationComplete;
