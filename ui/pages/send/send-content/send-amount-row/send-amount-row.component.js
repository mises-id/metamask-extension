import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import UserPreferencedCurrencyInput from '../../../../components/app/user-preferenced-currency-input';
import UserPreferencedTokenInput from '../../../../components/app/user-preferenced-token-input';
import { ASSET_TYPES } from '../../../../ducks/send';
import UnitInput from '../../../../components/ui/unit-input';
import { MISESNETWORK } from '../../../../../shared/constants/network';
import AmountMaxButton from './amount-max-button';

export default class SendAmountRow extends Component {
  static propTypes = {
    amount: PropTypes.string,
    inError: PropTypes.bool,
    asset: PropTypes.object,
    updateSendAmount: PropTypes.func,
    updateMisesSendAmount: PropTypes.func,
    provider: PropTypes.shape({
      nickname: PropTypes.string,
      rpcUrl: PropTypes.string,
      type: PropTypes.string,
      ticker: PropTypes.string,
    }).isRequired,
    accounts: PropTypes.object.isRequired,
    selectedAddress: PropTypes.string.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleChange = (newAmount) => {
    const { provider, accounts, selectedAddress } = this.props;
    if (provider.type === MISESNETWORK) {
      const { misesBalance = { amount: 0 } } = accounts[selectedAddress];
      this.props.updateMisesSendAmount({
        amount: newAmount,
        balance: misesBalance.amount,
      });
      console.log(newAmount);
    } else {
      this.props.updateSendAmount(newAmount);
    }
  };

  renderInput() {
    const { amount, inError, asset, provider } = this.props;
    if (provider.type === MISESNETWORK) {
      return (
        <UnitInput
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          value={amount}
        />
      );
    }
    return asset.type === ASSET_TYPES.TOKEN ? (
      <UserPreferencedTokenInput
        error={inError}
        onChange={this.handleChange}
        token={asset.details}
        value={amount}
      />
    ) : (
      <UserPreferencedCurrencyInput
        error={inError}
        onChange={this.handleChange}
        value={amount}
      />
    );
  }

  render() {
    const { inError } = this.props;

    return (
      <SendRowWrapper
        label={`${this.context.t('amount')}:`}
        showError={inError}
        errorType="amount"
      >
        <AmountMaxButton inError={inError} />
        {this.renderInput()}
      </SendRowWrapper>
    );
  }
}
