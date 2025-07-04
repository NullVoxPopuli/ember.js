import { moduleFor, RenderingTestCase, runTask } from 'internal-test-helpers';

import {
  subscribe as instrumentationSubscribe,
  reset as instrumentationReset,
} from '@ember/instrumentation';

import { Component } from '../../utils/helpers';

moduleFor(
  'Components compile instrumentation',
  class extends RenderingTestCase {
    constructor() {
      super(...arguments);

      this.resetEvents();

      instrumentationSubscribe('render.getComponentDefinition', {
        before: (name, timestamp, payload) => {
          if (payload.view !== this.component) {
            this.actual.before.push(payload);
          }
        },
        after: (name, timestamp, payload) => {
          if (payload.view !== this.component) {
            this.actual.after.push(payload);
          }
        },
      });
    }

    resetEvents() {
      this.expected = {
        before: [],
        after: [],
      };

      this.actual = {
        before: [],
        after: [],
      };
    }

    teardown() {
      this.assert.deepEqual(this.actual.before, [], 'No unexpected events (before)');
      this.assert.deepEqual(this.actual.after, [], 'No unexpected events (after)');
      super.teardown();
      instrumentationReset();
    }

    ['@test it should only receive an instrumentation event for initial render']() {
      let testCase = this;

      let BaseClass = class extends Component {
        tagName = '';

        willRender() {
          testCase.expected.before.push(this);
          testCase.expected.after.unshift(this);
        }
      };

      this.registerComponent('x-bar', {
        template: '[x-bar: {{this.bar}}]',
        ComponentClass: class extends BaseClass {},
      });

      this.render(`[-top-level: {{this.foo}}] {{x-bar bar=this.bar}}`, {
        foo: 'foo',
        bar: 'bar',
      });

      this.assertText('[-top-level: foo] [x-bar: bar]');

      this.assertEvents('after initial render');

      runTask(() => this.rerender());

      this.assertEvents('after no-op rerender');
    }

    assertEvents(label) {
      let { actual, expected } = this;
      this.assert.strictEqual(
        actual.before.length,
        actual.after.length,
        `${label}: before and after callbacks should be balanced`
      );

      this._assertEvents(`${label} (before):`, actual.before, expected.before);
      this._assertEvents(`${label} (after):`, actual.before, expected.before);

      this.resetEvents();
    }

    _assertEvents(label, actual, expected) {
      this.assert.equal(
        actual.length,
        expected.length,
        `${label}: expected ${expected.length} and got ${actual.length}`
      );

      actual.forEach((payload, i) => this.assertPayload(payload, expected[i]));
    }

    assertPayload(payload, component) {
      this.assert.equal(payload.object, component._debugContainerKey, 'payload.object');
    }
  }
);
