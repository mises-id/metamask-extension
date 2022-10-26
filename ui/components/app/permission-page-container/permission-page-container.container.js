import { connect } from 'react-redux';
import { getMetaMaskIdentities, getMisesOpt } from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;

  const allIdentities = getMetaMaskIdentities(state);
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    allIdentitiesSelected,
    misesOpt: getMisesOpt(state),
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
