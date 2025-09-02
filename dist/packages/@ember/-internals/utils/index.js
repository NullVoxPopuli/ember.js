export { e as enumerableSymbol, i as isInternalSymbol, s as symbol } from '../../../shared-chunks/symbol-Bye5Bjw-.js';
export { m as dictionary } from '../../../shared-chunks/dictionary-gc5gpyOG.js';
export { G as GUID_KEY, R as ROOT, d as checkHasSuper, c as generateGuid, a as getDebugName, g as guidFor, i as intern, b as isObject, l as lookupDescriptor, o as observerListenerMetaFor, e as setListeners, s as setObservers, h as setWithMandatorySetter, f as setupMandatorySetter, t as teardownMandatorySetter, u as uuid, w as wrap } from '../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
export { g as getName, s as setName } from '../../../shared-chunks/name-BUiO6dqy.js';
export { t as toString } from '../../../shared-chunks/to-string-C7M8LBLH.js';
export { i as isProxy, s as setProxy } from '../../../shared-chunks/is_proxy-5oejL_VX.js';
export { C as Cache } from '../../../shared-chunks/cache-qDyqAcpg.js';

/**
  Checks to see if the `methodName` exists on the `obj`.

  ```javascript
  let foo = { bar: function() { return 'bar'; }, baz: null };

  Ember.canInvoke(foo, 'bar'); // true
  Ember.canInvoke(foo, 'baz'); // false
  Ember.canInvoke(foo, 'bat'); // false
  ```

  @method canInvoke
  @for Ember
  @param {Object} obj The object to check for the method
  @param {String} methodName The method name to check for
  @return {Boolean}
  @private
*/
function canInvoke(obj, methodName) {
  return obj != null && typeof obj[methodName] === 'function';
}

/**
  @module @ember/utils
*/

export { canInvoke };
