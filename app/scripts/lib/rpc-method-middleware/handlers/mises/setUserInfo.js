import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

/**
 * This internal method is used by our external provider to send metadata about
 * permission subjects so that we can e.g. display a proper name and icon in
 * our UI.
 */

const sendMetadata = {
  methodNames: [MESSAGE_TYPE.MISES_SETUSERINFO],
  implementation: setUserinfoHandler,
  hookNames: {
    setInfo: true,
  },
};
export default sendMetadata;

/**
 * @typedef {Record<string, Function>} SendMetadataOptions
 * @property {Function} addSubjectMetadata - A function that records subject
 * metadata, bound to the requesting origin.
 * @property {string} subjectType - The type of the requesting origin / subject.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<unknown>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {SendMetadataOptions} options
 */
async function setUserinfoHandler(req, res, _next, end, { setInfo }) {
  const { params } = req;
  try {
    await setInfo(params[0]);
    res.result = true;
  } catch (error) {
    console.log(error);
    res.error = error;
  }
  return end();
}
