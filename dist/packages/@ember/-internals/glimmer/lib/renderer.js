import { p as privatize } from '../../../../shared-chunks/registry-CU7X7HvH.js';
import { E as ENV } from '../../../../shared-chunks/env-DxZ20QzS.js';
import { getOwner } from '../../owner/index.js';
import { g as guidFor } from '../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { isDevelopingApp } from '@embroider/macros';
import { getViewId, getViewElement } from '../../views/lib/system/utils.js';
import '../../views/lib/system/action_manager.js';
import '../../views/lib/views/states.js';
import '../../../debug/index.js';
import { _backburner, _getCurrentRunLoop } from '../../../runloop/index.js';
import { isDestroyed, associateDestroyableChild, registerDestructor, destroy } from '../../../../@glimmer/destroyable/index.js';
import { artifacts, RuntimeOpImpl } from '../../../../@glimmer/program/index.js';
import { createConstRef, UNDEFINED_REFERENCE, valueForRef } from '../../../../@glimmer/reference/index.js';
import { clientBuilder, curry, createCapturedArgs, inTransaction, runtimeOptions, EMPTY_POSITIONAL, renderComponent as renderComponent$1, renderMain } from '../../../../@glimmer/runtime/index.js';
import { dict } from '../../../../@glimmer/util/index.js';
import { unwrapTemplate } from './component-managers/unwrap-template.js';
import { valueForTag, CURRENT_TAG, validateTag } from '../../../../@glimmer/validator/index.js';
import { a as RSVP } from '../../../../shared-chunks/rsvp-ziM3qQyS.js';
import { hasDOM } from '../../browser-environment/index.js';
import { BOUNDS } from './component-managers/curly.js';
import { RootComponentDefinition } from './component-managers/root.js';
import { EmberEnvironmentDelegate } from './environment.js';
import { StrictResolver } from './renderer/strict-resolver.js';
import ResolverImpl from './resolver.js';
import OutletView from './views/outlet.js';
import { EvaluationContextImpl } from '../../../../@glimmer/opcode-compiler/index.js';
import { assert } from '../../../debug/lib/assert.js';

