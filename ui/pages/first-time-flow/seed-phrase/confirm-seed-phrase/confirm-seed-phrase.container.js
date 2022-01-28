import { connect } from 'react-redux';
import {
  setSeedPhraseBackedUp,
  initializeThreeBox,
  setMisesAccountUserInfo,
} from '../../../../store/actions';
import ConfirmSeedPhrase from './confirm-seed-phrase.component';

const mapDispatchToProps = (dispatch) => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) =>
      dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    initializeThreeBox: () => dispatch(initializeThreeBox()),
    setMisesAccountUserInfo: () => dispatch(setMisesAccountUserInfo()),
  };
};

export default connect(null, mapDispatchToProps)(ConfirmSeedPhrase);
