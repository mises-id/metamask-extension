import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { ComposedStore, ObservableStore } from '@metamask/obs-store';
import { JsonRpcEngine } from 'json-rpc-engine';
import { providerFromEngine } from 'eth-json-rpc-middleware';
import { ethErrors } from 'eth-rpc-errors';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from 'swappable-obj-proxy';
import EthQuery from 'eth-query';
import SafeEventEmitter from 'safe-event-emitter';
import {
  INFURA_PROVIDER_TYPES,
  NETWORK_TYPE_RPC,
  NETWORK_TYPE_TO_ID_MAP,
  INFURA_BLOCKED_KEY,
  MISESNETWORK,
  MISES_CHAIN_ID,
  MISES_SYMBOL,
} from '../../../../shared/constants/network';
import { SECOND } from '../../../../shared/constants/time';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../shared/modules/network.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import createMetamaskMiddleware from './createMetamaskMiddleware';
import createInfuraClient from './createInfuraClient';
import createJsonRpcClient from './createJsonRpcClient';

const env = process.env.METAMASK_ENV;
const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);
let globalOptions = {};
let defaultProviderConfigOpts;
if (process.env.IN_TEST) {
  defaultProviderConfigOpts = {
    type: NETWORK_TYPE_RPC,
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    nickname: 'Localhost 8545',
  };
} else if (process.env.METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigOpts = { type: MISESNETWORK, chainId: MISES_CHAIN_ID };
} else {
  defaultProviderConfigOpts = { type: MISESNETWORK, chainId: MISES_CHAIN_ID };
}

const defaultProviderConfig = {
  ticker: MISES_SYMBOL,
  ...defaultProviderConfigOpts,
};

const defaultNetworkDetailsState = {
  EIPS: { 1559: undefined },
};

export const NETWORK_EVENTS = {
  // Fired after the actively selected network is changed
  NETWORK_DID_CHANGE: 'networkDidChange',
  // Fired when the actively selected network *will* change
  NETWORK_WILL_CHANGE: 'networkWillChange',
  // Fired when Infura returns an error indicating no support
  INFURA_IS_BLOCKED: 'infuraIsBlocked',
  // Fired when not using an Infura network or when Infura returns no error, indicating support
  INFURA_IS_UNBLOCKED: 'infuraIsUnblocked',
};

