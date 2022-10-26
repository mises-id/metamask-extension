import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import Identicon from '../../../ui/identicon';
import { ellipsify } from '../../../../pages/send/send.utils';
import { getProvider } from '../../../../selectors';
import { MISESNETWORK } from '../../../../../shared/constants/network';
import { shortenAddress } from '../../../../helpers/utils/util';
import { MISES_TRUNCATED_ADDRESS_START_CHARS } from '../../../../../shared/constants/labels';

function addressesEqual(address1, address2) {
  return String(address1).toLowerCase() === String(address2).toLowerCase();
}

export default function RecipientGroup({
  label,
  items,
  onSelect,
  selectedAddress,
}) {
  const provider = useSelector(getProvider);
  const isMises = provider.type === MISESNETWORK;
  if (!items || !items.length) {
    return null;
  }

  return (
    <div
      className="send__select-recipient-wrapper__group"
      data-testid="recipient-group"
    >
      {label && (
        <div className="send__select-recipient-wrapper__group-label">
          {label}
        </div>
      )}
      {items.map(({ address, name, misesId }) => (
        <div
          key={address}
          onClick={() => onSelect(address, name)}
          className={classnames({
            'send__select-recipient-wrapper__group-item': !addressesEqual(
              address,
              selectedAddress,
            ),
            'send__select-recipient-wrapper__group-item--selected': addressesEqual(
              address,
              selectedAddress,
            ),
          })}
        >
          <Identicon address={address} diameter={28} />
          <div
            className="send__select-recipient-wrapper__group-item__content"
            data-testid="recipient"
          >
            <div className="send__select-recipient-wrapper__group-item__title">
              {name || ellipsify(address)}
            </div>
            {name && (
              <div className="send__select-recipient-wrapper__group-item__subtitle">
                {isMises
                  ? shortenAddress(
                      misesId,
                      MISES_TRUNCATED_ADDRESS_START_CHARS,
                    ) || ellipsify(address)
                  : ellipsify(address)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

RecipientGroup.propTypes = {
  label: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ),
  onSelect: PropTypes.func.isRequired,
  selectedAddress: PropTypes.string,
};
