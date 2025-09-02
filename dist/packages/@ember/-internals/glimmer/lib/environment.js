import { E as ENV } from '../../../../shared-chunks/env-DxZ20QzS.js';
import { a as getDebugName } from '../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { isDevelopingApp } from '@embroider/macros';
import { constructStyleDeprecationMessage } from '../../views/lib/system/utils.js';
import '../../views/lib/system/action_manager.js';
import '../../views/lib/views/states.js';
import { deprecate, warn } from '../../../debug/index.js';
import { schedule, _backburner } from '../../../runloop/index.js';
import setGlobalContext from '../../../../@glimmer/global-context/index.js';
import { debug } from '../../../../@glimmer/validator/index.js';
import toIterator from './utils/iterator.js';
import { isHTMLSafe } from './utils/string.js';
import toBool from './utils/to-bool.js';
import { assert } from '../../../debug/lib/assert.js';

setGlobalContext({
  scheduleRevalidate() {
    _backburner.ensureInstance();
  },
  toBool,
  toIterator,
  getProp(obj, prop) {
    return obj[prop];
  },
  setProp(obj, prop, value) {
    obj[prop] = value;
  },
  getPath(obj, path) {
    let parts = path.split('.');
    let current = obj;
    for (let part of parts) {
      if (typeof current === 'function' || typeof current === 'object' && current !== null) {
        current = current[part];
      }
    }
    return current;
  },
  setPath(obj, path, value) {
    let parts = path.split('.');
    let current = obj;
    let pathToSet = parts.pop();
    for (let part of parts) {
      current = current[part];
    }
    current[pathToSet] = value;
  },
  scheduleDestroy(destroyable, destructor) {
    schedule('actions', null, destructor, destroyable);
  },
  scheduleDestroyed(finalizeDestructor) {
    schedule('destroy', null, finalizeDestructor);
  },
  warnIfStyleNotTrusted(value) {
    (isDevelopingApp() && warn(constructStyleDeprecationMessage(String(value)), (() => {
      if (value === null || value === undefined || isHTMLSafe(value)) {
        return true;
      }
      return false;
    })(), {
      id: 'ember-htmlbars.style-xss-warning'
    }));
  },
  assert(test, msg, options) {
    if (isDevelopingApp()) {
      let id = options?.id;
      let override = VM_ASSERTION_OVERRIDES.filter(o => o.id === id)[0];
      (isDevelopingApp() && !(test) && assert(override?.message ?? msg, test));
    }
  },
  deprecate(msg, test, options) {
    if (isDevelopingApp()) {
      let {
        id
      } = options;
      if (id === 'argument-less-helper-paren-less-invocation') {
        throw new Error(`A resolved helper cannot be passed as a named argument as the syntax is ` + `ambiguously a pass-by-reference or invocation. Use the ` + `\`{{helper 'foo-helper}}\` helper to pass by reference or explicitly ` + `invoke the helper with parens: \`{{(fooHelper)}}\`.`);
      }
      let override = VM_DEPRECATION_OVERRIDES.filter(o => o.id === id)[0];
      if (!override) throw new Error(`deprecation override for ${id} not found`);

      // allow deprecations to be disabled in the VM_DEPRECATION_OVERRIDES array below
      if (!override.disabled) {
        (isDevelopingApp() && !(Boolean(test)) && deprecate(override.message ?? msg, Boolean(test), override));
      }
    }
  }
});
if (isDevelopingApp()) {
  debug?.setTrackingTransactionEnv?.({
    debugMessage(obj, keyName) {
      let dirtyString = keyName ? `\`${keyName}\` on \`${getDebugName?.(obj)}\`` : `\`${getDebugName?.(obj)}\``;
      return `You attempted to update ${dirtyString}, but it had already been used previously in the same computation.  Attempting to update a value after using it in a computation can cause logical errors, infinite revalidation bugs, and performance issues, and is not supported.`;
    }
  });
}

///////////

// VM Assertion/Deprecation overrides

const VM_DEPRECATION_OVERRIDES = [{
  id: 'setting-on-hash',
  until: '4.4.0',
  for: 'ember-source',
  since: {
    available: '3.28.0',
    enabled: '3.28.0'
  }
}];
const VM_ASSERTION_OVERRIDES = [];

///////////

// Define environment delegate

class EmberEnvironmentDelegate {
  enableDebugTooling = ENV._DEBUG_RENDER_TREE;
  constructor(owner, isInteractive) {
    this.owner = owner;
    this.isInteractive = isInteractive;
  }
  onTransactionCommit() {}
}

export { EmberEnvironmentDelegate };
