const { RouterView } = require('../../modules/router');
const route = require('../constants/routes');
const footerButtons = require('../snippets/footer-buttons');
const sidebar = require('../snippets/sidebar');

class ExpertSelectSetupType extends RouterView {

  constructor(options) {
    super(options);
  }

  render(state) {

    const { $target } = this;

    const generateCredentials = state.get('generateCredentials');

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
            
                <p style="${styles.p}">Usernames and passwords must be generated for the wallet of each token that will be traded.</p>
                <div class="main-area" style="${styles.mainArea}">
                  <div id="js-automaticCredentials" class="main-area-item"><i class="${generateCredentials ? 'fa' : 'far'} fa-circle radio-icon"></i> <strong>Quick Setup</strong> - Automatically generate credentials (recommended)</div>
                  <div id="js-manualCredentials" class="main-area-item"><i class="${!generateCredentials ? 'fa' : 'far'} fa-circle radio-icon"></i> <strong>Expert Setup</strong> - Manually create RPC credentials (advanced users only)</div>
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

    const toggleCredentialGeneration = e => {
      e.preventDefault();
      const generateCredentials = state.get('generateCredentials');
      state.set('generateCredentials', !generateCredentials);
      const $automatic = $('#js-automaticCredentials').find('i');
      const $manual = $('#js-manualCredentials').find('i');
      if(generateCredentials) {
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
      router.goTo(route.SELECT_WALLET_DIRECTORIES);
    });

    $('#js-continueBtn').on('click', e => {
      e.preventDefault();
      const generateCredentials = state.get('generateCredentials');
      if(generateCredentials) {
        router.goTo(route.FINISH);
      } else {
        router.goTo(route.ENTER_WALLET_CREDENTIALS);
      }
    });
  }

}

module.exports = ExpertSelectSetupType;
