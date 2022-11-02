import { connect } from 'react-redux';

import {
  getFirstTimeFlowType,
  getOnboardingInitiator,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import { setCompletedOnboarding } from '../../../store/actions';
import { setOnBoardedInThisUISession } from '../../../ducks/app/app';
import EndOfFlow from './end-of-flow.component';

const mapStateToProps = (state) => {
  return {
    onboardingInitiator: getOnboardingInitiator(state),
    firstTimeFlowType: getFirstTimeFlowType(state),
    participateInMetaMetrics: getParticipateInMetaMetrics(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCompletedOnboarding: () => dispatch(setCompletedOnboarding()),
    setOnBoardedInThisUISession: (value) =>
      dispatch(setOnBoardedInThisUISession(value)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EndOfFlow);
