import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const MisesWalletOverview = ({ balance, buttons, className, icon }) => {
  return (
    <div className={classnames('wallet-overview', className)}>
      <div className="wallet-overview__balance">
        {icon}
        {balance}
      </div>
      <div className="wallet-overview__buttons">{buttons}</div>
    </div>
  );
};

MisesWalletOverview.propTypes = {
  balance: PropTypes.element.isRequired,
  buttons: PropTypes.element.isRequired,
  className: PropTypes.string,
  icon: PropTypes.element.isRequired,
};

MisesWalletOverview.defaultProps = {
  className: undefined,
};

export default MisesWalletOverview;