class DynamicScope {
  constructor(view, outletState) {
    this.view = view;
    this.outletState = outletState;
  }
  child() {
    return new DynamicScope(this.view, this.outletState);
  }
  get(key) {
    (isDevelopingApp() && !(key === 'outletState') && assert(`Using \`-get-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState'));
    return this.outletState;
  }
  set(key, value) {
    (isDevelopingApp() && !(key === 'outletState') && assert(`Using \`-with-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState'));
    this.outletState = value;
    return value;
  }
}
const NO_OP = () => {};

// This wrapper logic prevents us from rerendering in case of a hard failure
// during render. This prevents infinite revalidation type loops from occuring,
// and ensures that errors are not swallowed by subsequent follow on failures.
function errorLoopTransaction(fn) {
  if (isDevelopingApp()) {
    return () => {
      let didError = true;
      try {
        fn();
        didError = false;
      } finally {
        if (didError) {
          // Noop the function so that we won't keep calling it and causing
          // infinite looping failures;
          fn = () => {
            // eslint-disable-next-line no-console
            console.warn('Attempted to rerender, but the Ember application has had an unrecoverable error occur during render. You should reload the application after fixing the cause of the error.');
          };
        }
      }
    };
  } else {
    return fn;
  }
}
class ComponentRootState {
  type = 'component';
  #result;
  #render;
  constructor(state, definition, options) {
    this.#render = errorLoopTransaction(() => {
      let iterator = renderComponent$1(state.context, state.builder(state.env, options.into), state.owner, definition, options?.args);
      let result = this.#result = iterator.sync();
      associateDestroyableChild(this, this.#result);

      // override .render function after initial render
      this.#render = errorLoopTransaction(() => result.rerender({
        alwaysRevalidate: false
      }));
    });
  }
  isFor(_component) {
    return false;
  }
  render() {
    this.#render();
  }
  destroy() {
    destroy(this);
  }
  get destroyed() {
    return isDestroyed(this);
  }
  get result() {
    return this.#result;
  }
}
class ClassicRootState {
  type = 'classic';
  id;
  result;
  destroyed;
  render;
  env;
  constructor(root, context, owner, template, self, parentElement, dynamicScope, builder) {
    this.root = root;
    (isDevelopingApp() && !(template !== undefined) && assert(`You cannot render \`${valueForRef(self)}\` without a template.`, template !== undefined));
    this.id = root instanceof OutletView ? guidFor(root) : getViewId(root);
    this.result = undefined;
    this.destroyed = false;
    this.env = context.env;
    this.render = errorLoopTransaction(() => {
      let layout = unwrapTemplate(template).asLayout();
      let iterator = renderMain(context, owner, self, builder(context.env, {
        element: parentElement,
        nextSibling: null
      }), layout, dynamicScope);
      let result = this.result = iterator.sync();

      // override .render function after initial render
      this.render = errorLoopTransaction(() => result.rerender({
        alwaysRevalidate: false
      }));
    });
  }
  isFor(possibleRoot) {
    return this.root === possibleRoot;
  }
  destroy() {
    let {
      result,
      env
    } = this;
    this.destroyed = true;
    this.root = null;
    this.result = undefined;
    this.render = undefined;
    if (result !== undefined) {
      /*
       Handles these scenarios:
        * When roots are removed during standard rendering process, a transaction exists already
         `.begin()` / `.commit()` are not needed.
       * When roots are being destroyed manually (`component.append(); component.destroy() case), no
         transaction exists already.
       * When roots are being destroyed during `Renderer#destroy`, no transaction exists
        */

      inTransaction(env, () => destroy(result));
    }
  }
}
const renderers = [];
function _resetRenderers() {
  renderers.length = 0;
}
function register(renderer) {
  (isDevelopingApp() && !(renderers.indexOf(renderer) === -1) && assert('Cannot register the same renderer twice', renderers.indexOf(renderer) === -1));
  renderers.push(renderer);
}
function deregister(renderer) {
  let index = renderers.indexOf(renderer);
  (isDevelopingApp() && !(index !== -1) && assert('Cannot deregister unknown unregistered renderer', index !== -1));
  renderers.splice(index, 1);
}
function loopBegin() {
  for (let renderer of renderers) {
    renderer.rerender();
  }
}
let renderSettledDeferred = null;
/*
  Returns a promise which will resolve when rendering has settled. Settled in
  this context is defined as when all of the tags in use are "current" (e.g.
  `renderers.every(r => r._isValid())`). When this is checked at the _end_ of
  the run loop, this essentially guarantees that all rendering is completed.

  @method renderSettled
  @returns {Promise<void>} a promise which fulfills when rendering has settled
*/
function renderSettled() {
  if (renderSettledDeferred === null) {
    renderSettledDeferred = RSVP.defer();
    // if there is no current runloop, the promise created above will not have
    // a chance to resolve (because its resolved in backburner's "end" event)
    if (!_getCurrentRunLoop()) {
      // ensure a runloop has been kicked off
      _backburner.schedule('actions', null, NO_OP);
    }
  }
  return renderSettledDeferred.promise;
}
function resolveRenderPromise() {
  if (renderSettledDeferred !== null) {
    let resolve = renderSettledDeferred.resolve;
    renderSettledDeferred = null;
    _backburner.join(null, resolve);
  }
}
let loops = 0;
function loopEnd() {
  for (let renderer of renderers) {
    if (!renderer.isValid()) {
      if (loops > ENV._RERENDER_LOOP_LIMIT) {
        loops = 0;
        // TODO: do something better
        renderer.destroy();
        throw new Error('infinite rendering invalidation detected');
      }
      loops++;
      return _backburner.join(null, NO_OP);
    }
  }
  loops = 0;
  resolveRenderPromise();
}
_backburner.on('begin', loopBegin);
_backburner.on('end', loopEnd);
class RendererState {
  static create(data, renderer) {
    const state = new RendererState(data, renderer);
    associateDestroyableChild(renderer, state);
    return state;
  }
  #data;
  #lastRevision = -1;
  #inRenderTransaction = false;
  #destroyed = false;
  #roots = [];
  #removedRoots = [];
  constructor(data, renderer) {
    this.#data = data;
    registerDestructor(this, () => {
      this.clearAllRoots(renderer);
    });
  }
  get debug() {
    return {
      roots: this.#roots,
      inRenderTransaction: this.#inRenderTransaction,
      isInteractive: this.isInteractive
    };
  }
  get roots() {
    return this.#roots;
  }
  get owner() {
    return this.#data.owner;
  }
  get builder() {
    return this.#data.builder;
  }
  get context() {
    return this.#data.context;
  }
  get env() {
    return this.context.env;
  }
  get isInteractive() {
    return this.#data.context.env.isInteractive;
  }
  renderRoot(root, renderer) {
    let roots = this.#roots;
    roots.push(root);
    associateDestroyableChild(this, root);
    if (roots.length === 1) {
      register(renderer);
    }
    this.#renderRootsTransaction(renderer);
    return root;
  }
  #renderRootsTransaction(renderer) {
    if (this.#inRenderTransaction) {
      // currently rendering roots, a new root was added and will
      // be processed by the existing _renderRoots invocation
      return;
    }

