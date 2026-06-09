import { RenderingTestCase, moduleFor, runTask } from 'internal-test-helpers';
import { setComponentTemplate } from '@glimmer/manager';
import { Component } from '@ember/-internals/glimmer';
import { precompileTemplate } from '@ember/template-compilation';
import { set } from '@ember/object';
import { action } from '@ember/object';
import { getOwner } from '@ember/owner';

moduleFor(
  'Helpers test: default helper manager',
  class extends RenderingTestCase {
    '@test plain functions can be used as helpers'() {
      function hello() {
        return 'hello';
      }

      this.render('{{(this.hello)}}', {
        hello,
      });
      this.assertText('hello');

      runTask(() => this.rerender());
      this.assertText('hello');
    }

    '@test positional arguments are passed as function arguments'(assert) {
      function hello(...args) {
        assert.deepEqual(args, [1, 2, 3]);
        return args.length;
      }

      this.render('{{(this.hello 1 2 3)}}', {
        hello,
      });
      this.assertText('3');
    }

    '@test tracks changes to positional arguments'(assert) {
      let count = 0;

      function hello(firstArgument) {
        count++;
        return firstArgument;
      }

      this.render('{{(this.hello this.foo)}}', {
        hello,
        foo: 123,
      });

      assert.strictEqual(count, 1, 'rendered once');
      this.assertText('123');

      runTask(() => this.rerender());
      assert.equal(count, 1, 'rendered once');
      this.assertText('123');

      runTask(() => set(this.context, 'foo', 456));

      assert.equal(count, 2, 'rendered twice');
      this.assertText('456');
    }

    '@test named arguments are passed as the last function argument'(assert) {
      function hello(positional, named) {
        assert.strictEqual(positional, 'foo');

        return named.foo;
      }

      this.render('{{(this.hello "foo" foo="bar")}}', {
        hello,
      });
      this.assertText('bar');
    }

    '@test tracks changes to named arguments'(assert) {
      let count = 0;

      function hello(named) {
        count++;
        return named.foo;
      }

      this.render('{{(this.hello foo=this.foo)}}', {
        hello,
        foo: 123,
      });

      assert.strictEqual(count, 1, 'rendered once');
      this.assertText('123');

      runTask(() => this.rerender());
      assert.equal(count, 1, 'rendered once');
      this.assertText('123');

      runTask(() => set(this.context, 'foo', 456));

      assert.equal(count, 2, 'rendered twice');
      this.assertText('456');
    }

    '@test plain functions passed as component arguments can be used as helpers'() {
      function hello() {
        return 'hello';
      }

      this.owner.register(
        'component:foo-bar',
        setComponentTemplate(precompileTemplate('{{(@hello)}}'), class extends Component {})
      );

      this.render(`<FooBar @hello={{this.hello}} />`, {
        hello,
      });
      this.assertText('hello');
    }

    '@test plain functions stored as class properties can be used as helpers'() {
      this.owner.register(
        'component:foo-bar',
        setComponentTemplate(
          precompileTemplate('{{(this.hello)}}'),
          class extends Component {
            hello = () => {
              return 'hello';
            };
          }
        )
      );

      this.render(`<FooBar />`);
      this.assertText('hello');
    }

    '@test class methods can be used as helpers'() {
      this.owner.register(
        'component:foo-bar',
        setComponentTemplate(
          precompileTemplate('{{(this.hello)}}'),
          class extends Component {
            hello() {
              return 'hello';
            }
          }
        )
      );

      this.render(`<FooBar />`);
      this.assertText('hello');
    }

    '@test actions can be used as helpers'() {
      this.owner.register(
        'component:foo-bar',
        setComponentTemplate(
          precompileTemplate('{{(this.hello)}}'),
          class extends Component {
            someProperty = 'hello';

            @action
            hello() {
              return this.someProperty;
            }
          }
        )
      );

      this.render(`<FooBar />`);
      this.assertText('hello');
    }

    '@test getOwner() with no arguments returns the owner inside a plain function helper'(assert) {
      let captured = 'NOT_SET';

      function whoOwnsMe() {
        captured = getOwner();
        return 'rendered';
      }

      this.render('{{(this.whoOwnsMe)}}', { whoOwnsMe });

      this.assertText('rendered');
      assert.strictEqual(captured, this.owner, 'getOwner() returned the rendering owner');
    }

    '@test getOwner() with no arguments works in a function helper passed as an argument'(assert) {
      let captured = 'NOT_SET';

      function whoOwnsMe() {
        captured = getOwner();
        return 'rendered';
      }

      this.owner.register(
        'component:foo-bar',
        setComponentTemplate(precompileTemplate('{{(@whoOwnsMe)}}'), class extends Component {})
      );

      this.render(`<FooBar @whoOwnsMe={{this.whoOwnsMe}} />`, { whoOwnsMe });

      this.assertText('rendered');
      assert.strictEqual(captured, this.owner, 'getOwner() returned the rendering owner');
    }

    '@test getOwner() is undefined outside a helper and the ambient is restored afterward'(assert) {
      assert.strictEqual(getOwner(), undefined, 'no ambient owner before rendering');

      let captured = 'NOT_SET';
      let whoOwnsMe = () => {
        captured = getOwner();
        return 'rendered';
      };

      this.render('{{(this.whoOwnsMe)}}', { whoOwnsMe });
      this.assertText('rendered');

      assert.strictEqual(captured, this.owner, 'the helper saw the rendering owner');
      assert.strictEqual(getOwner(), undefined, 'ambient owner cleared again after the helper ran');
    }
  }
);
