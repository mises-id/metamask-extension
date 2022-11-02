import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

function TxMessage({ msgs }) {
  const RenderItem = ({ value }) => {
    return Object.keys(value).map((key, index) => {
      return (
        <div key={index}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '14px',
              marginRight: '5px',
              color: '#333',
              fontWeight: 'bold',
            }}
          >
            {key}:
          </span>
          <p
            style={{
              fontSize: '14px',
              color: '#666',
              margin: `5px 0`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '80vw',
            }}
          >
            {key === 'amount'
              ? `${value.amount.amount}${value.amount.denom}`
              : value[key]}
          </p>
        </div>
      );
    });
  };
  const renderValue = (value) => {
    return (
      <div>
        {typeof value === 'object' ? <RenderItem value={value} /> : value}
      </div>
    );
  };
  const [renderMsg, setRenderMsg] = useState([...msgs]);
  useEffect(() => {
    if (msgs.length > 0) {
      msgs.forEach((element, index) => {
        element.typeUrl &&
          element.typeUrl.then((res) => {
            renderMsg[index].type = res;
            setRenderMsg([...renderMsg]);
          });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs.length]);

  return (
    <>
      {renderMsg.map((msg, i) => (
        <Accordion key={i}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <p
              style={{
                fontSize: '14px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                width: '80vw',
                color: '#333',
              }}
            >
              {msg.type}
            </p>
          </AccordionSummary>
          <AccordionDetails>{renderValue(msg.value)}</AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}
TxMessage.propTypes = {
  msgs: PropTypes.array,
};
export default TxMessage;
