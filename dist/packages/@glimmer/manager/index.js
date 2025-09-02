import { debugAssert } from '../global-context/index.js';
import { associateDestroyableChild, registerDestructor } from '../destroyable/index.js';
import { createComputeRef, createConstRef, UNDEFINED_REFERENCE, valueForRef } from '../reference/index.js';
import { createUpdatableTag, untrack, track } from '../validator/index.js';
import { InternalComponentCapabilities } from '../vm/index.js';
import { isDevelopingApp } from '@embroider/macros';

let debugToString;
if (isDevelopingApp()) {
  let getFunctionName = fn => {
      let functionName = fn.name;
      if ("" === functionName) {
        let match = /function (\w+)\s*\(/u.exec(String(fn));
        functionName = match && match[1] || "";
      }
      return functionName.replace(/^bound /u, "");
    },
    getObjectName = obj => {
      let name, className;
      // If the class has a decent looking name, and the `toString` is one of the
      // default Ember toStrings, replace the constructor portion of the toString
      // with the class name. We check the length of the class name to prevent doing
      // this when the value is minified.
      return "function" == typeof obj.constructor && (className = getFunctionName(obj.constructor)), "toString" in obj && obj.toString !== Object.prototype.toString && obj.toString !== Function.prototype.toString && (
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      name = obj.toString()), name && /<.*:ember\d+>/u.test(name) && className && "_" !== className[0] && className.length > 2 && "Class" !== className ? name.replace(/<.*:/u, `<${className}:`) : name || className;
    },
    getPrimitiveName = value => String(value);
  debugToString = value => "function" == typeof value ? getFunctionName(value) || "(unknown function)" : "object" == typeof value && null !== value ? getObjectName(value) || "(unknown object)" : getPrimitiveName(value);
}
var debugToString$1 = debugToString;
const CUSTOM_TAG_FOR = new WeakMap();
function getCustomTagFor(obj) {
  return CUSTOM_TAG_FOR.get(obj);
}
function setCustomTagFor(obj, customTagFn) {
  CUSTOM_TAG_FOR.set(obj, customTagFn);
}
function convertToInt(prop) {
  if ("symbol" == typeof prop) return null;
  const num = Number(prop);
  return isNaN(num) ? null : num % 1 == 0 ? num : null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- @fixme
class NamedArgsProxy {
  constructor(named) {
    this.named = named;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- @fixme
  get(_target, prop) {
    const ref = this.named[prop];
    if (void 0 !== ref) return valueForRef(ref);
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- @fixme
  has(_target, prop) {
    return prop in this.named;
  }
  ownKeys() {
    return Object.keys(this.named);
  }
  isExtensible() {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- @fixme
  getOwnPropertyDescriptor(_target, prop) {
    if (isDevelopingApp() && !(prop in this.named)) throw new Error(`args proxies do not have real property descriptors, so you should never need to call getOwnPropertyDescriptor yourself. This code exists for enumerability, such as in for-in loops and Object.keys(). Attempted to get the descriptor for \`${String(prop)}\``);
    return {
      enumerable: true,
      configurable: true
    };
  }
}
class PositionalArgsProxy {
  constructor(positional) {
    this.positional = positional;
  }
  get(target, prop) {
    let {
      positional: positional
    } = this;
    if ("length" === prop) return positional.length;
    const parsed = convertToInt(prop);
    return null !== parsed && parsed < positional.length ? valueForRef(positional[parsed]) : target[prop];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  }
  isExtensible() {
    return false;
  }
  has(_target, prop) {
    const parsed = convertToInt(prop);
    return null !== parsed && parsed < this.positional.length;
  }
}
const argsProxyFor = (capturedArgs, type) => {
    const {
        named: named,
        positional: positional
      } = capturedArgs,
      namedHandler = new NamedArgsProxy(named),
      positionalHandler = new PositionalArgsProxy(positional),
      namedTarget = Object.create(null);
    if (isDevelopingApp()) {
      const setHandler = function (_target, prop) {
          throw new Error(`You attempted to set ${String(prop)} on the arguments of a component, helper, or modifier. Arguments are immutable and cannot be updated directly; they always represent the values that are passed down. If you want to set default values, you should use a getter and local tracked state instead.`);
        },
        forInDebugHandler = () => {
          throw new Error(`Object.keys() was called on the positional arguments array for a ${type}, which is not supported. This function is a low-level function that should not need to be called for positional argument arrays. You may be attempting to iterate over the array using for...in instead of for...of.`);
        };
      namedHandler.set = setHandler, positionalHandler.set = setHandler, positionalHandler.ownKeys = forInDebugHandler;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const namedProxy = new Proxy(namedTarget, namedHandler),
      positionalProxy = new Proxy([], positionalHandler);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return setCustomTagFor(namedProxy, (_obj, key) => function (namedArgs, key) {
      return track(() => {
        key in namedArgs &&
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
        valueForRef(namedArgs[key]);
      });
    }(named, key)), setCustomTagFor(positionalProxy, (_obj, key) => function (positionalArgs, key) {
      return track(() => {
        "[]" === key &&
        // consume all of the tags in the positional array
        positionalArgs.forEach(valueForRef);
        const parsed = convertToInt(key);
        null !== parsed && parsed < positionalArgs.length &&
        // consume the tag of the referenced index
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
        valueForRef(positionalArgs[parsed]);
      });
    }(positional, key)), {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      named: namedProxy,
      positional: positionalProxy
    };
  },
  FROM_CAPABILITIES = isDevelopingApp() ? new WeakSet() : void 0;
function buildCapabilities(capabilities) {
  return isDevelopingApp() && (
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  FROM_CAPABILITIES.add(capabilities), Object.freeze(capabilities)), capabilities;
}
const EMPTY = InternalComponentCapabilities.Empty;

/**
 * Converts a ComponentCapabilities object into a 32-bit integer representation.
 */
function capabilityFlagsFrom(capabilities) {
  return EMPTY | capability(capabilities, "dynamicLayout") | capability(capabilities, "dynamicTag") | capability(capabilities, "prepareArgs") | capability(capabilities, "createArgs") | capability(capabilities, "attributeHook") | capability(capabilities, "elementHook") | capability(capabilities, "dynamicScope") | capability(capabilities, "createCaller") | capability(capabilities, "updateHook") | capability(capabilities, "createInstance") | capability(capabilities, "wrapped") | capability(capabilities, "willDestroy") | capability(capabilities, "hasSubOwner");
}
function capability(capabilities, capability) {
  return capabilities[capability] ? InternalComponentCapabilities[capability] : EMPTY;
}
function managerHasCapability(_manager, capabilities, capability) {
  return !!(capabilities & capability);
}
function hasCapability(capabilities, capability) {
  return !!(capabilities & capability);
}
function helperCapabilities(managerAPI, options = {}) {
  if (debugAssert(
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS-only check
  "3.23" === managerAPI, () => `Invalid helper manager compatibility specified; you specified ${managerAPI}, but only '3.23' is supported.`), isDevelopingApp() && (!options.hasValue && !options.hasScheduledEffect || options.hasValue && options.hasScheduledEffect)) throw new Error("You must pass either the `hasValue` OR the `hasScheduledEffect` capability when defining a helper manager. Passing neither, or both, is not permitted.");
  if (isDevelopingApp() && options.hasScheduledEffect) throw new Error("The `hasScheduledEffect` capability has not yet been implemented for helper managers. Please pass `hasValue` instead");
  return buildCapabilities({
    hasValue: Boolean(options.hasValue),
    hasDestroyable: Boolean(options.hasDestroyable),
    hasScheduledEffect: Boolean(options.hasScheduledEffect)
  });
}

////////////
function hasValue(manager) {
  return manager.capabilities.hasValue;
}
function hasDestroyable(manager) {
  return manager.capabilities.hasDestroyable;
}

////////////
class CustomHelperManager {
  constructor(factory) {
    this.factory = factory, this.helperManagerDelegates = new WeakMap(), this.undefinedDelegate = null;
  }
  getDelegateForOwner(owner) {
    let delegate = this.helperManagerDelegates.get(owner);
    if (void 0 === delegate) {
      let {
        factory: factory
      } = this;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      if (delegate = factory(owner), isDevelopingApp() && !FROM_CAPABILITIES.has(delegate.capabilities))
        // TODO: This error message should make sense in both Ember and Glimmer https://github.com/glimmerjs/glimmer-vm/issues/1200
        throw new Error(`Custom helper managers must have a \`capabilities\` property that is the result of calling the \`capabilities('3.23')\` (imported via \`import { capabilities } from '@ember/helper';\`). Received: \`${JSON.stringify(delegate.capabilities)}\` for: \`${delegate}\``);
      this.helperManagerDelegates.set(owner, delegate);
    }
    return delegate;
  }
  getDelegateFor(owner) {
    if (void 0 === owner) {
      let {
        undefinedDelegate: undefinedDelegate
      } = this;
      if (null === undefinedDelegate) {
        let {
          factory: factory
        } = this;
        this.undefinedDelegate = undefinedDelegate = factory(void 0);
      }
      return undefinedDelegate;
    }
    return this.getDelegateForOwner(owner);
  }
  getHelper(definition) {
    return (capturedArgs, owner) => {
      let manager = this.getDelegateFor(owner);
      const args = argsProxyFor(capturedArgs, "helper"),
        bucket = manager.createHelper(definition, args);
      if (hasValue(manager)) {
        let cache = createComputeRef(() => manager.getValue(bucket), null, isDevelopingApp() && manager.getDebugName && manager.getDebugName(definition));
        return hasDestroyable(manager) && associateDestroyableChild(cache, manager.getDestroyable(bucket)), cache;
      }
      if (hasDestroyable(manager)) {
        let ref = createConstRef(void 0, isDevelopingApp() && (manager.getDebugName?.(definition) ?? "unknown helper"));
        return associateDestroyableChild(ref, manager.getDestroyable(bucket)), ref;
      }
      return UNDEFINED_REFERENCE;
    };
  }
}
class FunctionHelperManager {
  createHelper(fn, args) {
    return {
      fn: fn,
      args: args
    };
  }
  getValue({
    fn: fn,
    args: args
  }) {
    return Object.keys(args.named).length > 0 ? fn(...args.positional, args.named) : fn(...args.positional);
  }
  getDebugName(fn) {
    return fn.name ? `(helper function ${fn.name})` : "(anonymous helper function)";
  }
  constructor() {
    this.capabilities = buildCapabilities({
      hasValue: true,
      hasDestroyable: false,
      hasScheduledEffect: false
    });
  }
}
const COMPONENT_MANAGERS = new WeakMap(),
  MODIFIER_MANAGERS = new WeakMap(),
  HELPER_MANAGERS = new WeakMap(),
  getPrototypeOf$1 = Object.getPrototypeOf;
function setManager(map, manager, obj) {
  return isDevelopingApp() && (debugAssert(
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS-only check
  null !== obj && ("object" == typeof obj || "function" == typeof obj),
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  `Attempted to set a manager on a non-object value. Managers can only be associated with objects or functions. Value was ${debugToString$1(obj)}`), debugAssert(!map.has(obj), `Attempted to set the same type of manager multiple times on a value. You can only associate one manager of each type with a given value. Value was ${debugToString$1(obj)}`)), map.set(obj, manager), obj;
}
function getManager(map, obj) {
  let pointer = obj;
  for (; null !== pointer;) {
    const manager = map.get(pointer);
    if (void 0 !== manager) return manager;
    pointer = getPrototypeOf$1(pointer);
  }
}

///////////
function setInternalModifierManager(manager, definition) {
  return setManager(MODIFIER_MANAGERS, manager, definition);
}
function getInternalModifierManager(definition, isOptional) {
  isDevelopingApp() && debugAssert(
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS-only check
  "object" == typeof definition && null !== definition || "function" == typeof definition, () =>
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- @fixme
  `Attempted to use a value as a modifier, but it was not an object or function. Modifier definitions must be objects or functions with an associated modifier manager. The value was: ${definition}`);
  const manager = getManager(MODIFIER_MANAGERS, definition);
  return void 0 === manager ? (isDevelopingApp() && debugAssert(isOptional,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  `Attempted to load a modifier, but there wasn't a modifier manager associated with the definition. The definition was: ${debugToString$1(definition)}`), null) : manager;
}
function setInternalHelperManager(manager, definition) {
  return setManager(HELPER_MANAGERS, manager, definition);
}
const DEFAULT_MANAGER = new CustomHelperManager(() => new FunctionHelperManager());
function getInternalHelperManager(definition, isOptional) {
  debugAssert(
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS-only check
  "object" == typeof definition && null !== definition || "function" == typeof definition, () =>
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- @fixme
  `Attempted to use a value as a helper, but it was not an object or function. Helper definitions must be objects or functions with an associated helper manager. The value was: ${definition}`);
  let manager = getManager(HELPER_MANAGERS, definition);
  // Functions are special-cased because functions are defined
  // as the "default" helper, per: https://github.com/emberjs/rfcs/pull/756
  if (void 0 === manager && "function" == typeof definition && (manager = DEFAULT_MANAGER), manager) return manager;
  if (true === isOptional) return null;
  if (isDevelopingApp()) throw new Error(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  `Attempted to load a helper, but there wasn't a helper manager associated with the definition. The definition was: ${debugToString$1(definition)}`);
  return null;
}
function setInternalComponentManager(factory, obj) {
  return setManager(COMPONENT_MANAGERS, factory, obj);
}
function getInternalComponentManager(definition, isOptional) {
  debugAssert(
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS-only check
  "object" == typeof definition && null !== definition || "function" == typeof definition, () =>
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- @fixme
  `Attempted to use a value as a component, but it was not an object or function. Component definitions must be objects or functions with an associated component manager. The value was: ${definition}`);
  const manager = getManager(COMPONENT_MANAGERS, definition);
  return void 0 === manager ? (debugAssert(isOptional, () =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  `Attempted to load a component, but there wasn't a component manager associated with the definition. The definition was: ${debugToString$1(definition)}`), null) : manager;
}

///////////
function hasInternalComponentManager(definition) {
  return void 0 !== getManager(COMPONENT_MANAGERS, definition);
}
function hasInternalHelperManager(definition) {
  return function (definition) {
    return "function" == typeof definition;
  }(definition) || void 0 !== getManager(HELPER_MANAGERS, definition);
}
function hasInternalModifierManager(definition) {
  return void 0 !== getManager(MODIFIER_MANAGERS, definition);
}
const CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: false,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false,
  hasSubOwner: false
};
function componentCapabilities(managerAPI, options = {}) {
  if (isDevelopingApp() && "3.13" !== managerAPI) throw new Error("Invalid component manager compatibility specified");
  let updateHook = Boolean(options.updateHook);
  return buildCapabilities({
    asyncLifeCycleCallbacks: Boolean(options.asyncLifecycleCallbacks),
    destructor: Boolean(options.destructor),
    updateHook: updateHook
  });
}
function hasAsyncLifeCycleCallbacks(delegate) {
  return delegate.capabilities.asyncLifeCycleCallbacks;
}
function hasUpdateHook(delegate) {
  return delegate.capabilities.updateHook;
}

/**
  The CustomComponentManager allows addons to provide custom component
  implementations that integrate seamlessly into Ember. This is accomplished
  through a delegate, registered with the custom component manager, which
  implements a set of hooks that determine component behavior.

  To create a custom component manager, instantiate a new CustomComponentManager
  class and pass the delegate as the first argument:

  ```js
  let manager = new CustomComponentManager({
    // ...delegate implementation...
  });
  ```

  ## Delegate Hooks

  Throughout the lifecycle of a component, the component manager will invoke
  delegate hooks that are responsible for surfacing those lifecycle changes to
  the end developer.

  * `create()` - invoked when a new instance of a component should be created
  * `update()` - invoked when the arguments passed to a component change
  * `getContext()` - returns the object that should be
*/
class CustomComponentManager {
  constructor(factory) {
    this.factory = factory, this.componentManagerDelegates = new WeakMap();
  }
  getDelegateFor(owner) {
    let {
        componentManagerDelegates: componentManagerDelegates
      } = this,
      delegate = componentManagerDelegates.get(owner);
    if (void 0 === delegate) {
      let {
        factory: factory
      } = this;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      if (delegate = factory(owner), isDevelopingApp() && !FROM_CAPABILITIES.has(delegate.capabilities))
        // TODO: This error message should make sense in both Ember and Glimmer https://github.com/glimmerjs/glimmer-vm/issues/1200
        throw new Error(`Custom component managers must have a \`capabilities\` property that is the result of calling the \`capabilities('3.13')\` (imported via \`import { capabilities } from '@ember/component';\`). Received: \`${JSON.stringify(delegate.capabilities)}\` for: \`${delegate}\``);
      componentManagerDelegates.set(owner, delegate);
    }
    return delegate;
  }
  create(owner, definition, vmArgs) {
    let delegate = this.getDelegateFor(owner),
      args = argsProxyFor(vmArgs.capture(), "component"),
      component = delegate.createComponent(definition, args);
    return new CustomComponentState(component, delegate, args);
  }
  getDebugName(definition) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return "function" == typeof definition ? definition.name : definition.toString();
  }
  update(bucket) {
    let {
      delegate: delegate
    } = bucket;
    if (hasUpdateHook(delegate)) {
      let {
        component: component,
        args: args
      } = bucket;
      delegate.updateComponent(component, args);
    }
  }
  didCreate({
    component: component,
    delegate: delegate
  }) {
    hasAsyncLifeCycleCallbacks(delegate) && delegate.didCreateComponent(component);
  }
  didUpdate({
    component: component,
    delegate: delegate
  }) {
    (function (delegate) {
      return hasAsyncLifeCycleCallbacks(delegate) && hasUpdateHook(delegate);
    })(delegate) && delegate.didUpdateComponent(component);
  }
  didRenderLayout() {}
  didUpdateLayout() {}
  getSelf({
    component: component,
    delegate: delegate
  }) {
    return createConstRef(delegate.getContext(component), "this");
  }
  getDestroyable(bucket) {
    const {
      delegate: delegate
    } = bucket;
    if (function (delegate) {
      return delegate.capabilities.destructor;
    }(delegate)) {
      const {
        component: component
      } = bucket;
      return registerDestructor(bucket, () => delegate.destroyComponent(component)), bucket;
    }
    return null;
  }
  getCapabilities() {
    return CAPABILITIES;
  }
}

/**
 * Stores internal state about a component instance after it's been created.
 */
class CustomComponentState {
  constructor(component, delegate, args) {
    this.component = component, this.delegate = delegate, this.args = args;
  }
}
function modifierCapabilities(managerAPI, optionalFeatures = {}) {
  return debugAssert("3.22" === managerAPI, () => `Invalid modifier manager compatibility specified; you specified ${managerAPI}, but only '3.22' is supported.`), buildCapabilities({
    disableAutoTracking: Boolean(optionalFeatures.disableAutoTracking)
  });
}

/**
  The CustomModifierManager allows addons to provide custom modifier
  implementations that integrate seamlessly into Ember. This is accomplished
  through a delegate, registered with the custom modifier manager, which
  implements a set of hooks that determine modifier behavior.
  To create a custom modifier manager, instantiate a new CustomModifierManager
  class and pass the delegate as the first argument:

  ```js
  let manager = new CustomModifierManager({
    // ...delegate implementation...
  });
  ```

  ## Delegate Hooks

  Throughout the lifecycle of a modifier, the modifier manager will invoke
  delegate hooks that are responsible for surfacing those lifecycle changes to
  the end developer.
  * `createModifier()` - invoked when a new instance of a modifier should be created
  * `installModifier()` - invoked when the modifier is installed on the element
  * `updateModifier()` - invoked when the arguments passed to a modifier change
  * `destroyModifier()` - invoked when the modifier is about to be destroyed
*/
class CustomModifierManager {
  constructor(factory) {
    this.factory = factory, this.componentManagerDelegates = new WeakMap();
  }
  getDelegateFor(owner) {
    let {
        componentManagerDelegates: componentManagerDelegates
      } = this,
      delegate = componentManagerDelegates.get(owner);
    if (void 0 === delegate) {
      let {
        factory: factory
      } = this;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      if (delegate = factory(owner), isDevelopingApp() && !FROM_CAPABILITIES.has(delegate.capabilities))
        // TODO: This error message should make sense in both Ember and Glimmer https://github.com/glimmerjs/glimmer-vm/issues/1200
        throw new Error(`Custom modifier managers must have a \`capabilities\` property that is the result of calling the \`capabilities('3.22')\` (imported via \`import { capabilities } from '@ember/modifier';\`). Received: \`${JSON.stringify(delegate.capabilities)}\` for: \`${delegate}\``);
      componentManagerDelegates.set(owner, delegate);
    }
    return delegate;
  }
  create(owner, element, definition, capturedArgs) {
    let state,
      delegate = this.getDelegateFor(owner),
      args = argsProxyFor(capturedArgs, "modifier"),
      instance = delegate.createModifier(definition, args);
    return state = {
      tag: createUpdatableTag(),
      element: element,
      delegate: delegate,
      args: args,
      modifier: instance
    }, registerDestructor(state, () => delegate.destroyModifier(instance, args)), state;
  }
  getDebugName(definition) {
    return "function" == typeof definition ? definition.name || definition.toString() : "<unknown>";
  }
  getDebugInstance({
    modifier: modifier
  }) {
    return modifier;
  }
  getTag({
    tag: tag
  }) {
    return tag;
  }
  install({
    element: element,
    args: args,
    modifier: modifier,
    delegate: delegate
  }) {
    let {
      capabilities: capabilities
    } = delegate;
    capabilities.disableAutoTracking ? untrack(() => delegate.installModifier(modifier, element, args)) : delegate.installModifier(modifier, element, args);
  }
  update({
    args: args,
    modifier: modifier,
    delegate: delegate
  }) {
    let {
      capabilities: capabilities
    } = delegate;
    capabilities.disableAutoTracking ? untrack(() => delegate.updateModifier(modifier, args)) : delegate.updateModifier(modifier, args);
  }
  getDestroyable(state) {
    return state;
  }
}
function setComponentManager(factory, obj) {
  return setInternalComponentManager(new CustomComponentManager(factory), obj);
}
function setModifierManager(factory, obj) {
  return setInternalModifierManager(new CustomModifierManager(factory), obj);
}
function setHelperManager(factory, obj) {
  return setInternalHelperManager(new CustomHelperManager(factory), obj);
}
const TEMPLATES = new WeakMap(),
  getPrototypeOf = Reflect.getPrototypeOf;
function setComponentTemplate(factory, obj) {
  if (isDevelopingApp() && (null === obj || "object" != typeof obj && "function" != typeof obj))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    throw new Error(`Cannot call \`setComponentTemplate\` on \`${debugToString$1(obj)}\``);
  if (isDevelopingApp() && TEMPLATES.has(obj)) throw new Error(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  `Cannot call \`setComponentTemplate\` multiple times on the same class (\`${debugToString$1(obj)}\`)`);
  return TEMPLATES.set(obj, factory), obj;
}
function getComponentTemplate(obj) {
  let pointer = obj;
  for (; null !== pointer;) {
    let template = TEMPLATES.get(pointer);
    if (void 0 !== template) return template;
    pointer = getPrototypeOf(pointer);
  }
}

export { CustomComponentManager, CustomHelperManager, CustomModifierManager, capabilityFlagsFrom, componentCapabilities, getComponentTemplate, getCustomTagFor, getInternalComponentManager, getInternalHelperManager, getInternalModifierManager, hasCapability, hasDestroyable, hasInternalComponentManager, hasInternalHelperManager, hasInternalModifierManager, hasValue, helperCapabilities, managerHasCapability, modifierCapabilities, setComponentManager, setComponentTemplate, setCustomTagFor, setHelperManager, setInternalComponentManager, setInternalHelperManager, setInternalModifierManager, setModifierManager };
