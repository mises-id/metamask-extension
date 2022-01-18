import { connect } from 'react-redux';
import {
  updateSendAmount,
  getSendAmount,
  sendAmountIsInError,
  getSendAsset,
  updateMisesSendAmount,
} from '../../../../ducks/send';
import { getMetaMaskAccounts } from '../../../../selectors';
import SendAmountRow from './send-amount-row.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendAmountRow);

function mapStateToProps(state) {
  return {
    amount: getSendAmount(state),
    selectedAddress: state.metamask.selectedAddress,
    accounts: getMetaMaskAccounts(state),
    inError: sendAmountIsInError(state),
    asset: getSendAsset(state),
    provider: state.metamask.provider,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAmount: (newAmount) => dispatch(updateSendAmount(newAmount)),
    updateMisesSendAmount: (newAmount) =>
      dispatch(updateMisesSendAmount(newAmount)),
  };
}
