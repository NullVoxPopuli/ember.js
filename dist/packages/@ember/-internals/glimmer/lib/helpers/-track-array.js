import { t as tagForProperty } from '../../../../../shared-chunks/cache-D0AO_9wX.js';
import '../../../../debug/index.js';
import { isDevelopingApp } from '@embroider/macros';
import { consumeTag } from '../../../../../@glimmer/validator/index.js';
import '../../../../../shared-chunks/env-DxZ20QzS.js';
import { b as isObject } from '../../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { createComputeRef, valueForRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { assert } from '../../../../debug/lib/assert.js';

/**
@module ember
*/
const trackArray = internalHelper(({
  positional
}) => {
  const inner = positional[0];
  (isDevelopingApp() && !(inner) && assert('expected at least one positional arg', inner));
  return createComputeRef(() => {
    let iterable = valueForRef(inner);
    if (isObject(iterable)) {
      consumeTag(tagForProperty(iterable, '[]'));
    }
    return iterable;
  });
});

export { trackArray as default };
