/* global swal, tippy */

const fs = require('fs-extra-promise');
const { Set } = require('immutable');
const { ipcRenderer, remote } = require('electron');
const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const configurationTypes= require('../constants/configuration-types');
const footerButtons = require('../snippets/footer-buttons');
const { compareByVersion, saveConfs, addConfs, updateConfs } = require('../util');

class SelectWalletVersions extends RouterView {

  constructor(options) {
    super(options);
  }

  onBeforeMount(state) {
    const configurationType = state.get('configurationType');
    const wallets = state.get('wallets');

    const selectedAbbrs = state.get('selectedAbbrs');
    const addAbbrToVersion = state.get('addAbbrToVersion');

    const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
    const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
    const updateAbbrToVersion = state.get('updateAbbrToVersion');

    let filteredWallets = [...wallets]
      .filter(w => {
        const dir = w.getDefaultDirectory();
        try {
          fs.statSync(dir);
          return true;
        } catch(err) {
          return false;
        }
      })
      .sort((a, b) => compareByVersion(a.versionId, b.versionId))
      .reduce((arr, w) => {
        const idx = arr.findIndex(ww => ww.abbr === w.abbr);
        if(idx > -1) { // coin is already in array
          arr[idx].versions = [...arr[idx].versions, ...w.versions];
          return arr;
        } else {
          return [...arr, w];
        }
      }, [])
      .map(w => {
        w.versions.sort(compareByVersion);
        w.version = w.versions[0];
        return w;
      });

    if(addingWallets) {
      filteredWallets = filteredWallets
        .filter(w => !selectedAbbrs.has(w.abbr))
        .map(w => {
          const version = addAbbrToVersion.get(w.abbr);
          if(version) {
            w.version = version;
          }
          return w;
        });
      if(addAbbrToVersion.size === 0) {
        state.set('addAbbrToVersion', new Map(filteredWallets.map(w => [w.abbr, w.version])));
      }
    } else if(updatingWallets) {
      filteredWallets = filteredWallets
        .filter(w => selectedAbbrs.has(w.abbr))
        .map(w => {
          const version = updateAbbrToVersion.get(w.abbr);
          if(version) {
            w.version = version;
          }
          return w;
        });
    } else {
      state.set('selectedWallets', new Set(filteredWallets.map(f => {
        const { abbr, version } = f;
        const wallet = wallets.find(w => w.abbr === abbr && w.versions.includes(version));
        return wallet.versionId;
      })));
    }
    state.set('filteredWallets', filteredWallets);
  }

