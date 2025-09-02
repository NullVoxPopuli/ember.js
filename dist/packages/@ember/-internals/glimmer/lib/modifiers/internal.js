import { setOwner } from '../../../owner/index.js';
import { g as guidFor } from '../../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import { isDevelopingApp } from '@embroider/macros';
import '../../../../debug/index.js';
import { registerDestructor } from '../../../../../@glimmer/destroyable/index.js';
import { valueForRef } from '../../../../../@glimmer/reference/index.js';
import { assert } from '../../../../debug/lib/assert.js';

class InternalModifier {
  // Override this
  static toString() {
    return 'internal modifier';
  }
  constructor(owner, element, args) {
    this.owner = owner;
    this.element = element;
    this.args = args;
    setOwner(this, owner);
  }
  install() {}
  remove() {}
  positional(index) {
    let ref = this.args.positional[index];
    return ref ? valueForRef(ref) : undefined;
  }
  named(key) {
    let ref = this.args.named[key];
    return ref ? valueForRef(ref) : undefined;
  }
  toString() {
    return `<${this.constructor.toString()}:${guidFor(this)}>`;
  }
}
function destructor(modifier) {
  modifier.remove();
}
class InternalModifierState {
  constructor(instance) {
    this.instance = instance;
  }
}
class InternalModifierManager {
  constructor(ModifierClass, name) {
    this.ModifierClass = ModifierClass;
    this.name = name;
  }
  create(owner, element, _definition, args) {
    (isDevelopingApp() && !(element instanceof HTMLElement) && assert('element must be an HTMLElement', element instanceof HTMLElement));
    let {
      ModifierClass
    } = this;
    let instance = new ModifierClass(owner, element, args);
    registerDestructor(instance, destructor);
    return new InternalModifierState(instance);
  }

  // not needed for now, but feel free to implement this
  getTag() {
    return null;
  }
  getDebugName() {
    return this.name;
  }
  install({
    instance
  }) {
    return instance.install();
  }

  // not needed for now, but feel free to implement this
  update() {
    (isDevelopingApp() && true && assert('update should never be called on an internal modifier'));
  }
  getDestroyable({
    instance
  }) {
    return instance;
  }
}

export { InternalModifierManager, InternalModifier as default };
