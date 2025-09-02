import '../../../../debug/index.js';
import { dasherize } from '../../../string/index.js';
import { createComputeRef, valueForRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

const normalizeClassHelper = internalHelper(({
  positional
}) => {
  return createComputeRef(() => {
    let classNameArg = positional[0];
    let valueArg = positional[1];
    (isDevelopingApp() && !(classNameArg && valueArg) && assert('expected at least two positional args', classNameArg && valueArg));
    let classNameParts = valueForRef(classNameArg).split('.');
    let className = classNameParts[classNameParts.length - 1];
    (isDevelopingApp() && !(className) && assert('has className', className)); // Always at least one split result
    let value = valueForRef(valueArg);
    if (value === true) {
      return dasherize(className);
    } else if (!value && value !== 0) {
      return '';
    } else {
      return String(value);
    }
  });
});

export { normalizeClassHelper as default };