  render(state) {

    const { $target } = this;

    const styles = {
      p: 'margin-top:0;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:10px;',
      bottomP: 'margin-top:10px;padding-top:0;padding-left:10px;padding-right:10px;margin-bottom:-5px;'
    };

    const configurationType = state.get('configurationType');
    const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
    const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;

    const addAbbrToVersion = state.get('addAbbrToVersion');
    const updateAbbrToVersion = state.get('updateAbbrToVersion');
    const skipList = state.get('skipList');

    const items = [...state.get('filteredWallets')]
      .map(w => {
        const checked = addingWallets ? addAbbrToVersion.has(w.abbr) : updatingWallets ? updateAbbrToVersion.has(w.abbr) : skipList.has(w.abbr);
        return `
              <div class="main-area-item2">
                <div style="display:flex;flex-direction:row:flex-wrap:nowrap;justify-content:space-between;">
                  <div>${w.name}</div>
                  <div style="display:${!updatingWallets && w.abbr === 'BLOCK' ? 'none' : 'block'};"><small><a class="js-skipBtn" href="#" data-abbr="${w.abbr}" data-version="${w.version}"><i class="far ${checked ? 'fa-check-square' : 'fa-square'} check-icon" /></a> ${addingWallets ? 'Add Wallet' : updatingWallets ? 'Update wallet' : 'Skip'}</small></div>
                </div>
                <div class="input-group" style="margin-bottom:0;margin-top:10px;">
                  <label style="flex-basis:0;flex-grow:1;">Wallet Version</label>
                  <div class="js-versionDropdownButton dropdown-button" data-abbr="${w.abbr}" data-version="${w.version}" style="flex-basis:0;flex-grow:1;position:relative;">
                    <div style="margin-left:10px;">${w.version}</div>
                    <div><i class="fas fa-angle-down radio-icon" style="margin-right:0;font-size:20px;"></i></div>
                  </div>
                </div>
              </div>
              <div style="height:1px;"></div>
            `;
      })
      .join('\n');

    const html = `
          <h3>CONFIGURATION SETUP</h3>
          <div class="container">
            <div class="flex-container">
              <div class="col2-no-margin">
              
                <p style="${styles.p}">Please select the version of the wallet installed for each of the following tokens. <strong>DO NOT</strong> use any wallet versions not listed here. They have either not been tested yet or are not compatible.</p>
                <div id="js-mainConfigurationArea" class="main-area">
                  ${items}
                </div>
                <div style="display:block;">
                <div class="js-tippyContent">
                  <ul style="text-align:left;">
                    <li>Lite wallets, online wallets, and Electrum wallets are not supported yet.</li>
                    <li>Not all assets are supported. <a class="js-supportedAssetsLink" href="'#">See list of supported assets.</a></li>
                    <li>Quick Setup only checks default install locations. If using a custom install location, use Expert Setup.</li>
                  </ul>
                </div>
                </div>
                <div style="${styles.bottomP}">Don't see a wallet in the list? <sup><i class="fas fa-question-circle js-tippyTrigger" /></sup></div>
                
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
      router.goTo(route.SELECT_SETUP_TYPE);
    });

    $('#js-continueBtn').on('click', async function(e) {
      e.preventDefault();

      const configurationType = state.get('configurationType');
      const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
      const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
      const addAbbrToVersion = state.get('addAbbrToVersion');
      const updateAbbrToVersion = state.get('updateAbbrToVersion');

      const wallets = state.get('wallets');
      let selectedWallets = state.get('selectedWallets');
      const skipList = state.get('skipList');

      if(updatingWallets && updateAbbrToVersion.size === 0) {
        const { dismiss } = await swal({
          text: 'No wallets have been selected to update.',
          type: 'warning',
          showConfirmButton: true,
          confirmButtonText: 'Edit',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          reverseButtons: true
        });
        if(dismiss === 'cancel') ipcRenderer.send('closeConfigurationWindow');
        return;
      }

      const filtered = wallets
        .filter(w => addingWallets ? addAbbrToVersion.has(w.abbr) : updatingWallets ? updateAbbrToVersion.has(w.abbr) : !skipList.has(w.abbr))
        .filter(w => addingWallets ? w.versions.includes(addAbbrToVersion.get(w.abbr)) : updatingWallets ? w.versions.includes(updateAbbrToVersion.get(w.abbr)) : selectedWallets.has(w.versionId))
        .map(w => {
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
        });

      if(addingWallets) {
        for(const [ abbr, version ] of addAbbrToVersion.entries()) {
          const filteredWallets = wallets.filter(w => w.abbr === abbr);
          const selectedWallet = wallets.find(w => w.abbr === abbr && w.versions.includes(version));
          for(const w of filteredWallets) {
            selectedWallets = selectedWallets.delete(w.versionId);
          }
          selectedWallets = selectedWallets.add(selectedWallet.versionId);
        }
      } else if(updatingWallets) {
        for(const [ abbr, version ] of updateAbbrToVersion.entries()) {
          const filteredWallets = wallets.filter(w => w.abbr === abbr);
          const selectedWallet = wallets.find(w => w.abbr === abbr && w.versions.includes(version));
          for(const w of filteredWallets) {
            selectedWallets = selectedWallets.delete(w.versionId);
          }
          selectedWallets = selectedWallets.add(selectedWallet.versionId);
        }
      } else {
        for(const versionId of [...selectedWallets]) {
          if(!filtered.some(w => w.versionId === versionId)) selectedWallets = selectedWallets.delete(versionId);
        }
      }

      if(addingWallets) {
        const block = wallets
          .find(w => w.abbr === 'BLOCK');
        addConfs(filtered, block.directory);
      } else if(updatingWallets) {
        const block = wallets
          .find(w => w.abbr === 'BLOCK');
        updateConfs(filtered, block.directory);
      } else {
        saveConfs(filtered);
        const block = filtered
          .find(w => w.abbr === 'BLOCK');
        const { username, password } = block;
        const port = state.get('rpcPort');
        const rpcIP = state.get('rpcIP');
        ipcRenderer.sendSync('saveDXData', username, password, port, rpcIP);
      }

      ipcRenderer.sendSync('saveSelected', [...selectedWallets]);

      router.goTo(route.CONFIGURATION_COMPLETE);
    });

    $('.js-skipBtn').on('click', e => {
      e.preventDefault();
      const $target = $(e.currentTarget);
      const $icon = $target.find('i');
      const abbr = $target.attr('data-abbr');
      const version = $target.attr('data-version');
      const configurationType = state.get('configurationType');
      const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
      const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;
      let addAbbrToVersion = state.get('addAbbrToVersion');
      let updateAbbrToVersion = state.get('updateAbbrToVersion');
      let skipList = state.get('skipList');

      if(updatingWallets ? updateAbbrToVersion.has(abbr) : addAbbrToVersion.has(abbr)) {
        $icon.addClass('fa-square');
        $icon.removeClass('fa-check-square');
        if(updatingWallets) {
          updateAbbrToVersion.delete(abbr);
          state.set('updateAbbrToVersion', updateAbbrToVersion);
        } else if(addingWallets) {
          addAbbrToVersion.delete(abbr);
          state.set('addAbbrToVersion', updateAbbrToVersion);
        }
      } else {
        skipList = skipList.add(abbr);
        $icon.addClass('fa-check-square');
        $icon.removeClass('fa-square');
        if(updatingWallets) {
          updateAbbrToVersion = updateAbbrToVersion.set(abbr, version);
          state.set('updateAbbrToVersion', updateAbbrToVersion);
        } else if(addingWallets) {
          addAbbrToVersion = addAbbrToVersion.set(abbr, version);
          state.set('addAbbrToVersion', addAbbrToVersion);
        }
      }
      if(!updatingWallets) state.set('skipList', skipList);
    });

    const { openExternal } = remote.shell;
    $('.js-supportedAssetsLink').on('click', e => {
      e.preventDefault();
      openExternal('https://docs.blocknet.co/blockdx/listings');
    });
    tippy($('.js-tippyTrigger')[0], {
      interactive: true,
      animateFill: false,
      theme: 'block',
      content: $('.js-tippyContent')[0]
    });

    $('.js-versionDropdownButton').on('click', e => {
      e.preventDefault();

      const closeDropdowns = callback => {
        const $target = $('#js-mainConfigurationArea');
        const $icons = $target.find('i.fa-angle-up');
        $target.find('.js-dropdownMenu').remove();
        $icons
          .addClass('fa-angle-down')
          .removeClass('fa-angle-up');
        if(callback) setTimeout(callback, 0);
      };

      $('#js-mainConfigurationArea')
        .off('click')
        .on('click', ee => {
          const $target = $(ee.target);
          if(!$target.hasClass('js-versionDropdownButton') && !$target.parent().hasClass('js-versionDropdownButton')) {
            closeDropdowns();
          }
        });

      const $target = $(e.currentTarget);
      const abbr = $target.attr('data-abbr');
      const wallets = state.get('wallets');
      const versions = wallets.find(w => w.abbr === abbr).versions;
      const $icon = $target.find('i');
      if($icon.hasClass('fa-angle-down')) { // dropdown currently closed

        const height = $target.outerHeight();
        const width = $target.outerWidth();

        closeDropdowns(() => {

          $icon.addClass('fa-angle-up');
          $icon.removeClass('fa-angle-down');

          $target.append(`
            <div class="js-dropdownMenu" style="z-index:1000;position:absolute;top:${height}px;left:0;background-color:#ddd;width:${width}px;max-height:162px;overflow-y:auto;">
              ${versions.map(v => `<div class="js-dropdownMenuItem dropdown-button" data-version="${v}"><div>${v}</div></div>`).join('')}
            </div>
          `);

          setTimeout(() => {
            $('.js-dropdownMenuItem')
              .off('click')
              .on('click', ee => {
                ee.preventDefault();
                const v = $(ee.currentTarget).attr('data-version');

                const configurationType = state.get('configurationType');
                const addingWallets = configurationType === configurationTypes.ADD_NEW_WALLETS;
                const updatingWallets = configurationType === configurationTypes.UPDATE_WALLETS;

                const updateAbbrToVersion = state.get('updateAbbrToVersion');
                if(updatingWallets && updateAbbrToVersion.has(abbr)) {
                  updateAbbrToVersion.set(abbr, v);
                  state.set('updateAbbrToVersion', updateAbbrToVersion);
                }

                const addAbbrToVersion = state.get('addAbbrToVersion');
                if(addingWallets && addAbbrToVersion.has(abbr)) {
                  addAbbrToVersion.set(abbr, v);
                  state.set('addAbbrToVersion', addAbbrToVersion);
                }

                const idx = wallets
                  .findIndex(w => w.abbr === abbr && w.versions.includes(v));
                state.set('wallets', [
                  ...wallets.slice(0, idx),
                  wallets[idx].set({version: v}),
                  ...wallets.slice(idx + 1)
                ]);
                $($target.find('div')[0]).text(v);
                const versionId = wallets[idx].versionId;

                const skipLink = $(`.js-skipBtn[data-abbr="${abbr}"]`);
                skipLink.attr('data-version', v);

                if(!updatingWallets) {
                  let selectedWallets = state.get('selectedWallets');
                  for(const w of wallets) {
                    if(w.abbr === abbr) selectedWallets = selectedWallets.delete(w.versionId);
                  }
                  selectedWallets = selectedWallets.add(versionId);
                  state.set('selectedWallets', selectedWallets);
                }

              });
          }, 0);
        });

      } else { // dropdown currently open
        closeDropdowns();
      }
    });

  }

}

module.exports = SelectWalletVersions;
