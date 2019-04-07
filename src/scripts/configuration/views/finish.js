const { ipcRenderer } = require('electron');
const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const configurationTypes = require('../constants/configuration-types');
const { saveConfs, addConfs, updateConfs } = require('../util');
const sidebar = require('../snippets/sidebar');

class Finish extends RouterView {

  constructor(options) {
    super(options);
  }

  render() {

    const { $target } = this;

    const styles = {
      p: 'margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:20px;',
      mainArea: 'margin-top:-10px;padding-top:0;background-color:#0e2742;overflow-y:auto;'
    };

    const html = `
          <h3>CONFIGURATION COMPLETE!</h3>
          <div class="container">
            <div class="flex-container">
              <div class="col1">
                ${sidebar(1)}
              </div>
              <div class="col2-no-margin">
            
                <p style="${styles.p}">Upon selecting 'Finish', the configurations set will be saved.</p>

                <div class="main-area" style="${styles.mainArea}"></div>
                <div id="js-buttonContainer" class="button-container">
                  <button id="js-backBtn" type="button" class="gray-button">BACK</button>
                  <button id="js-continueBtn" type="button">FINISH</button>
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
      router.goTo(route.EXPERT_SELECT_SETUP_TYPE);
    });

    $('#js-continueBtn').on('click', e => {
      e.preventDefault();
      const wallets = state.get('wallets');

      const configurationType = state.get('configurationType');
      const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
      const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
      const selectedListName = addingWallets ? 'addWallets' : updatingWallets ? 'updateWallets' : 'selectedWallets';

      const selectedWallets = state.get(selectedListName);

      let filtered = wallets
          .filter(w => selectedWallets.has(w.versionId));
      if(!state.get('skipSetup')) {
        filtered = filtered
          .map(w => {
            if(state.get('generateCredentials')) {
              if(updatingWallets && w.abbr === 'BLOCK') {
                return w.set({
                  username: ipcRenderer.sendSync('getUser'),
                  password: ipcRenderer.sendSync('getPassword')
                });
              } else {
                const credentials = w.generateCredentials();
                return w.set({
                  username: credentials.username,
                  password: credentials.password
                });
              }
            } else {
              return w;
            }
          });
        if(addingWallets || updatingWallets) {
          let selected = state.get('selectedWallets');
          for(const { abbr, versionId } of filtered) {
            const filteredWallets = wallets.filter(w => w.abbr === abbr);
            for(const w of filteredWallets) {
              selected = selected.delete(w.versionId);
            }
            selected = selected.add(versionId);
          }
          const block = state.get('wallets').find(w => w.abbr === 'BLOCK');
          if(addingWallets) {
            addConfs(filtered, block.directory);
          } else { // updating wallets
            updateConfs(filtered, block.directory);
            if(filtered.some(w => w.abbr === 'BLOCK')) {
              const port = state.get('rpcPort');
              const rpcIP = state.get('rpcIP');
              ipcRenderer.sendSync('saveDXData', block.username, block.password, port, rpcIP);
            }
          }
          ipcRenderer.sendSync('saveSelected', [...selected]);
        } else {
          saveConfs(filtered);
        }
      }

      if(!addingWallets && !updatingWallets) {
        const block = filtered
          .find(w => w.abbr === 'BLOCK');
        const { username, password } = block;
        const port = state.get('rpcPort');
        const rpcIP = state.get('rpcIP');
        ipcRenderer.sendSync('saveDXData', username, password, port, rpcIP);
        ipcRenderer.sendSync('saveSelected', [...selectedWallets]);
      }
      router.goTo(route.CONFIGURATION_COMPLETE);
    });
  }

}

module.exports = Finish;