const getMisesMethods = async (
  method,
  params,
  {
    setInfo,
    setFollow,
    setUnFollow,
    getAccountFlag,
    getActive,
    restorePage,
    connect,
    disconnect,
    addressToMisesId,
  },
) => {
  switch (method) {
    case 'mises_setUserInfo': {
      try {
        await setInfo(params[0]);
        return true;
      } catch (error) {
        return error;
      }
    }
    case 'mises_userFollow': {
      try {
        await setFollow(params[0]);
        return true;
      } catch (error) {
        return error;
      }
    }
    case 'mises_userUnFollow': {
      try {
        await setUnFollow(params[0]);
        return true;
      } catch (error) {
        return error;
      }
    }
    case 'mises_getMisesAccount': {
      try {
        return getAccountFlag();
      } catch (error) {
        console.log(error);
        return error;
      }
    }
    case 'mises_getActive': {
      try {
        const flag = await getActive();
        console.log(flag, '有active');
        return Boolean(flag);
      } catch (error) {
        return error;
      }
    }
    case 'mises_openRestore': {
      try {
        restorePage();
        return true;
      } catch (error) {
        return error;
      }
    }
    case 'mises_connect': {
      try {
        connect(params[0]);
        return true;
      } catch (error) {
        return error;
      }
    }
    case 'mises_disconnect': {
      try {
        disconnect(params[0]);
        return true;
      } catch (error) {
        return error;
      }
    }
    case 'mises_getAddressToMisesId': {
      try {
        return addressToMisesId(params[0]);
      } catch (error) {
        return error;
      }
    }
    default:
      break;
  }
  return true;
};
const getMisesAccount = async ({
  exportAccount,
  generateAuth,
  getAccounts,
  hasPermission,
  getUnlockPromise,
  requestAccountsPermission,
}) => {
  let isProcessingRequestAccounts = false;
  if (isProcessingRequestAccounts) {
    return Promise.reject(
      ethErrors.rpc.resourceUnavailable(
        'Already processing eth_requestAccounts. Please wait.',
      ),
    );
  }
  console.log(hasPermission('eth_accounts'), 'hasPermission');
  if (hasPermission('eth_accounts')) {
    isProcessingRequestAccounts = true;
    try {
      await getUnlockPromise(true);
    } catch (err) {
      return Promise.reject(err);
    }
    isProcessingRequestAccounts = false;
  }
  // first, just try to get accounts
  let accounts = await getAccounts();
  if (accounts.length > 0) {
    const nonce = new Date().getTime();
    const key = await exportAccount(accounts[0]);
    const auth = await generateAuth(nonce, key); // get mises auth
    console.log('first, just try to get accounts');
    return {
      accounts,
      auth,
    };
  }
  // if no accounts, request the accounts permission
  try {
    await requestAccountsPermission();
  } catch (err) {
    return Promise.reject(err);
  }

  // get the accounts again
  accounts = await getAccounts();
  /* istanbul ignore else: too hard to induce, see below comment */
  if (accounts.length > 0) {
    const nonce = new Date().getTime();
    const key = await exportAccount(accounts[0]);
    const auth = await generateAuth(nonce, key); // get mises auth
    console.log('get the accounts again');
    return {
      accounts,
      auth,
    };
  }
  // this should never happen, because it should be caught in the
  // above catch clause
  return Promise.reject(
    ethErrors.rpc.internal(
      'Accounts unexpectedly unavailable. Please report this bug.',
    ),
  );
};
function createMisesMiddleware() {
  return (req, res, next, end) => {
    console.log('MisesMiddleware', 'req', req);
    if (req.method === 'eth_chainId') {
      res.result = -1;
      return end();
    }
    if (req.method === 'net_version') {
      res.result = '0x4';
      return end();
    }
    if (req.method === 'eth_getBalance') {
      res.result = 0;
      return end();
    }
    if (req.method === 'eth_getBlockByNumber') {
      res.result = null;
      return end();
    }
    if (
      ['eth_call', 'eth_sendTransaction', 'eth_sendTransaction'].includes(
        req.method,
      )
    ) {
      throw new Error(
        `Your Metamask wallet is now connected to Mises chain, please switch to ETH chain before invoke ${req.method}`,
      );
    }
    if (req.method === 'mises_requestAccounts') {
      getMisesAccount(globalOptions)
        .then((data) => {
          res.result = data;
          return end();
        })
        .catch((err) => {
          res.error = err;
          return end();
        });
    } else if (req.method && req.method.indexOf('mises_') > -1) {
      getMisesMethods(req.method, req.params, globalOptions)
        .then((data) => {
          res.result = data;
          return end();
        })
        .catch(() => {
          res.result = false;
          return end();
        });
    } else {
      return next();
    }
  };
}
class DummyBlockTracker extends SafeEventEmitter {
  isRunning() {
    return true;
  }

  getCurrentBlock() {
    return '';
  }

  getLatestBlock() {
    return '';
  }

  checkForLatestBlock() {
    return '';
  }

