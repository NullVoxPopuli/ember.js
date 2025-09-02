import { scheduleDestroyed, scheduleDestroy } from '../global-context/index.js';
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
let enableDestroyableTracking,
  assertDestroyablesDestroyed,
  DESTROYABLE_META = new WeakMap();
function push(collection, newItem) {
  return null === collection ? newItem : Array.isArray(collection) ? (collection.push(newItem), collection) : [collection, newItem];
}
function iterate(collection, fn) {
  Array.isArray(collection) ? collection.forEach(fn) : null !== collection && fn(collection);
}
function remove(collection, item, message) {
  if (isDevelopingApp()) {
    let collectionIsItem = collection === item,
      collectionContainsItem = Array.isArray(collection) && -1 !== collection.indexOf(item);
    if (!collectionIsItem && !collectionContainsItem) throw new Error(String(message));
  }
  if (Array.isArray(collection) && collection.length > 1) {
    let index = collection.indexOf(item);
    return collection.splice(index, 1), collection;
  }
  return null;
}
function getDestroyableMeta(destroyable) {
  let meta = DESTROYABLE_META.get(destroyable);
  return void 0 === meta && (meta = {
    parents: null,
    children: null,
    eagerDestructors: null,
    destructors: null,
    state: 0
  }, isDevelopingApp() && (meta.source = destroyable), DESTROYABLE_META.set(destroyable, meta)), meta;
}
function associateDestroyableChild(parent, child) {
  if (isDevelopingApp() && isDestroying(parent)) throw new Error("Attempted to associate a destroyable child with an object that is already destroying or destroyed");
  let parentMeta = getDestroyableMeta(parent),
    childMeta = getDestroyableMeta(child);
  return parentMeta.children = push(parentMeta.children, child), childMeta.parents = push(childMeta.parents, parent), child;
}
function registerDestructor(destroyable, destructor, eager = false) {
  if (isDevelopingApp() && isDestroying(destroyable)) throw new Error("Attempted to register a destructor with an object that is already destroying or destroyed");
  let meta = getDestroyableMeta(destroyable),
    destructorsKey = eager ? "eagerDestructors" : "destructors";
  return meta[destructorsKey] = push(meta[destructorsKey], destructor), destructor;
}
function unregisterDestructor(destroyable, destructor, eager = false) {
  if (isDevelopingApp() && isDestroying(destroyable)) throw new Error("Attempted to unregister a destructor with an object that is already destroying or destroyed");
  let meta = getDestroyableMeta(destroyable),
    destructorsKey = eager ? "eagerDestructors" : "destructors";
  meta[destructorsKey] = remove(meta[destructorsKey], destructor, isDevelopingApp() && "attempted to remove a destructor that was not registered with the destroyable");
}

////////////
function destroy(destroyable) {
  let meta = getDestroyableMeta(destroyable);
  if (meta.state >= 1) return;
  let {
    parents: parents,
    children: children,
    eagerDestructors: eagerDestructors,
    destructors: destructors
  } = meta;
  meta.state = 1, iterate(children, destroy), iterate(eagerDestructors, destructor => {
    destructor(destroyable);
  }), iterate(destructors, destructor => {
    scheduleDestroy(destroyable, destructor);
  }), scheduleDestroyed(() => {
    iterate(parents, parent => {
      !function (child, parent) {
        let parentMeta = getDestroyableMeta(parent);
        0 === parentMeta.state && (parentMeta.children = remove(parentMeta.children, child, isDevelopingApp() && "attempted to remove child from parent, but the parent's children did not contain the child. This is likely a bug with destructors."));
      }(destroyable, parent);
    }), meta.state = 2;
  });
}
function destroyChildren(destroyable) {
  let {
    children: children
  } = getDestroyableMeta(destroyable);
  iterate(children, destroy);
}
function _hasDestroyableChildren(destroyable) {
  let meta = DESTROYABLE_META.get(destroyable);
  return void 0 !== meta && null !== meta.children;
}
function isDestroying(destroyable) {
  let meta = DESTROYABLE_META.get(destroyable);
  return void 0 !== meta && meta.state >= 1;
}
function isDestroyed(destroyable) {
  let meta = DESTROYABLE_META.get(destroyable);
  return void 0 !== meta && meta.state >= 2;
}

////////////
if (isDevelopingApp()) {
  let isTesting = false;
  enableDestroyableTracking = () => {
    if (isTesting)
      // Reset destroyable meta just in case, before throwing the error
      throw DESTROYABLE_META = new WeakMap(), new Error("Attempted to start destroyable testing, but you did not end the previous destroyable test. Did you forget to call `assertDestroyablesDestroyed()`");
    isTesting = true, DESTROYABLE_META = new Map();
  }, assertDestroyablesDestroyed = () => {
    if (!isTesting) throw new Error("Attempted to assert destroyables destroyed, but you did not start a destroyable test. Did you forget to call `enableDestroyableTracking()`");
    isTesting = false;
    let map = DESTROYABLE_META;
    DESTROYABLE_META = new WeakMap();
    let undestroyed = [];
    if (map.forEach(meta => {
      2 !== meta.state &&
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      undestroyed.push(meta.source);
    }), undestroyed.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      let objectsToString = undestroyed.map(debugToString$1).join("\n    "),
        error = new Error(`Some destroyables were not destroyed during this test:\n    ${objectsToString}`);
      throw error.destroyables = undestroyed, error;
    }
  };
}

export { _hasDestroyableChildren, assertDestroyablesDestroyed, associateDestroyableChild, destroy, destroyChildren, enableDestroyableTracking, isDestroyed, isDestroying, registerDestructor, unregisterDestructor };
