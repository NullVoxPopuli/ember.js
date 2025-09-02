import '../../../../debug/index.js';
import { createUnboundRef, valueForRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

/**
@module ember
*/

const unbound = internalHelper(({
  positional,
  named
}) => {
  (isDevelopingApp() && !(positional.length === 1 && Object.keys(named).length === 0) && assert('unbound helper cannot be called with multiple params or hash params', positional.length === 1 && Object.keys(named).length === 0));
  return createUnboundRef(valueForRef(positional[0]), '(result of an `unbound` helper)');
});

export { unbound as default };
