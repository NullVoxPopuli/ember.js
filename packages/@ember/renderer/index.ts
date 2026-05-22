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
 * Returns the current render-tree scope, or `undefined` if called outside of
 * rendering.
 *
 * See [RFC #1154](https://github.com/emberjs/rfcs/pull/1154) for the motivation
 * and the userland patterns this primitive enables (notably component-tree
 * `provide` / `consume`).
 *
 * The returned `Scope` exposes `entries`, an iterable that walks the current
 * scope's own additions, then up through each ancestor render node. Anything
 * pushed onto the scope via `addToScope` becomes visible here.
 *
 * `getScope()` is synchronous and is only valid during render. After an
 * `await`, you must capture the scope (or the specific entries you need)
 * before the microtask boundary.
 *
 * @method getScope
 * @static
 * @for @ember/renderer
 * @returns {Scope | undefined} the current scope, or `undefined` when called outside of rendering.
 * @public
 */
export { getCurrentRenderScope as getScope } from '@glimmer/runtime/lib/render-scope';

/**
 * Adds an entry to the current render-tree scope so descendants can find it
 * via `getScope()`. Throws when called outside of rendering.
 *
 * See [RFC #1154](https://github.com/emberjs/rfcs/pull/1154).
 *
 * @method addToScope
 * @static
 * @for @ember/renderer
 * @param {unknown} entry the value to expose to descendants.
 * @public
 */
export { addToCurrentRenderScope as addToScope } from '@glimmer/runtime/lib/render-scope';

export type { RenderScope as Scope } from '@glimmer/runtime/lib/render-scope';
