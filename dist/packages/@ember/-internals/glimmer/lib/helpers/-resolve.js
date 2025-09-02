import '../../../../debug/index.js';
import { isConstRef, valueForRef, createConstRef } from '../../../../../@glimmer/reference/index.js';
import { internalHelper } from './internal-helper.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

/**
  @module ember
*/

const resolve = internalHelper(({
  positional
}, owner) => {
  // why is this allowed to be undefined in the first place?
  (isDevelopingApp() && !(owner) && assert('[BUG] missing owner', owner));
  (isDevelopingApp() && !(positional.length === 1) && assert(`[BUG] wrong number of positional arguments, expecting 1, got ${positional.length}`, positional.length === 1));
  let fullNameRef = positional[0];
  (isDevelopingApp() && !(fullNameRef && isConstRef(fullNameRef)) && assert('[BUG] expecting a string literal as argument', fullNameRef && isConstRef(fullNameRef)));
  let fullName = valueForRef(fullNameRef);
  (isDevelopingApp() && !(typeof fullName === 'string') && assert('[BUG] expecting a string literal as argument', typeof fullName === 'string'));
  (isDevelopingApp() && !((s => s.split(':').length === 2)(fullName)) && assert('[BUG] expecting a valid full name', (s => s.split(':').length === 2)(fullName)));
  if (isDevelopingApp()) {
    let [type, name] = fullName.split(':');
    (isDevelopingApp() && !(owner.hasRegistration(fullName)) && assert(`Attempted to invoke \`(-resolve "${fullName}")\`, but ${name} was not a valid ${type} name.`, owner.hasRegistration(fullName)));
  }
  return createConstRef(owner.factoryFor(fullName)?.class, `(-resolve "${fullName}")`);
});

export { resolve as default };
