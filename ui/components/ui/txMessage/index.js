import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function TxMessage({ msgs }) {
  const renderValue = (value) => {
    return typeof value === 'object' ? (
      <pre style={{ width: '100%', overflowX: 'auto' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    ) : (
      value
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
            <Typography>{msg.type}</Typography>
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
