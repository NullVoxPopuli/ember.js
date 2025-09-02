import '../../../../debug/index.js';
import { createComputeRef, valueForRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

let helper;
if (isDevelopingApp()) {
  helper = args => {
    const inner = args.positional[0];
    (isDevelopingApp() && !(inner) && assert('expected at least one positional arg', inner));
    return createComputeRef(() => {
      let value = valueForRef(inner);
      (isDevelopingApp() && !(value !== null && value !== undefined) && assert('You cannot pass a null or undefined destination element to in-element', value !== null && value !== undefined));
      return value;
    });
  };
} else {
  helper = args => {
    let arg = args.positional[0];
    (isDevelopingApp() && !(arg) && assert('expected at least one positional arg', arg));
    return arg;
  };
}
const inElementNullCheckHelper = internalHelper(helper);

export { inElementNullCheckHelper as default };
