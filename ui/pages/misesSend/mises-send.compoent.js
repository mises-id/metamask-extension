import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Button from '../../components/ui/button';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getMisesTranstionFlag } from '../../selectors';
import { resetTranstionFlag } from '../../store/actions';
// import { useHistory } from 'react-router-dom';
// import { useI18nContext } from '../../hooks/useI18nContext';

export default function MisesSend() {
  const flag = useSelector(getMisesTranstionFlag);
  const history = useHistory();
  const goHomePage = () => {
    history.push(DEFAULT_ROUTE);
  };
  const flagStatus = {
    loading: {
      icon: 'spinner.gif',
      txt: 'Processing, please wait patiently',
    },
    error: {
      icon: 'warning-icon.png',
      txt: 'Some problems have been encountered, resulting in transaction failure. Please try again later',
    },
    success: {
      icon: 'tada.png',
      txt: 'Successful trade',
    },
  };
  // const dispatch = useDispatch();
  // const setFlag = () => dispatch(resetTranstionFlag());
  const [transtionFlag, settranstionFlag] = useState(flagStatus[flag]);
  useEffect(() => {
    settranstionFlag(flagStatus[flag]);
  }, [flag]); // eslint-disable-line
  useEffect(() => {
    return () => {
      resetTranstionFlag();
    };
  }, []);
  // const t = useI18nContext();
  // const history = useHistory();

  return (
    <div className="flex">
      <img src={`./images/${transtionFlag.icon}`} width={40} />
      <p className="transtionFlag">{transtionFlag.txt}</p>

      <div className="gohome">
        <Button type="primary" onClick={goHomePage}>
          GO HOME PAGE
        </Button>
      </div>
    </div>
  );
}
