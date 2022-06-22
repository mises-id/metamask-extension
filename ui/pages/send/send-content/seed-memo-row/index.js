import React from 'react';
import { useDispatch } from 'react-redux';
import TextField from '../../../../components/ui/text-field';
import { SendMemo } from '../../../../ducks/send';
import SendRowWrapper from '../send-row-wrapper';

const SendMemoTxt = () => {
  const [amount, setAmount] = React.useState('');
  const dispatch = useDispatch();
  const handleChange = (e) => {
    setAmount(e.target.value);
  };
  const blur = () => {
    dispatch(SendMemo(amount));
  };
  return (
    <SendRowWrapper label="Memo" errorType="Memo">
      <TextField
        value={amount}
        onChange={handleChange}
        placeholder="Add a memo"
        onBlur={blur}
        fullWidth
      />
    </SendRowWrapper>
  );
};
export default SendMemoTxt;
