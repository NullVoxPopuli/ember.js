/**
@module ember
*/
import type { CapturedArguments } from '@glimmer/interfaces';
import { createReadOnlyRef } from '@glimmer/reference';
import { assert } from '@ember/debug';
import { internalHelper } from './internal-helper';

/**
  The `readonly` helper let's you specify that a binding is one-way only,
  instead of two-way.
  When you pass a `readonly` binding from an outer context (e.g. parent component),
  to to an inner context (e.g. child component), you are saying that changing that
  property in the inner context does not change the value in the outer context.

  To specify that a binding is read-only, when invoking the child `Component`:

  ```app/components/my-parent.js
  export default class MyParent extends Component {
    totalClicks = 3;
  }
  ```

  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} // -> 3
  <MyChild @childClickCount={{readonly totalClicks}} />
  ```
  ```
  {{my-child childClickCount=(readonly totalClicks)}}
  ```

  Now, when you update `childClickCount`:

  ```app/components/my-child.js
  export default class MyChild extends Component {
    click() {
      this.incrementProperty('childClickCount');
    }
  }
  ```

  The value updates in the child component, but not the parent component:

  ```app/templates/components/my-child.hbs
  {{log childClickCount}} //-> 4
  ```

  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} //-> 3
  <MyChild @childClickCount={{readonly totalClicks}} />
  ```
  or
  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} //-> 3
  {{my-child childClickCount=(readonly totalClicks)}}
  ```

  ### Objects and Arrays

  When passing a property that is a complex object (e.g. object, array) instead of a primitive object (e.g. number, string),
  only the reference to the object is protected using the readonly helper.
  This means that you can change properties of the object both on the parent component, as well as the child component.
  The `readonly` binding behaves similar to the `const` keyword in JavaScript.

  Let's look at an example:

  First let's set up the parent component:

  ```app/components/my-parent.js
  import Component from '@ember/component';

  export default class MyParent extends Component {
    clicks: null,

    init() {
      this._super(...arguments);
      this.set('clicks', { total: 3 });
    }
  }
  ```

  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 3
  <MyChild @childClicks={{readonly clicks}} />
  ```
  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 3
  {{my-child childClicks=(readonly clicks)}}
  ```

  Now, if you update the `total` property of `childClicks`:

  ```app/components/my-child.js
  import Component from '@ember/component';

  export default class MyChild extends Component {
    click() {
      this.get('clicks').incrementProperty('total');
    }
  }
  ```

  You will see the following happen:

  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 4
  <MyChild @childClicks={{readonly clicks}} />
  ```
  or
  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 4
  {{my-child childClicks=(readonly clicks)}}
  ```

  ```app/templates/components/my-child.hbs
  {{log childClicks.total}} //-> 4
  ```

  @method readonly
  @param {Object} [attr] the read-only attribute.
  @for Ember.Templates.helpers
  @private
*/
export default internalHelper(({ positional }: CapturedArguments) => {
  let firstArg = positional[0];
  assert('has first arg', firstArg);
  return createReadOnlyRef(firstArg);
});
