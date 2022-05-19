import addEthereumChain from './add-ethereum-chain';
import ethAccounts from './eth-accounts';
import getProviderState from './get-provider-state';
import logWeb3ShimUsage from './log-web3-shim-usage';
import requestAccounts from './request-accounts';
import sendMetadata from './send-metadata';
import switchEthereumChain from './switch-ethereum-chain';
import watchAsset from './watch-asset';
import misesGetAccount from './mises/get-mises-account';
import misesRequestAccounts from './mises/request-accounts';
import getAddressToMisesId from './mises/getAddressToMisesId';
import getCollectibles from './mises/getCollectibles';
import connect from './mises/connect';
import setUserInfo from './mises/setUserInfo';
import follow from './mises/follow';
import unfollow from './mises/unfollow';
import getActive from './mises/getActive';
import disconnect from './mises/disconnect';
import openRestore from './mises/openRestore';
import openNFTPage from './mises/openNFTPage';

const handlers = [
  addEthereumChain,
  ethAccounts,
  getProviderState,
  logWeb3ShimUsage,
  requestAccounts,
  sendMetadata,
  switchEthereumChain,
  watchAsset,
  misesGetAccount, // get mises account is
  misesRequestAccounts, // request mises accounts is
  getAddressToMisesId, // get mises address to mises id is
  getCollectibles, // get collectibles is
  connect, // connect mises network
  setUserInfo, // set user info
  follow, // follow mises user
  unfollow, // unfollow mises user
  getActive, // get active mises user
  disconnect, // disconnect mises network
  openRestore, // open restore page
  openNFTPage, // open nft page
];
export default handlers;
