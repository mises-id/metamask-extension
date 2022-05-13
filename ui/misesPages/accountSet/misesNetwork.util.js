export const MISES_SITE_API = 'https://api.alb.mises.site/api/v1';
// export const MISES_SITE_API = 'http://192.168.1.2:8080/api/v1';
// export const MISES_POINT = 'http://192.168.1.8:26657';
export const MISES_POINT = 'http://127.0.0.1:26657';
// mises network api map
export const getBaseApi = (type) => {
  switch (type) {
    case 'signin': // get api token
      return `${MISES_SITE_API}/signin`;
    case 'gasprices': // get gasprices
      return `${MISES_SITE_API}/mises/gasprices`;
    case 'assets':
      return `${MISES_SITE_API}/opensea/assets`;
    case 'single_asset':
      return `${MISES_SITE_API}/opensea/single_asset`;
    case 'assets_contract':
      return `${MISES_SITE_API}/opensea/assets_contract`;
    default:
      throw new Error('getBaseApi requires an api call type');
  }
};
