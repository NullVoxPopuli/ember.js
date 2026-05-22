/**
 * @module @ember/renderer
 */
import { precompileTemplate } from '@ember/template-compilation';
import { addToCurrentRenderScope, getCurrentRenderScope } from '@glimmer/runtime/lib/render-scope';
import InternalComponent, {
  type OpaqueInternalComponentConstructor,
  opaquify,
} from './components/internal';

/**
 * The shape returned by `makeContext`. Use `Provide` in templates to bind a
 * fresh value into the render tree and `consume` to read the nearest enclosing
 * value.
 */
export interface Context<T> {
  Provide: OpaqueInternalComponentConstructor;
  consume: () => T;
}

export type ContextFactory<T> = (new () => T) | (() => T);

/**
 * Creates a render-tree-scoped context per [RFC #1154][rfc] discussion.
 *
 * [rfc]: https://github.com/emberjs/rfcs/pull/1154
 *
 * @example
 *
 * ```gjs
 * import { makeContext } from '@ember/renderer';
 *
 * class Theme {
 *   color = 'dark';
 * }
 *
 * const theme = makeContext(Theme);
 *
 * <template>
 *   <theme.Provide>
 *     {{#let (theme.consume) as |t|}}
 *       {{t.color}} {{! "dark" }}
 *     {{/let}}
 *   </theme.Provide>
 *
 *   {{ (theme.consume) }} {{! throws -- no provider in the hierarchy }}
 * </template>
 * ```
 *
 * Both forms are supported for the factory:
 * - A class (`makeContext(SomeClass)`) — each `<Provide>` constructs a fresh
 *   instance via `new SomeClass()`.
 * - A factory function (`makeContext(() => value)`) — each `<Provide>`
 *   invokes the factory to produce a fresh value.
 *
 * Reactivity rules: the *value* returned by the factory is not itself
 * tracked. Consumers see the same identity across re-renders of their
 * Provide. To get reactivity, put `@tracked` state on the value object —
 * mutating that state will invalidate consumers as expected.
 *
 * `consume()` throws if it is called outside of rendering, or if no
 * matching `<Provide>` exists higher in the render tree. This is
 * intentional: a missing provider is almost always a bug, not a
 * legitimate "fall back to undefined" state. If you need a default,
 * provide one at the application root.
 *
 * @method makeContext
 * @static
 * @for @ember/renderer
 * @param {Function} factory A zero-arg class or factory function that
 *   produces a fresh value each time `<Provide>` is rendered.
 * @returns {Object} An object with `Provide` (a component) and `consume`
 *   (a function/helper that reads the nearest provided value).
 * @public
 */
export function makeContext<T>(factory: ContextFactory<T>): Context<T> {
  // Identity-based key, so multiple contexts can coexist on the same scope
  // without name collisions. Held in the closure -- not exported.
  const key = {};

  function consume(): T {
    let scope = getCurrentRenderScope();
    if (scope === undefined) {
      throw new Error(
        '`consume()` was called outside of rendering. The render-tree scope is only available during rendering -- there is nothing to read.'
      );
    }
    for (let entry of scope.entries) {
      if (Array.isArray(entry) && entry[0] === key) {
        return entry[1] as T;
      }
    }
    throw new Error(
      'No matching `<Provide>` was found in the render tree. Wrap consumers in `<Context.Provide>...</Context.Provide>`, or provide a default at the application root.'
    );
  }

  class Provide extends InternalComponent {
    static override toString(): string {
      return 'Provide';
    }

    constructor(...args: ConstructorParameters<typeof InternalComponent>) {
      super(...args);
      const value = isClassConstructor(factory)
        ? new (factory as new () => T)()
        : (factory as () => T)();
      addToCurrentRenderScope([key, value]);
    }
  }

  return { Provide: opaquify(Provide, PROVIDE_TEMPLATE), consume };
}

// All Provide components share the same template: yield to the block.
// Per-instance behavior is parameterized via the closure in makeContext.
const PROVIDE_TEMPLATE = precompileTemplate('{{yield}}');

function isClassConstructor(fn: unknown): boolean {
  if (typeof fn !== 'function') return false;
  // ES classes serialize starting with `class`; arrow / regular functions do
  // not. This is the standard "is class" sniff and is good enough for our
  // dual-overload accepting either form.
  return /^class[\s{]/.test(Function.prototype.toString.call(fn));
}
