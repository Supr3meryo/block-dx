const { ipcRenderer } = require('electron');
const { dialog, app } = require('electron').remote;
const fs = require('fs-extra-promise');
const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const configurationTypes = require('../constants/configuration-types');
const { removeNonWordCharacters } = require('../util');
const footerButtons = require('../snippets/footer-buttons');
const sidebar = require('../snippets/sidebar');

const { platform } = process;

class SelectWalletDirectories extends RouterView {

  constructor(options) {
    super(options);
  }

  onBeforeMount(state) {

    const configurationType = state.get('configurationType');
    const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
    const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
    const selectedListName = addingWallets ? 'addWallets' : updatingWallets ? 'updateWallets' : 'selectedWallets';

    const allWallets = state.get('wallets');
    const selectedWallets = state.get(selectedListName);
    const newWallets = allWallets
      .map(w => {
        if(!selectedWallets.has(w.versionId)) return w;
        try {
          if(w.directory) {
            fs.statSync(w.directory);
            w = w.set('error', false);
          } else {
            const fullPath = w.getDefaultDirectory();
            fs.statSync(fullPath);
            w = w.set({
              directory: fullPath,
              error: false
            });
          }
          return w;
        } catch(err) {
          // console.error(err);
          w = w.set({
            directory: '',
            error: true
          });
          return w;
        }
      });
    state.set('wallets', newWallets);
  }

  render(state) {

    const { $target } = this;

    const configurationType = state.get('configurationType');
    const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
    const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
    const selectedListName = addingWallets ? 'addWallets' : updatingWallets ? 'updateWallets' : 'selectedWallets';

    const allWallets = state.get('wallets');
    const selectedWallets = state.get(selectedListName);
    const wallets = allWallets
      .filter(w => selectedWallets.has(w.versionId));
    const items = wallets
      .map(w => {
        return `
              <div class="main-area-item2">
                <div style="display:flex;flex-direction:row:flex-wrap:nowrap;justify-content:space-between;">
                  <div>${w.name}</div>
                  <div id="${removeNonWordCharacters(w.versionId)}-error" class="text-danger" style="display:${w.error || !w.directory ? 'block' : 'none'};text-align:right;">Error: data directory not found</div>
                </div>
                <div style="margin-top:10px;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:flex-start;">
                  <input id="${removeNonWordCharacters(w.versionId)}" type="text" value="${w.directory}" readonly />
                  <button class="js-browseBtn" type="button" data-id="${w.versionId}" style="margin-top:0;margin-right:0;width:100px;min-width:100px;">BROWSE</button>
                </div>
              </div>
              <div style="height:1px;"></div>
            `;
      })
      .join('\n');
    const missingDirectories = wallets
      .reduce((num, w) => {
        return (!w.error && w.directory) ? num : num + 1;
      }, 0);
    const html = `
      <h3>CONFIGURATION SETUP</h3>
      <div class="container">
        <div class="flex-container">
          <div class="col1">
            ${sidebar(0)}
          </div>
          <div class="col2">
          
          <p style="margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:5px;">Configuration files will be installed to these default data directories. To accept the default locations, select 'Continue'. To change the location, select 'Browse'.</p>
          <p id="js-errors" class="text-danger" style="display:${missingDirectories > 0 ? 'block' : 'none'};margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:10px;"><span id="js-errorCount">${missingDirectories}</span> error(s) exist; continue to skip wallets with errors.</p>
          <div id="js-mainConfigurationArea" class="main-area">
            ${items}
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
      router.goTo(route.EXPERT_SELECT_WALLET_VERSIONS);
    });

    $('#js-continueBtn').on('click', e => {
      e.preventDefault();
      const wallets = state.get('wallets');

      const configurationType = state.get('configurationType');
      const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
      const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
      const selectedListName = addingWallets ? 'addWallets' : updatingWallets ? 'updateWallets' : 'selectedWallets';
      const selected = state.get(selectedListName);

      const hasErrors = wallets
        .filter(w => selected.has(w.versionId))
        .filter(w => w.error);
      if(hasErrors.length > 0) {
        const newSelected = hasErrors
          .reduce((set, w) => {
            return set.delete(w.versionId);
          }, selected);
        state.set(selectedListName, newSelected);

        const abbrListName = addingWallets ? 'addAbbrs' : updatingWallets ? 'updateWallets' : 'selectedAbbrs';
        const newSelectedAbbrs = hasErrors
          .reduce((set, w) => {
            return set.delete(w.abbr);
          }, state.get(abbrListName));
        state.set(abbrListName, newSelectedAbbrs);
      }
      router.goTo(route.EXPERT_SELECT_SETUP_TYPE);
    });

    $('.js-browseBtn').on('click', e => {
      e.preventDefault();
      const versionId = $(e.currentTarget).attr('data-id');
      const wallets = state.get('wallets');
      const idx = wallets.findIndex(w => w.versionId === versionId);
      dialog.showOpenDialog({
        title: `${wallets[idx].name} Data Directory`,
        defaultPath: platform === 'linux' ? ipcRenderer.sendSync('getHomePath') : app.getPath('appData'),
        properties: ['openDirectory']
      }, (paths = []) => {
        const [directoryPath] = paths;
        if (directoryPath) {
          $(`#${removeNonWordCharacters(versionId)}`).val(directoryPath);
          $(`#${removeNonWordCharacters(versionId)}-error`).css('display', 'none');
          const newWallets = [
            ...wallets.slice(0, idx),
            wallets[idx].set({directory: directoryPath, error: false}),
            ...wallets.slice(idx + 1)
          ];
          state.set('wallets', newWallets);

          const configurationType = state.get('configurationType');
          const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
          const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
          const selectedListName = addingWallets ? 'addWallets' : updatingWallets ? 'updateWallets' : 'selectedWallets';
          const selectedWallets = state.get(selectedListName);

          const filtered = newWallets
            .filter(w => selectedWallets.has(w.versionId));
          const errorCount = filtered.reduce((num, w) => (!w.error && w.directory) ? num : num + 1, 0);
          if (errorCount === 0) {
            $('#js-errors').css('display', 'none');
          } else {
            $('#js-errorCount').text(errorCount);
            $('#js-errors').css('display', 'block');
          }
        }
      });
    });
  }

}

module.exports = SelectWalletDirectories;
