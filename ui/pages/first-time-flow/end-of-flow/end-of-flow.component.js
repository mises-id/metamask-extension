import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
import Snackbar from '../../../components/ui/snackbar';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
// import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { returnToOnboardingInitiator } from '../onboarding-initiator-util';
import {
  COLORS,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Typography from '../../../components/ui/typography';

export default class EndOfFlowScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    completionMetaMetricsName: PropTypes.string,
    setCompletedOnboarding: PropTypes.func,
    onboardingInitiator: PropTypes.exact({
      location: PropTypes.string,
      tabId: PropTypes.number,
    }),

    firstTimeFlowType: PropTypes.oneOf(['create', 'import']),
    setParticipateInMetaMetrics: PropTypes.func,
    // participateInMetaMetrics: PropTypes.bool,
  };

  onCancel = async () => {
    this.onComplete(false);
  };

  async _beforeUnload() {
    await this._onOnboardingComplete();
  }

  _removeBeforeUnload() {
    window.removeEventListener('beforeunload', this._beforeUnload);
  }

  async _onOnboardingComplete(flag) {
    const {
      setCompletedOnboarding,
      completionMetaMetricsName,
      firstTimeFlowType,
      setParticipateInMetaMetrics,
    } = this.props;
    const [, metaMetricsId] = await setParticipateInMetaMetrics(flag);
    await setCompletedOnboarding();
    this.context.trackEvent({
      category: 'Onboarding',
      event: completionMetaMetricsName,
      properties: {
        action: 'Onboarding Complete',
        legacy_event: true,
      },
    });

    const firstTimeFlowTypeNameMap = {
      create: 'Selected Create New Wallet',
      import: 'Selected Import Wallet',
    };
    const firstTimeSelectionMetaMetricsName =
      firstTimeFlowTypeNameMap[firstTimeFlowType];
    console.log(firstTimeFlowType, metaMetricsId);
    this.context.trackEvent(
      {
        category: 'Onboarding',
        event: firstTimeSelectionMetaMetricsName,
        properties: {
          action: 'Import or Create',
          legacy_event: true,
        },
      },
      {
        isOptIn: true,
        metaMetricsId,
        flushImmediately: true,
      },
    );
  }

  onComplete = async (flag = true) => {
    const { history, onboardingInitiator } = this.props;

    this._removeBeforeUnload();
    await this._onOnboardingComplete(flag);
    if (onboardingInitiator) {
      await returnToOnboardingInitiator(onboardingInitiator);
    }
    history.push(DEFAULT_ROUTE);
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this._beforeUnload.bind(this));
  }

  componentWillUnmount = () => {
    this._removeBeforeUnload();
  };

  render() {
    const { t } = this.context;
    const { onboardingInitiator } = this.props;

    return (
      <div className="end-of-flow">
        <div className="end-of-flow__header">
          <MetaFoxLogo />
        </div>
        <div className="end-of-flow__box">
          <div className="end-of-flow__emoji">🎉</div>
          <div className="first-time-flow__header">Congratulations!</div>
          <div className="first-time-flow__text-block end-of-flow__text-1">
            You have successfully created your Mises ID & Metamask account.
          </div>
          <div className="first-time-flow__text-block end-of-flow__text-2">
            Please keep your seed phrase safe, or you&apos;ll put your assets
            and data at risk!
          </div>
          <div className="first-time-flow__text-block end-of-flow__text-2">
            Please connect to Mises chain to edit your personal info.
          </div>
          {/* <div className="first-time-flow__text-block end-of-flow__text-2">
            {t('metametricsOptInDescription')}
          </div> */}
        </div>
        {/* <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage3')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage4')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage5')}`}
        </div>
        <div className="end-of-flow__text-3">
          {`• ${t('endOfFlowMessage6')}`}
        </div>
        <div className="end-of-flow__text-3">
          •{' '}
          {t('endOfFlowMessage7', [
            <a
              target="_blank"
              key="metamaskSupportLink"
              rel="noopener noreferrer"
              href={SUPPORT_REQUEST_LINK}
            >
              <span className="first-time-flow__link-text">
                {this.context.t('here')}
              </span>
            </a>,
          ])}
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-4">
          {`*${t('endOfFlowMessage8')}`}&nbsp;
          <a
            href="https://metamask.zendesk.com/hc/en-us/articles/360015489591-Basic-Safety-Tips"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="first-time-flow__link-text">
              {t('endOfFlowMessage9')}
            </span>
          </a>
        </div> */}
        <div className="end-of-flow-btn">
          <Typography
            color={COLORS.TEXT_ALTERNATIVE}
            align={TEXT_ALIGN.CENTER}
            variant={TYPOGRAPHY.H6}
            className="onboarding-metametrics__terms"
          >
            {t('metametricsOptInDescription', [
              <a
                key="metametrics-bottom-text-wrapper"
                href="https://www.mises.site/policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('gdprMessagePrivacyPolicy')}
              </a>,
            ])}
          </Typography>
          <div className="endofflow-metametrics__buttons">
            <Button
              className="first-time-flow__button"
              data-testid="metametrics-no-thanks"
              type="secondary"
              onClick={this.onCancel}
            >
              {t('noThanks')}
            </Button>
            <Button
              className="first-time-flow__button"
              data-testid="metametrics-i-agree"
              type="primary"
              onClick={() => this.onComplete(true)}
            >
              {t('affirmAgree')}
            </Button>
          </div>
        </div>
        {/* <Button
          type="primary"
          className="first-time-flow__button"
          onClick={this.onComplete}
        >
          {t('endOfFlowMessage10')}
        </Button> */}
        {onboardingInitiator ? (
          <Snackbar
            content={t('onboardingReturnNotice', [
              t('endOfFlowMessage10'),
              onboardingInitiator.location,
            ])}
          />
        ) : null}
      </div>
    );
  }
}
