import { a as tagForObject } from '../../../../../shared-chunks/cache-D0AO_9wX.js';
import '../../../../debug/index.js';
import { isDevelopingApp } from '@embroider/macros';
import { consumeTag } from '../../../../../@glimmer/validator/index.js';
import '../../../../../shared-chunks/env-DxZ20QzS.js';
import '../../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { i as isProxy } from '../../../../../shared-chunks/is_proxy-5oejL_VX.js';
import { createComputeRef, valueForRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { assert } from '../../../../debug/lib/assert.js';

/**
@module ember
*/
class EachInWrapper {
  constructor(inner) {
    this.inner = inner;
  }
}
const eachIn = internalHelper(({
  positional
}) => {
  const inner = positional[0];
  (isDevelopingApp() && !(inner) && assert('expected at least one positional arg', inner));
  return createComputeRef(() => {
    let iterable = valueForRef(inner);
    consumeTag(tagForObject(iterable));
    if (isProxy(iterable)) {
      // this is because the each-in doesn't actually get(proxy, 'key') but bypasses it
      // and the proxy's tag is lazy updated on access
      iterable = _contentFor(iterable);
    }
    return new EachInWrapper(iterable);
  });
});

export { EachInWrapper, eachIn as default };