    // used to prevent calling _renderRoots again (see above)
    // while we are actively rendering roots
    this.#inRenderTransaction = true;
    let completedWithoutError = false;
    try {
      this.renderRoots(renderer);
      completedWithoutError = true;
    } finally {
      if (!completedWithoutError) {
        this.#lastRevision = valueForTag(CURRENT_TAG);
      }
      this.#inRenderTransaction = false;
    }
  }
  renderRoots(renderer) {
    let roots = this.#roots;
    let removedRoots = this.#removedRoots;
    let initialRootsLength;
    do {
      initialRootsLength = roots.length;
      inTransaction(this.context.env, () => {
        // ensure that for the first iteration of the loop
        // each root is processed
        for (let i = 0; i < roots.length; i++) {
          let root = roots[i];
          (isDevelopingApp() && !(root) && assert('has root', root));
          if (root.destroyed) {
            // add to the list of roots to be removed
            // they will be removed from `this._roots` later
            removedRoots.push(root);

            // skip over roots that have been marked as destroyed
            continue;
          }

          // when processing non-initial reflush loops,
          // do not process more roots than needed
          if (i >= initialRootsLength) {
            continue;
          }
          root.render();
        }
        this.#lastRevision = valueForTag(CURRENT_TAG);
      });
    } while (roots.length > initialRootsLength);

    // remove any roots that were destroyed during this transaction
    while (removedRoots.length) {
      let root = removedRoots.pop();
      let rootIndex = roots.indexOf(root);
      roots.splice(rootIndex, 1);
    }
    if (this.#roots.length === 0) {
      deregister(renderer);
    }
  }
  scheduleRevalidate(renderer) {
    _backburner.scheduleOnce('render', this, this.revalidate, renderer);
  }
  isValid() {
    return this.#destroyed || this.#roots.length === 0 || validateTag(CURRENT_TAG, this.#lastRevision);
  }
  revalidate(renderer) {
    if (this.isValid()) {
      return;
    }
    this.#renderRootsTransaction(renderer);
  }
  clearAllRoots(renderer) {
    let roots = this.#roots;
    for (let root of roots) {
      destroy(root);
    }
    this.#removedRoots.length = 0;
    this.#roots = [];

    // if roots were present before destroying
    // deregister this renderer instance
    if (roots.length) {
      deregister(renderer);
    }
  }
}

/**
 * The returned object from `renderComponent`
 * @public
 * @module @ember/renderer
 */

function intoTarget(into) {
  if ('element' in into) {
    return into;
  } else {
    return {
      element: into,
      nextSibling: null
    };
  }
}

/**
 * Render a component into a DOM element.
 *
 * @method renderComponent
 * @static
 * @for @ember/renderer
 * @param {Object} component The component to render.
 * @param {Object} options
 * @param {Element} options.into Where to render the component in to.
 * @param {Object} [options.owner] Optionally specify the owner to use. This will be used for injections, and overall cleanup.
 * @param {Object} [options.env] Optional renderer configuration
 * @param {Object} [options.args] Optionally pass args in to the component. These may be reactive as long as it is an object or object-like
 * @public
 */
