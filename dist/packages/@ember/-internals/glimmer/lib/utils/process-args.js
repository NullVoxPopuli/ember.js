import '../../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { isDevelopingApp } from '@embroider/macros';
import '../../../../debug/index.js';
import { MUTABLE_CELL } from '../../../views/lib/compat/attrs.js';
import '../../../views/lib/system/action_manager.js';
import '../../../views/lib/views/states.js';
import { valueForRef, isUpdatableRef, updateRef } from '../../../../../@glimmer/reference/index.js';
import { assert } from '../../../../debug/lib/assert.js';

function processComponentArgs(namedArgs) {
  let attrs = Object.create(null);
  let props = Object.create(null);
  for (let name in namedArgs) {
    let ref = namedArgs[name];
    (isDevelopingApp() && !(ref) && assert('expected ref', ref));
    let value = valueForRef(ref);
    if (isUpdatableRef(ref)) {
      attrs[name] = new MutableCell(ref, value);
    } else {
      attrs[name] = value;
    }
    props[name] = value;
  }
  props.attrs = attrs;
  return props;
}
const REF = Symbol('REF');
class MutableCell {
  value;
  [MUTABLE_CELL];
  [REF];
  constructor(ref, value) {
    this[MUTABLE_CELL] = true;
    this[REF] = ref;
    this.value = value;
  }
  update(val) {
    updateRef(this[REF], val);
  }
}

export { processComponentArgs };
