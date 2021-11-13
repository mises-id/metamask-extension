import React from 'react';

import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import ErrorMessage from '../../../components/ui/error-message';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';

const LowPriorityMessage = () => {
  const { balanceError, estimateUsed } = useGasFeeContext();
  const t = useI18nContext();

  return (
    <div className="transaction-error-message">
      {balanceError && <ErrorMessage errorKey={INSUFFICIENT_FUNDS_ERROR_KEY} />}
      {estimateUsed === 'low' && (
        <ActionableMessage
          className="actionable-message--warning"
          message={t('lowPriorityMessage')}
          useIcon
          iconFillColor="#f8c000"
        />
      )}
    </div>
  );
};

export default LowPriorityMessage;
