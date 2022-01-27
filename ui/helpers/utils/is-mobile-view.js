// Checks if viewport at invoke time fits mobile dimensions
// isMobileView :: () => Bool
const isMobileView = () =>
  window.matchMedia('screen and (max-width: $break-small)').matches;

export default isMobileView;

/**
 * @description: Judge platform type
 * @param {*}
 * @return {boolean} true:mobile false:pc
 */
export function isMobile() {
  // const isMobileFlag = Boolean(
  //   window.navigator.userAgent.match(
  //     /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/u,
  //   ),
  // );
  // return isMobileFlag;
  return true;
}
