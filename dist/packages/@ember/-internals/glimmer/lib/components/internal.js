import { setOwner } from '../../../owner/index.js';
import { g as guidFor } from '../../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { isDevelopingApp } from '@embroider/macros';
import '../../../../debug/index.js';
import { setInternalComponentManager, setComponentTemplate } from '../../../../../@glimmer/manager/index.js';
import { valueForRef, isConstRef, createConstRef } from '../../../../../@glimmer/reference/index.js';
import { untrack } from '../../../../../@glimmer/validator/index.js';
import { assert } from '../../../../debug/lib/assert.js';

function NOOP() {}
class InternalComponent {
  // Override this
  static toString() {
    return 'internal component';
  }
  constructor(owner, args, caller) {
    this.owner = owner;
    this.args = args;
    this.caller = caller;
    setOwner(this, owner);
  }

  /**
   * The default HTML id attribute. We don't really _need_ one, this is just
   * added for compatibility as it's hard to tell if people rely on it being
   * present, and it doens't really hurt.
   *
   * However, don't rely on this internally, like passing it to `getElementId`.
   * This can be (and often is) overriden by passing an `id` attribute on the
   * invocation, which shadows this default id via `...attributes`.
   */
  get id() {
    return guidFor(this);
  }

  /**
   * The default HTML class attribute. Similar to the above, we don't _need_
   * them, they are just added for compatibility as it's similarly hard to tell
   * if people rely on it in their CSS etc, and it doens't really hurt.
   */
  get class() {
    return 'ember-view';
  }
  validateArguments() {
    for (let name of Object.keys(this.args.named)) {
      if (!this.isSupportedArgument(name)) {
        this.onUnsupportedArgument(name);
      }
    }
  }
  named(name) {
    let ref = this.args.named[name];
    return ref ? valueForRef(ref) : undefined;
  }
  positional(index) {
    let ref = this.args.positional[index];
    return ref ? valueForRef(ref) : undefined;
  }
  listenerFor(name) {
    let listener = this.named(name);
    if (listener) {
      (isDevelopingApp() && !(typeof listener === 'function') && assert(`The \`@${name}\` argument to the <${this.constructor}> component must be a function`, typeof listener === 'function'));
      return listener;
    } else {
      return NOOP;
    }
  }
  isSupportedArgument(_name) {
    return false;
  }
  onUnsupportedArgument(_name) {}
  toString() {
    return `<${this.constructor}:${guidFor(this)}>`;
  }
}
const OPAQUE_CONSTRUCTOR_MAP = new WeakMap();
function opaquify(constructor, template) {
  let _opaque = {
    // Factory interface
    create() {
      throw assert('Use constructor instead of create');
    },
    toString() {
      return constructor.toString();
    }
  };
  let opaque = _opaque;
  OPAQUE_CONSTRUCTOR_MAP.set(opaque, constructor);
  setInternalComponentManager(INTERNAL_COMPONENT_MANAGER, opaque);
  setComponentTemplate(template, opaque);
  return opaque;
}
function deopaquify(opaque) {
  let constructor = OPAQUE_CONSTRUCTOR_MAP.get(opaque);
  (isDevelopingApp() && !(constructor) && assert(`[BUG] Invalid internal component constructor: ${opaque}`, constructor));
  return constructor;
}
const CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: true,
  dynamicScope: false,
  updateHook: false,
  createInstance: true,
  wrapped: false,
  willDestroy: false,
  hasSubOwner: false
};
class InternalManager {
  getCapabilities() {
    return CAPABILITIES;
  }
  create(owner, definition, args, _env, _dynamicScope, caller) {
    (isDevelopingApp() && !(isConstRef(caller)) && assert('caller must be const', isConstRef(caller)));
    let ComponentClass = deopaquify(definition);
    let instance = new ComponentClass(owner, args.capture(), valueForRef(caller));
    untrack(instance['validateArguments'].bind(instance));
    return instance;
  }
  didCreate() {}
  didUpdate() {}
  didRenderLayout() {}
  didUpdateLayout() {}
  getDebugName(definition) {
    return definition.toString();
  }
  getSelf(instance) {
    return createConstRef(instance, 'this');
  }
  getDestroyable(instance) {
    return instance;
  }
}
const INTERNAL_COMPONENT_MANAGER = new InternalManager();

export { InternalComponent as default, opaquify };
