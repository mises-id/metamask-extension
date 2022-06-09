import MisesSdk from 'mises-js-sdk';
import { ObservableStore } from '@metamask/obs-store';
import BigNumber from 'bignumber.js';
import {
  getBaseApi,
  MISES_POINT,
} from '../../../ui/misesPages/accountSet/misesNetwork.util';
import { request } from '../../../ui/helpers/utils/fetch';
import { shortenAddress } from '../../../ui/helpers/utils/util';
import { MISES_TRUNCATED_ADDRESS_START_CHARS } from '../../../shared/constants/labels';

export default class MisesController {
  timer;

  intervalTime = 200000;

  misesGasfee;

  constructor({ exportAccount, getKeyringAccounts }) {
    this.exportAccount = exportAccount;
    this.getKeyringAccounts = getKeyringAccounts;
    // this.getSelectedAddress = getSelectedAddress;
    this.store = new ObservableStore({
      priKeyHex: '',
      accountList: [],
      transformFlag: 'loading',
    });
    this.config = MisesSdk.newConfig();
    this.coinDefine = MisesSdk.newCoinDefine();
    this.msgReader = MisesSdk.newMsgReader();
    this.coinDefine.load();
    this.config.setLCDEndpoint(MISES_POINT);
    this.misesSdk = MisesSdk.newSdk(this.config);
    this.misesUser = this.misesSdk.userMgr();
    this.misesAppMgr = this.misesSdk.appMgr();

    this.gasPriceAndLimit();
  }

  async updataBalance() {
    const balanceList = await this.getAccountMisesBalance();
    Promise.all(balanceList).then((res) => {
      let accountList = this.getAccountList();
      accountList = accountList.map((val) => {
        const findIndex = res.findIndex((item) => item.address === val.address);
        if (findIndex > -1) {
          val.misesBalance = res[findIndex].misesBalance;
        }
        return val;
      });
      console.log('updataBalance', accountList);
      this.store.updateState({
        accountList,
      });
    });
  }

  getAccountList() {
    const { accountList } = this.store.getState();
    return accountList;
  }

