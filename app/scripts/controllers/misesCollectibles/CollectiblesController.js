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

  /**
   * Checks the ownership of a ERC-721 or ERC-1155 collectible for a given address.
   *
   * @param ownerAddress - User public address.
   * @param collectibleAddress - Collectible contract address.
   * @param collectibleId - Collectible token ID.
   * @returns Promise resolving the collectible ownership.
   */
  async isCollectibleOwner(ownerAddress, collectibleAddress, collectibleId) {
    console.log(ownerAddress, collectibleAddress, collectibleId);
    // Checks the ownership for ERC-721.
    try {
      const owner = await this.getERC721OwnerOf(
        collectibleAddress,
        collectibleId,
      );
      // If the owner contract address of the current collectibleAddress returns 0x, it is considered not the current owner Continue with the getERC1155BalanceOf function
      if (owner.toLowerCase() !== '0x') {
        return ownerAddress.toLowerCase() === owner.toLowerCase();
      }
      // eslint-disable-next-line no-empty
    } catch (_a) {
      // Ignore ERC-721 contract error
      console.log(_a, 'isCollectibleOwner');
    }
    // Checks the ownership for ERC-1155.
    try {
      const balance = await this.getERC1155BalanceOf(
        ownerAddress,
        collectibleAddress,
        collectibleId,
      );
      return balance > 0;
      // eslint-disable-next-line no-empty
    } catch (_b) {
      // Ignore ERC-1155 contract error
    }
    throw new Error(
      'Unable to verify ownership. Probably because the standard is not supported or the chain is incorrect.',
    );
  }
}
