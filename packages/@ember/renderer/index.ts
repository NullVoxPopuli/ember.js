/**
  @module @ember/renderer
  @public
*/

/**
 * @class Renderer
 * @public
 */

/**
  Returns a promise which will resolve when rendering has completed. In
  this context, rendering is completed when all auto-tracked state that is
  consumed in the template (including any tracked state in models, services,
  etc. that are then used in a template) has been updated in the DOM.

  For example, in a test you might want to update some tracked state and
  then run some assertions after rendering has completed. You _could_ use
  `await settled()` in that location, but in some contexts you don't want to
  wait for full settledness (which includes test waiters, pending AJAX/fetch,
  run loops, etc) but instead only want to know when that updated value has
  been rendered in the DOM. **THAT** is what `await renderSettled()` is
  _perfect_ for.

  ```js
  import { renderSettled } from '@ember/renderer';
  import { render } from '@ember/test-helpers';
  import { tracked } from '@glimmer/tracking';
  import { hbs } from 'ember-cli-htmlbars';
  import { setupRenderingTest } from 'my-app/tests/helpers';
  import { module, test } from 'qunit';

  module('Integration | Component | profile-card', function (hooks) {
    setupRenderingTest(hooks);

    test("it renders the person's name", async function (assert) {
      class Person {
        @tracked name = '';
      }

      this.person = new Person();
      this.person.name = 'John';

      await render(hbs`
        <ProfileCard @name={{this.person.name}} />
      `);

      assert.dom().hasText('John');

      this.person.name = 'Jane';

      await renderSettled(); // Wait until rendering has completed.

      assert.dom().hasText('Jane');
    });
  });
  ```

  @method renderSettled
  @returns {Promise<void>} a promise which fulfills when rendering has completed
  @public
*/

export { renderSettled } from '@ember/-internals/glimmer/lib/renderer';

/**
 * Render a component into a DOM element.
 *
 * See also: [RFC#1099](https://github.com/emberjs/rfcs/blob/main/text/1099-renderComponent.md)
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
export { renderComponent } from '@ember/-internals/glimmer/lib/renderer';

/**
 * Creates a render-tree-scoped context (provide/consume) for sharing values
 * with descendant components without prop drilling.
 *
 * See [RFC #1154](https://github.com/emberjs/rfcs/pull/1154) and the original
 * [Context RFC #975](https://github.com/emberjs/rfcs/pull/975).
 *
 * `makeContext` returns an object with:
 *
 * - `Provide`: a component that, on every render, produces a fresh value
 *    from the given class or factory and exposes it to every descendant in
 *    the block.
 * - `consume()`: a function (also usable as a template helper) that returns
 *    the nearest enclosing provided value. **Throws** if there is no
 *    matching provider higher in the render tree, or if called outside of
 *    rendering.
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
 *   {{ (theme.consume) }} {{! throws -- no provider }}
 * </template>
 * ```
 *
 * Reactivity: the *value* returned by the factory is not itself tracked,
 * but `@tracked` state on it is — mutating tracked fields invalidates
 * consumers as expected.
 *
 * @method makeContext
 * @static
 * @for @ember/renderer
 * @param {Function} factory A zero-arg class or factory function that
 *   produces a fresh value each time `<Provide>` is rendered.
 * @returns {Object} `{ Provide, consume }`
 * @public
 */
export { makeContext } from '@ember/-internals/glimmer/lib/make-context';

export type { Context, ContextFactory } from '@ember/-internals/glimmer/lib/make-context';
