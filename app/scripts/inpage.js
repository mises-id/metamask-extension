// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define;

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define;
  try {
    global.define = undefined;
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.');
  }
};

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define;
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.');
  }
};

cleanContextForImports();

/* eslint-disable import/first */
import log from 'loglevel';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//

// setup background connection
const metamaskStream = new WindowPostMessageStream({
  name: 'metamask-inpage',
  target: 'metamask-contentscript',
});

initializeProvider({
  connectionStream: metamaskStream,
  logger: log,
  shouldShimWeb3: true,
});
const __getLargeImg = (_) => {
  let img;
  const nodeList = document.getElementsByTagName('img');
  for (let i = 0; i < nodeList.length; i++) {
    const node = nodeList[i];
    let h = node.naturalHeight;
    let w = node.naturalWidth;
    if (h === 0 || w === 0) {
      h = node.height;
      w = node.width;
    }
    if (h >= 200 && w >= 300) {
      img = nodeList[i];
      if (img && img.src && img.src.toLowerCase().startsWith('http')) {
        break;
      }
    }
  }
  return img && img.src;
};
const __getFavicon = (_) => {
  let favicon;
  const nodeList = document.getElementsByTagName('link');
  for (let i = 0; i < nodeList.length; i++) {
    const rel = nodeList[i].getAttribute('rel');
    if (
      rel === 'icon' ||
      rel === 'shortcut icon' ||
      rel === 'icon shortcut' ||
      rel === 'apple-touch-icon'
    ) {
      favicon = nodeList[i];
    }
  }
  return favicon && favicon.href;
};
window.misesModule = {
  getWindowInformation() {
    const config = window.$misesShare;
    const url = window.location.href;
    const icon = config ? config.images : __getLargeImg() || __getFavicon();
    const { title } = window.document;
    console.log({ url, icon, title });
    return { url, icon, title };
  },
};
