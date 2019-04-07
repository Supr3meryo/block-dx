/* global swal */

const { ipcRenderer } = require('electron');
const { Set } = require('immutable');
const { Router } = require('../modules/router');
const route = require('./constants/routes');
const configurationTypes = require('./constants/configuration-types');
const SelectSetupType = require('./views/select-setup-type');
const SelectWalletVersions = require('./views/select-wallet-versions');
const ConfigurationComplete = require('./views/configuration-complete');
const SelectWallets = require('./views/select-wallets');
const ExpertSelectWalletVersions = require('./views/expert-select-wallet-versions');
const SelectWalletDirectories = require('./views/select-wallet-directories');
const ExpertSelectSetupType = require('./views/expert-select-setup-type');
const Finish = require('./views/finish');
const EnterBlocknetCredentials = require('./views/enter-blocknet-credentials');
const EnterWalletCredentials = require('./views/enter-wallet-credentials');
const ConfigurationMenu = require('./views/configuration-menu');
const Wallet = require('./modules/wallet');

ipcRenderer.on('errorMessage', async function(e, title, message) {
  try {
    const { dismiss } = await swal({
      title,
      html: message,
      type: 'warning',
      showConfirmButton: true,
      confirmButtonText: 'Start Basic Setup',
      showCancelButton: true,
      cancelButtonText: 'Open RPC Settings',
      reverseButtons: true,
      allowEscapeKey: false,
      allowOutsideClick: false
    });
    if(dismiss === 'cancel') {
      ipcRenderer.send('openSettingsWindow');
    }
  } catch(err) {
    console.error(err);
    alert(err);
  }
});

const state = {

  _data: new Map(),

  set(key, val) {
    this._data.set(key, val);
    console.log('state', [...this._data.entries()]
      .reduce((obj, [ k, v ]) => Object.assign(obj, {[k]: v}), {})
    );
  },

  get(key) {
    return this._data.get(key);
  }

};

$(document).ready(() => {
  try {

    state.set('sidebarSelected', 0);
    state.set('sidebarItems', [
      {text: 'Configuration Setup'},
      {text: 'RPC Settings'}
    ]);
    state.set('skipSetup', false);
    state.set('active', 'configuration1');
    state.set('quickSetup', true);
    state.set('generateCredentials', true);
    state.set('rpcPort', '41414');
    state.set('rpcIP', '127.0.0.1');

    const isFirstRun = ipcRenderer.sendSync('isFirstRun');
    state.set('isFirstRun', isFirstRun);

    state.set('configurationType', isFirstRun ? configurationTypes.FRESH_SETUP : configurationTypes.ADD_NEW_WALLETS);

    const router = new Router({
      $target: $('#js-main'),
      state
    });
    router.registerRoute(route.SELECT_SETUP_TYPE, SelectSetupType);
    router.registerRoute(route.SELECT_WALLET_VERSIONS, SelectWalletVersions);
    router.registerRoute(route.CONFIGURATION_COMPLETE, ConfigurationComplete);
    router.registerRoute(route.SELECT_WALLETS, SelectWallets);
    router.registerRoute(route.EXPERT_SELECT_WALLET_VERSIONS, ExpertSelectWalletVersions);
    router.registerRoute(route.SELECT_WALLET_DIRECTORIES, SelectWalletDirectories);
    router.registerRoute(route.EXPERT_SELECT_SETUP_TYPE, ExpertSelectSetupType);
    router.registerRoute(route.FINISH, Finish);
    router.registerRoute(route.ENTER_BLOCKNET_CREDENTIALS, EnterBlocknetCredentials);
    router.registerRoute(route.ENTER_WALLET_CREDENTIALS, EnterWalletCredentials);
    router.registerRoute(route.CONFIGURATION_MENU, ConfigurationMenu);

    let wallets = ipcRenderer.sendSync('getManifest');
    wallets = wallets.map(w => new Wallet(w));
    const blockIdx = wallets.findIndex(w => w.abbr === 'BLOCK');
    const others = [
      ...wallets.slice(0, blockIdx),
      ...wallets.slice(blockIdx + 1)
    ].sort((a, b) => a.name.localeCompare(b.name));
    wallets = [
      wallets[blockIdx],
      ...others
    ];
    const selectedWalletIds = new Set([
      wallets[0].versionId,
      ...ipcRenderer.sendSync('getSelected')
    ]);
    const selectedAbbrs = new Set([...wallets
      .filter(w => selectedWalletIds.has(w.versionId))
      .map(w => w.abbr)
    ]);
    state.set('selectedWallets', selectedWalletIds);
    state.set('selectedAbbrs', selectedAbbrs);
    state.set('addWallets', new Set());
    state.set('addAbbrs', new Set());
    state.set('addAbbrToVersion', new Map());
    state.set('updateWallets', new Set());
    state.set('updateAbbrs', new Set());
    state.set('updateAbbrToVersion', new Map());
    state.set('skipList', new Set());

    state.set('wallets', wallets);

    if(isFirstRun) {
      router.goTo(route.SELECT_SETUP_TYPE);
    } else {
      router.goTo(route.CONFIGURATION_MENU);
    }

  } catch(err) {
    alert(err.message);
    console.error(err);
  }
});
