import { connect } from 'react-redux';
import {
  getFirstTimeFlowType,
  getOnboardingInitiator,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import {
  setCompletedOnboarding,
  setParticipateInMetaMetrics,
} from '../../../store/actions';
import EndOfFlow from './end-of-flow.component';

const firstTimeFlowTypeNameMap = {
  create: 'New Wallet Created',
  import: 'New Wallet Imported',
};

const mapStateToProps = (state) => {
  const {
    metamask: { firstTimeFlowType },
  } = state;

  return {
    completionMetaMetricsName: firstTimeFlowTypeNameMap[firstTimeFlowType],
    onboardingInitiator: getOnboardingInitiator(state),
    firstTimeFlowType: getFirstTimeFlowType(state),
    participateInMetaMetrics: getParticipateInMetaMetrics(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCompletedOnboarding: () => dispatch(setCompletedOnboarding()),
    setParticipateInMetaMetrics: (flag) =>
      dispatch(setParticipateInMetaMetrics(flag)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EndOfFlow);
