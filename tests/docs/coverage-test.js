'use strict';

const path = require('path');

QUnit.module('Docs coverage', function (hooks) {
  let docs, expected;
  hooks.before(function () {
    if (!process.env.REUSE_DOCS) {
      buildDocs();
    }
    docs = require(path.join(__dirname, '../../docs/data.json'));
    expected = require('./expected');
  });

  QUnit.module('classitems', function (hooks) {
    let docsItems, expectedItems;
    hooks.before(function () {
      docsItems = new Set(docs.classitems.map((item) => item.name).filter(Boolean));
      expectedItems = new Set(expected.classitems);
    });

    QUnit.test('No missing classitems', function (assert) {
      let missing = setDifference(expectedItems, docsItems);
      assert.emptySet(
        missing,
        'The following classitems are missing. If you intentionally removed a public API method, please update tests/docs/expected.js. Otherwise, documentation is missing, incorrectly formatted, or in a directory that is not watched by yuidoc. All files containing documentation must have a yuidoc class declaration.'
      );
    });

    QUnit.test('No extraneous classitems', function (assert) {
      let extraneous = setDifference(docsItems, expectedItems);
      assert.emptySet(
        extraneous,
        'The following classitems are unexpected. If you have added new features, please update tests/docs/expected.js and confirm that any public properties are marked both @public and @static to be included in the Ember API Docs viewer.'
      );
    });
  });

  QUnit.module('classes', function (hooks) {
    let docsItems, expectedItems;
    hooks.before(function () {
      docsItems = new Set(
        Object.values(docs.classes)
          .filter((item) => item?.access !== 'private' && !item.name.includes('@'))
          .map((item) => item.name)
      );
      expectedItems = new Set(expected.classes);
    });

    QUnit.test('No missing classes', function (assert) {
      let missing = setDifference(expectedItems, docsItems);
      assert.emptySet(
        missing,
        'The following classes are missing. If you intentionally removed a public API class, please update tests/docs/expected.js. Otherwise, documentation is missing, incorrectly formatted, or in a directory that is not watched by yuidoc. All files containing documentation must have a yuidoc class declaration.'
      );
    });

    QUnit.test('No extraneous classes', function (assert) {
      let extraneous = setDifference(docsItems, expectedItems);
      assert.emptySet(
        extraneous,
        'The following classes are unexpected. If you have added new classes, please update tests/docs/expected.js and confirm that any public properties are marked both @public and @static to be included in the Ember API Docs viewer.'
      );
    });
  });

  QUnit.module('modules (packages)', function (hooks) {
    let docsItems, expectedItems;
    hooks.before(function () {
      docsItems = new Set(
        Object.values(docs.modules)
          .filter((item) => item?.access !== 'private')
          .map((item) => item.name)
      );
      expectedItems = new Set(expected.modules);
    });

    QUnit.test('No missing modules (packages)', function (assert) {
      let missing = setDifference(expectedItems, docsItems);
      assert.emptySet(
        missing,
        'The following modules (packages) are missing. If you intentionally removed a public API module (package), please update tests/docs/expected.js. Otherwise, documentation is missing, incorrectly formatted, or in a directory that is not watched by yuidoc. All files containing documentation must have a yuidoc class declaration.'
      );
    });

    QUnit.test('No extraneous modules (packages)', function (assert) {
      let extraneous = setDifference(docsItems, expectedItems);
      assert.emptySet(
        extraneous,
        'The following modules (packages) are unexpected. If you have added new modules (packages), please update tests/docs/expected.js and confirm that any public properties are marked both @public and @static to be included in the Ember API Docs viewer.'
      );
    });
  });
});

function buildDocs() {
  let child = require('child_process');
  child.execFileSync('node', [require.resolve('ember-cli/bin/ember'), 'ember-cli-yuidoc'], {
    stdio: 'pipe',
  });
}

function setDifference(setA, setB) {
  let difference = new Set(setA);
  for (let elem of setB) {
    difference.delete(elem);
  }
  return difference;
}

QUnit.assert.emptySet = function assertEmptySet(value, message) {
  this.pushResult({
    result: value.size === 0,
    actual: Array.from(value).sort(),
    expected: [],
    message: message,
  });
};
