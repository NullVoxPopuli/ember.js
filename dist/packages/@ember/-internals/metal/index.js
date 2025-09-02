export { C as ComputedDescriptor, T as TrackedDescriptor, d as descriptorForDecorator, b as descriptorForProperty, c as isClassicDecorator, i as isElementDescriptor, m as markObjectAsDirty, n as nativeDescDecorator, s as setClassicDecorator, a as tagForObject, t as tagForProperty, e as tracked } from '../../../shared-chunks/cache-D0AO_9wX.js';
import { warn } from '../../debug/index.js';
import { isDevelopingApp } from '@embroider/macros';
export { cached } from '../../../@glimmer/tracking/index.js';
export { createCache, getValue, isConst } from '../../../@glimmer/validator/index.js';
import { c as context } from '../../../shared-chunks/env-DxZ20QzS.js';
import '../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { s as setName, g as getName } from '../../../shared-chunks/name-BUiO6dqy.js';

/**
 @module ember
*/
/**
  Helper class that allows you to register your library with Ember.

  Singleton created at `Ember.libraries`.

  @class Libraries
  @constructor
  @private
*/
class Libraries {
  _registry;
  _coreLibIndex;
  constructor() {
    this._registry = [];
    this._coreLibIndex = 0;
  }
  _getLibraryByName(name) {
    let libs = this._registry;
    for (let lib of libs) {
      if (lib.name === name) {
        return lib;
      }
    }
    return undefined;
  }
  register(name, version, isCoreLibrary) {
    let index = this._registry.length;
    if (!this._getLibraryByName(name)) {
      if (isCoreLibrary) {
        index = this._coreLibIndex++;
      }
      this._registry.splice(index, 0, {
        name,
        version
      });
    } else {
      (isDevelopingApp() && warn(`Library "${name}" is already registered with Ember.`, false, {
        id: 'ember-metal.libraries-register'
      }));
    }
  }
  registerCoreLibrary(name, version) {
    this.register(name, version, true);
  }
  deRegister(name) {
    let lib = this._getLibraryByName(name);
    let index;
    if (lib) {
      index = this._registry.indexOf(lib);
      this._registry.splice(index, 1);
    }
  }
}
const LIBRARIES = new Libraries();

const hasOwnProperty = Object.prototype.hasOwnProperty;
let searchDisabled = false;
const flags = {
  _set: 0,
  _unprocessedNamespaces: false,
  get unprocessedNamespaces() {
    return this._unprocessedNamespaces;
  },
  set unprocessedNamespaces(v) {
    this._set++;
    this._unprocessedNamespaces = v;
  }
};
let unprocessedMixins = false;
const NAMESPACES = [];
const NAMESPACES_BY_ID = Object.create(null);
function addNamespace(namespace) {
  flags.unprocessedNamespaces = true;
  NAMESPACES.push(namespace);
}
function removeNamespace(namespace) {
  let name = getName(namespace);
  delete NAMESPACES_BY_ID[name];
  NAMESPACES.splice(NAMESPACES.indexOf(namespace), 1);
  if (name in context.lookup && namespace === context.lookup[name]) {
    context.lookup[name] = undefined;
  }
}
function findNamespaces() {
  if (!flags.unprocessedNamespaces) {
    return;
  }
  let lookup = context.lookup;
  let keys = Object.keys(lookup);
  for (let key of keys) {
    // Only process entities that start with uppercase A-Z
    if (!isUppercase(key.charCodeAt(0))) {
      continue;
    }
    let obj = tryIsNamespace(lookup, key);
    if (obj) {
      setName(obj, key);
    }
  }
}
function findNamespace(name) {
  if (!searchDisabled) {
    processAllNamespaces();
  }
  return NAMESPACES_BY_ID[name];
}
function processNamespace(namespace) {
  _processNamespace([namespace.toString()], namespace, new Set());
}
function processAllNamespaces() {
  let unprocessedNamespaces = flags.unprocessedNamespaces;
  if (unprocessedNamespaces) {
    findNamespaces();
    flags.unprocessedNamespaces = false;
  }
  if (unprocessedNamespaces || unprocessedMixins) {
    let namespaces = NAMESPACES;
    for (let namespace of namespaces) {
      processNamespace(namespace);
    }
    unprocessedMixins = false;
  }
}
function isSearchDisabled() {
  return searchDisabled;
}
function setSearchDisabled(flag) {
  searchDisabled = Boolean(flag);
}
function setUnprocessedMixins() {
  unprocessedMixins = true;
}
function _processNamespace(paths, root, seen) {
  let idx = paths.length;
  let id = paths.join('.');
  NAMESPACES_BY_ID[id] = root;
  setName(root, id);

  // Loop over all of the keys in the namespace, looking for classes
  for (let key in root) {
    if (!hasOwnProperty.call(root, key)) {
      continue;
    }
    let obj = root[key];

    // If we are processing the `Ember` namespace, for example, the
    // `paths` will start with `["Ember"]`. Every iteration through
    // the loop will update the **second** element of this list with
    // the key, so processing `Ember.View` will make the Array
    // `['Ember', 'View']`.
    paths[idx] = key;

    // If we have found an unprocessed class
    if (obj && getName(obj) === void 0) {
      // Replace the class' `toString` with the dot-separated path
      setName(obj, paths.join('.'));
      // Support nested namespaces
    } else if (obj && isNamespace(obj)) {
      // Skip aliased namespaces
      if (seen.has(obj)) {
        continue;
      }
      seen.add(obj);
      // Process the child namespace
      _processNamespace(paths, obj, seen);
    }
  }
  paths.length = idx; // cut out last item
}
function isNamespace(obj) {
  return obj != null && typeof obj === 'object' && obj.isNamespace;
}
function isUppercase(code) {
  return code >= 65 && code <= 90 // A
  ; // Z
}
function tryIsNamespace(lookup, prop) {
  try {
    let obj = lookup[prop];
    return (obj !== null && typeof obj === 'object' || typeof obj === 'function') && obj.isNamespace && obj;
  } catch (_e) {
    // continue
  }
}

export { Libraries, NAMESPACES, NAMESPACES_BY_ID, addNamespace, findNamespace, findNamespaces, isSearchDisabled as isNamespaceSearchDisabled, LIBRARIES as libraries, processAllNamespaces, processNamespace, removeNamespace, setSearchDisabled as setNamespaceSearchDisabled, setUnprocessedMixins };
