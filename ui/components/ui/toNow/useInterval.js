import { useEffect, useRef } from 'react';

const useInterval = (callback, delay) => {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
    // eslint-disable-next-line consistent-return
  }, [callback]);

  useEffect(() => {
    if (!delay) {
      return undefined;
    }
    const id = setInterval(() => savedCallback.current(), delay);
    return () => {
      clearInterval(id);
    };
  }, [delay]);
};

export default useInterval;
