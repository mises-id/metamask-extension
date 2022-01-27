import { connect } from 'react-redux';
import { showModal, setAccountLabel } from '../../../../store/actions';
import {
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
  getMisesOpt,
} from '../../../../selectors';
import AccountDetailsModal from './account-details-modal.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    selectedIdentity: getSelectedIdentity(state),
    keyrings: state.metamask.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    misesOpt: getMisesOpt(state),
    provider: state.metamask.provider,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showExportPrivateKeyModal: () =>
      dispatch(showModal({ name: 'EXPORT_PRIVATE_KEY' })),
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AccountDetailsModal);
