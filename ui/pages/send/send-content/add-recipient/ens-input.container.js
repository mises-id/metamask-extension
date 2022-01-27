import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupEnsName,
  initializeEnsSlice,
  resetEnsResolution,
} from '../../../../ducks/ens';
import { getMisesOpt } from '../../../../selectors';
import EnsInput from './ens-input.component';

const mapStateToProps = (state) => {
  return {
    misesOpt: getMisesOpt(state),
    provider: state.metamask.provider,
  };
};
function mapDispatchToProps(dispatch) {
  return {
    lookupEnsName: debounce((ensName) => dispatch(lookupEnsName(ensName)), 150),
    initializeEnsSlice: () => dispatch(initializeEnsSlice()),
    resetEnsResolution: debounce(() => dispatch(resetEnsResolution()), 300),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EnsInput);
