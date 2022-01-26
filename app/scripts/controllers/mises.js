import MisesSdk from 'mises-js-sdk';
import { ObservableStore } from '@metamask/obs-store';
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
 * @LastEditTime: 2022-01-26 21:29:55
 * @LastEditors: lmk
 * @Description: mises controller
 */
export default class MisesController {
  constructor({ exportAccount, getKeyringAccounts }) {
    this.exportAccount = exportAccount;
    this.getKeyringAccounts = getKeyringAccounts;
    this.store = new ObservableStore({
      priKeyHex: '',
      accountList: [],
      transformFlag: 'loading',
    });
    const config = MisesSdk.newConfig();
    this.coinDefine = MisesSdk.newCoinDefine();
    this.coinDefine.load();
    config.setLCDEndpoint(MISES_POINT);
    this.misesSdk = MisesSdk.newSdk(config);
    this.misesUser = this.misesSdk.userMgr();
    this.misesAppMgr = this.misesSdk.appMgr();
    console.log(this.misesSdk, this.misesUser, this.misesAppMgr);
  }

  /**
   * @description: set current misesUser
   * @param {string} key
   * @return {object} MUser
   */
  async activate(priKeyHex) {
    // this.store.updateState({
    //   priKeyHex,
    // });
    console.log('拿到了priKeyHex', priKeyHex);
    // return priKeyHex;
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
      console.log('获取用户数据');
      const nonce = new Date().getTime();
      const activeUser = this.misesUser.activeUser();
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
          console.log(accountList, account, 'account');
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
        console.log(userInfo, misesId, '用户数据');
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
      console.log(error, 'error');
      return Promise.reject(error);
    }
  }

  async generateAuth(nonce, key) {
    let activeUser = this.misesUser.activeUser();
    if (!activeUser) {
      activeUser = await this.misesUser.activateUser(key);
    }
    return activeUser.generateAuth(nonce);
  }

  /**
   * @description: set mises userInfo to browser
   * @param {object} params:{misesId:string,nickname:string,avatar:string,token:string}
   */
  setToMisesPrivate(params) {
    console.log('准备i调用setMisesId', params);
    window.localStorage.setItem('setAccount', true);
    return new Promise((resolve) => {
      /* global chrome */
      if (chrome.misesPrivate) {
        chrome.misesPrivate.setMisesId(JSON.stringify(params));
        return resolve();
      }
      console.log('chrome.misesPrivate对象不存在');
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
      const activeUser = this.misesUser.activeUser();
      const userinfo = await activeUser.info();
      const version = userinfo.version.add(1);
      console.log({
        ...data,
        version,
      });
      const info = await activeUser.setInfo({
        ...data,
        version,
      });
      const { accountList } = this.store.getState();
      const misesId = activeUser.address();
      const { token } =
        accountList.find((val) => val.misesId === misesId) || {};
      console.log(token);
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
    const activeUser = this.misesUser.activeUser();
    return activeUser.follow(data);
  }

  setFollow(data) {
    const activeUser = this.misesUser.activeUser();
    return activeUser.unfollow(data);
  }

  async connect({ domain, appid, userid, permissions }) {
    console.log({ domain, appid, userid, permissions }, 'connect');
    try {
      await this.misesAppMgr.ensureApp(appid, domain);
      const connect = await this.misesSdk.connect(
        domain,
        appid,
        userid,
        permissions,
      );
      console.log(connect, 'connect');
      return connect;
    } catch (error) {
      console.log(error, 'wqeeeeee');
      return false;
    }
  }

  disconnect({ appid, userid }) {
    console.log({ appid, userid }, 'disconnect');
    return this.misesSdk.disconnect(appid, userid);
  }

  async initMisesBalance() {
    const keyringList = await this.getKeyringAccounts();
    console.log(keyringList, 'initMisesBalance');
    const accountList = keyringList.map(async (val) => {
      const misesBalance = await this.getUserBalance(val);
      const user = await this.getMisesUser(val);
      return {
        address: val,
        misesBalance,
        misesId: user.address(),
      };
    });
    await Promise.all(accountList).then((res) => {
      console.log(res, 'accountList');
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
        const balanceObj = await this.coinDefine.toCoinMIS(balanceLong);
        balanceObj.denom = balanceObj.denom.toUpperCase();
        return balanceObj;
      }
      return Promise.resolve({
        amount: '0',
        denom: 'MIS',
      });
    } catch (error) {
      console.log(error);
      return Promise.resolve({
        amount: '0',
        denom: 'MIS',
      });
    }
  }

  async setMisesBook(misesId, amount) {
    try {
      const activeUser = this.misesUser.activeUser();
      const amountLong = this.coinDefine.fromCoin({
        amount,
        denom: 'mis',
      });
      const res = await activeUser.sendUMIS(misesId, amountLong);
      this.store.updateState({
        transformFlag: res.height > 0 ? 'success' : 'error',
      });
      // history.push(MISES_SEND_CONFIRM_ROUTE);
      return true;
    } catch (error) {
      console.log(error, 'wwww');
      this.store.updateState({
        transformFlag: 'error',
      });
      return false;
    }
  }

  resetTranstionFlag() {
    this.store.updateState({
      transformFlag: 'loading',
    });
  }

  async recentTransactions() {
    try {
      const activeUser = this.misesUser.activeUser();
      let list = await activeUser.recentTransactions();
      list = list.map((val) => {
        val.rawLog = JSON.parse(val.rawLog);
        val.raw = val.rawLog[0].events;
        console.log(val);
        const transfers = val.raw[3].attributes;
        const amount = transfers[2].value.replace('umis', '|').split('|');
        const currency = this.coinDefine.fromCoin({
          amount: amount[0],
          denom: 'umis',
        });
        const balanceObj = this.coinDefine.toCoinMIS(currency);
        balanceObj.denom = balanceObj.denom.toUpperCase();
        const transactionGroup = {
          category:
            transfers[0].value === activeUser.address() ? 'receive' : 'send',
          date: `${val.height}`,
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
        return transactionGroup;
      });
      console.log(list);
      list.sort((a, b) => a.height - b.height);
      return list;
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  getAccountFlag() {
    return window.localStorage.getItem('setAccount');
  }
}
