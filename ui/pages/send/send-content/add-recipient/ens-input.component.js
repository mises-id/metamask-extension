import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  isValidDomainName,
  isValidMisesId,
} from '../../../../helpers/utils/util';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import { MISESNETWORK } from '../../../../../shared/constants/network';

export default class EnsInput extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    selectedAddress: PropTypes.string,
    selectedName: PropTypes.string,
    scanQrCode: PropTypes.func,
    onPaste: PropTypes.func,
    onValidAddressTyped: PropTypes.func,
    internalSearch: PropTypes.bool,
    userInput: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    lookupEnsName: PropTypes.func.isRequired,
    initializeEnsSlice: PropTypes.func.isRequired,
    resetEnsResolution: PropTypes.func.isRequired,
    misesOpt: PropTypes.object.isRequired,
    provider: PropTypes.shape({
      nickname: PropTypes.string,
      rpcUrl: PropTypes.string,
      type: PropTypes.string,
      ticker: PropTypes.string,
    }).isRequired,
  };

  componentDidMount() {
    this.props.initializeEnsSlice();
  }

  onPaste = (event) => {
    if (event.clipboardData.items?.length) {
      const clipboardItem = event.clipboardData.items[0];
      clipboardItem?.getAsString((text) => {
        const input = text.trim();
        if (
          !isBurnAddress(input) &&
          isValidHexAddress(input, { mixedCaseUseChecksum: true })
        ) {
          this.props.onPaste(input);
        }
      });
    }
  };

  onChange = ({ target: { value } }) => {
    const {
      onValidAddressTyped,
      internalSearch,
      onChange,
      lookupEnsName,
      resetEnsResolution,
      misesOpt,
    } = this.props;
    const input = value.trim();
    const { isMises } = misesOpt;
    onChange(input);
    if (internalSearch) {
      return null;
    }
    // Empty ENS state if input is empty
    // maybe scan ENS
    if (isMises) {
      resetEnsResolution();
      if (onValidAddressTyped && isValidMisesId(input)) {
        onValidAddressTyped(input);
      }
    } else if (isValidDomainName(input)) {
      lookupEnsName(input);
    } else {
      resetEnsResolution();
      if (
        onValidAddressTyped &&
        !isBurnAddress(input) &&
        isValidHexAddress(input, { mixedCaseUseChecksum: true })
      ) {
        onValidAddressTyped(input);
      }
    }

    return null;
  };

  render() {
    const { t } = this.context;
    const {
      className,
      selectedAddress,
      selectedName,
      userInput,
      provider,
    } = this.props;

    const hasSelectedAddress = Boolean(selectedAddress);

    return (
      <div className={classnames('ens-input', className)}>
        <div
          className={classnames('ens-input__wrapper', {
            'ens-input__wrapper__status-icon--error': false,
            'ens-input__wrapper__status-icon--valid': false,
            'ens-input__wrapper--valid': hasSelectedAddress,
          })}
        >
          <i
            className={classnames('ens-input__wrapper__status-icon', 'fa', {
              'fa-check-circle': hasSelectedAddress,
              'fa-search': !hasSelectedAddress,
            })}
            style={{
              color: hasSelectedAddress
                ? 'var(--color-success-default)'
                : 'var(--color-icon-muted)',
            }}
          />
          {hasSelectedAddress ? (
            <>
              <div className="ens-input__wrapper__input ens-input__wrapper__input--selected">
                <div className="ens-input__selected-input__title">
                  {selectedName || selectedAddress}
                </div>
                {selectedName !== selectedAddress && (
                  <div className="ens-input__selected-input__subtitle">
                    {selectedAddress}
                  </div>
                )}
              </div>
              <button
                onClick={this.props.onReset}
                className="ens-input__wrapper__action-icon-button"
              >
                <i
                  className="fa fa-times"
                  style={{
                    color: 'var(--color-icon-default)',
                  }}
                  title={t('close')}
                />
              </button>
            </>
          ) : (
            <>
              <input
                className="ens-input__wrapper__input"
                type="text"
                dir="auto"
                placeholder={
                  provider.type === MISESNETWORK
                    ? 'Search Mises ID'
                    : t('recipientAddressPlaceholder')
                }
                onChange={this.onChange}
                onPaste={this.onPaste}
                spellCheck="false"
                value={selectedAddress || userInput}
                autoFocus
                data-testid="ens-input"
              />
              <button
                className="ens-input__wrapper__action-icon-button"
                onClick={() => {
                  if (userInput) {
                    this.props.onReset();
                  } else {
                    this.props.scanQrCode();
                  }
                }}
              >
                <i
                  className={classnames('fa', {
                    'fa-times': userInput,
                    'fa-qrcode': !userInput,
                  })}
                  title={t(userInput ? 'close' : 'scanQrCode')}
                  style={{
                    color: userInput
                      ? 'var(--color-icon-default)'
                      : 'var(--color-primary-default)',
                  }}
                />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
}
