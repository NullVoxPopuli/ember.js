import { getViewElement, clearElementView, clearViewElement } from '../../../views/lib/system/utils.js';
import '../../../views/lib/system/action_manager.js';
import '../../../views/lib/views/states.js';
import { registerDestructor } from '../../../../../@glimmer/destroyable/index.js';
import { createConstRef } from '../../../../../@glimmer/reference/index.js';
import { valueForTag, beginUntrackFrame, endUntrackFrame } from '../../../../../@glimmer/validator/index.js';

function NOOP() {}

/**
  @module ember
*/

/**
  Represents the internal state of the component.

  @class ComponentStateBucket
  @private
*/
class ComponentStateBucket {
  classRef = null;
  rootRef;
  argsRevision;
  constructor(component, args, argsTag, finalizer, hasWrappedElement, isInteractive) {
    this.component = component;
    this.args = args;
    this.argsTag = argsTag;
    this.finalizer = finalizer;
    this.hasWrappedElement = hasWrappedElement;
    this.isInteractive = isInteractive;
    this.classRef = null;
    this.argsRevision = args === null ? 0 : valueForTag(argsTag);
    this.rootRef = createConstRef(component, 'this');
    registerDestructor(this, () => this.willDestroy(), true);
    registerDestructor(this, () => this.component.destroy());
  }
  willDestroy() {
    let {
      component,
      isInteractive
    } = this;
    if (isInteractive) {
      beginUntrackFrame();
      component.trigger('willDestroyElement');
      component.trigger('willClearRender');
      endUntrackFrame();
      let element = getViewElement(component);
      if (element) {
        clearElementView(element);
        clearViewElement(component);
      }
    }
    component.renderer.unregister(component);
  }
  finalize() {
    let {
      finalizer
    } = this;
    finalizer();
    this.finalizer = NOOP;
  }
}

export { ComponentStateBucket as default };
