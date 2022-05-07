import { CollectiblesController } from '@metamask/controllers';
import {
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
} from '../../../../shared/constants/network';
import { getBaseApi } from '../../../../ui/misesPages/accountSet/misesNetwork.util';

export default class MisesCollectiblesController extends CollectiblesController {
  getNetwork() {
    const { chainId } = this.config;
    if (chainId === MAINNET_CHAIN_ID) {
      return 'main';
    }
    if (chainId === RINKEBY_CHAIN_ID) {
      return 'test';
    }
    return 'unknown';
  }

  getCollectibleApi(contractAddress, tokenId) {
    // const { chainId } = this.config;
    return `${getBaseApi(
      'single_asset',
    )}?asset_contract_address=${contractAddress}&token_id=${tokenId}&network=${this.getNetwork()}`;
  }

  getCollectibleContractInformationApi(contractAddress) {
    return `${getBaseApi(
      'assets_contract',
    )}?asset_contract_address=${contractAddress}&network=${this.getNetwork()}`;
  }
}
