import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
// import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
} from '../../../helpers/constants/routes';

export default class SelectAction extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
    setFirstTimeFlowType: PropTypes.func,
    nextRoute: PropTypes.string,
    metaMetricsId: PropTypes.string,
  };

  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  componentDidMount() {
    const { history, isInitialized, nextRoute } = this.props;

    if (isInitialized) {
      history.push(nextRoute);
    }
  }

  handleCreate = () => {
    const { metaMetricsId } = this.props;
    const { trackEvent } = this.context;
    this.props.setFirstTimeFlowType('create');
    trackEvent(
      {
        category: EVENT.CATEGORIES.ONBOARDING,
        event: EVENT_NAMES.WALLET_SETUP_STARTED,
        properties: {
          account_type: EVENT.ACCOUNT_TYPES.DEFAULT,
        },
      },
      {
        isOptIn: true,
        metaMetricsId,
        flushImmediately: true,
      },
    );
    this.props.history.push(INITIALIZE_CREATE_PASSWORD_ROUTE);
  };

  handleImport = () => {
    const { metaMetricsId } = this.props;
    const { trackEvent } = this.context;
    this.props.setFirstTimeFlowType('import');
    trackEvent(
      {
        category: EVENT.CATEGORIES.ONBOARDING,
        event: EVENT_NAMES.WALLET_SETUP_STARTED,
        properties: {
          account_type: EVENT.ACCOUNT_TYPES.IMPORTED,
        },
      },
      {
        isOptIn: true,
        metaMetricsId,
        flushImmediately: true,
      },
    );
    this.props.history.push(INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE);
  };

  render() {
    const { t } = this.context;

    return (
      <div className="select-action">
        {/* <MetaFoxLogo /> */}

        <div className="select-action__wrapper">
          <div className="select-action__body">
            {/* <div className="select-action__body-header">
              {t('newToMetaMask')}
            </div> */}
            <div className="select-action__select-buttons">
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  {/* <div className="select-action__button-symbol">
                    <img src="./images/download-alt.svg" alt="" />
                  </div> */}
                  <div className="select-action__button-text-big">
                    {t('importWalletTitle1')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('importWalletContent1')}
                  </div>
                  <div className="select-action__button-text-big">
                    {t('importWalletTitle2')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('importWalletContent2')}
                  </div>
                </div>
                <Button
                  type="primary"
                  className="first-time-flow__button"
                  onClick={this.handleImport}
                  data-testid="import-wallet-button"
                >
                  {t('importWallet1')}
                </Button>
              </div>
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  {/* <div className="select-action__button-symbol">
                    <img src="./images/thin-plus.svg" alt="" />
                  </div> */}
                  <div className="select-action__button-text-big">
                    {t('letsGoSetUp1')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('thisWillCreate1')}
                  </div>
                </div>
                <Button
                  type="primary"
                  className="first-time-flow__button"
                  onClick={this.handleCreate}
                  data-testid="create-wallet-button"
                >
                  {t('createAWallet')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
