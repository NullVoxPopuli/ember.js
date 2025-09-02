import { isHTMLSafe } from './string.js';
import { t as tagForProperty } from '../../../../../shared-chunks/cache-D0AO_9wX.js';
import '../../../../debug/index.js';
import '@embroider/macros';
import { consumeTag } from '../../../../../@glimmer/validator/index.js';
import '../../../../../shared-chunks/env-DxZ20QzS.js';
import '../../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { i as isProxy } from '../../../../../shared-chunks/is_proxy-5oejL_VX.js';

function toBool(predicate) {
  if (isProxy(predicate)) {
    consumeTag(tagForProperty(predicate, 'content'));
    return Boolean(predicate.isTruthy);
  } else if (Array.isArray(predicate)) {
    consumeTag(tagForProperty(predicate, '[]'));
    return predicate.length !== 0;
  } else if (isHTMLSafe(predicate)) {
    return Boolean(predicate.toString());
  } else {
    return Boolean(predicate);
  }
}

export { toBool as default };
