import { peekMeta, meta } from '../@ember/-internals/meta/lib/meta.js';
import '../@ember/debug/index.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../@ember/debug/lib/assert.js';
import { f as setupMandatorySetter, b as isObject } from './mandatory-setter-Bij6Bx8G.js';
import { isDestroyed } from '../@glimmer/destroyable/index.js';
import { getCustomTagFor } from '../@glimmer/manager/index.js';
import { tagFor, CONSTANT_TAG, dirtyTagFor, trackedData, consumeTag } from '../@glimmer/validator/index.js';
import { s as symbol } from './symbol-Bye5Bjw-.js';
import { t as toString } from './to-string-C7M8LBLH.js';
import './env-DxZ20QzS.js';

function isElementDescriptor(args) {
  let [maybeTarget, maybeKey, maybeDesc] = args;
  return (
    // Ensure we have the right number of args
    args.length === 3 && (
    // Make sure the target is a class or object (prototype)
    typeof maybeTarget === 'function' || typeof maybeTarget === 'object' && maybeTarget !== null) &&
    // Make sure the key is a string
    typeof maybeKey === 'string' && (
    // Make sure the descriptor is the right shape
    typeof maybeDesc === 'object' && maybeDesc !== null || maybeDesc === undefined)
  );
}
function nativeDescDecorator(propertyDesc) {
  let decorator = function () {
    return propertyDesc;
  };
  setClassicDecorator(decorator);
  return decorator;
}

/**
  Objects of this type can implement an interface to respond to requests to
  get and set. The default implementation handles simple properties.

  @class Descriptor
  @private
*/
class ComputedDescriptor {
  enumerable = true;
  configurable = true;
  _dependentKeys = undefined;
  _meta = undefined;
  setup(_obj, keyName, _propertyDesc, meta) {
    meta.writeDescriptors(keyName, this);
  }
  teardown(_obj, keyName, meta) {
    meta.removeDescriptors(keyName);
  }
}
if (isDevelopingApp()) ;

/////////////

const DECORATOR_DESCRIPTOR_MAP = new WeakMap();

/**
  Returns the CP descriptor associated with `obj` and `keyName`, if any.

  @method descriptorForProperty
  @param {Object} obj the object to check
  @param {String} keyName the key to check
  @return {Descriptor}
  @private
*/
function descriptorForProperty(obj, keyName, _meta) {
  (isDevelopingApp() && !(obj !== null) && assert('Cannot call `descriptorForProperty` on null', obj !== null));
  (isDevelopingApp() && !(obj !== undefined) && assert('Cannot call `descriptorForProperty` on undefined', obj !== undefined));
  (isDevelopingApp() && !(typeof obj === 'object' || typeof obj === 'function') && assert(`Cannot call \`descriptorForProperty\` on ${typeof obj}`, typeof obj === 'object' || typeof obj === 'function'));
  let meta = _meta === undefined ? peekMeta(obj) : _meta;
  if (meta !== null) {
    return meta.peekDescriptors(keyName);
  }
}
function descriptorForDecorator(dec) {
  return DECORATOR_DESCRIPTOR_MAP.get(dec);
}

/**
  Check whether a value is a decorator

  @method isClassicDecorator
  @param {any} possibleDesc the value to check
  @return {boolean}
  @private
*/
function isClassicDecorator(dec) {
  return typeof dec === 'function' && DECORATOR_DESCRIPTOR_MAP.has(dec);
}

/**
  Set a value as a decorator

  @method setClassicDecorator
  @param {function} decorator the value to mark as a decorator
  @private
*/
function setClassicDecorator(dec, value = true) {
  DECORATOR_DESCRIPTOR_MAP.set(dec, value);
}

// This is exported for `@tracked`, but should otherwise be avoided. Use `tagForObject`.
const SELF_TAG = symbol('SELF_TAG');
function tagForProperty(obj, propertyKey, addMandatorySetter = false, meta) {
  let customTagFor = getCustomTagFor(obj);
  if (customTagFor !== undefined) {
    return customTagFor(obj, propertyKey, addMandatorySetter);
  }
  let tag = tagFor(obj, propertyKey, meta);
  if (isDevelopingApp() && addMandatorySetter) {
    setupMandatorySetter(tag, obj, propertyKey);
  }
  return tag;
}
function tagForObject(obj) {
  if (isObject(obj)) {
    if (isDevelopingApp()) {
      (isDevelopingApp() && !(!isDestroyed(obj)) && assert(isDestroyed(obj) ? `Cannot create a new tag for \`${toString(obj)}\` after it has been destroyed.` : '', !isDestroyed(obj)));
    }
    return tagFor(obj, SELF_TAG);
  }
  return CONSTANT_TAG;
}
function markObjectAsDirty(obj, propertyKey) {
  dirtyTagFor(obj, propertyKey);
  dirtyTagFor(obj, SELF_TAG);
}

