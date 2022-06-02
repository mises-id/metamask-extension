import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip';
import { toNow } from './toNow';
import useInterval from './useInterval';

function ToNow({ date, update }) {
  const [, setKey] = useState(0);
  useInterval(
    () => {
      setKey((key) => key + 1);
    },
    update ? 1000 : null,
  );
  return (
    <Tooltip position="top" html={date.toLocaleString()}>
      <span>{toNow(date)}</span>
    </Tooltip>
  );
}
ToNow.propTypes = {
  date: PropTypes.number.isRequired,
  update: PropTypes.bool,
};
export default ToNow;