  removeAllListeners(_) {
    return this;
  }
}
export default class NetworkController extends EventEmitter {
  constructor(opts = {}) {
    super();
    // create stores
    this.providerStore = new ObservableStore(
      opts.provider || { ...defaultProviderConfig },
    );
    this.previousProviderStore = new ObservableStore(
      this.providerStore.getState(),
    );
    this.networkStore = new ObservableStore('loading');
    // We need to keep track of a few details about the current network
    // Ideally we'd merge this.networkStore with this new store, but doing so
    // will require a decent sized refactor of how we're accessing network
    // state. Currently this is only used for detecting EIP 1559 support but
    // can be extended to track other network details.
    this.networkDetails = new ObservableStore(
      opts.networkDetails || {
        ...defaultNetworkDetailsState,
      },
    );
    this.store = new ComposedStore({
      provider: this.providerStore,
      previousProviderStore: this.previousProviderStore,
      network: this.networkStore,
      networkDetails: this.networkDetails,
    });

    // provider and block tracker
    this._provider = null;
    this._blockTracker = null;

    // provider and block tracker proxies - because the network changes
    this._providerProxy = null;
    this._blockTrackerProxy = null;
    globalOptions = opts;
    this.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, this.lookupNetwork);
  }

  /**
   * Sets the Infura project ID
   *
   * @param {string} projectId - The Infura project ID
   * @throws {Error} If the project ID is not a valid string.
   */
  setInfuraProjectId(projectId) {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Invalid Infura project ID');
    }

    this._infuraProjectId = projectId;
  }

  initializeProvider(providerParams) {
    this._baseProviderParams = providerParams;
    const { type, rpcUrl, chainId } = this.getProviderConfig();
    this._configureProvider({ type, rpcUrl, chainId });
    this.lookupNetwork();
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker() {
    const provider = this._providerProxy;
    const blockTracker = this._blockTrackerProxy;
    return { provider, blockTracker };
  }

  /**
   * Method to return the latest block for the current network
   *
   * @returns {Object} Block header
   */
  getLatestBlock() {
    return new Promise((resolve, reject) => {
      const { provider } = this.getProviderAndBlockTracker();
      const ethQuery = new EthQuery(provider);
      ethQuery.sendAsync(
        { method: 'eth_getBlockByNumber', params: ['latest', false] },
        (err, block) => {
          if (err) {
            return reject(err);
          }
          return resolve(block);
        },
      );
    });
  }

  /**
   * Method to check if the block header contains fields that indicate EIP 1559
   * support (baseFeePerGas).
   *
   * @returns {Promise<boolean>} true if current network supports EIP 1559
   */
  async getEIP1559Compatibility() {
    const { EIPS } = this.networkDetails.getState();
    if (EIPS[1559] !== undefined) {
      return EIPS[1559];
    }
    const latestBlock = await this.getLatestBlock();
    const supportsEIP1559 =
      latestBlock && latestBlock.baseFeePerGas !== undefined;
    this.setNetworkEIPSupport(1559, supportsEIP1559);
    return supportsEIP1559;
  }

  verifyNetwork() {
    // Check network when restoring connectivity:
    if (this.isNetworkLoading()) {
      this.lookupNetwork();
    }
  }

  getNetworkState() {
    return this.networkStore.getState();
  }

  setNetworkState(network) {
    this.networkStore.putState(network);
  }

  /**
   * Set EIP support indication in the networkDetails store
   *
   * @param {number} EIPNumber - The number of the EIP to mark support for
   * @param {boolean} isSupported - True if the EIP is supported
   */
  setNetworkEIPSupport(EIPNumber, isSupported) {
    this.networkDetails.updateState({
      EIPS: {
        [EIPNumber]: isSupported,
      },
    });
  }

  /**
   * Reset EIP support to default (no support)
   */
  clearNetworkDetails() {
    this.networkDetails.putState({ ...defaultNetworkDetailsState });
  }

  isNetworkLoading() {
    return this.getNetworkState() === 'loading';
  }

  lookupNetwork() {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      );
      return;
    }

    const chainId = this.getCurrentChainId();
    if (!chainId) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing chainId',
      );
      this.setNetworkState('loading');
      // keep network details in sync with network state
      this.clearNetworkDetails();
      return;
    }

    // Ping the RPC endpoint so we can confirm that it works
    const ethQuery = new EthQuery(this._provider);
    const initialNetwork = this.getNetworkState();
    const { type } = this.getProviderConfig();
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);

    if (isInfura) {
      this._checkInfuraAvailability(type);
    } else {
      this.emit(NETWORK_EVENTS.INFURA_IS_UNBLOCKED);
    }

    ethQuery.sendAsync({ method: 'net_version' }, (err, networkVersion) => {
      const currentNetwork = this.getNetworkState();
      if (initialNetwork === currentNetwork) {
        if (err) {
          this.setNetworkState('loading');
          // keep network details in sync with network state
          this.clearNetworkDetails();
          return;
        }

        this.setNetworkState(networkVersion);
        // look up EIP-1559 support
        this.getEIP1559Compatibility();
      }
    });
  }

  getCurrentChainId() {
    const { type, chainId: configChainId } = this.getProviderConfig();
    return NETWORK_TYPE_TO_ID_MAP[type]?.chainId || configChainId;
  }

  setRpcTarget(rpcUrl, chainId, ticker = 'ETH', nickname = '', rpcPrefs) {
    assert.ok(
      isPrefixedFormattedHexString(chainId),
      `Invalid chain ID "${chainId}": invalid hex string.`,
    );
    assert.ok(
      isSafeChainId(parseInt(chainId, 16)),
      `Invalid chain ID "${chainId}": numerical value greater than max safe value.`,
    );
    this.setProviderConfig({
      type: NETWORK_TYPE_RPC,
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    });
  }

  async setProviderType(type) {
    // console.log(type);
    const mises = type === 'MisesTestNet';
    if (!mises) {
      assert.notStrictEqual(
        type,
        NETWORK_TYPE_RPC,
        `NetworkController - cannot call "setProviderType" with type "${NETWORK_TYPE_RPC}". Use "setRpcTarget"`,
      );
      assert.ok(
        INFURA_PROVIDER_TYPES.includes(type),
        `Unknown Infura provider type "${type}".`,
      );
    }
    const { chainId } = NETWORK_TYPE_TO_ID_MAP[type];
    this.setProviderConfig({
      type,
      rpcUrl: '',
      chainId,
      ticker: mises ? 'MIS' : 'ETH',
      nickname: '',
    });
  }

  resetConnection() {
    this.setProviderConfig(this.getProviderConfig());
  }

  /**
   * Sets the provider config and switches the network.
   *
   * @param config
   */
  setProviderConfig(config) {
    this.previousProviderStore.updateState(this.getProviderConfig());
    this.providerStore.updateState(config);
    this._switchNetwork(config);
  }

  rollbackToPreviousProvider() {
    const config = this.previousProviderStore.getState();
    this.providerStore.updateState(config);
    this._switchNetwork(config);
  }

  getProviderConfig() {
    return this.providerStore.getState();
  }

  getNetworkIdentifier() {
    const provider = this.providerStore.getState();
    return provider.type === NETWORK_TYPE_RPC ? provider.rpcUrl : provider.type;
  }

  //
  // Private
  //

  async _checkInfuraAvailability(network) {
    const rpcUrl = `https://${network}.infura.io/v3/${this._infuraProjectId}`;

    let networkChanged = false;
    this.once(NETWORK_EVENTS.NETWORK_DID_CHANGE, () => {
      networkChanged = true;
    });

    try {
      const response = await fetchWithTimeout(rpcUrl, {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      if (networkChanged) {
        return;
      }

      if (response.ok) {
        this.emit(NETWORK_EVENTS.INFURA_IS_UNBLOCKED);
      } else {
        const responseMessage = await response.json();
        if (networkChanged) {
          return;
        }
        if (responseMessage.error === INFURA_BLOCKED_KEY) {
          this.emit(NETWORK_EVENTS.INFURA_IS_BLOCKED);
        }
      }
    } catch (err) {
      log.warn(`MetaMask - Infura availability check failed`, err);
    }
  }

  _switchNetwork(opts) {
    // Indicate to subscribers that network is about to change
    this.emit(NETWORK_EVENTS.NETWORK_WILL_CHANGE);
    // Set loading state
    this.setNetworkState('loading');
    // Reset network details
    this.clearNetworkDetails();
    // Configure the provider appropriately
    this._configureProvider(opts);
    // Notify subscribers that network has changed
    this.emit(NETWORK_EVENTS.NETWORK_DID_CHANGE, opts.type);
  }

  _configureProvider({ type, rpcUrl, chainId }) {
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);
    if (isInfura) {
      this._configureInfuraProvider(type, this._infuraProjectId);
      // url-based rpc endpoints
    } else if (type === NETWORK_TYPE_RPC) {
      this._configureStandardProvider(rpcUrl, chainId);
    } else if (type === MISESNETWORK) {
      const blockTracker = new DummyBlockTracker();
      const networkMiddleware = createMisesMiddleware();
      this._setNetworkClient({ networkMiddleware, blockTracker });
      console.log(this);
    } else {
      throw new Error(
        `NetworkController - _configureProvider - unknown type "${type}"`,
      );
    }
  }

  _configureInfuraProvider(type, projectId) {
    log.info('NetworkController - configureInfuraProvider', type);
    const networkClient = createInfuraClient({
      network: type,
      projectId,
    });
    this._setNetworkClient(networkClient);
  }

  _configureStandardProvider(rpcUrl, chainId) {
    log.info('NetworkController - configureStandardProvider', rpcUrl);
    const networkClient = createJsonRpcClient({ rpcUrl, chainId });
    this._setNetworkClient(networkClient);
  }

  _setNetworkClient({ networkMiddleware, blockTracker }) {
    const metamaskMiddleware = createMetamaskMiddleware(
      this._baseProviderParams,
    );
    const engine = new JsonRpcEngine();
    engine.push(metamaskMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this._setProviderAndBlockTracker({ provider, blockTracker });
  }

  _setProviderAndBlockTracker({ provider, blockTracker }) {
    // update or initialize proxies
    if (this._providerProxy) {
      this._providerProxy.setTarget(provider);
    } else {
      this._providerProxy = createSwappableProxy(provider);
    }
    if (this._blockTrackerProxy) {
      this._blockTrackerProxy.setTarget(blockTracker);
    } else {
      this._blockTrackerProxy = createEventEmitterProxy(blockTracker, {
        eventFilter: 'skipInternal',
      });
    }
    // set new provider and blockTracker
    this._provider = provider;
    this._blockTracker = blockTracker;
  }

  mergeNetworkOpts(options) {
    globalOptions = { ...globalOptions, ...options };
  }
}