function renderComponent(
/**
 * The component definition to render.
 *
 * Any component that has had its manager registered is valid.
 * For the component-types that ship with ember, manager registration
 * does not need to be worried about.
 */
component, {
  owner = {},
  env,
  into,
  args
}) {
  /**
   * SAFETY: we should figure out what we need out of a `document` and narrow the API.
   *         this exercise should also end up beginning to define what we need for CLI rendering (or to other outputs)
   */
  let document = env && 'document' in env ? env?.['document'] : globalThis.document;
  let renderer = BaseRenderer.strict(owner, document, {
    ...env,
    isInteractive: env?.isInteractive ?? true,
    hasDOM: env && 'hasDOM' in env ? Boolean(env?.['hasDOM']) : true
  });

  /**
   * Replace all contents, if we've rendered multiple times.
   *
   * https://github.com/emberjs/rfcs/pull/1099/files#diff-2b962105b9083ca84579cdc957f27f49407440f3c5078083fa369ec18cc46da8R365
   *
   * We could later add an option to not do this behavior
   *
   * NOTE: destruction is async
   */
  let existing = RENDER_CACHE.get(into);
  existing?.destroy();
  /**
   * We can only replace the inner HTML the first time.
   * Because destruction is async, it won't be safe to
   * do this again, and we'll have to rely on the above destroy.
   */
  if (!existing && into instanceof Element) {
    into.innerHTML = '';
  }
  let innerResult = renderer.render(component, {
    into,
    args
  }).result;
  let result = {
    destroy() {
      if (innerResult) {
        destroy(innerResult);
      }
    }
  };
  RENDER_CACHE.set(into, result);
  return result;
}
const RENDER_CACHE = new WeakMap();
class BaseRenderer {
  static strict(owner, document, options) {
    return new BaseRenderer(owner, {
      hasDOM: hasDOM,
      ...options
    }, document, new StrictResolver(), clientBuilder);
  }
  state;
  constructor(owner, envOptions, document, resolver, builder) {
    let sharedArtifacts = artifacts();

    /**
     * SAFETY: are there consequences for being looser with *this* owner?
     *         the public API for `owner` is kinda `Partial<InternalOwner>`
     *         aka: implement only what you need.
     *         But for actual ember apps, you *need* to implement everything
     *         an app needs (which will actually change and become less over time)
     */
    let env = new EmberEnvironmentDelegate(owner, envOptions.isInteractive);
    let options = runtimeOptions({
      document
    }, env, sharedArtifacts, resolver);
    let context = new EvaluationContextImpl(sharedArtifacts, heap => new RuntimeOpImpl(heap), options);
    this.state = RendererState.create({
      owner,
      context,
      builder
    }, this);
  }
  get debugRenderTree() {
    let {
      debugRenderTree
    } = this.state.env;
    (isDevelopingApp() && !(debugRenderTree) && assert('Attempted to access the DebugRenderTree, but it did not exist. Is the Ember Inspector open?', debugRenderTree));
    return debugRenderTree;
  }
  isValid() {
    return this.state.isValid();
  }
  destroy() {
    destroy(this);
  }
  render(component, options) {
    const root = new ComponentRootState(this.state, component, {
      args: options.args,
      into: intoTarget(options.into)
    });
    return this.state.renderRoot(root, this);
  }
  rerender() {
    this.state.scheduleRevalidate(this);
  }

  // render(component: Component, options: { into: Cursor; args?: Record<string, unknown> }): void {
  //   this.state.renderRoot(component);
  // }
}
class Renderer extends BaseRenderer {
  static strict(owner, document, options) {
    return new BaseRenderer(owner, {
      hasDOM: hasDOM,
      ...options
    }, document, new StrictResolver(), clientBuilder);
  }
  _rootTemplate;
  _viewRegistry;
  static create(props) {
    let {
      _viewRegistry
    } = props;
    let owner = getOwner(props);
    (isDevelopingApp() && !(owner) && assert('Renderer is unexpectedly missing an owner', owner));
    let document = owner.lookup('service:-document');
    let env = owner.lookup('-environment:main');
    let rootTemplate = owner.lookup(privatize`template:-root`);
    let builder = owner.lookup('service:-dom-builder');
    return new this(owner, document, env, rootTemplate, _viewRegistry, builder);
  }
  constructor(owner, document, env, rootTemplate, viewRegistry, builder = clientBuilder, resolver = new ResolverImpl()) {
    super(owner, env, document, resolver, builder);
    this._rootTemplate = rootTemplate(owner);
    this._viewRegistry = viewRegistry || owner.lookup('-view-registry:main');
  }

