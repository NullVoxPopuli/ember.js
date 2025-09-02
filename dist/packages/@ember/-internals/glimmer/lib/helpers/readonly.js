import { createReadOnlyRef } from '../../../../../@glimmer/reference/index.js';
import '../../../../debug/index.js';
import { internalHelper } from './internal-helper.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

/**
@module ember
*/

const readonly = internalHelper(({
  positional
}) => {
  let firstArg = positional[0];
  (isDevelopingApp() && !(firstArg) && assert('has first arg', firstArg));
  return createReadOnlyRef(firstArg);
});

export { readonly as default };
