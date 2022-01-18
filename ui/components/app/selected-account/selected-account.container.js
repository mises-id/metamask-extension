import { connect } from 'react-redux';
import { getMisesOpt, getSelectedIdentity } from '../../../selectors';
import SelectedAccount from './selected-account.component';

const mapStateToProps = (state) => {
  return {
    selectedIdentity: getSelectedIdentity(state),
    misesOpt: getMisesOpt(state),
  };
};

export default connect(mapStateToProps)(SelectedAccount);