const CHAIN_PASS_THROUGH = new WeakSet();

function tracked(...args) {
  (isDevelopingApp() && !(!(isElementDescriptor(args.slice(0, 3)) && args.length === 5 && args[4] === true)) && assert(`@tracked can only be used directly as a native decorator. If you're using tracked in classic classes, add parenthesis to call it like a function: tracked()`, !(isElementDescriptor(args.slice(0, 3)) && args.length === 5 && args[4] === true)));
  if (!isElementDescriptor(args)) {
    let propertyDesc = args[0];
    (isDevelopingApp() && !(args.length === 0 || typeof propertyDesc === 'object' && propertyDesc !== null) && assert(`tracked() may only receive an options object containing 'value' or 'initializer', received ${propertyDesc}`, args.length === 0 || typeof propertyDesc === 'object' && propertyDesc !== null));
    if (isDevelopingApp() && propertyDesc) {
      let keys = Object.keys(propertyDesc);
      (isDevelopingApp() && !(keys.length <= 1 && (keys[0] === undefined || keys[0] === 'value' || keys[0] === 'initializer')) && assert(`The options object passed to tracked() may only contain a 'value' or 'initializer' property, not both. Received: [${keys}]`, keys.length <= 1 && (keys[0] === undefined || keys[0] === 'value' || keys[0] === 'initializer')));
      (isDevelopingApp() && !(!('initializer' in propertyDesc) || typeof propertyDesc.initializer === 'function') && assert(`The initializer passed to tracked must be a function. Received ${propertyDesc.initializer}`, !('initializer' in propertyDesc) || typeof propertyDesc.initializer === 'function'));
    }
    let initializer = propertyDesc ? propertyDesc.initializer : undefined;
    let value = propertyDesc ? propertyDesc.value : undefined;
    let decorator = function (target, key, _desc, _meta, isClassicDecorator) {
      (isDevelopingApp() && !(isClassicDecorator) && assert(`You attempted to set a default value for ${key} with the @tracked({ value: 'default' }) syntax. You can only use this syntax with classic classes. For native classes, you can use class initializers: @tracked field = 'default';`, isClassicDecorator));
      let fieldDesc = {
        initializer: initializer || (() => value)
      };
      return descriptorForField([target, key, fieldDesc]);
    };
    setClassicDecorator(decorator);
    return decorator;
  }
  return descriptorForField(args);
}
if (isDevelopingApp()) {
  // Normally this isn't a classic decorator, but we want to throw a helpful
  // error in development so we need it to treat it like one
  setClassicDecorator(tracked);
}
function descriptorForField([target, key, desc]) {
  (isDevelopingApp() && !(!desc || !desc.value && !desc.get && !desc.set) && assert(`You attempted to use @tracked on ${key}, but that element is not a class field. @tracked is only usable on class fields. Native getters and setters will autotrack add any tracked fields they encounter, so there is no need mark getters and setters with @tracked.`, !desc || !desc.value && !desc.get && !desc.set));
  let {
    getter,
    setter
  } = trackedData(key, desc ? desc.initializer : undefined);
  function get() {
    let value = getter(this);

    // Add the tag of the returned value if it is an array, since arrays
    // should always cause updates if they are consumed and then changed
    if (Array.isArray(value)) {
      consumeTag(tagFor(value, '[]'));
    }
    return value;
  }
  function set(newValue) {
    setter(this, newValue);
    dirtyTagFor(this, SELF_TAG);
  }
  let newDesc = {
    enumerable: true,
    configurable: true,
    isTracked: true,
    get,
    set
  };
  meta(target).writeDescriptors(key, new TrackedDescriptor(get, set));
  return newDesc;
}
class TrackedDescriptor {
  constructor(_get, _set) {
    this._get = _get;
    this._set = _set;
    CHAIN_PASS_THROUGH.add(this);
  }
  get(obj) {
    return this._get.call(obj);
  }
  set(obj, _key, value) {
    this._set.call(obj, value);
  }
}

export { ComputedDescriptor as C, TrackedDescriptor as T, tagForObject as a, descriptorForProperty as b, isClassicDecorator as c, descriptorForDecorator as d, tracked as e, isElementDescriptor as i, markObjectAsDirty as m, nativeDescDecorator as n, setClassicDecorator as s, tagForProperty as t };
