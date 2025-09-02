export {
  type ExtendedMethodDecorator,
  type DecoratorPropertyDescriptor,
  ComputedDescriptor,
  type ElementDescriptor,
  isElementDescriptor,
  nativeDescDecorator,
  descriptorForDecorator,
  descriptorForProperty,
  isClassicDecorator,
  setClassicDecorator,
} from './lib/decorator';
export { default as libraries, Libraries } from './lib/libraries';

export { tagForProperty, tagForObject, markObjectAsDirty } from './lib/tags';
export { tracked, TrackedDescriptor } from './lib/tracked';
export { cached } from './lib/cached';
export { createCache, getValue, isConst } from './lib/cache';

export {
  NAMESPACES,
  NAMESPACES_BY_ID,
  addNamespace,
  findNamespace,
  findNamespaces,
  processNamespace,
  processAllNamespaces,
  removeNamespace,
  isSearchDisabled as isNamespaceSearchDisabled,
  setSearchDisabled as setNamespaceSearchDisabled,
  setUnprocessedMixins,
} from './lib/namespace_search';
