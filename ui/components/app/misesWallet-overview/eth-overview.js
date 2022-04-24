import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';

import Identicon from '../../ui/identicon';
import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  // BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../mises-user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { showModal, updataBalance } from '../../../store/actions';
import {
  isBalanceCached,
  getSelectedAccount,
  getShouldShowFiat,
  // getIsMainnet,
  // getIsTestnet,
  // getCurrentKeyring,
  // getSwapsDefaultToken,
  // getIsSwapsChain,
  getNativeCurrencyImage,
} from '../../../selectors/selectors';
// import SwapIcon from '../../ui/icon/swap-icon.component';
import BuyIcon from '../../ui/icon/overview-buy-icon.component';
import SendIcon from '../../ui/icon/overview-send-icon.component';
// import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import IconButton from '../../ui/icon-button';
// import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import MisesWalletOverview from './wallet-overview';

const MisesEthOverview = ({ className }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);

  const trackEvent = useContext(MetaMetricsContext);
  // const depositEvent = useMetricEvent({
  //   eventOpts: {
  //     category: 'Navigation',
  //     action: 'Home',
  //     name: 'Clicked Deposit',
  //   },
  // });
  const history = useHistory();
  // const keyring = useSelector(getCurrentKeyring);
  // const usingHardwareWallet = isHardwareKeyring(keyring.type);
  const balanceIsCached = useSelector(isBalanceCached);
  const showFiat = useSelector(getShouldShowFiat);
  const selectedAccount = useSelector(getSelectedAccount);
  const {
    balance,
    misesBalance = {
      amount: '0',
      denom: 'MIS',
    },
  } = selectedAccount;
  // const isMainnetChain = useSelector(getIsMainnet);
  // const isTestnetChain = useSelector(getIsTestnet);
  // const isSwapsChain = useSelector(getIsSwapsChain);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);

  // const enteredSwapsEvent = useNewMetricEvent({
  //   event: 'Swaps Opened',
  //   properties: { source: 'Main View', active_currency: 'MIS' },
  //   category: 'swaps',
  // });
  // const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  let timer = null;
  const closeTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const getBalance = () => {
    if (timer) {
      closeTimer();
    }
    console.log('getBalance page');
    updataBalance();
    timer = setTimeout(() => {
      getBalance();
    }, 20000);
  };
  useEffect(() => {
    getBalance();
    return () => {
      closeTimer();
    };
  }, []);
  return (
    <MisesWalletOverview
      balance={
        <Tooltip
          position="top"
          title={t('balanceOutdated')}
          disabled={!balanceIsCached}
        >
          <div className="eth-overview__balance">
            <div className="eth-overview__primary-container">
              <UserPreferencedCurrencyDisplay
                className={classnames('eth-overview__primary-balance')}
                data-testid="eth-overview__primary-currency"
                value={balance}
                misesBalance={misesBalance}
                type={PRIMARY}
                ethNumberOfDecimals={4}
                hideTitle
              />
              {/* {balanceIsCached ? (
                <span className="eth-overview__cached-star">*</span>
              ) : null} */}
            </div>
            {showFiat && (
              <UserPreferencedCurrencyDisplay
                className={classnames({
                  'eth-overview__cached-secondary-balance': balanceIsCached,
                  'eth-overview__secondary-balance': !balanceIsCached,
                })}
                data-testid="eth-overview__secondary-currency"
                value={balance}
                type={SECONDARY}
                misesBalance={misesBalance}
                ethNumberOfDecimals={4}
                hideTitle
              />
            )}
          </div>
        </Tooltip>
      }
      buttons={
        <>
          <IconButton
            className="eth-overview__button"
            Icon={BuyIcon}
            // disabled={!(isMainnetChain || isTestnetChain)}
            label={t('receive')}
            onClick={() => {
              // depositEvent();
              // dispatch(showModal({ name: 'DEPOSIT_ETHER' }));
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
            }}
          />
          {/* <IconButton
            className="eth-overview__button"
            Icon={BuyIcon}
            // disabled={!(isMainnetChain || isTestnetChain)}
            label={t('buy')}
            onClick={() => {
              depositEvent();
              dispatch(showModal({ name: 'DEPOSIT_ETHER' }));
            }}
          /> */}
          <IconButton
            className="eth-overview__button"
            data-testid="eth-overview-send"
            Icon={SendIcon}
            label={t('send')}
            onClick={() => {
              trackEvent({
                event: 'Clicked Send: Eth',
                category: 'Navigation',
                properties: {
                  action: 'Home',
                  legacy_event: true,
                },
              });
              history.push(SEND_ROUTE);
            }}
          />
          {/* <IconButton
            className="eth-overview__button"
            disabled={!isSwapsChain}
            Icon={SwapIcon}
            onClick={() => {
              if (isSwapsChain) {
                enteredSwapsEvent();
                dispatch(setSwapsFromToken(defaultSwapsToken));
                if (usingHardwareWallet) {
                  global.platform.openExtensionInBrowser(BUILD_QUOTE_ROUTE);
                } else {
                  history.push(BUILD_QUOTE_ROUTE);
                }
              }
            }}
            label={t('swap')}
            tooltipRender={(contents) => (
              <Tooltip
                title={t('currentlyUnavailable')}
                position="bottom"
                disabled={isSwapsChain}
              >
                {contents}
              </Tooltip>
            )}
          /> */}
        </>
      }
      className={className}
      icon={<Identicon diameter={32} image={primaryTokenImage} imageBorder />}
    />
  );
};

MisesEthOverview.propTypes = {
  className: PropTypes.string,
};

MisesEthOverview.defaultProps = {
  className: undefined,
};

export default MisesEthOverview;
