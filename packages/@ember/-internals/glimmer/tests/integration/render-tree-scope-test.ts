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
 * The bulk of the substantive scenarios here are ported from
 * `customerio/ember-provide-consume-context`'s test suite -- the prior-art
 * implementation that NullVoxPopuli called out in the RFC. The intent is
 * to pin down the *same behaviors* that production users of that library
 * rely on (sibling isolation, conditionals, reactivity to value changes,
 * etc.), translated to the makeContext API where:
 *
 *   - The string `@key=` becomes a closure-captured `makeContext` identity.
 *   - `<ContextProvider>` becomes `<myContext.Provide>` (optionally with
 *     `@value=`).
 *   - `<ContextConsumer>` becomes `(myContext.consume)` (a function
 *     helper) or `myContext.consume()` in JS.
 *
 * Where the two APIs intentionally diverge (e.g. EPCC's `getContext`
 * returns `undefined` for missing context, whereas makeContext throws per
 * NVP's "reduce harm" clarification), the test is rewritten to assert the
 * makeContext behavior.
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
  'RFC #1154 -- makeContext: API surface',
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
  }
);

/**
 * The "real-world scenarios" suite, ported from
 * ember-provide-consume-context's
 * tests/integration/components/built-in-components-test.ts.
 */
moduleFor(
  'RFC #1154 -- makeContext: behavior ported from ember-provide-consume-context',
  class extends MakeContextTestCase {
    afterEach() {
      runDestroy(this);
    }

    '@test a consumer can read context'(assert: QUnit['assert']) {
      const ctx = makeContext(() => '5');

      let Root = setComponentTemplate(
        precompileTemplate(
          '<ctx.Provide>{{#let (ctx.consume) as |v|}}<div id="content">{{v}}</div>{{/let}}</ctx.Provide>',
          { strictMode: true, scope: () => ({ ctx }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '5');
    }

    '@test a consumer reads from the closest provider'(assert: QUnit['assert']) {
      const ctx = makeContext(() => '0');

      let Root = setComponentTemplate(
        precompileTemplate(
          [
            '<ctx.Provide @value="1">',
            '  {{#let (ctx.consume) as |v|}}<div id="content-1">{{v}}</div>{{/let}}',
            '  <ctx.Provide @value="2">',
            '    {{#let (ctx.consume) as |v|}}<div id="content-2">{{v}}</div>{{/let}}',
            '  </ctx.Provide>',
            '</ctx.Provide>',
          ].join('\n'),
          { strictMode: true, scope: () => ({ ctx }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content-1')?.textContent, '1');
      assert.strictEqual(this.element.querySelector('#content-2')?.textContent, '2');
    }

    "@test consumer's value updates when @value changes"(assert: QUnit['assert']) {
      class State {
        @tracked count = 1;
      }
      const state = new State();
      const ctx = makeContext(() => 0);

      let Root = setComponentTemplate(
        precompileTemplate(
          '<ctx.Provide @value={{state.count}}>{{#let (ctx.consume) as |v|}}<div id="content">{{v}}</div>{{/let}}</ctx.Provide>',
          { strictMode: true, scope: () => ({ ctx, state }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '1');

      run(() => {
        state.count = 2;
      });
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '2');
    }

    "@test a consumer can't access a context it isn't nested in"(assert: QUnit['assert']) {
      const ctxA = makeContext(() => 'missing');
      const ctxB = makeContext(() => 'missing');

      let error: Error | undefined;
      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          try {
            ctxA.consume();
          } catch (e) {
            error = e as Error;
          }
        }
      }
      setComponentTemplate(precompileTemplate('done'), Reader);

      // Outer is ctxA (left subtree) and ctxB (right subtree); Reader is
      // under ctxB, so a consume for ctxA should throw -- they don't bleed.
      let Root = setComponentTemplate(
        precompileTemplate(
          '<ctxA.Provide @value="A"></ctxA.Provide><ctxB.Provide @value="B"><Reader/></ctxB.Provide>',
          { strictMode: true, scope: () => ({ ctxA, ctxB, Reader }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);

      assert.ok(error, 'consume() raised for non-enclosing context');
      assert.ok(
        /No matching `<Provide>`/.test(error?.message ?? ''),
        `error mentions missing provider, got: ${error?.message}`
      );
    }

    '@test sibling Provides with the same context do not bleed'(assert: QUnit['assert']) {
      const ctx = makeContext(() => 'default');

      let Root = setComponentTemplate(
        precompileTemplate(
          [
            '<ctx.Provide @value="1">{{#let (ctx.consume) as |v|}}<div id="content-1">{{v}}</div>{{/let}}</ctx.Provide>',
            '<ctx.Provide @value="2">{{#let (ctx.consume) as |v|}}<div id="content-2">{{v}}</div>{{/let}}</ctx.Provide>',
          ].join('\n'),
          { strictMode: true, scope: () => ({ ctx }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content-1')?.textContent, '1');
      assert.strictEqual(this.element.querySelector('#content-2')?.textContent, '2');
    }

    '@test consumer is reactive across an {{#if}} that toggles it on and off'(
      assert: QUnit['assert']
    ) {
      class State {
        @tracked count = 1;
        @tracked hidden = false;
      }
      const state = new State();
      const ctx = makeContext(() => 0);

      let Root = setComponentTemplate(
        precompileTemplate(
          [
            '<ctx.Provide @value={{state.count}}>',
            '  {{#unless state.hidden}}',
            '    {{#let (ctx.consume) as |v|}}<div id="content">{{v}}</div>{{/let}}',
            '  {{/unless}}',
            '</ctx.Provide>',
          ].join('\n'),
          { strictMode: true, scope: () => ({ ctx, state }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '1', 'initial');

      run(() => {
        state.hidden = true;
      });
      assert.strictEqual(this.element.querySelector('#content'), null, 'hidden');

      run(() => {
        state.hidden = false;
      });
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '1', 'back to "1"');

      run(() => {
        state.hidden = true;
      });
      run(() => {
        state.count = 2;
      });
      run(() => {
        state.hidden = false;
      });
      assert.strictEqual(
        this.element.querySelector('#content')?.textContent,
        '2',
        'consumer reflects updated count when toggled back on'
      );
    }

    '@test a conditional <Provide> tears down and re-instates correctly'(assert: QUnit['assert']) {
      class State {
        @tracked hidden = false;
      }
      const state = new State();
      const ctx = makeContext(() => 'default');

      let Root = setComponentTemplate(
        precompileTemplate(
          [
            '{{#unless state.hidden}}',
            '  <ctx.Provide @value="1">{{#let (ctx.consume) as |v|}}<div id="content">{{v}}</div>{{/let}}</ctx.Provide>',
            '{{/unless}}',
          ].join('\n'),
          { strictMode: true, scope: () => ({ ctx, state }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '1');

      run(() => {
        state.hidden = true;
      });
      assert.strictEqual(this.element.querySelector('#content'), null);

      run(() => {
        state.hidden = false;
      });
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '1');
    }

    '@test a conditional sibling <Provide> does not override an outer one'(
      assert: QUnit['assert']
    ) {
      class State {
        @tracked hidden = true;
      }
      const state = new State();
      const ctx = makeContext(() => 'default');

      // The inner ctx.Provide @value="2" is in a sibling subtree of the
      // consumer, so it must never override the outer @value="1".
      let Root = setComponentTemplate(
        precompileTemplate(
          [
            '<ctx.Provide @value="1">',
            '  {{#unless state.hidden}}',
            '    <ctx.Provide @value="2"></ctx.Provide>',
            '  {{/unless}}',
            '  {{#let (ctx.consume) as |v|}}<div id="content">{{v}}</div>{{/let}}',
            '</ctx.Provide>',
          ].join('\n'),
          { strictMode: true, scope: () => ({ ctx, state }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '1');

      run(() => {
        state.hidden = false;
      });
      assert.strictEqual(
        this.element.querySelector('#content')?.textContent,
        '1',
        'sibling provider does not override outer'
      );

      run(() => {
        state.hidden = true;
      });
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '1');
    }

    '@test multiple distinct contexts can be nested'(assert: QUnit['assert']) {
      const ctxOne = makeContext(() => '0');
      const ctxTwo = makeContext(() => '0');

      let Root = setComponentTemplate(
        precompileTemplate(
          [
            '<ctxOne.Provide @value="1">',
            '  <ctxTwo.Provide @value="2">',
            '    {{#let (ctxOne.consume) as |a|}}<div id="content-1">{{a}}</div>{{/let}}',
            '    {{#let (ctxTwo.consume) as |b|}}<div id="content-2">{{b}}</div>{{/let}}',
            '  </ctxTwo.Provide>',
            '</ctxOne.Provide>',
          ].join('\n'),
          { strictMode: true, scope: () => ({ ctxOne, ctxTwo }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content-1')?.textContent, '1');
      assert.strictEqual(this.element.querySelector('#content-2')?.textContent, '2');
    }

    '@test @tracked state on a factory-provided class instance is reactive'(
      assert: QUnit['assert']
    ) {
      class Counter {
        @tracked count = 0;
      }
      // Capture the instance via the factory itself -- the factory runs
      // exactly once per <Provide>, so this avoids needing a separate
      // capturing component.
      let captured: Counter | undefined;
      const counter = makeContext(() => {
        const c = new Counter();
        captured = c;
        return c;
      });

      let Root = setComponentTemplate(
        precompileTemplate(
          '<counter.Provide>{{#let (counter.consume) as |c|}}<div id="content">{{c.count}}</div>{{/let}}</counter.Provide>',
          { strictMode: true, scope: () => ({ counter }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '0');
      assert.ok(captured, 'factory produced the instance');

      run(() => {
        captured!.count = 5;
      });
      assert.strictEqual(this.element.querySelector('#content')?.textContent, '5');
    }

    '@test consumer at component-instance init time sees the nearest provider'(
      assert: QUnit['assert']
    ) {
      // Mirrors EPCC's "a consumer can read context during initialization":
      // when the consumer is a class component, its constructor should see
      // the enclosing provider's value (not throw, not see a stale one).
      const ctx = makeContext(() => 'wrong');

      let observed: string | undefined;
      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          observed = ctx.consume() as string;
        }
      }
      setComponentTemplate(precompileTemplate('done'), Reader);

      let Root = setComponentTemplate(
        precompileTemplate('<ctx.Provide @value="provided"><Reader/></ctx.Provide>', {
          strictMode: true,
          scope: () => ({ ctx, Reader }),
        }),
        templateOnly()
      );

      this.renderComponent(Root);
      assert.strictEqual(observed, 'provided');
    }

    '@test factory-provided value is stable across the same Provide re-render'(
      assert: QUnit['assert']
    ) {
      // EPCC analogue: providing a class instance preserves identity. If a
      // sibling tracked re-render happens, the same instance should be
      // re-yielded -- not a new one. This is important for downstream code
      // that uses identity (e.g. caching, refs).
      class State {
        @tracked tick = 0;
      }
      const state = new State();

      let count = 0;
      const ctx = makeContext(() => ({ id: count++ }));

      let observed: object[] = [];
      class Reader extends GlimmerishComponent {
        constructor(owner: Owner, args: Record<string, unknown>) {
          super(owner, args);
          observed.push(ctx.consume() as object);
        }
      }
      setComponentTemplate(precompileTemplate(''), Reader);

      let Root = setComponentTemplate(
        precompileTemplate(
          // The bare {{state.tick}} consumes the tracked tag so toggling it
          // forces the surrounding region to re-render, but the <Provide>
          // itself doesn't re-instantiate the factory.
          '<ctx.Provide>{{state.tick}}<Reader/></ctx.Provide>',
          { strictMode: true, scope: () => ({ ctx, state, Reader }) }
        ),
        templateOnly()
      );

      this.renderComponent(Root);
      const first = observed[0];
      assert.ok(first, 'reader observed the value once');

      run(() => {
        state.tick = 1;
      });

      // Reader's constructor only fires once -- so we don't get a second
      // observed entry. The real guarantee here is that the factory only
      // ran once: `count` must be 1.
      assert.strictEqual(count, 1, 'factory was not re-invoked on parent re-render');
    }
  }
);
