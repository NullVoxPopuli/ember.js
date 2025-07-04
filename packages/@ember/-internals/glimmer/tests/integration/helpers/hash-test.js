import { RenderingTestCase, defineComponent, moduleFor, runTask } from 'internal-test-helpers';

import { Component } from '../../utils/helpers';

import { set, computed } from '@ember/object';

moduleFor(
  'Helpers test: {{hash}}',
  class extends RenderingTestCase {
    ['@test returns a hash with the right key-value']() {
      this.render(`{{#let (hash name="Sergio") as |person|}}{{person.name}}{{/let}}`);

      this.assertText('Sergio');

      runTask(() => this.rerender());

      this.assertText('Sergio');
    }

    ['@test can be shadowed']() {
      let hash = (obj) =>
        Object.entries(obj)
          .map(([key, value]) => `hash:${key}=${value}`)
          .join(',');
      let Root = defineComponent(
        { hash, shadowHash: hash },
        `({{hash apple='red' banana='yellow'}}) ({{#let shadowHash as |hash|}}{{hash apple='green'}}{{/let}})`
      );

      this.renderComponent(Root, {
        expect: '(hash:apple=red,hash:banana=yellow) (hash:apple=green)',
      });
    }

    ['@test can have more than one key-value']() {
      this.render(
        `{{#let (hash name="Sergio" lastName="Arbeo") as |person|}}{{person.name}} {{person.lastName}}{{/let}}`
      );

      this.assertText('Sergio Arbeo');

      runTask(() => this.rerender());

      this.assertText('Sergio Arbeo');
    }

    ['@test binds values when variables are used']() {
      this.render(
        `{{#let (hash name=this.model.firstName lastName="Arbeo") as |person|}}{{person.name}} {{person.lastName}}{{/let}}`,
        {
          model: {
            firstName: 'Marisa',
          },
        }
      );

      this.assertText('Marisa Arbeo');

      runTask(() => this.rerender());

      this.assertText('Marisa Arbeo');

      runTask(() => set(this.context, 'model.firstName', 'Sergio'));

      this.assertText('Sergio Arbeo');

      runTask(() => set(this.context, 'model', { firstName: 'Marisa' }));

      this.assertText('Marisa Arbeo');
    }

    ['@test binds multiple values when variables are used']() {
      this.render(
        `{{#let (hash name=this.model.firstName lastName=this.model.lastName) as |person|}}{{person.name}} {{person.lastName}}{{/let}}`,
        {
          model: {
            firstName: 'Marisa',
            lastName: 'Arbeo',
          },
        }
      );

      this.assertText('Marisa Arbeo');

      runTask(() => this.rerender());

      this.assertText('Marisa Arbeo');

      runTask(() => set(this.context, 'model.firstName', 'Sergio'));

      this.assertText('Sergio Arbeo');

      runTask(() => set(this.context, 'model.lastName', 'Smith'));

      this.assertText('Sergio Smith');

      runTask(() =>
        set(this.context, 'model', {
          firstName: 'Marisa',
          lastName: 'Arbeo',
        })
      );

      this.assertText('Marisa Arbeo');
    }

    ['@test hash helpers can be nested']() {
      this.render(
        `{{#let (hash person=(hash name=this.model.firstName)) as |ctx|}}{{ctx.person.name}}{{/let}}`,
        {
          model: { firstName: 'Balint' },
        }
      );

      this.assertText('Balint');

      runTask(() => this.rerender());

      this.assertText('Balint');

      runTask(() => set(this.context, 'model.firstName', 'Chad'));

      this.assertText('Chad');

      runTask(() => set(this.context, 'model', { firstName: 'Balint' }));

      this.assertText('Balint');
    }

    ['@test should yield hash of internal properties']() {
      let fooBarInstance;
      let FooBarComponent = class extends Component {
        init() {
          super.init(...arguments);
          fooBarInstance = this;
          this.model = { firstName: 'Chad' };
        }
      };

      this.registerComponent('foo-bar', {
        ComponentClass: FooBarComponent,
        template: `{{yield (hash firstName=this.model.firstName)}}`,
      });

      this.render(`{{#foo-bar as |values|}}{{values.firstName}}{{/foo-bar}}`);

      this.assertText('Chad');

      runTask(() => this.rerender());

      this.assertText('Chad');

      runTask(() => set(fooBarInstance, 'model.firstName', 'Godfrey'));

      this.assertText('Godfrey');

      runTask(() => set(fooBarInstance, 'model', { firstName: 'Chad' }));

      this.assertText('Chad');
    }

    ['@test should yield hash of internal and external properties']() {
      let fooBarInstance;
      let FooBarComponent = class extends Component {
        init() {
          super.init(...arguments);
          fooBarInstance = this;
          this.model = { firstName: 'Chad' };
        }
      };

      this.registerComponent('foo-bar', {
        ComponentClass: FooBarComponent,
        template: `{{yield (hash firstName=this.model.firstName lastName=this.lastName)}}`,
      });

      this.render(
        `{{#foo-bar lastName=this.model.lastName as |values|}}{{values.firstName}} {{values.lastName}}{{/foo-bar}}`,
        {
          model: { lastName: 'Hietala' },
        }
      );

      this.assertText('Chad Hietala');

      runTask(() => this.rerender());

      this.assertText('Chad Hietala');

      runTask(() => {
        set(fooBarInstance, 'model.firstName', 'Godfrey');
        set(this.context, 'model.lastName', 'Chan');
      });

      this.assertText('Godfrey Chan');

      runTask(() => {
        set(fooBarInstance, 'model', { firstName: 'Chad' });
        set(this.context, 'model', { lastName: 'Hietala' });
      });

      this.assertText('Chad Hietala');
    }

    ['@test works with computeds']() {
      let FooBarComponent = class extends Component {
        @computed('hash.firstName', 'hash.lastName')
        get fullName() {
          return `${this.hash.firstName} ${this.hash.lastName}`;
        }
      };

      this.registerComponent('foo-bar', {
        ComponentClass: FooBarComponent,
        template: `{{this.fullName}}`,
      });

      this.render(`{{foo-bar hash=(hash firstName=this.firstName lastName=this.lastName)}}`, {
        firstName: 'Chad',
        lastName: 'Hietala',
      });

      this.assertText('Chad Hietala');

      runTask(() => this.rerender());

      this.assertText('Chad Hietala');

      runTask(() => {
        set(this.context, 'firstName', 'Godfrey');
        set(this.context, 'lastName', 'Chan');
      });

      this.assertText('Godfrey Chan');
    }
  }
);
