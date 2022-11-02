import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  MISES_SEND_CONFIRM_ROUTE,
} from '../../../helpers/constants/routes';
import { EVENT } from '../../../../shared/constants/metametrics';
import { SEND_STAGES } from '../../../ducks/send';
import { NETWORK_TYPES } from '../../../../shared/constants/network';

export default class SendFooter extends Component {
  static propTypes = {
    addToAddressBookIfNew: PropTypes.func,
    addToMisesBookIfNew: PropTypes.func,
    resetSendState: PropTypes.func,
    disabled: PropTypes.bool.isRequired,
    history: PropTypes.object,
    sign: PropTypes.func,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    sendStage: PropTypes.string,
    sendErrors: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    cancelTx: PropTypes.func,
    draftTransactionID: PropTypes.string,
    provider: PropTypes.shape({
      nickname: PropTypes.string,
      rpcUrl: PropTypes.string,
      type: PropTypes.string,
      ticker: PropTypes.string,
    }).isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  onCancel() {
    const {
      cancelTx,
      draftTransactionID,
      history,
      mostRecentOverviewPage,
      resetSendState,
      sendStage,
    } = this.props;

    if (draftTransactionID) {
      cancelTx({ id: draftTransactionID });
    }
    resetSendState();

    const nextRoute =
      sendStage === SEND_STAGES.EDIT ? DEFAULT_ROUTE : mostRecentOverviewPage;
    history.push(nextRoute);
  }

  async onSubmit(event) {
    event.preventDefault();
    const {
      addToAddressBookIfNew,
      sign,
      to,
      toAccounts,
      history,
      provider,
      addToMisesBookIfNew,
    } = this.props;
    const { trackEvent } = this.context;
    // let promise = null;
    if (provider.type === NETWORK_TYPES.MISES) {
      addToMisesBookIfNew(to);
      trackEvent({
        category: EVENT.CATEGORIES.TRANSACTIONS,
        event: 'Complete',
        properties: {
          action: 'Edit Screen',
          legacy_event: true,
        },
      });
      setTimeout(() => {
        history.push(MISES_SEND_CONFIRM_ROUTE);
      }, 400);
    } else {
      // TODO: add nickname functionality
      await addToAddressBookIfNew(to, toAccounts);
      const promise = sign();
      Promise.resolve(promise).then(() => {
        trackEvent({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          event: 'Complete',
          properties: {
            action: 'Edit Screen',
            legacy_event: true,
          },
        });
        history.push(CONFIRM_TRANSACTION_ROUTE);
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { sendErrors } = this.props;
    const { trackEvent } = this.context;
    if (
      Object.keys(sendErrors).length > 0 &&
      isEqual(sendErrors, prevProps.sendErrors) === false
    ) {
      const errorField = Object.keys(sendErrors).find((key) => sendErrors[key]);
      const errorMessage = sendErrors[errorField];

      trackEvent({
        category: EVENT.CATEGORIES.TRANSACTIONS,
        event: 'Error',
        properties: {
          action: 'Edit Screen',
          legacy_event: true,
          errorField,
          errorMessage,
        },
      });
    }
  }

  render() {
    const { t } = this.context;
    const { sendStage, provider } = this.props;
    return (
      <PageContainerFooter
        onCancel={() => this.onCancel()}
        onSubmit={(e) => this.onSubmit(e)}
        disabled={this.props.disabled}
        submitText={provider.type === NETWORK_TYPES.MISES ? 'Send' : ''}
        cancelText={sendStage === SEND_STAGES.EDIT ? t('reject') : t('cancel')}
      />
    );
  }
}
