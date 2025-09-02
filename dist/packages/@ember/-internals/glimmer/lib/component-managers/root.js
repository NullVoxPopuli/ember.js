import { g as getFactoryFor } from '../../../../../shared-chunks/registry-CU7X7HvH.js';
import '../../../../debug/index.js';
import { _instrumentStart } from '../../../../instrumentation/index.js';
import { capabilityFlagsFrom } from '../../../../../@glimmer/manager/index.js';
import { CONSTANT_TAG, consumeTag } from '../../../../../@glimmer/validator/index.js';
import ComponentStateBucket from '../utils/curly-component-state-bucket.js';
import CurlyComponentManager, { initialRenderInstrumentDetails, processComponentInitializationAssertions, DIRTY_TAG } from './curly.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

class RootComponentManager extends CurlyComponentManager {
  component;
  constructor(component) {
    super();
    this.component = component;
  }
  create(_owner, _state, _args, {
    isInteractive
  }, dynamicScope) {
    let component = this.component;
    let finalizer = _instrumentStart('render.component', initialRenderInstrumentDetails, component);
    dynamicScope.view = component;
    let hasWrappedElement = component.tagName !== '';

    // We usually do this in the `didCreateElement`, but that hook doesn't fire for tagless components
    if (!hasWrappedElement) {
      if (isInteractive) {
        component.trigger('willRender');
      }
      component._transitionTo('hasElement');
      if (isInteractive) {
        component.trigger('willInsertElement');
      }
    }
    if (isDevelopingApp()) {
      processComponentInitializationAssertions(component, {});
    }
    let bucket = new ComponentStateBucket(component, null, CONSTANT_TAG, finalizer, hasWrappedElement, isInteractive);
    consumeTag(component[DIRTY_TAG]);
    return bucket;
  }
}

// ROOT is the top-level template it has nothing but one yield.
// it is supposed to have a dummy element
const ROOT_CAPABILITIES = {
  dynamicLayout: true,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: false,
  attributeHook: true,
  elementHook: true,
  createCaller: true,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: true,
  willDestroy: false,
  hasSubOwner: false
};
class RootComponentDefinition {
  // handle is not used by this custom definition
  handle = -1;
  resolvedName = '-top-level';
  state;
  manager;
  capabilities = capabilityFlagsFrom(ROOT_CAPABILITIES);
  compilable = null;
  constructor(component) {
    this.manager = new RootComponentManager(component);
    let factory = getFactoryFor(component);
    (isDevelopingApp() && !(factory !== undefined) && assert('missing factory for component', factory !== undefined));
    this.state = factory;
  }
}

export { ROOT_CAPABILITIES, RootComponentDefinition };
