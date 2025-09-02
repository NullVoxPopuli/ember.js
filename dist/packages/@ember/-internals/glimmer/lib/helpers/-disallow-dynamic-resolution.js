import '../../../../debug/index.js';
import { valueForRef, createComputeRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

/**
@module ember
*/
const disallowDynamicResolution = internalHelper(({
  positional,
  named
}) => {
  const nameOrValueRef = positional[0];
  (isDevelopingApp() && !(positional.length === 1 && nameOrValueRef) && assert(`[BUG] wrong number of positional arguments, expecting 1, got ${positional.length}`, positional.length === 1 && nameOrValueRef));
  let typeRef = named['type'];
  let locRef = named['loc'];
  let originalRef = named['original'];
  (isDevelopingApp() && !(typeRef) && assert(`[BUG] expecting \`type\` named argument`, typeRef));
  (isDevelopingApp() && !(locRef) && assert(`[BUG] expecting \`loc\` named argument`, locRef));
  (isDevelopingApp() && !(originalRef) && assert(`[BUG] expecting \`original\` named argument`, originalRef)); // Bug: why do these fail?
  // assert('[BUG] expecting a string literal for the `type` argument', isConstRef(typeRef));
  // assert('[BUG] expecting a string literal for the `loc` argument', isConstRef(locRef));
  // assert('[BUG] expecting a string literal for the `original` argument', isConstRef(originalRef));
  const type = valueForRef(typeRef);
  const loc = valueForRef(locRef);
  const original = valueForRef(originalRef);
  (isDevelopingApp() && !(typeof type === 'string') && assert('[BUG] expecting a string literal for the `type` argument', typeof type === 'string'));
  (isDevelopingApp() && !(typeof loc === 'string') && assert('[BUG] expecting a string literal for the `loc` argument', typeof loc === 'string'));
  (isDevelopingApp() && !(typeof original === 'string') && assert('[BUG] expecting a string literal for the `original` argument', typeof original === 'string'));
  return createComputeRef(() => {
    let nameOrValue = valueForRef(nameOrValueRef);
    (isDevelopingApp() && !(typeof nameOrValue !== 'string') && assert(`Passing a dynamic string to the \`(${type})\` keyword is disallowed. ` + `(You specified \`(${type} ${original})\` and \`${original}\` evaluated into "${nameOrValue}".) ` + `This ensures we can statically analyze the template and determine which ${type}s are used. ` + `If the ${type} name is always the same, use a string literal instead, i.e. \`(${type} "${nameOrValue}")\`. ` + `Otherwise, import the ${type}s into JavaScript and pass them directly. ` + 'See https://github.com/emberjs/rfcs/blob/master/text/0496-handlebars-strict-mode.md#4-no-dynamic-resolution for details. ' + loc, typeof nameOrValue !== 'string'));
    return nameOrValue;
  });
});

export { disallowDynamicResolution as default };
