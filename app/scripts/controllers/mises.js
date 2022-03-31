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
/*
 * @Author: lmk
 * @Date: 2021-12-16 14:36:05
 * @LastEditTime: 2022-03-31 21:06:36
 * @LastEditors: lmk
 * @Description: mises controller
 */
export default class MisesController {
  timer;

  intervalTime = 200000;

  misesGasfee;

  constructor({ exportAccount, getKeyringAccounts, getSelectedAddress }) {
    this.exportAccount = exportAccount;
    this.getKeyringAccounts = getKeyringAccounts;
    this.getSelectedAddress = getSelectedAddress;
    this.store = new ObservableStore({
      priKeyHex: '',
      accountList: [],
      transformFlag: 'loading',
    });
    this.config = MisesSdk.newConfig();
    this.coinDefine = MisesSdk.newCoinDefine();
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

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * @description: set current misesUser
   * @param {string} key
   * @return {object} MUser
   */
  async activate(priKeyHex) {
    return this.misesUser.activateUser(priKeyHex);
  }

  /**
   * @description: get mises.site token
   * @param {object} query:{misesId:string,sign:string,nonce:string,pubkey:string}
   * @return {string} token
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
   * @description: set store token
   * @param {string} token
   * @return {*}
   */
  async getMisesUserInfo(address) {
    /* 
    1.拿到用户信息 使用misesid+时间戳调用signMsg获取sign字段
    2.使用activeUser拿到用户信息
    2.使用时间戳调用generateAuth返回参数 使用参数拿到token
    3.拿到token组装数据给setToMisesPrivate(userinfo)
    */
    try {
      // console.log('获取用户数据');
      const nonce = new Date().getTime();
      const activeUser = this.getActive();
      const auth = await this.generateAuth(nonce);
      const { accountList } = this.store.getState();
      const misesBalance = await this.getUserBalance(address);
      const misesId = activeUser.address();
      const account = accountList.find((val) => val.address === address) || {
        address,
        auth,
        misesBalance,
        misesId,
      };
      if (!account.token) {
        const { token } = await this.getServerToken({
          provider: 'mises',
          user_authz: { auth },
        });
        account.token = token;
        const findIndex = accountList.findIndex(
          (val) => val.address === account.address,
        );
        if (findIndex > -1) {
          accountList[findIndex] = account;
        } else {
          // console.log(accountList, account, 'account');
          accountList.push(account);
        }
        this.store.updateState({
          accountList,
        });
        // accountList.push(account);
        // this.store.updateState({
        //   accountList,
        // });
      }
      const isRegistered = await activeUser.isRegistered();
      // const misesId = activeUser.misesID();
      if (isRegistered) {
        const userInfo = await activeUser.info();
        // console.log(userInfo, misesId, '用户数据');
        return {
          nickname:
            userInfo.name ||
            shortenAddress(misesId, MISES_TRUNCATED_ADDRESS_START_CHARS),
          avatar: userInfo.avatarUrl,
          misesId,
          token: account.token,
        };
      }
      return { token: account.token, misesId };
      // return {
      //   token: account.token,
      //   misesId: 'did:mises:mises16q6leu5py42kv3xlr5l7p74560ve2xa9gj422v',
      //   username: 'test',
      //   gender: 'other',
      //   mobile: '13800138000',
      //   email: 'exp@qq.com',
      // };
    } catch (error) {
      // console.log(error, 'error');
      return Promise.reject(error);
    }
  }

  async generateAuth(nonce, key) {
    try {
      let activeUser = this.getActive();
      if (!activeUser) {
        activeUser = await this.activate(key);
      }
      return activeUser.generateAuth(nonce);
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  /**
   * @description: set mises userInfo to browser
   * @param {object} params:{misesId:string,nickname:string,avatar:string,token:string}
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
   * @description: reset account list
   * @param {*}
   * @return {*}
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
      // console.log({
      //   ...data,
      //   version,
      // });
      const info = await activeUser.setInfo({
        ...data,
        version,
      });
      const { accountList } = this.store.getState();
      const misesId = activeUser.address();
      const { token } =
        accountList.find((val) => val.misesId === misesId) || {};
      // console.log(token);
      if (token) {
        this.setToMisesPrivate({
          nickname:
            data.name ||
            shortenAddress(misesId, MISES_TRUNCATED_ADDRESS_START_CHARS),
          avatar: data.avatarUrl,
          token,
          misesId,
        });
      }
      console.log('setinfo success', info);
      return info;
    } catch (error) {
      console.log(error, 'error');
      return false;
    }
  }

  setUnFollow(data) {
    const activeUser = this.getActive();
    return activeUser.unfollow(data);
  }

  setFollow(data) {
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
    const accountList = keyringList.map(async (val) => {
      const misesBalance = await this.getUserBalance(val);
      const user = await this.getMisesUser(val);
      return {
        address: val,
        misesBalance,
        misesId: user.address(),
      };
    });
    return accountList;
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

  async recentTransactions(type) {
    const selectedAddress = this.getSelectedAddress();
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
      list = list.map((val) => {
        val.rawLog = JSON.parse(val.rawLog);
        val.raw = val.rawLog[0].events;
        const transfers = val.raw[3].attributes;
        const amount = transfers[2].value.replace('umis', '|umis').split('|');
        const currency = this.coinDefine.fromCoin({
          amount: amount[0],
          denom: amount[1],
        });
        const balanceObj = this.coinDefine.toCoinMIS(currency);
        balanceObj.denom = balanceObj.denom.toUpperCase();
        return {
          category:
            transfers[0].value === activeUser.address() ? 'receive' : 'send',
          date: `${val.height}`,
          height: val.height,
          displayedStatusKey: 'confirmed',
          isPending: false,
          primaryCurrency: `${balanceObj.amount} ${balanceObj.denom}`,
          recipientAddress: transfers[0].value,
          secondaryCurrency: `${balanceObj.amount} ${balanceObj.denom}`,
          senderAddress: transfers[1].value,
          subtitle: '',
          subtitleContainsOrigin: false,
          title: '',
          nonce: '0x0',
          transactionGroupType: 'mises',
          hasCancelled: false,
          hasRetried: false,
          initialTransaction: { id: '0x0' },
          primaryTransaction: { err: {}, status: '' },
        };
      });
      list.sort((a, b) => b.height - a.height);
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

  async setAccountTransactionsHeight() {
    const selectedAddress = this.getSelectedAddress();
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
}
