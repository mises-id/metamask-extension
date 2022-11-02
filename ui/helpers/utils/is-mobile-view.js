// Checks if viewport at invoke time fits mobile dimensions
// isMobileView :: () => Bool
const isMobileView = () =>
  window.matchMedia('screen and (max-width: 575px)').matches;

export default isMobileView;

/**
 * Judge platform type
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
