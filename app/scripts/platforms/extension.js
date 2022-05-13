import browser from 'webextension-polyfill';

import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { getEnvironmentType, checkForError } from '../lib/util';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import { isMobile } from '../../../ui/helpers/utils/is-mobile-view';

export default class ExtensionPlatform {
  //
  // Public
  //
  reload() {
    browser.runtime.reload();
  }

  openTab(options) {
    console.log('openTab', browser.tabs);
    return new Promise((resolve, reject) => {
      browser.tabs.create(options).then((newTab) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newTab);
      });
    });
  }

  moveTab(tabId, options) {
    console.log('moveTab', tabId, options);
    return new Promise((resolve, reject) => {
      browser.tabs.move(
        tabId,
        options.then((newTab) => {
          const error = checkForError();
          if (error) {
            return reject(error);
          }
          return resolve(newTab);
        }),
      );
    });
  }

  openWindow(options) {
    console.log('openWindow', options);
    return new Promise((resolve, reject) => {
      if (isMobile()) {
        const { url, openerTabId, index } = options;
        this.openTab({
          url,
          openerTabId,
          index,
        }).then((newWindow) => {
          const error = checkForError();
          if (error) {
            return reject(error);
          }
          return resolve(newWindow);
        });
      } else {
        const { url, type, width, height, left, top } = options;
        browser.windows
          .create({
            url,
            type,
            width,
            height,
            left,
            top,
          })
          .then((newWindow) => {
            const error = checkForError();
            if (error) {
              return reject(error);
            }
            return resolve(newWindow);
          });
      }
    });
  }

  focusWindow(windowId) {
    return new Promise((resolve, reject) => {
      if (isMobile()) {
        return resolve();
      }
      browser.windows.update(windowId, { focused: true }).then(() => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve();
      });
      return resolve();
    });
  }

  updateWindowPosition(windowId, left, top) {
    return new Promise((resolve, reject) => {
      if (isMobile()) {
        return resolve();
      }
      browser.windows.update(windowId, { left, top }).then(() => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve();
      });
      return resolve();
    });
  }

  getLastFocusedWindow() {
    return new Promise((resolve, reject) => {
      browser.windows.getLastFocused().then((windowObject) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windowObject);
      });
    });
  }

  closeCurrentWindow(id) {
    if (isMobile()) {
      return this.getActiveTabs().then((windowDetails) => {
        console.log(windowDetails, id, 'closeCurrentWindow');
        const closeId = windowDetails[0].id;
        browser.tabs.get(closeId).then((e) => {
          if (e && closeId === id) {
            console.log(id, 'closeCurrentWindow=closeCurrentWindow');
            browser.tabs.remove(id);
          }
        });
      });
    }
    return browser.windows.getCurrent().then((windowDetails) => {
      return browser.windows.remove(windowDetails.id);
    });
  }

  getVersion() {
    const {
      version,
      version_name: versionName,
    } = browser.runtime.getManifest();

    const versionParts = version.split('.');
    if (versionName) {
      if (versionParts.length < 4) {
        throw new Error(`Version missing build number: '${version}'`);
      }
      // On Chrome, a more descriptive representation of the version is stored
      // in the `version_name` field for display purposes.
      return versionName;
    } else if (versionParts.length !== 3) {
      throw new Error(`Invalid version: ${version}`);
    } else if (versionParts[2].match(/[^\d]/u)) {
      // On Firefox, the build type and build version are in the fourth part of the version.
      const [major, minor, patchAndPrerelease] = versionParts;
      const matches = patchAndPrerelease.match(/^(\d+)([A-Za-z]+)(\d)+$/u);
      if (matches === null) {
        throw new Error(`Version contains invalid prerelease: ${version}`);
      }
      const [, patch, buildType, buildVersion] = matches;
      return `${major}.${minor}.${patch}-${buildType}.${buildVersion}`;
    }

    // If there is no `version_name` and there are only 3 version parts, then this is not a
    // prerelease and the version requires no modification.
    return version;
  }

  openExtensionInBrowser(
    route = null,
    queryString = null,
    keepWindowOpen = false,
    url = 'home.html',
  ) {
    let extensionURL = browser.runtime.getURL(url);

    if (route) {
      extensionURL += `#${route}`;
    }

    if (queryString) {
      extensionURL += `?${queryString}`;
    }

    this.openTab({ url: extensionURL });
    if (
      getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND &&
      !keepWindowOpen
    ) {
      window.close();
    }
  }

  getPlatformInfo(cb) {
    browser.runtime
      .getPlatformInfo()
      .then((platformInfo) => cb(platformInfo))
      .catch((err) => cb(err));
  }

  showTransactionNotification(txMeta, rpcPrefs) {
    const { status, txReceipt: { status: receiptStatus } = {} } = txMeta;

    if (status === TRANSACTION_STATUSES.CONFIRMED) {
      // There was an on-chain failure
      receiptStatus === '0x0'
        ? this._showFailedTransaction(
            txMeta,
            'Transaction encountered an error.',
          )
        : this._showConfirmedTransaction(txMeta, rpcPrefs);
    } else if (status === TRANSACTION_STATUSES.FAILED) {
      this._showFailedTransaction(txMeta);
    }
  }

  addOnRemovedListener(listener) {
    if (isMobile()) {
      browser.tabs.onRemoved.addListener(listener);
    } else {
      browser.windows.onRemoved.addListener(listener);
    }
  }

  getAllWindows() {
    return new Promise((resolve, reject) => {
      browser.windows.getAll().then((windows) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windows);
      });
    });
  }

  getActiveTabs() {
    return browser.tabs.query({ active: true });
  }

  getTabs(options) {
    return new Promise((resolve, reject) => {
      browser.tabs.query(options).then((tabs) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(tabs);
      });
    });
  }

  currentTab() {
    return new Promise((resolve, reject) => {
      browser.tabs.getCurrent().then((tab) => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve(tab);
        }
      });
    });
  }

  switchToTab(tabId) {
    console.log('switchToTab', tabId);
    return browser.tabs.update(tabId, { highlighted: true });
  }

  closeTab(tabId) {
    return new Promise((resolve, reject) => {
      browser.tabs.remove(tabId).then(() => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  _showConfirmedTransaction(txMeta, rpcPrefs) {
    this._subscribeToNotificationClicked();

    const url = getBlockExplorerLink(txMeta, rpcPrefs);
    const nonce = parseInt(txMeta.txParams.nonce, 16);

    const title = 'Confirmed transaction';
    const message = `Transaction ${nonce} confirmed! ${
      url.length ? 'View on Etherscan' : ''
    }`;
    this._showNotification(title, message, url);
  }

  _showFailedTransaction(txMeta, errorMessage) {
    const nonce = parseInt(txMeta.txParams.nonce, 16);
    const title = 'Failed transaction';
    const message = `Transaction ${nonce} failed! ${
      errorMessage || txMeta.err.message
    }`;
    this._showNotification(title, message);
  }

  _showNotification(title, message, url) {
    browser.notifications.create(url, {
      type: 'basic',
      title,
      iconUrl: browser.runtime.getURL('../../images/icon-64.png'),
      message,
    });
  }

  _subscribeToNotificationClicked() {
    if (!browser.notifications.onClicked.hasListener(this._viewOnEtherscan)) {
      browser.notifications.onClicked.addListener(this._viewOnEtherscan);
    }
  }

  _viewOnEtherscan(url) {
    if (url.startsWith('https://')) {
      browser.tabs.create({ url });
    }
  }
}
