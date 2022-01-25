import { createAsyncMiddleware } from 'json-rpc-engine';
import { ethErrors } from 'eth-rpc-errors';

/**
 * Create middleware for handling certain methods and preprocessing permissions requests.
 */
export default function createPermissionsMethodMiddleware({
  addDomainMetadata,
  getAccounts,
  getUnlockPromise,
  hasPermission,
  notifyAccountsChanged,
  requestAccountsPermission,
  setInfo,
  setUnFollow,
  setFollow,
  generateAuth,
  getAccountFlag,
  getActive,
  exportAccount,
  restorePage,
  connect,
  disconnect,
  addressToMisesId,
}) {
  let isProcessingRequestAccounts = false;

  return createAsyncMiddleware(async (req, res, next) => {
    let responseHandler;
    switch (req.method) {
      // Intercepting eth_accounts requests for backwards compatibility:
      // The getAccounts call below wraps the rpc-cap middleware, and returns
      // an empty array in case of errors (such as 4100:unauthorized)
      case 'eth_accounts': {
        res.result = await getAccounts();
        return;
      }
      case 'mises_requestAccounts':
      case 'eth_requestAccounts': {
        if (isProcessingRequestAccounts) {
          res.error = ethErrors.rpc.resourceUnavailable(
            'Already processing eth_requestAccounts. Please wait.',
          );
          return;
        }

        if (hasPermission('eth_accounts')) {
          isProcessingRequestAccounts = true;
          await getUnlockPromise();
          isProcessingRequestAccounts = false;
        }

        // first, just try to get accounts
        let accounts = await getAccounts();
        if (accounts.length > 0) {
          if (req.method === 'eth_requestAccounts') {
            res.result = accounts;
          }
          if (req.method === 'mises_requestAccounts') {
            const nonce = new Date().getTime();
            const key = await exportAccount(accounts[0]);
            const auth = await generateAuth(nonce, key); // get mises auth
            res.result = {
              accounts,
              auth,
            };
          }
          return;
        }

        // if no accounts, request the accounts permission
        try {
          await requestAccountsPermission();
        } catch (err) {
          res.error = err;
          return;
        }

        // get the accounts again
        accounts = await getAccounts();
        /* istanbul ignore else: too hard to induce, see below comment */
        if (accounts.length > 0) {
          if (req.method === 'eth_requestAccounts') {
            res.result = accounts;
          }
          if (req.method === 'mises_requestAccounts') {
            const nonce = new Date().getTime();
            const key = await exportAccount(accounts[0]);
            const auth = await generateAuth(nonce, key); // get mises auth
            res.result = {
              accounts,
              auth,
            };
          }
        } else {
          // this should never happen, because it should be caught in the
          // above catch clause
          res.error = ethErrors.rpc.internal(
            'Accounts unexpectedly unavailable. Please report this bug.',
          );
        }

        return;
      }
      // custom method for getting metadata from the requesting domain,
      // sent automatically by the inpage provider when it's initialized
      case 'metamask_sendDomainMetadata': {
        if (typeof req.params?.name === 'string') {
          addDomainMetadata(req.origin, req.params);
        }
        res.result = true;
        return;
      }
      // register return handler to send accountsChanged notification
      case 'wallet_requestPermissions': {
        if ('eth_accounts' in req.params?.[0]) {
          responseHandler = async () => {
            if (Array.isArray(res.result)) {
              for (const permission of res.result) {
                if (permission.parentCapability === 'eth_accounts') {
                  notifyAccountsChanged(await getAccounts());
                }
              }
            }
          };
        }
        break;
      }
      case 'mises_setUserInfo': {
        try {
          await setInfo(req.params[0]);
          res.result = true;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_userFollow': {
        try {
          await setFollow(req.params[0]);
          res.result = true;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_userUnFollow': {
        try {
          await setUnFollow(req.params[0]);
          res.result = true;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_getMisesAccount': {
        try {
          const flag = await getAccountFlag();
          res.result = flag;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_getActive': {
        try {
          const flag = await getActive();
          console.log(flag, '有active');
          res.result = Boolean(flag);
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_openRestore': {
        try {
          restorePage();
          res.result = true;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_connect': {
        try {
          connect(req.params[0]);
          res.result = true;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_disconnect': {
        try {
          disconnect(req.params[0]);
          res.result = true;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      case 'mises_getAddressToMisesId': {
        try {
          const misesid = await addressToMisesId(req.params[0]);
          res.result = misesid;
        } catch (error) {
          res.result = false;
        }
        return;
      }
      default:
        break;
    }

    // when this promise resolves, the response is on its way back
    // eslint-disable-next-line node/callback-return
    await next();

    if (responseHandler) {
      responseHandler();
    }
  });
}
