import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import AssetListItem from '../asset-list-item';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getShouldShowFiat,
  getNativeCurrencyImage,
  getSelectedAccount,
} from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';

const AssetList = ({ onClickAsset }) => {
  const selectedAccountBalance = useSelector((state) =>
    getSelectedAccount(state),
  );
  const nativeCurrency = useSelector(getNativeCurrency);
  const showFiat = useSelector(getShouldShowFiat);
  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(
    selectedAccountBalance.balance,
    {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    },
  );
  if (selectedAccountBalance.misesBalance) {
    primaryCurrencyProperties.value =
      selectedAccountBalance.misesBalance.amount;
  }
  const [
    secondaryCurrencyDisplay,
    secondaryCurrencyProperties,
  ] = useCurrencyDisplay(selectedAccountBalance.balance, {
    numberOfDecimals: secondaryNumberOfDecimals,
    currency: secondaryCurrency,
  });

  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  // const isMainnet = useSelector(getIsMainnet) || process.env.IN_TEST;

  return (
    <>
      <AssetListItem
        onClick={() => onClickAsset(nativeCurrency)}
        data-testid="wallet-balance"
        primary={
          primaryCurrencyProperties.value ?? secondaryCurrencyProperties.value
        }
        tokenSymbol={primaryCurrencyProperties.suffix}
        secondary={showFiat ? secondaryCurrencyDisplay : undefined}
        tokenImage={primaryTokenImage}
        identiconBorder
      />
      {/* <TokenList
        onTokenClick={(tokenAddress) => {
          onClickAsset(tokenAddress);
          selectTokenEvent();
        }}
      />
      <Box marginTop={4}>
        <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
          <Typography
            color={COLORS.UI4}
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.NORMAL}
          >
            {t('missingToken')}
          </Typography>
        </Box>
        <ImportTokenLink
          isMainnet={isMainnet}
          onClick={() => {
            history.push(IMPORT_TOKEN_ROUTE);
            addTokenEvent();
          }}
        />
      </Box> */}
    </>
  );
};

AssetList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default AssetList;
