import { CollectibleDetectionController } from '@metamask/controllers';
import { getBaseApi } from '../../../../ui/misesPages/accountSet/misesNetwork.util';
import { request } from '../../../../ui/helpers/utils/fetch';
import {
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
} from '../../../../shared/constants/network';

export default class MisesCollectibleDetectionController extends CollectibleDetectionController {
  offset = '';

  requestLock = false;

  constructor(options, config, state) {
    super(options, config, state);
    this.isMainnet = () => true;
    options.onNetworkStateChange(async ({ provider }) => {
      if (
        [MAINNET_CHAIN_ID, RINKEBY_CHAIN_ID].includes(provider.chainId) &&
        options.isUnlocked() &&
        !this.requestLock
      ) {
        this.requestLock = true;
        try {
          await this.startPolling();
          console.log(111111);
        } finally {
          setTimeout(() => {
            this.requestLock = false;
          }, 100);
        }
      }
    });
  }

  getOwnerCollectiblesApi(address, offset) {
    const { chainId } = this.config;
    // const a = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';
    return `${getBaseApi(
      'assets',
    )}?owner=${address}&cursor=${offset}&limit=50&network=${
      chainId === RINKEBY_CHAIN_ID ? 'test' : 'main'
    }`;
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
    try {
      const openSeaApiKey = this.getOpenSeaApiKey();
      const api = this.getOwnerCollectiblesApi(address, this.offset);
      const { assets, next } = await request({
        url: api,
        method: 'GET',
        headers: { 'X-API-KEY': openSeaApiKey },
        isCustom: true,
      });
      this.offset = next || '';
      return assets;
    } catch (error) {
      return [];
    }
  }
}
