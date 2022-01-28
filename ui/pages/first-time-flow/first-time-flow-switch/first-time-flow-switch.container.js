import { connect } from 'react-redux';
import { clearKeyrings } from '../../../store/actions';
import FirstTimeFlowSwitch from './first-time-flow-switch.component';

const mapStateToProps = ({ metamask }) => {
  const {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    seedPhraseBackedUp,
  } = metamask;

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    seedPhraseBackedUp,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    clearKeyrings: () => dispatch(clearKeyrings()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FirstTimeFlowSwitch);
