import { CollectiblesController } from '@metamask/controllers';
import { getBaseApi } from '../../../../ui/misesPages/accountSet/misesNetwork.util';

const RINKEBY_CHAIN_ID = '0x4';
export default class MisesCollectiblesController extends CollectiblesController {
  getCollectibleApi(contractAddress, tokenId) {
    const { chainId } = this.config;
    return `${getBaseApi(
      'single_asset',
    )}?asset_contract_address=${contractAddress}&token_id=${tokenId}&network=${
      chainId === RINKEBY_CHAIN_ID ? 'test' : 'main'
    }`;
  }

  getCollectibleContractInformationApi(contractAddress) {
    const { chainId } = this.config;
    return `${getBaseApi(
      'assets_contract',
    )}?asset_contract_address=${contractAddress}&network=${
      chainId === RINKEBY_CHAIN_ID ? 'test' : 'main'
    }`;
  }
}
