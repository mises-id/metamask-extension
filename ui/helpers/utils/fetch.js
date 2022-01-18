/*
 * @Author: lmk
 * @Date: 2021-12-29 09:53:19
 * @LastEditTime: 2021-12-29 10:59:21
 * @LastEditors: lmk
 * @Description: fetch
 */
export function request(options) {
  return new Promise((resolve, reject) => {
    window
      .fetch(options.url, {
        method: options.method || 'GET',
        body: JSON.stringify(options.body || options.params),
        headers: options.headers || {
          'Content-Type': 'application/json;charset=utf-8',
        },
      })
      .then(async (response) => {
        if (response.status === 200) {
          const res = await response.json();
          console.log(res);
          res.code === 0 ? resolve(res.data) : reject(res.message);
        } else {
          reject(response.statusText);
        }
      })
      .catch(reject);
  });
}
