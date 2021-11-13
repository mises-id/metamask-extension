import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithProvider } from '../../../../test/jest';
import { ETH } from '../../../helpers/constants/common';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';

import TransactionErrorMessage from './transaction-error-message';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

const render = (props) => {
  const store = configureStore({
    metamask: {
      nativeCurrency: ETH,
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      provider: {},
      cachedBalances: {},
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x1F4',
        },
      },
      selectedAddress: '0xAddress',
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider {...props}>
      <TransactionErrorMessage />
    </GasFeeContextProvider>,
    store,
  );
};

describe('TransactionErrorMessage', () => {
  it('should returning warning message for low gas estimate', () => {
    render({ transaction: { userFeeLevel: 'low' } });
    expect(
      document.getElementsByClassName('actionable-message--warning'),
    ).toHaveLength(1);
  });

  it('should return null for gas estimate other than low', () => {
    render({ transaction: { userFeeLevel: 'high' } });
    expect(
      document.getElementsByClassName('actionable-message--warning'),
    ).toHaveLength(0);
  });

  it('should not show insufficient balance message if transaction value is less than balance', () => {
    render({
      transaction: { userFeeLevel: 'high', txParams: { value: '0x64' } },
    });
    expect(screen.queryByText('Insufficient funds.')).not.toBeInTheDocument();
  });

  it('should show insufficient balance message if transaction value is more than balance', () => {
    render({
      transaction: { userFeeLevel: 'high', txParams: { value: '0x5208' } },
    });
    expect(screen.queryByText('Insufficient funds.')).toBeInTheDocument();
  });
});
