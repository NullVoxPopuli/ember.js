import { Meta } from '@ember/-internals/meta';
import { Descriptor } from './properties';

export default function descriptor(desc: PropertyDescriptor): NativeDescriptor {
  return new NativeDescriptor(desc);
}

/**
  A wrapper for a native ES5 descriptor. In an ideal world, we wouldn't need
  this at all, however, the way we currently flatten/merge our mixins require
  a special value to denote a descriptor.

  @class NativeDescriptor
  @private
*/
class NativeDescriptor extends Descriptor {
  desc: PropertyDescriptor;

  constructor(desc: PropertyDescriptor) {
    super();
    this.desc = desc;
    this.enumerable = desc.enumerable !== false;
    this.configurable = desc.configurable !== false;
  }

  setup(obj: object, key: string, meta: Meta): void {
    Object.defineProperty(obj, key, this.desc);
    meta.writeDescriptors(key, this);
  }

  get(obj: object, key: string): any {
    return obj[key];
  }

  set(obj: object, key: string, value: any): any {
    return (obj[key] = value);
  }
}

export function isComputedDescriptor(possibleDesc: unknown) {
  return possibleDesc !== null && typeof possibleDesc === 'object' && possibleDesc.isDescriptor;
}
