/**
 * @typedef {Object} FirstTimeState
 * @property {Object} config Initial configuration parameters
 * @property {Object} NetworkController Network controller state
 */

/**
 * @type {FirstTimeState}
 */
const initialState = {
  config: {},
  PreferencesController: {
    frequentRpcListDetail: [
      {
        rpcUrl: 'http://127.0.0.1:26657',
        chainId: '0xa46a',
        ticker: 'MIS',
        nickname: 'Mises Network',
        rpcPrefs: {
          blockExplorerUrl: 'https://gw.mises.site',
        },
      },
      {
        rpcUrl: 'http://localhost:8545',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'Localhost 8545',
        rpcPrefs: {},
      },
    ],
  },
};

export default initialState;
