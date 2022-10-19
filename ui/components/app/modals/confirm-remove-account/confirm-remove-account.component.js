import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import Modal from '../../modal';
import {
  addressSummary,
  getURLHostName,
  shortenAddress,
} from '../../../../helpers/utils/util';
import Identicon from '../../../ui/identicon';
import { MISES_TRUNCATED_ADDRESS_START_CHARS } from '../../../../../shared/constants/labels';
import { MISES_CHAIN_ID } from '../../../../../shared/constants/network';

export default class ConfirmRemoveAccount extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeAccount: PropTypes.func.isRequired,
    identity: PropTypes.object.isRequired,
    chainId: PropTypes.string.isRequired,
    rpcPrefs: PropTypes.object.isRequired,
    accountList: PropTypes.array.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  handleRemove = () => {
    this.props
      .removeAccount(this.props.identity.address)
      .then(() => this.props.hideModal());
  };

  handleCancel = () => {
    this.props.hideModal();
  };

  renderSelectedAccount() {
    const { t } = this.context;
    const { identity, rpcPrefs, chainId, accountList } = this.props;
    const account = accountList.find(
      (item) => item.address === identity.address,
    );
    const isMises = chainId === MISES_CHAIN_ID;
    const address = isMises ? account.misesId : identity.address;
    return (
      <div className="confirm-remove-account__account">
        <div className="confirm-remove-account__account__identicon">
          <Identicon address={identity.address} diameter={32} />
        </div>
        <div className="confirm-remove-account__account__name">
          <span className="confirm-remove-account__account__label">
            {t('name')}
          </span>
          <span className="account_value">{identity.name}</span>
        </div>
        <div className="confirm-remove-account__account__address">
          <span className="confirm-remove-account__account__label">
            {t('publicAddress')}
          </span>
          <span className="account_value">
            {isMises
              ? shortenAddress(address, MISES_TRUNCATED_ADDRESS_START_CHARS)
              : addressSummary(address, 4, 4)}
          </span>
        </div>
        <div className="confirm-remove-account__account__link">
          <a
            onClick={() => {
              const accountLink = isMises
                ? `${rpcPrefs.blockExplorerUrl}/holders/${address}`
                : getAccountLink(address, chainId, rpcPrefs);
              this.context.trackEvent({
                category: 'Accounts',
                event: 'Clicked Block Explorer Link',
                properties: {
                  link_type: 'Account Tracker',
                  action: 'Remove Account',
                  block_explorer_domain: getURLHostName(accountLink),
                },
              });
              global.platform.openTab({
                url: accountLink,
              });
            }}
            target="_blank"
            rel="noopener noreferrer"
            title={t('etherscanView')}
          >
            <i
              className="fa fa-share-square"
              style={{ color: 'var(--color-icon-muted)' }}
              title={t('etherscanView')}
            />
          </a>
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.context;

    return (
      <Modal
        headerText={`${t('removeAccount')}?`}
        onClose={this.handleCancel}
        onSubmit={this.handleRemove}
        onCancel={this.handleCancel}
        submitText={t('remove')}
        cancelText={t('nevermind')}
      >
        <div>
          {this.renderSelectedAccount()}
          <div className="confirm-remove-account__description">
            {t('removeAccountDescription')}
            <a
              className="confirm-remove-account__link"
              rel="noopener noreferrer"
              target="_blank"
              href="https://metamask.zendesk.com/hc/en-us/articles/360015289932"
            >
              {t('learnMore')}
            </a>
          </div>
        </div>
      </Modal>
    );
  }
}
