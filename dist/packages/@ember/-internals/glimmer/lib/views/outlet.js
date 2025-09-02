import { getOwner } from '../../../owner/index.js';
import '../../../../debug/index.js';
import { schedule } from '../../../../runloop/index.js';
import { createComputeRef, updateRef } from '../../../../../@glimmer/reference/index.js';
import { createTag, dirtyTag as DIRTY_TAG, consumeTag } from '../../../../../@glimmer/validator/index.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

// We use the `InternalOwner` notion here because we actually need all of its
// API for using with renderers (normally, it will be `EngineInstance`).
// We use `getOwner` from our internal home for it rather than the narrower
// public API for the same reason.
const TOP_LEVEL_NAME = '-top-level';
class OutletView {
  static extend(injections) {
    return class extends OutletView {
      static create(options) {
        if (options) {
          return super.create(Object.assign({}, injections, options));
        } else {
          return super.create(injections);
        }
      }
    };
  }
  static reopenClass(injections) {
    Object.assign(this, injections);
  }
  static create(options) {
    let {
      environment: _environment,
      application: namespace,
      template: templateFactory
    } = options;
    let owner = getOwner(options);
    (isDevelopingApp() && !(owner) && assert('OutletView is unexpectedly missing an owner', owner));
    let template = templateFactory(owner);
    return new OutletView(_environment, owner, template, namespace);
  }
  ref;
  state;
  constructor(_environment, owner, template, namespace) {
    this._environment = _environment;
    this.owner = owner;
    this.template = template;
    this.namespace = namespace;
    let outletStateTag = createTag();
    let outletState = {
      outlets: {
        main: undefined
      },
      render: {
        owner: owner,
        name: TOP_LEVEL_NAME,
        controller: undefined,
        model: undefined,
        template
      }
    };
    let ref = this.ref = createComputeRef(() => {
      consumeTag(outletStateTag);
      return outletState;
    }, state => {
      DIRTY_TAG(outletStateTag);
      outletState.outlets['main'] = state;
    });
    this.state = {
      ref,
      name: TOP_LEVEL_NAME,
      template,
      controller: undefined
    };
  }
  appendTo(selector) {
    let target;
    if (this._environment.hasDOM) {
      target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    } else {
      target = selector;
    }
    let renderer = this.owner.lookup('renderer:-dom');

    // SAFETY: It's not clear that this cast is safe.
    // The types for appendOutletView may be incorrect or this is a potential bug.
    schedule('render', renderer, 'appendOutletView', this, target);
  }
  rerender() {
    /**/
  }
  setOutletState(state) {
    updateRef(this.ref, state);
  }
  destroy() {
    /**/
  }
}

export { OutletView as default };
