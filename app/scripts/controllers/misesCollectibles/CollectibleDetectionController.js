import { CollectibleDetectionController } from '@metamask/controllers';
import { getBaseApi } from '../../../../ui/misesPages/accountSet/misesNetwork.util';
import { request } from '../../../../ui/helpers/utils/fetch';
import { CHAIN_IDS } from '../../../../shared/constants/network';

export default class MisesCollectibleDetectionController extends CollectibleDetectionController {
  offset = '';

  requestLock = false;

  constructor(options, config, state) {
    super(options, config, state);
    this.isMainnet = () => ![CHAIN_IDS.MISES].includes(this.config.chainId);
    options.onNetworkStateChange(async ({ provider }) => {
      if (
        ![CHAIN_IDS.MISES].includes(provider.chainId) &&
        options.isUnlocked() &&
        !this.requestLock
      ) {
        this.requestLock = true;
        try {
          await this.startPolling();
        } finally {
          setTimeout(() => {
            this.requestLock = false;
          }, 100);
        }
      }
    });
    this.getNetwork = options.getNetwork;
    this.getMisesAccount = options.getMisesAccount;
  }

  getOwnerCollectiblesApi(address, offset) {
    // const a = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';
    return `${getBaseApi(
      'assets',
    )}?owner=${address}&cursor=${offset}&limit=50&network=${this.getNetwork()}`;
    // switch (chainId) {
    //   case RINKEBY_CHAIN_ID:
    //     return `https://testnets-api.opensea.io/api/v1/assets?owner=${address}&offset=${offset}&limit=50`;
    //   default:
    //     return `${getBaseApi(
    //       'assets',
    //     )}?owner=${address}&cursor=${offset}&limit=50`;
    // }
  }

  startPolling() {
    this.detectCollectibles();
  }

  async getOwnerCollectibles(address) {
    const { token } = this.getMisesAccount(address);
    if (!token) {
      return Promise.resolve([]);
    }
    try {
      // const openSeaApiKey = this.getOpenSeaApiKey();
      const api = this.getOwnerCollectiblesApi(address, this.offset);
      const { assets, next } = await request({
        url: api,
        method: 'GET',
        headers: {
          // 'X-API-KEY': openSeaApiKey,
          Authorization: `Bearer ${token}`,
        },
        isCustom: true,
      });
      this.offset = next || '';
      return Array.isArray(assets) ? assets : [];
    } catch (error) {
      return [];
    }
  }
}
