/*
 * @Author: lmk
 * @Date: 2021-12-16 14:20:20
 * @LastEditTime: 2022-01-11 13:56:49
 * @LastEditors: lmk
 * @Description: network api manager
 */
export const MISES_SITE_API = 'https://apiv2.mises.site/api/v1';
// export const MISES_SITE_API = 'http://192.168.1.10:8080/api/v1/';
// export const MISES_POINT = 'http://192.168.1.8:26657';
export const MISES_POINT = 'http://127.0.0.1:26657';
// mises network api map
export const getBaseApi = (type) => {
  switch (type) {
    case 'signin': // get api token
      return `${MISES_SITE_API}/signin`;
    default:
      throw new Error('getBaseApi requires an api call type');
  }
};
