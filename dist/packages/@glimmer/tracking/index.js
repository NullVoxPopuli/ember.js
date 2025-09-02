export { e as tracked } from '../../shared-chunks/cache-D0AO_9wX.js';
import '../../@ember/debug/index.js';
import { isDevelopingApp } from '@embroider/macros';
import '../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import '../destroyable/index.js';
import '../manager/index.js';
import { createCache, getValue } from '../validator/index.js';
import '../../shared-chunks/env-DxZ20QzS.js';

// NOTE: copied from: https://github.com/glimmerjs/glimmer.js/pull/358
// Both glimmerjs/glimmer.js and emberjs/ember.js have the exact same implementation
// of @cached, so any changes made to one should also be made to the other

const cached = (...args) => {
  const [target, key, descriptor] = args;

  // Error on `@cached()`, `@cached(...args)`, and `@cached propName = value;`
  if (isDevelopingApp() && target === undefined) throwCachedExtraneousParens();
  if (isDevelopingApp() && (typeof target !== 'object' || typeof key !== 'string' || typeof descriptor !== 'object' || args.length !== 3)) {
    throwCachedInvalidArgsError(args);
  }
  if (isDevelopingApp() && (!('get' in descriptor) || typeof descriptor.get !== 'function')) {
    throwCachedGetterOnlyError(key);
  }
  const caches = new WeakMap();
  const getter = descriptor.get;
  descriptor.get = function () {
    if (!caches.has(this)) {
      caches.set(this, createCache(getter.bind(this)));
    }
    return getValue(caches.get(this));
  };
};
function throwCachedExtraneousParens() {
  throw new Error('You attempted to use @cached(), which is not necessary nor supported. Remove the parentheses and you will be good to go!');
}
function throwCachedGetterOnlyError(key) {
  throw new Error(`The @cached decorator must be applied to getters. '${key}' is not a getter.`);
}
function throwCachedInvalidArgsError(args = []) {
  throw new Error(`You attempted to use @cached on with ${args.length > 1 ? 'arguments' : 'an argument'} ( @cached(${args.map(d => `'${d}'`).join(', ')}), which is not supported. Dependencies are automatically tracked, so you can just use ${'`@cached`'}`);
}

export { cached };