  getMisesAccount(address) {
    if (address) {
      const accountList = this.getAccountList();
      const find = accountList.find((item) => item.address === address);
      if (find) {
        return find;
      }
    }
    return {};
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * @type key
   * @property {string} key - private key
   * @returns {object} MUser
   */
  async activate(priKeyHex) {
    return this.misesUser.activateUser(priKeyHex);
  }

  /**
   * @type query
   * @property {object} query - {misesId:string,sign:string,nonce:string,pubkey:string}
   * @returns {object} MUser
   */
  getServerToken(query) {
    return request({
      url: getBaseApi('signin'),
      method: 'POST',
      body: query,
    });
  }

  async getGasPrices() {
    try {
      const res = await request({
        url: getBaseApi('gasprices'),
      });
      return res;
    } catch (error) {
      return Promise.resolve({});
    }
  }

  getActive() {
    return this.misesUser.activeUser();
  }

  /**
   * @type address
   * @property {string} address - The account's ethereum address, in lower case.
   * @type token
   * @property {string} token - The token to be used for the transaction.
   * @returns {object} MUser
   * set store token
   */
  async getMisesUserInfo(address) {
    const { accountList } = this.store.getState();
    const activeUser = this.getActive();
    console.log(activeUser, 'activeUser');
    const misesId = activeUser ? activeUser.address() : '';
    let account = accountList.find((val) => val.address === address) || null;
    const nonce = new Date().getTime();
    const { auth } = await this.generateAuth(nonce);
    if (!account) {
      const misesBalance = await this.getUserBalance(address);
      account = {
        address,
        misesId,
        misesBalance,
        auth,
      };
    }
    const nowTimeStamp = new Date().getTime();
    const expireTokenFlag =
      account.token &&
      account.timestamp &&
      nowTimeStamp - account.timestamp > 604800000; // 6 days
    if (!account.token || expireTokenFlag) {
      try {
        const referrer = await this.getinstallreferrer();
        const { token } = await this.getServerToken({
          provider: 'mises',
          user_authz: { auth },
          referrer,
        });
        account.token = token;
        account.timestamp = new Date().getTime();
      } catch (error) {
        return Promise.reject(error, 'get token Error');
      }
      const isRegistered = await activeUser.isRegistered();
      if (isRegistered) {
        console.log(isRegistered, 'not found userinfo cache');
        const userInfo = await activeUser.info();
        account.userInfo = {
          name:
            userInfo.name ||
            shortenAddress(misesId, MISES_TRUNCATED_ADDRESS_START_CHARS),
          avatarUrl: userInfo.avatarUrl,
        };
      }
      const findIndex = accountList.findIndex(
        (val) => val.address === account.address,
      );
      findIndex > -1
        ? (accountList[findIndex] = account)
        : accountList.push(account);
      this.store.updateState({
        accountList,
      });
    }
    const userinfo = {
      nickname: account.userInfo
        ? account.userInfo.name
        : shortenAddress(misesId, MISES_TRUNCATED_ADDRESS_START_CHARS),
      avatar: account.userInfo && account.userInfo.avatarUrl,
      misesId,
      token: account.token,
    };
    console.log(userinfo, 'method:getMisesUserInfo');
    return userinfo;
  }

  async generateAuth(nonce, key) {
    try {
      const activeUser = key ? await this.activate(key) : this.getActive();
      const auth = await activeUser.generateAuth(nonce);
      return {
        auth,
        misesId: activeUser.address(),
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  /**
   * @type params
   * @property {object} params - {misesId:string,nickname:string,avatar:string,token:string}
   * set mises userInfo to browser
   */
  setToMisesPrivate(params) {
    console.log('Ready to call setmisesid', params);
    window.localStorage.setItem('setAccount', true);
    return new Promise((resolve) => {
      /* global chrome */
      if (chrome.misesPrivate) {
        chrome.misesPrivate.setMisesId(JSON.stringify(params));
        return resolve();
      }
      console.log('The missesprivate object does not exist');
      return resolve('not defind setMisesId Function');
      // return reject(JSON.stringify(params));
    });
  }

  /**
   * reset account list
   */
  lockAll() {
    // console.log('清除了mises数据');
    // this.misesUser.lockAll();
  }

  async setUserInfo(data) {
    try {
      const activeUser = this.getActive();
      const userinfo = await activeUser.info();
      const version = userinfo.version.add(1);
      const info = await activeUser.setInfo({
        ...data,
        version,
      });
      const { accountList } = this.store.getState();
      const misesId = activeUser.address();
      const index = accountList.findIndex((val) => val.misesId === misesId);
      if (index > -1) {
        const { token } = accountList[index] || {};
        const updateUserInfo = {
          nickname:
            data.name ||
            shortenAddress(misesId, MISES_TRUNCATED_ADDRESS_START_CHARS),
          avatar: data.avatarUrl,
          token,
          misesId,
        };
        token && this.setToMisesPrivate(updateUserInfo); // set mises userInfo to browser
        // set mises to chrome extension
        accountList[index].userInfo = {
          name: updateUserInfo.nickname,
          avatarUrl: updateUserInfo.avatar,
        };
        // update accountList
        this.store.updateState({
          accountList,
        });
        console.log('update userinfo cache ', accountList[index]);
      }
      console.log('setinfo success', info);
      return info;
    } catch (error) {
      console.log(error, 'error');
      return false;
    }
  }

  setUnFollow(data) {
    console.log('mises:setUnFollow');
    const activeUser = this.getActive();
    return activeUser.unfollow(data);
  }

  setFollow(data) {
    console.log('mises:setFollow');
    const activeUser = this.getActive();
    return activeUser.follow(data);
  }

  async connect({ domain, appid, userid, permissions }) {
    // console.log({ domain, appid, userid, permissions }, 'connect');
    try {
      await this.misesAppMgr.ensureApp(appid, domain);
      const connect = await this.misesSdk.connect(
        domain,
        appid,
        userid,
        permissions,
      );
      // console.log(connect, 'connect');
      return connect;
    } catch (error) {
      // console.log(error, 'wqeeeeee');
      return false;
    }
  }

  disconnect({ appid, userid }) {
    // console.log({ appid, userid }, 'disconnect');
    return this.misesSdk.disconnect(appid, userid);
  }

  async getAccountMisesBalance() {
    const keyringList = await this.getKeyringAccounts();
    const accountList = this.getAccountList();
    return keyringList.map(async (val) => {
      const misesBalance = await this.getUserBalance(val);
      const user = await this.getMisesUser(val);
      const cacheObj = accountList.find((item) => item.address === val) || {};
      return {
        ...cacheObj,
        address: val,
        misesBalance,
        misesId: user.address(),
      };
    });
  }

  async initMisesBalance() {
    // console.log('initMisesBalance');
    const accountList = await this.getAccountMisesBalance();
    Promise.all(accountList).then((res) => {
      // console.log(res, 'accountList');
      this.store.updateState({
        accountList: res,
      });
    });
  }

  async getMisesUser(address) {
    const key = await this.exportAccount(address); // get priKeyHex
    const user = await this.misesUser.getUser(key);
    return user;
  }

  async addressToMisesId(address) {
    const user = await this.getMisesUser(address);
    return user.address();
  }

  async getUserBalance(address) {
    // console.log();
    try {
      const user = await this.getMisesUser(address);
      const balanceLong = await user.getBalanceUMIS();
      if (user && balanceLong) {
        const balanceObj = this.coinDefine.toCoinMIS(balanceLong);
        balanceObj.denom = balanceObj.denom.toUpperCase();
        return balanceObj;
      }
      return Promise.resolve({
        amount: '0',
        denom: 'MIS',
      });
    } catch (error) {
      // console.log(error);
      return Promise.resolve({
        amount: '0',
        denom: 'MIS',
      });
    }
  }

  async gasPriceAndLimit() {
    try {
      const gasPrices = await this.getGasPrices();

      const proposeGasprice =
        gasPrices.propose_gasprice || this.config.gasPrice();

      this.config.setGasPriceAndLimit(proposeGasprice, 200000);
      console.log('gasPriceAndLimit', proposeGasprice);
      return proposeGasprice;
    } catch (error) {
      return Promise.resolve(this.config.gasPrice());
    }
  }

  async setMisesBook(misesId, amount, simulate = false) {
    const activeUser = this.getActive();
    const amountLong = this.coinDefine.fromCoin({
      amount,
      denom: 'mis',
    });
    console.log(simulate, 'simulate');
    if (!simulate) {
      try {
        const res = await activeUser.sendUMIS(misesId, amountLong);
        this.store.updateState({
          transformFlag: res.code === 0 ? 'success' : 'error',
        });
        console.log(res, 'success-setMisesBook');
        return true;
      } catch (error) {
        this.store.updateState({
          transformFlag: 'error',
        });
        console.log(error, 'err-setMisesBook');
        return false;
      }
    }

    try {
      if (this.misesGasfee) {
        console.log('get cache misesGasfee');
        return this.misesGasfee;
      }
      const res = await activeUser.sendUMIS(misesId, amountLong, simulate);

      const proposeGasprice = await this.gasPriceAndLimit();

      const gasprice = new BigNumber(proposeGasprice)
        .times(new BigNumber(res.gasWanted || 67751))
        .toString();

      console.log(proposeGasprice, res, 'propose_gasprice');
      const gasWanted = this.coinDefine.fromCoin({
        amount: gasprice,
        denom: 'umis',
      });
      const toCoinMIS = await this.coinDefine.toCoinMIS(gasWanted);
      res.gasWanted = toCoinMIS.amount;
      this.misesGasfee = res;
      return res;
    } catch (error) {
      console.log(error, 'err-simulate');
      return false;
    }
  }

  resetTranstionFlag() {
    this.store.updateState({
      transformFlag: 'loading',
    });
  }

  parseAmountItem(item) {
    const amount = item.value.replace('umis', '|umis').split('|');
    const currency = this.coinDefine.fromCoin({
      amount: amount[0],
      denom: amount[1],
    });
    const coin = this.coinDefine.toCoinMIS(currency);
    return {
      amount: coin.amount,
      denom: coin.denom.toUpperCase(),
    };
  }

  parseTxEvents(activeUserAddr, tx) {
    const events = tx.raw;
    return events.reduce((result, event) => {
      let amount = { amount: '', denom: '' };
      let recipient = {};
      let sender = {};
      let category = '';
      let title = '';
      let subtitle = '';
      let transactionGroupType = 'misesIn';
      switch (event.type) {
        case 'transfer': {
          const amountItem = event.attributes.find(
            (item) => item.key === 'amount',
          );
          if (amountItem) {
            amount = this.parseAmountItem(amountItem);
          }
          recipient = event.attributes.find((item) => item.key === 'recipient');
          sender = event.attributes.find((item) => item.key === 'sender');
          category =
            recipient && recipient.value === activeUserAddr
              ? 'receive'
              : 'send';
          transactionGroupType = 
            recipient && recipient.value === activeUserAddr
              ? 'misesIn'
              : 'misesOut';
          break;
        }

        case 'withdraw_rewards': {
          const amountItem = event.attributes.find(
            (item) => item.key === 'amount',
          );
          if (amountItem) {
            amount = this.parseAmountItem(amountItem);
          }

          sender = event.attributes.find(
            (item) => item.key === 'validator',
          );
          recipient = {value: activeUserAddr}

          category = 'interaction';
          title = 'Withdraw Rewards';
          transactionGroupType = 'misesIn';
          break;
        }
        case 'delegate': {
          const amountItem = event.attributes.find(
            (item) => item.key === 'amount',
          );
          if (amountItem) {
            amount = this.parseAmountItem(amountItem);
          }
          sender = {value: activeUserAddr}
          recipient = event.attributes.find(
            (item) => item.key === 'validator',
          );
          category = 'interaction';
          title = 'Delegate';
          transactionGroupType = 'misesOut';
          break;
        }
        case 'redelegate': {
          const amountItem = event.attributes.find(
            (item) => item.key === 'amount',
          );
          if (amountItem) {
            amount = this.parseAmountItem(amountItem);
          }
          sender = {value: activeUserAddr}
          recipient = event.attributes.find(
            (item) => item.key === 'destination_validator',
          );
          category = 'interaction';
          title = 'Redelegate';
          transactionGroupType = 'misesOut';
          break;
        }
        case 'unbond': {
          const amountItem = event.attributes.find(
            (item) => item.key === 'amount',
          );
          if (amountItem) {
            amount = this.parseAmountItem(amountItem);
          }
          sender = event.attributes.find(
            (item) => item.key === 'validator',
          );
          recipient = {value: activeUserAddr}
          category = 'interaction';
          title = 'Unbond';
          transactionGroupType = 'misesIn';
          break;
        }
        default:
          return result;
      }

      return result.concat({
        category,
        date:
          result.length === 0
            ? `${tx.height}`
            : `${tx.height}:${result.length}`,
        height: tx.height,
        displayedStatusKey: 'confirmed',
        isPending: false,
        primaryCurrency: `${amount.amount} ${amount.denom}`,
        recipientAddress: recipient.value ?? '',
        secondaryCurrency: `${amount.amount} ${amount.denom}`,
        senderAddress: sender.value ?? '',
        subtitle,
        subtitleContainsOrigin: false,
        title,
        nonce: '0x0',
        transactionGroupType,
        hasCancelled: false,
        hasRetried: false,
        initialTransaction: { id: '0x0', hash: tx.hash },
        primaryTransaction: { err: {}, status: '', hash: tx.hash },
      });
    }, []);
  }

  async recentTransactions(type, selectedAddress) {
    // const selectedAddress = this.getSelectedAddress();
    const accountList = this.getAccountList();
    const index = accountList.findIndex(
      (val) => val.address === selectedAddress,
    );
    const currentAddress = accountList[index] || {};
    if (type === 'cache') {
      console.log('get cache', currentAddress);
      return currentAddress.transactions || [];
    }
    console.log('get network');
    try {
      const activeUser = this.getActive();
      let list = await activeUser.recentTransactions(currentAddress.height);
      console.log(list, 'recentTransactions');
      list = list.reduce((result, val) => {
        val.rawLog = JSON.parse(val.rawLog);
        val.raw = [];
        val.rawLog.forEach((item) => {
          val.raw = [...val.raw, ...item.events];
        });
        return result.concat(this.parseTxEvents(activeUser.address(), val));
      }, []);
      // list.sort((a, b) => b.height - a.height);
      if (index > -1) {
        accountList[index].transactions = list;
        this.store.updateState({
          accountList,
        });
      }
      console.log(list);
      return list;
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  getAccountFlag() {
    return window.localStorage.getItem('setAccount');
  }

  async setAccountTransactionsHeight(selectedAddress) {
    // const selectedAddress = this.getSelectedAddress();
    const accountList = this.getAccountList();
    const index = accountList.findIndex(
      (val) => val.address === selectedAddress,
    );
    if (index > -1) {
      const { transactions = [] } = accountList[index];
      const last = transactions[0] || {};
      console.log(last);
      accountList[index].height = last.height + 1;
      // console.log(last.height, accountList, 'setAccountTransactionsHeight');
      this.store.updateState({
        accountList,
      });
    }
  }

  getinstallreferrer() {
    return new Promise((resolve) => {
      if (chrome.misesPrivate && chrome.misesPrivate.getInstallReferrer) {
        chrome.misesPrivate.getInstallReferrer((res) => {
          resolve(res);
        });
        return;
      }
      resolve('');
    });
  }

  async postTx(params) {
    console.log(params, 'postTx:getParmas===');
    const activeUser = this.getActive();
    const data = await activeUser.postTx(
      params.msgs,
      '',
      params.gasFee,
      params.gasLimit,
    );
    if (data.code !== 0) {
      return Promise.reject(data.rawLog);
    }
    return data;
  }

  getReader(msg) {
    return this.msgReader.summary(msg);
  }
}
