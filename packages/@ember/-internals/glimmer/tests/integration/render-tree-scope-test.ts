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
import { makeContext } from '../../lib/make-context';
import { tracked } from '@glimmer/tracking';
import type Owner from '@ember/owner';

/**
 * Coverage for `makeContext` (the user-facing API discussed in
 * https://github.com/emberjs/rfcs/pull/1154 -- NullVoxPopuli's
 * `makeContext(Klass)` proposal returning `{ Provide, consume }`).
 *
 * The tests below pin down the semantics that real consumers care about:
 *
 *   1. `<Context.Provide>` produces a fresh instance per render, which
 *      descendants can read via `context.consume()` or `(context.consume)`.
 *   2. `consume()` finds the *nearest* enclosing `<Provide>`.
 *   3. `consume()` throws when called outside a render OR when no provider
 *      is in the tree -- a missing provider is a bug, not a default.
 *   4. Each `<Provide>` has its own instance: providing the same class
 *      twice does not share state across providers.
 *   5. `@tracked` state on the provided value flows reactively to
 *      consumers.
 */

class MakeContextTestCase extends AbstractStrictTestCase {
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
  'RFC #1154 -- makeContext: render-tree-scoped context',
  class extends MakeContextTestCase {
    afterEach() {
      runDestroy(this);
    }

    '@test consume() throws if called outside of rendering'(assert: QUnit['assert']) {
      class Theme {
        color = 'dark';
      }
      const theme = makeContext(Theme);

      assert.throws(
        () => theme.consume(),
        /outside of rendering/,
        'consume() outside a render is rejected'
      );
    }

    '@test consume() throws when no <Provide> exists in the tree'(assert: QUnit['assert']) {
      class Theme {
        color = 'dark';
      }
      const theme = makeContext(Theme);

      let error: Error | undefined;
      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          try {
            theme.consume();
          } catch (e) {
            error = e as Error;
          }
        }
      }
      setComponentTemplate(precompileTemplate(''), Reader);

      let Root = setComponentTemplate(
        precompileTemplate('<Reader/>', {
          strictMode: true,
          scope: () => ({ Reader }),
        }),
        templateOnly()
      );

      this.renderComponent(Root);

      assert.ok(error, 'consume() raised');
      assert.ok(
        /No matching `<Provide>`/.test(error?.message ?? ''),
        `error mentions missing provider, got: ${error?.message}`
      );
    }

    '@test <Provide> + consume() returns the nearest enclosing instance'(assert: QUnit['assert']) {
      let id = 0;
      class Counter {
        id = id++;
      }
      const counter = makeContext(Counter);

      let seen: number[] = [];

      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          seen.push(counter.consume().id);
        }
      }
      setComponentTemplate(precompileTemplate('r'), Reader);

      let Root = setComponentTemplate(
        precompileTemplate(
          // Inner <Provide> shadows the outer one. Three readers, three
          // distinct provider scopes -- each should see the nearest.
          '<counter.Provide><Reader/><counter.Provide><Reader/></counter.Provide><Reader/></counter.Provide>',
          {
            strictMode: true,
            scope: () => ({ Reader, counter }),
          }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assertHTML('rrr');

      assert.deepEqual(
        seen,
        [0, 1, 0],
        'each Reader saw its nearest <Provide>: outer (id 0), inner (id 1), outer again (id 0)'
      );
    }

    '@test factory form: makeContext(() => value)'(assert: QUnit['assert']) {
      // Plain factory -- no class.
      let made = 0;
      const cfg = makeContext(() => {
        made++;
        return { label: 'hello' };
      });

      let observed: string | undefined;
      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          observed = cfg.consume().label;
        }
      }
      setComponentTemplate(precompileTemplate('r'), Reader);

      let Root = setComponentTemplate(
        precompileTemplate('<cfg.Provide><Reader/></cfg.Provide>', {
          strictMode: true,
          scope: () => ({ Reader, cfg }),
        }),
        templateOnly()
      );

      this.renderComponent(Root);

      assert.strictEqual(made, 1, 'factory ran exactly once');
      assert.strictEqual(observed, 'hello', 'consumer saw the factory-produced value');
    }

    '@test (context.consume) is usable as a template helper'(assert: QUnit['assert']) {
      class Theme {
        color = 'dark';
      }
      const theme = makeContext(Theme);

      let Root = setComponentTemplate(
        precompileTemplate(
          '<theme.Provide>{{#let (theme.consume) as |t|}}{{t.color}}{{/let}}</theme.Provide>',
          {
            strictMode: true,
            scope: () => ({ theme }),
          }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assertHTML('dark');
      assert.ok(true);
    }

    '@test @tracked state on the provided value is reactive'(assert: QUnit['assert']) {
      class Counter {
        @tracked count = 0;
      }
      const counter = makeContext(Counter);

      let captured: Counter | undefined;
      class Capture extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          captured = counter.consume();
        }
      }
      setComponentTemplate(precompileTemplate(''), Capture);

      let Root = setComponentTemplate(
        precompileTemplate(
          '<counter.Provide><Capture/>{{#let (counter.consume) as |c|}}{{c.count}}{{/let}}</counter.Provide>',
          {
            strictMode: true,
            scope: () => ({ Capture, counter }),
          }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assertHTML('0');

      assert.ok(captured, 'Capture observed the instance');
      run(() => {
        captured!.count = 5;
      });
      assertHTML('5');
    }
  }
);
