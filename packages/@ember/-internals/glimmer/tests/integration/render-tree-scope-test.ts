import {
  AbstractStrictTestCase,
  assertHTML,
  buildOwner,
  moduleFor,
  runDestroy,
} from 'internal-test-helpers';

import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@glimmer/manager';
import templateOnly from '@ember/component/template-only';
import GlimmerishComponent from '../utils/glimmerish-component';

import { run } from '@ember/runloop';
import { associateDestroyableChild, registerDestructor } from '@glimmer/destroyable';
import { renderComponent } from '../../lib/renderer';
import {
  addToCurrentRenderScope as addToScope,
  getCurrentRenderScope as getScope,
} from '@glimmer/runtime/lib/render-scope';
import type Owner from '@ember/owner';

/**
 * Coverage for the render-tree scope primitives proposed in RFC #1154
 * ( https://github.com/emberjs/rfcs/pull/1154 ).
 *
 * These tests pin down the two things consumers actually rely on:
 *
 *   1. `getScope()` is only defined while rendering, and returns a Scope whose
 *      `entries` walks from the current render node up through each ancestor.
 *   2. A userland `provide` / `consume` built on `addToScope` + `getScope`
 *      finds the nearest provider, which is the building block for any
 *      component-tree context implementation.
 */

class RenderTreeScopeTestCase extends AbstractStrictTestCase {
  owner: Owner;

  constructor(assert: QUnit['assert']) {
    super(assert);
    this.owner = buildOwner({});
    associateDestroyableChild(this, this.owner);
  }

  get element() {
    return document.querySelector('#qunit-fixture')!;
  }

  renderComponent(component: object) {
    let { owner } = this;
    run(() => {
      const result = renderComponent(component, {
        owner,
        env: { document: document, isInteractive: true, hasDOM: true },
        into: this.element,
      });
      registerDestructor(this, () => result.destroy());
    });
  }
}

moduleFor(
  'RFC #1154 -- render-tree scope primitives',
  class extends RenderTreeScopeTestCase {
    afterEach() {
      runDestroy(this);
    }

    '@test getScope() returns undefined outside of rendering'(assert: QUnit['assert']) {
      assert.strictEqual(getScope(), undefined, 'no active scope before render');

      let Foo = setComponentTemplate(precompileTemplate('hi'), templateOnly());
      this.renderComponent(Foo);

      assertHTML('hi');
      assert.strictEqual(getScope(), undefined, 'no active scope after commit');
    }

    '@test addToScope() throws when called outside of rendering'(assert: QUnit['assert']) {
      assert.throws(
        () => addToScope('nope'),
        /addToScope/,
        'addToScope rejects calls made outside a render'
      );
    }

    "@test a function captured at render time sees the caller's scope entries via getScope()"(
      assert: QUnit['assert']
    ) {
      let collected: unknown[] = [];

      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          let scope = getScope();
          assert.ok(scope, 'scope is defined during component construction');
          if (scope) {
            for (let entry of scope.entries) {
              collected.push(entry);
            }
          }
        }
      }
      setComponentTemplate(precompileTemplate('done'), Reader);

      class Provider extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          addToScope({ kind: 'theme', value: 'dark' });
          addToScope({ kind: 'locale', value: 'en' });
        }
      }
      setComponentTemplate(
        precompileTemplate('<Reader/>', {
          strictMode: true,
          scope: () => ({ Reader }),
        }),
        Provider
      );

      let Root = setComponentTemplate(
        precompileTemplate('<Provider/>', {
          strictMode: true,
          scope: () => ({ Provider }),
        }),
        templateOnly()
      );

      this.renderComponent(Root);
      assertHTML('done');

      // Entries iterate most-recent-first within a node, then walk up.
      // Reader's own scope is empty, so we should see the two entries from
      // Provider in reverse insertion order.
      assert.deepEqual(
        collected,
        [
          { kind: 'locale', value: 'en' },
          { kind: 'theme', value: 'dark' },
        ],
        'consumer iterates its parent provider entries newest-first'
      );
    }

    '@test consumer finds the nearest provider (component-tree context pattern)'(
      assert: QUnit['assert']
    ) {
      let observed: string[] = [];

      class ThemeKey {}
      const THEME = new ThemeKey();

      function provideTheme(value: string) {
        addToScope([THEME, value]);
      }

      function consumeTheme(): string | undefined {
        let scope = getScope();
        if (!scope) return undefined;
        for (let entry of scope.entries) {
          if (Array.isArray(entry) && entry[0] === THEME) {
            return entry[1] as string;
          }
        }
        return undefined;
      }

      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          observed.push(consumeTheme() ?? 'none');
        }
      }
      setComponentTemplate(precompileTemplate('r'), Reader);

      class Inner extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          provideTheme('dark');
        }
      }
      setComponentTemplate(
        precompileTemplate('<Reader/>', {
          strictMode: true,
          scope: () => ({ Reader }),
        }),
        Inner
      );

      class Outer extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          provideTheme('light');
        }
      }
      setComponentTemplate(
        precompileTemplate('<Reader/><Inner/><Reader/>', {
          strictMode: true,
          scope: () => ({ Inner, Reader }),
        }),
        Outer
      );

      let Root = setComponentTemplate(
        precompileTemplate('<Reader/><Outer/>', {
          strictMode: true,
          scope: () => ({ Outer, Reader }),
        }),
        templateOnly()
      );

      this.renderComponent(Root);
      assertHTML('rrrr');

      assert.deepEqual(
        observed,
        ['none', 'light', 'dark', 'light'],
        'each Reader sees the nearest enclosing provider, falling back to undefined at the root'
      );
    }
  }
);
