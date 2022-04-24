import React, { useMemo, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions';
import {
  getCurrentChainId,
  getProvider,
  getSelectedAddress,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItem from '../transaction-list-item';
import SmartTransactionListItem from '../transaction-list-item/smart-transaction-list-item.component';
import Button from '../../ui/button';
import { TOKEN_CATEGORY_HASH } from '../../../helpers/constants/transactions';
import { SWAPS_CHAINID_CONTRACT_ADDRESS_MAP } from '../../../../shared/constants/swaps';
import { TRANSACTION_TYPES } from '../../../../shared/constants/transaction';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { MISESNETWORK } from '../../../../shared/constants/network';
import { recentTransactions } from '../../../store/actions';

const PAGE_INCREMENT = 10;

// When we are on a token page, we only want to show transactions that involve that token.
// In the case of token transfers or approvals, these will be transactions sent to the
// token contract. In the case of swaps, these will be transactions sent to the swaps contract
// and which have the token address in the transaction data.
//
// getTransactionGroupRecipientAddressFilter is used to determine whether a transaction matches
// either of those criteria
const getTransactionGroupRecipientAddressFilter = (
  recipientAddress,
  chainId,
) => {
  return ({ initialTransaction: { txParams } }) => {
    return (
      isEqualCaseInsensitive(txParams?.to, recipientAddress) ||
      (txParams?.to === SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[chainId] &&
        txParams.data.match(recipientAddress.slice(2)))
    );
  };
};

const tokenTransactionFilter = ({
  initialTransaction: { type, destinationTokenSymbol, sourceTokenSymbol },
}) => {
  if (TOKEN_CATEGORY_HASH[type]) {
    return false;
  } else if (type === TRANSACTION_TYPES.SWAP) {
    return destinationTokenSymbol === 'ETH' || sourceTokenSymbol === 'ETH';
  }
  return true;
};

const getFilteredTransactionGroups = (
  transactionGroups,
  hideTokenTransactions,
  tokenAddress,
  chainId,
) => {
  if (hideTokenTransactions) {
    return transactionGroups.filter(tokenTransactionFilter);
  } else if (tokenAddress) {
    return transactionGroups.filter(
      getTransactionGroupRecipientAddressFilter(tokenAddress, chainId),
    );
  }
  return transactionGroups;
};

export default function TransactionList({
  hideTokenTransactions,
  tokenAddress,
}) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();

  const unfilteredPendingTransactions = useSelector(
    nonceSortedPendingTransactionsSelector,
  );
  const unfilteredCompletedTransactions = useSelector(
    nonceSortedCompletedTransactionsSelector,
  );
  const chainId = useSelector(getCurrentChainId);
  const provider = useSelector(getProvider);
  const selectedAddress = useSelector(getSelectedAddress);
  const pendingTransactions = useMemo(
    () =>
      getFilteredTransactionGroups(
        unfilteredPendingTransactions,
        hideTokenTransactions,
        tokenAddress,
        chainId,
      ),
    [
      hideTokenTransactions,
      tokenAddress,
      unfilteredPendingTransactions,
      chainId,
    ],
  );
  let completedTransactions = useMemo(() => {
    return getFilteredTransactionGroups(
      unfilteredCompletedTransactions,
      hideTokenTransactions,
      tokenAddress,
      chainId,
    );
  }, [
    hideTokenTransactions,
    tokenAddress,
    unfilteredCompletedTransactions,
    chainId,
  ]);

  const viewMore = useCallback(
    () => setLimit((prev) => prev + PAGE_INCREMENT),
    [],
  );
  // eslint-disable-next-line
  let [misesCompletedTransactions, setmisesCompletedTransactions] = useState(
    [],
  );
  if (misesCompletedTransactions.length) {
    completedTransactions = misesCompletedTransactions;
  }
  // const pendingLength = pendingTransactions.length;
  const [loading, setloading] = useState('');
  const unique = (arr) => {
    const uniqueArr = [];
    if (Array.isArray(arr)) {
      arr.forEach((val) => {
        const flag = uniqueArr.some((item) => item.height === val.height);
        if (!flag) uniqueArr.push(val);
      });
    }
    return uniqueArr.sort((a, b) => b.height - a.height);
  };
  const getMisesTransactions = () => {
    setloading('loading');
    // get cache
    recentTransactions('cache')
      .then((res) => {
        setmisesCompletedTransactions(
          unique([...misesCompletedTransactions, ...res]),
        );
      })
      .catch((err) => {
        console.log(err);
      });
    // get refresh data
    recentTransactions()
      .then((res) => {
        setmisesCompletedTransactions(
          unique([...misesCompletedTransactions, ...res]),
        );
        setloading('success');
        setTimeout(() => {
          setloading('');
        }, 1000);
      })
      .catch((err) => {
        setloading('error');
        console.log(err);
      });
  };
  useEffect(() => {
    if (provider.type === MISESNETWORK && selectedAddress) {
      misesCompletedTransactions = [];
    }
    provider.type === MISESNETWORK
      ? getMisesTransactions()
      : setmisesCompletedTransactions([]);
  }, [provider.type, selectedAddress]);

  return (
    <div className="transaction-list">
      <div className="transaction-list__transactions">
        {pendingTransactions.length > 0 && (
          <div className="transaction-list__pending-transactions">
            <div className="transaction-list__header">
              {`${t('queue')} (${pendingTransactions.length})`}
            </div>
            {pendingTransactions.map((transactionGroup, index) =>
              transactionGroup.initialTransaction.transactionType ===
              TRANSACTION_TYPES.SMART ? (
                <SmartTransactionListItem
                  isEarliestNonce={index === 0}
                  smartTransaction={transactionGroup.initialTransaction}
                  key={`${transactionGroup.nonce}:${index}`}
                />
              ) : (
                <TransactionListItem
                  isEarliestNonce={index === 0}
                  transactionGroup={transactionGroup}
                  key={`${transactionGroup.nonce}:${index}`}
                />
              ),
            )}
          </div>
        )}
        {loading === 'loading' && (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            Getting new data...
          </div>
        )}
        {loading === 'success' && (
          <div style={{ textAlign: 'center', padding: '10px' }}>success</div>
        )}
        {loading === 'error' && (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            Data refresh error
          </div>
        )}
        <div className="transaction-list__completed-transactions">
          {pendingTransactions.length > 0 ? (
            <div className="transaction-list__header">{t('history')}</div>
          ) : null}
          {completedTransactions.length > 0 ? (
            completedTransactions
              .slice(0, limit)
              .map((transactionGroup, index) =>
                transactionGroup.initialTransaction?.transactionType ===
                'smart' ? (
                  <SmartTransactionListItem
                    smartTransaction={transactionGroup.initialTransaction}
                    key={`${transactionGroup.nonce}:${index}`}
                  />
                ) : (
                  <TransactionListItem
                    transactionGroup={transactionGroup}
                    key={`${transactionGroup.nonce}:${limit + index - 10}`}
                  />
                ),
              )
          ) : (
            <div className="transaction-list__empty">
              <div className="transaction-list__empty-text">
                {loading === '' && t('noTransactions')}
              </div>
            </div>
          )}
          {completedTransactions.length > limit && (
            <Button
              className="transaction-list__view-more"
              type="secondary"
              onClick={viewMore}
            >
              {t('viewMore')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

TransactionList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
};

TransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
};
