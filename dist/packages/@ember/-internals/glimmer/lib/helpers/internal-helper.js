import { setInternalHelperManager } from '../../../../../@glimmer/manager/index.js';

function internalHelper(helper) {
  return setInternalHelperManager(helper, {});
}

export { internalHelper };
