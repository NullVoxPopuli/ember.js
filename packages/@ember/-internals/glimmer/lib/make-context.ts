/**
 * @module @ember/helper
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
 * value into the render tree and `consume` to read the nearest enclosing
 * value.
 */
export interface Context<T> {
  Provide: OpaqueInternalComponentConstructor;
  consume: () => T;
}

// Internal entry shape stored in the render-tree scope. The key identifies the
// context (closure-captured by makeContext); `read` returns the current
// provided value -- evaluated lazily so that the auto-tracking inside
// `valueForRef` makes consumers reactive to the `@value` argument.
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
 * `makeContext` takes no value of its own -- it only establishes the
 * *type* of the value (via a type parameter) and returns a `Provide`
 * component plus a `consume` reader. The value is supplied at render time
 * through `<Provide @value={{...}}>`.
 *
 * @example
 *
 * ```gjs
 * import { makeContext } from '@ember/helper';
 *
 * class Theme {
 *   color = 'dark';
 * }
 *
 * const theme = makeContext<Theme>();
 *
 * <template>
 *   <theme.Provide @value={{this.theme}}>
 *     {{#let (theme.consume) as |t|}}
 *       {{t.color}} {{! whatever this.theme.color is }}
 *     {{/let}}
 *   </theme.Provide>
 *
 *   {{! Override the value at a nested provider: }}
 *   <theme.Provide @value={{this.theme}}>
 *     <theme.Provide @value={{this.lightTheme}}>
 *       {{#let (theme.consume) as |t|}}
 *         {{t.color}} {{! the light theme's color }}
 *       {{/let}}
 *     </theme.Provide>
 *   </theme.Provide>
 *
 *   {{ (theme.consume) }} {{! throws -- no provider in the hierarchy }}
 * </template>
 * ```
 *
 * Reactivity: the `@value` binding is reactive. When the argument passed to
 * `<Provide>` updates, consumers re-render automatically. If `@value` is a
 * stable object, mutating its `@tracked` fields likewise re-renders
 * consumers.
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
 * @returns {Object} An object with `Provide` (a component that takes a
 *   `@value`) and `consume` (a function/helper that reads the nearest
 *   provided value).
 * @public
 */
export function makeContext<T>(): Context<T> {
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
      'No matching `<Provide>` was found in the render tree. Wrap consumers in `<Context.Provide @value={{...}}>...</Context.Provide>`, or provide a default at the application root.'
    );
  }

  class Provide extends InternalComponent {
    static override toString(): string {
      return 'Provide';
    }

    constructor(...args: ConstructorParameters<typeof InternalComponent>) {
      super(...args);

      // The provided value comes from `@value`. Store a lazy read that pulls
      // the current value from the argument reference. `valueForRef` consumes
      // tracking tags when called inside a tracking frame, so consumers
      // re-render automatically when the argument updates. If `@value` was
      // omitted, the provider still exists in the tree and provides
      // `undefined` (consume() returns undefined rather than throwing).
      const valueRef = this.args.named['value'];
      const read = (): unknown => (valueRef === undefined ? undefined : valueForRef(valueRef));

      const entry: ContextEntry = { key, read };
      addToCurrentRenderScope(entry);
    }
  }

  return { Provide: opaquify(Provide, PROVIDE_TEMPLATE), consume };
}

// All Provide components share the same template: yield to the block.
// Per-instance behavior is parameterized via the closure in makeContext.
const PROVIDE_TEMPLATE = precompileTemplate('{{yield}}');
