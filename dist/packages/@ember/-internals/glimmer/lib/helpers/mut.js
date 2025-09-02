import '../../../../debug/index.js';
import { isUpdatableRef, createInvokableRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

/**
@module ember
*/
const mut = internalHelper(({
  positional
}) => {
  let ref = positional[0];
  (isDevelopingApp() && !(ref) && assert('expected at least one positional arg', ref)); // TODO: Improve this error message. This covers at least two distinct
  // cases:
  //
  // 1. (mut "not a path") – passing a literal, result from a helper
  //    invocation, etc
  //
  // 2. (mut receivedValue) – passing a value received from the caller
  //    that was originally derived from a literal, result from a helper
  //    invocation, etc
  //
  // This message is alright for the first case, but could be quite
  // confusing for the second case.
  (isDevelopingApp() && !(isUpdatableRef(ref)) && assert('You can only pass a path to mut', isUpdatableRef(ref)));
  return createInvokableRef(ref);
});

export { mut as default };