  // renderer HOOKS

  appendOutletView(view, target) {
    // TODO: This bypasses the {{outlet}} syntax so logically duplicates
    // some of the set up code. Since this is all internal (or is it?),
    // we can refactor this to do something more direct/less convoluted
    // and with less setup, but get it working first
    let outlet = createRootOutlet(view);
    let {
      name,
      /* controller, */template
    } = view.state;
    let named = dict();
    named['Component'] = createConstRef(makeRouteTemplate(view.owner, name, template), '@Component');

    // TODO: is this guaranteed to be undefined? It seems to be the
    // case in the `OutletView` class. Investigate how much that class
    // exists as an internal implementation detail only, or if it was
    // used outside of core. As far as I can tell, test-helpers uses
    // it but only for `setOutletState`.
    // named['controller'] = createConstRef(controller, '@controller');
    // Update: at least according to the debug render tree tests, we
    // appear to always expect this to be undefined. Not a definitive
    // source by any means, but is useful evidence
    named['controller'] = UNDEFINED_REFERENCE;
    named['model'] = UNDEFINED_REFERENCE;
    let args = createCapturedArgs(named, EMPTY_POSITIONAL);
    this._appendDefinition(view, curry(0, outlet, view.owner, args, true), target);
  }
  appendTo(view, target) {
    let definition = new RootComponentDefinition(view);
    this._appendDefinition(view, curry(0, definition, this.state.owner, null, true), target);
  }
  _appendDefinition(root, definition, target) {
    let self = createConstRef(definition, 'this');
    let dynamicScope = new DynamicScope(null, UNDEFINED_REFERENCE);
    let rootState = new ClassicRootState(root, this.state.context, this.state.owner, this._rootTemplate, self, target, dynamicScope, this.state.builder);
    this.state.renderRoot(rootState, this);
  }
  cleanupRootFor(component) {
    // no need to cleanup roots if we have already been destroyed
    if (isDestroyed(this)) {
      return;
    }
    let roots = this.state.roots;

    // traverse in reverse so we can remove items
    // without mucking up the index
    let i = roots.length;
    while (i--) {
      let root = roots[i];
      (isDevelopingApp() && !(root) && assert('has root', root));
      if (root.type === 'classic' && root.isFor(component)) {
        root.destroy();
        roots.splice(i, 1);
      }
    }
  }
  remove(view) {
    view._transitionTo('destroying');
    this.cleanupRootFor(view);
    if (this.state.isInteractive) {
      view.trigger('didDestroyElement');
    }
  }
  get _roots() {
    return this.state.debug.roots;
  }
  get _inRenderTransaction() {
    return this.state.debug.inRenderTransaction;
  }
  get _isInteractive() {
    return this.state.debug.isInteractive;
  }
  get _context() {
    return this.state.context;
  }
  register(view) {
    let id = getViewId(view);
    (isDevelopingApp() && !(!this._viewRegistry[id]) && assert('Attempted to register a view with an id already in use: ' + id, !this._viewRegistry[id]));
    this._viewRegistry[id] = view;
  }
  unregister(view) {
    delete this._viewRegistry[getViewId(view)];
  }
  getElement(component) {
    if (this._isInteractive) {
      return getViewElement(component);
    } else {
      throw new Error('Accessing `this.element` is not allowed in non-interactive environments (such as FastBoot).');
    }
  }
  getBounds(component) {
    let bounds = component[BOUNDS];
    (isDevelopingApp() && !(bounds) && assert('object passed to getBounds must have the BOUNDS symbol as a property', bounds));
    let parentElement = bounds.parentElement();
    let firstNode = bounds.firstNode();
    let lastNode = bounds.lastNode();
    return {
      parentElement,
      firstNode,
      lastNode
    };
  }
}

export { BaseRenderer, DynamicScope, Renderer, RendererState, _resetRenderers, renderComponent, renderSettled };
