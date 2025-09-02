import { isFactory } from '../../owner/index.js';
import '../../../debug/index.js';
import { _instrumentStart } from '../../../instrumentation/index.js';
import { setInternalHelperManager, getInternalComponentManager, getComponentTemplate } from '../../../../@glimmer/manager/index.js';
import { hash, get, fn, concat, array, on, TEMPLATE_ONLY_COMPONENT_MANAGER, templateOnlyComponent } from '../../../../@glimmer/runtime/index.js';
import { isCurlyManager } from './component-managers/curly.js';
import { isClassicHelper, CLASSIC_HELPER_MANAGER } from './helper.js';
import disallowDynamicResolution from './helpers/-disallow-dynamic-resolution.js';
import inElementNullCheckHelper from './helpers/-in-element-null-check.js';
import normalizeClassHelper from './helpers/-normalize-class.js';
import resolve from './helpers/-resolve.js';
import trackArray from './helpers/-track-array.js';
import eachIn from './helpers/each-in.js';
import mut from './helpers/mut.js';
import readonly from './helpers/readonly.js';
import unbound from './helpers/unbound.js';
import uniqueId from './helpers/unique-id.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../debug/lib/assert.js';

function instrumentationPayload(name) {
  return {
    object: `component:${name}`
  };
}
function componentFor(name, owner) {
  let fullName = `component:${name}`;
  return owner.factoryFor(fullName) || null;
}
function lookupComponentPair(owner, name) {
  let component = componentFor(name, owner);
  if (isFactory(component) && component.class) {
    let layout = getComponentTemplate(component.class);
    if (layout !== undefined) {
      return {
        component,
        layout
      };
    }
  }
  if (component === null) {
    return null;
  } else {
    return {
      component,
      layout: null
    };
  }
}
const BUILTIN_KEYWORD_HELPERS = {
  mut,
  readonly,
  unbound,
  '-hash': hash,
  '-each-in': eachIn,
  '-normalize-class': normalizeClassHelper,
  '-resolve': resolve,
  '-track-array': trackArray,
  '-in-el-null': inElementNullCheckHelper
};
const BUILTIN_HELPERS = {
  ...BUILTIN_KEYWORD_HELPERS,
  array,
  concat,
  fn,
  get,
  hash,
  'unique-id': uniqueId
};
if (isDevelopingApp()) {
  BUILTIN_HELPERS['-disallow-dynamic-resolution'] = disallowDynamicResolution;
} else {
  // Bug: this may be a quirk of our test setup?
  // In prod builds, this is a no-op helper and is unused in practice. We shouldn't need
  // to add it at all, but the current test build doesn't produce a "prod compiler", so
  // we ended up running the debug-build for the template compliler in prod tests. Once
  // that is fixed, this can be removed. For now, this allows the test to work and does
  // not really harm anything, since it's just a no-op pass-through helper and the bytes
  // has to be included anyway. In the future, perhaps we can avoid the latter by using
  // `import(...)`?
  BUILTIN_HELPERS['-disallow-dynamic-resolution'] = disallowDynamicResolution;
}

// With the implementation of RFC #1006(https://rfcs.emberjs.com/id/1006-deprecate-action-template-helper), the `action` modifer was removed. It was the
// only built-in keyword modifier, so this object is currently empty.
const BUILTIN_KEYWORD_MODIFIERS = {};
const BUILTIN_MODIFIERS = {
  ...BUILTIN_KEYWORD_MODIFIERS,
  on
};
const CLASSIC_HELPER_MANAGER_ASSOCIATED = new WeakSet();
class ResolverImpl {
  componentDefinitionCache = new Map();
  lookupPartial() {
    return null;
  }
  lookupHelper(name, owner) {
    (isDevelopingApp() && !(!(BUILTIN_HELPERS[name] && owner.hasRegistration(`helper:${name}`))) && assert(`You attempted to overwrite the built-in helper "${name}" which is not allowed. Please rename the helper.`, !(BUILTIN_HELPERS[name] && owner.hasRegistration(`helper:${name}`))));
    let helper = BUILTIN_HELPERS[name];
    if (helper !== undefined) {
      return helper;
    }
    let factory = owner.factoryFor(`helper:${name}`);
    if (factory === undefined) {
      return null;
    }
    let definition = factory.class;
    if (definition === undefined) {
      return null;
    }
    if (typeof definition === 'function' && isClassicHelper(definition)) {
      // For classic class based helpers, we need to pass the factoryFor result itself rather
      // than the raw value (`factoryFor(...).class`). This is because injections are already
      // bound in the factoryFor result, including type-based injections

      if (isDevelopingApp()) {
        // In DEBUG we need to only set the associated value once, otherwise
        // we'll trigger an assertion
        if (!CLASSIC_HELPER_MANAGER_ASSOCIATED.has(factory)) {
          CLASSIC_HELPER_MANAGER_ASSOCIATED.add(factory);
          setInternalHelperManager(CLASSIC_HELPER_MANAGER, factory);
        }
      } else {
        setInternalHelperManager(CLASSIC_HELPER_MANAGER, factory);
      }
      return factory;
    }
    return definition;
  }
  lookupBuiltInHelper(name) {
    return BUILTIN_KEYWORD_HELPERS[name] ?? null;
  }
  lookupModifier(name, owner) {
    let builtin = BUILTIN_MODIFIERS[name];
    if (builtin !== undefined) {
      return builtin;
    }
    let modifier = owner.factoryFor(`modifier:${name}`);
    if (modifier === undefined) {
      return null;
    }
    return modifier.class || null;
  }
  lookupBuiltInModifier(name) {
    return BUILTIN_KEYWORD_MODIFIERS[name] ?? null;
  }
  lookupComponent(name, owner) {
    let pair = lookupComponentPair(owner, name);
    if (pair === null) {
      (isDevelopingApp() && !(name !== 'text-area') && assert('Could not find component `<TextArea />` (did you mean `<Textarea />`?)', name !== 'text-area'));
      return null;
    }
    let template = null;
    let key;
    if (pair.component === null) {
      key = template = pair.layout(owner);
    } else {
      key = pair.component;
    }
    let cachedComponentDefinition = this.componentDefinitionCache.get(key);
    if (cachedComponentDefinition !== undefined) {
      return cachedComponentDefinition;
    }
    if (template === null && pair.layout !== null) {
      template = pair.layout(owner);
    }
    let finalizer = _instrumentStart('render.getComponentDefinition', instrumentationPayload, name);
    let definition = null;
    if (pair.component === null) {
      definition = {
        state: templateOnlyComponent(undefined, name),
        manager: TEMPLATE_ONLY_COMPONENT_MANAGER,
        template
      };
    } else {
      let factory = pair.component;
      (isDevelopingApp() && !(factory.class !== undefined) && assert(`missing component class ${name}`, factory.class !== undefined));
      let ComponentClass = factory.class;
      let manager = getInternalComponentManager(ComponentClass);
      definition = {
        state: isCurlyManager(manager) ? factory : ComponentClass,
        manager,
        template
      };
    }
    finalizer();
    this.componentDefinitionCache.set(key, definition);
    (isDevelopingApp() && !(!(definition === null && name === 'text-area')) && assert('Could not find component `<TextArea />` (did you mean `<Textarea />`?)', !(definition === null && name === 'text-area')));
    return definition;
  }
}

export { BUILTIN_HELPERS, BUILTIN_KEYWORD_HELPERS, ResolverImpl as default };
