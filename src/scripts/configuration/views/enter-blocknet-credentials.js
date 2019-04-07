/* global swal */

const { ipcRenderer } = require('electron');
const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const footerButtons = require('../snippets/footer-buttons');
const sidebar = require('../snippets/sidebar');

class EnterBlocknetCredentials extends RouterView {

  constructor(options) {
    super(options);
  }

  render(state) {

    const { $target } = this;

    const skipSetup = state.get('skipSetup');

    const block = state.get('wallets').find(w => w.abbr === 'BLOCK');

    const styles = {
      p: 'margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:20px;',
      mainArea: 'margin-top:-10px;padding-top:0;background-color:#0e2742;overflow-y:auto;'
    };

    const html = `
          <h3>CONFIGURATION SETUP</h3>
          <div class="container">
            <div class="flex-container">
              <div class="col1">
                ${sidebar(1)}
              </div>
              <div class="col2-no-margin">
            
          <p style="${styles.p}">In order to conduct peer-to-peer trades, Block DX requires access to the <a href="#" class="blocknet-link js-blocknetWalletLink">Blocknet wallet</a>. Please enter the RPC credentials found in <em>blocknetdx.conf</em>.</p>
          <div class="main-area" style="${styles.mainArea}">
            <div class="input-group">
              <label>Blocknet RPC Port</label>
              <input id="js-rpcPort" type="text" value="${state.get('rpcPort')}" ${skipSetup ? '' : 'readonly'} />
            </div>
            <div class="input-group">
              <label>Blocknet RPC User</label>
              <input id="js-rpcUser" type="text" value="${block.username}" />
            </div>
            <div class="input-group">
              <label>Blocknet RPC Password</label>
              <input id="js-rpcPassword" type="text" value="${block.password}" />
            </div>
            <div class="input-group">
              <label>Blocknet IP</label>
              <input id="js-rpcIP" type="text" value="${state.get('rpcIP')}" />
            </div>
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

    $('#js-backBtn').on('click', e => {
      e.preventDefault();
      const skipSetup = state.get('skipSetup');
      if(skipSetup) {
        router.goTo(route.SELECT_WALLETS);
      } else {
        router.goTo(route.ENTER_WALLET_CREDENTIALS);
      }
    });

    $('#js-continueBtn').on('click', async function(e) {
      e.preventDefault();

      const wallets = state.get('wallets');
      const block = wallets
        .find(w => w.abbr === 'BLOCK');
      const { username, password } = block;

      if(!username || !password) {
        await swal({
          title: 'Missing Credentials',
          text: `You must enter credentials for ${block.name} in order to continue.`,
          type: 'error',
          showConfirmButton: true,
          confirmButtonText: 'OK'
        });
        return;
      }

      const port = state.get('rpcPort');
      const rpcIP = state.get('rpcIP');
      ipcRenderer.sendSync('saveDXData', username, password, port, rpcIP);
      ipcRenderer.sendSync('saveSelected', [...state.get('selectedWallets')]);

      router.goTo(route.FINISH);
    });

    $('#js-rpcPort').on('change', e => {
      const value = e.target.value.trim();
      state.set('rpcPort', value);
    });

    $('#js-rpcIP').on('change', e => {
      const value = e.target.value.trim();
      state.set('rpcIP', value);
    });

    $('#js-rpcUser').on('change', e => {
      const wallets = state.get('wallets');
      const { value } = e.target;
      const idx = wallets.findIndex(w => w.abbr === 'BLOCK');
      const newWallets = [
        ...wallets.slice(0, idx),
        wallets[idx].set({username: value.trim()}),
        ...wallets.slice(idx + 1)
      ];
      state.set('wallets', newWallets);
    });

    $('#js-rpcPassword').on('change', e => {
      const wallets = state.get('wallets');
      const { value } = e.target;
      const idx = wallets.findIndex(w => w.abbr === 'BLOCK');
      const newWallets = [
        ...wallets.slice(0, idx),
        wallets[idx].set({password: value}),
        ...wallets.slice(idx + 1)
      ];
      state.set('wallets', newWallets);
    });
  }

}

module.exports = EnterBlocknetCredentials;
