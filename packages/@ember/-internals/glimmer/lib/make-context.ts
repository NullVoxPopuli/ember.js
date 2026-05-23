/**
 * @module @ember/renderer
 */
import { precompileTemplate } from '@ember/template-compilation';
import { addToCurrentRenderScope, getCurrentRenderScope } from '@glimmer/runtime/lib/render-scope';
import { valueForRef } from '@glimmer/reference/lib/reference';
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

// Internal entry shape stored in the render-tree scope. The key identifies the
// context (closure-captured by makeContext); `read` returns the current
// provided value -- evaluated lazily so that, when `@value` is passed, the
// auto-tracking inside `valueForRef` makes consumers reactive to it.
interface ContextEntry {
  key: object;
  read: () => unknown;
}

function isContextEntry(entry: unknown): entry is ContextEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'key' in entry &&
    'read' in entry &&
    typeof (entry as ContextEntry).read === 'function'
  );
}

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
 *   {{! Override the value at this provider: }}
 *   <theme.Provide @value={{(hash color="light")}}>
 *     {{#let (theme.consume) as |t|}}
 *       {{t.color}} {{! "light" }}
 *     {{/let}}
 *   </theme.Provide>
 *
 *   {{ (theme.consume) }} {{! throws -- no provider in the hierarchy }}
 * </template>
 * ```
 *
 * Both factory forms are supported:
 * - A class (`makeContext(SomeClass)`) — each `<Provide>` constructs a fresh
 *   instance via `new SomeClass()`.
 * - A factory function (`makeContext(() => value)`) — each `<Provide>`
 *   invokes the factory to produce a fresh value.
 *
 * `<Provide>` also accepts an optional `@value` argument. When passed, that
 * value is provided to descendants instead of the factory's output, and
 * consumers re-render automatically when the argument updates.
 *
 * Reactivity rules:
 * - For factory-provided values, the *value* returned by the factory is not
 *   itself tracked. Put `@tracked` state on it for reactivity.
 * - For `@value`-provided values, the binding is reactive to argument
 *   updates as you'd expect.
 *
 * `consume()` throws if it is called outside of rendering, or if no
 * matching `<Provide>` exists higher in the render tree. This is
 * intentional (matching NullVoxPopuli's "reduce harm" clarification on the
 * RFC): a missing provider is almost always a bug, not a legitimate
 * "fall back to undefined" state. If you want a default, provide one at the
 * application root.
 *
 * @method makeContext
 * @static
 * @for @ember/renderer
 * @param {Function} factory A zero-arg class or factory function that
 *   produces a fresh value each time `<Provide>` is rendered (and `@value`
 *   was not passed).
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
      if (isContextEntry(entry) && entry.key === key) {
        return entry.read() as T;
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

      // If `@value` was passed, store a lazy read that pulls the current
      // value from the argument reference. `valueForRef` consumes tracking
      // tags when called inside a tracking frame, so consumers re-render
      // automatically when the argument updates.
      const valueRef = this.args.named['value'];
      let read: () => unknown;
      if (valueRef !== undefined) {
        read = () => valueForRef(valueRef);
      } else {
        const factoryValue: T = isClassConstructor(factory)
          ? new (factory as new () => T)()
          : (factory as () => T)();
        read = () => factoryValue;
      }

      const entry: ContextEntry = { key, read };
      addToCurrentRenderScope(entry);
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
