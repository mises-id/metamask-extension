import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
} from '../../../helpers/constants/routes';

export default class FirstTimeFlowSwitch extends PureComponent {
  static propTypes = {
    completedOnboarding: PropTypes.bool,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    seedPhraseBackedUp: PropTypes.bool,
  };

  render() {
    const {
      completedOnboarding,
      isInitialized,
      isUnlocked,
      seedPhraseBackedUp,
    } = this.props;

    if (completedOnboarding) {
      return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
    }

    if (seedPhraseBackedUp !== null) {
      return <Redirect to={{ pathname: INITIALIZE_END_OF_FLOW_ROUTE }} />;
    }

    if (isUnlocked) {
      return <Redirect to={{ pathname: LOCK_ROUTE }} />;
    }

    if (!isInitialized) {
      return <Redirect to={{ pathname: INITIALIZE_SELECT_ACTION_ROUTE }} />;
    }

    return <Redirect to={{ pathname: INITIALIZE_UNLOCK_ROUTE }} />;
  }
}
