import React, { useContext } from 'react';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  getSendMaxModeState,
  isSendFormInvalid,
  toggleSendMaxMode,
} from '../../../../../ducks/send';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';

export default function AmountMaxButton({ misesGas }) {
  const isDraftTransactionInvalid = useSelector(isSendFormInvalid);
  const maxModeOn = useSelector(getSendMaxModeState);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const onMaxClick = () => {
    // trackClickedMax();
    trackEvent({
      event: 'Clicked "Amount Max"',
      category: 'Transactions',
      properties: {
        action: 'Edit Screen',
        legacy_event: true,
      },
    });
    dispatch(toggleSendMaxMode(misesGas));
  };

  const disabled = isDraftTransactionInvalid;

  return (
    <button
      className="send-v2__amount-max"
      disabled={disabled}
      onClick={onMaxClick}
    >
      <input type="checkbox" checked={maxModeOn} readOnly />
      <div
        className={classnames('send-v2__amount-max__button', {
          'send-v2__amount-max__button__disabled': disabled,
        })}
      >
        {t('max')}
      </div>
    </button>
  );
}
AmountMaxButton.propTypes = {
  misesGas: PropTypes.object,
};
