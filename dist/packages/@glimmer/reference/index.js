import { setProp, getProp, toIterator, getPath } from '../global-context/index.js';
import { isDict, EMPTY_ARRAY, isIndexable } from '../util/index.js';
import { CONSTANT_TAG, validateTag, track, valueForTag, INITIAL, createTag, dirtyTag as DIRTY_TAG, consumeTag } from '../validator/index.js';
import { isDevelopingApp } from '@embroider/macros';

const REFERENCE = Symbol("REFERENCE");
class ReferenceImpl {
  constructor(type) {
    this.tag = null, this.lastRevision = INITIAL, this.children = null, this.compute = null, this.update = null, this[REFERENCE] = type;
  }
}
function createPrimitiveRef(value) {
  const ref = new ReferenceImpl(2);
  return ref.tag = CONSTANT_TAG, ref.lastValue = value, isDevelopingApp() && (ref.debugLabel = String(value)), ref;
}
const UNDEFINED_REFERENCE = createPrimitiveRef(void 0),
  NULL_REFERENCE = createPrimitiveRef(null),
  TRUE_REFERENCE = createPrimitiveRef(true),
  FALSE_REFERENCE = createPrimitiveRef(false);
function createConstRef(value, debugLabel) {
  const ref = new ReferenceImpl(0);
  return ref.lastValue = value, ref.tag = CONSTANT_TAG, isDevelopingApp() && (ref.debugLabel = debugLabel), ref;
}
function createUnboundRef(value, debugLabel) {
  const ref = new ReferenceImpl(2);
  return ref.lastValue = value, ref.tag = CONSTANT_TAG, isDevelopingApp() && (ref.debugLabel = debugLabel), ref;
}
function createComputeRef(compute, update = null, debugLabel = "unknown") {
  const ref = new ReferenceImpl(1);
  return ref.compute = compute, ref.update = update, isDevelopingApp() && (ref.debugLabel = `(result of a \`${debugLabel}\` helper)`), ref;
}
function createReadOnlyRef(ref) {
  return isUpdatableRef(ref) ? createComputeRef(() => valueForRef(ref), null, ref.debugLabel) : ref;
}
function isInvokableRef(ref) {
  return 3 === ref[REFERENCE];
}
function createInvokableRef(inner) {
  const ref = createComputeRef(() => valueForRef(inner), value => updateRef(inner, value));
  return ref.debugLabel = inner.debugLabel, ref[REFERENCE] = 3, ref;
}
function isConstRef(_ref) {
  return _ref.tag === CONSTANT_TAG;
}
function isUpdatableRef(_ref) {
  return null !== _ref.update;
}
function valueForRef(_ref) {
  const ref = _ref;
  let {
    tag: tag
  } = ref;
  if (tag === CONSTANT_TAG) return ref.lastValue;
  const {
    lastRevision: lastRevision
  } = ref;
  let lastValue;
  if (null !== tag && validateTag(tag, lastRevision)) lastValue = ref.lastValue;else {
    const {
        compute: compute
      } = ref,
      newTag = track(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
        lastValue = ref.lastValue = compute();
      }, isDevelopingApp() && ref.debugLabel);
    tag = ref.tag = newTag, ref.lastRevision = valueForTag(newTag);
  }
  return consumeTag(tag), lastValue;
}
function updateRef(_ref, value) {
  (0, _ref.update)(value);
}
function childRefFor(_parentRef, path) {
  const parentRef = _parentRef,
    type = parentRef[REFERENCE];
  let child,
    children = parentRef.children;
  if (null === children) children = parentRef.children = new Map();else {
    const next = children.get(path);
    if (next) return next;
  }
  if (2 === type) {
    const parent = valueForRef(parentRef);
    child = isDict(parent) ? createUnboundRef(parent[path], isDevelopingApp() && `${parentRef.debugLabel}.${path}`) : UNDEFINED_REFERENCE;
  } else child = createComputeRef(() => {
    const parent = valueForRef(parentRef);
    if (isDict(parent)) return getProp(parent, path);
  }, val => {
    const parent = valueForRef(parentRef);
    if (isDict(parent)) return setProp(parent, path, val);
  }), isDevelopingApp() && (child.debugLabel = `${parentRef.debugLabel}.${path}`);
  return children.set(path, child), child;
}
function childRefFromParts(root, parts) {
  let reference = root;
  for (const part of parts) reference = childRefFor(reference, part);
  return reference;
}
let createDebugAliasRef;
isDevelopingApp() && (createDebugAliasRef = (debugLabel, inner) => {
  const ref = createComputeRef(() => valueForRef(inner), isUpdatableRef(inner) ? value => updateRef(inner, value) : null);
  return ref[REFERENCE] = inner[REFERENCE], ref.debugLabel = debugLabel, ref;
});
const NULL_IDENTITY = {},
  KEY = (_, index) => index,
  INDEX = (_, index) => String(index),
  IDENTITY = item => null === item ? NULL_IDENTITY : item;
class WeakMapWithPrimitives {
  get weakMap() {
    return void 0 === this._weakMap && (this._weakMap = new WeakMap()), this._weakMap;
  }
  get primitiveMap() {
    return void 0 === this._primitiveMap && (this._primitiveMap = new Map()), this._primitiveMap;
  }
  set(key, value) {
    isIndexable(key) ? this.weakMap.set(key, value) : this.primitiveMap.set(key, value);
  }
  get(key) {
    return isIndexable(key) ? this.weakMap.get(key) : this.primitiveMap.get(key);
  }
}
const IDENTITIES = new WeakMapWithPrimitives();

/**
 * When iterating over a list, it's possible that an item with the same unique
 * key could be encountered twice:
 *
 * ```js
 * let arr = ['same', 'different', 'same', 'same'];
 * ```
 *
 * In general, we want to treat these items as _unique within the list_. To do
 * this, we track the occurences of every item as we iterate the list, and when
 * an item occurs more than once, we generate a new unique key just for that
 * item, and that occurence within the list. The next time we iterate the list,
 * and encounter an item for the nth time, we can get the _same_ key, and let
 * Glimmer know that it should reuse the DOM for the previous nth occurence.
 */
function uniqueKeyFor(keyFor) {
  let seen = new WeakMapWithPrimitives();
  return (value, memo) => {
    let key = keyFor(value, memo),
      count = seen.get(key) || 0;
    return seen.set(key, count + 1), 0 === count ? key : function (value, count) {
      let identities = IDENTITIES.get(value);
      void 0 === identities && (identities = [], IDENTITIES.set(value, identities));
      let identity = identities[count];
      return void 0 === identity && (identity = {
        value: value,
        count: count
      }, identities[count] = identity), identity;
    }(key, count);
  };
}
function createIteratorRef(listRef, key) {
  return createComputeRef(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let iterable = valueForRef(listRef),
      keyFor = function (key) {
        switch (key) {
          case "@key":
            return uniqueKeyFor(KEY);
          case "@index":
            return uniqueKeyFor(INDEX);
          case "@identity":
            return uniqueKeyFor(IDENTITY);
          default:
            return function (path) {
              if (isDevelopingApp() && "@" === path[0]) throw new Error(`invalid keypath: '${path}', valid keys: @index, @identity, or a path`);
              return uniqueKeyFor(item => getPath(item, path));
            }(key);
        }
      }(key);
    if (Array.isArray(iterable)) return new ArrayIterator(iterable, keyFor);
    let maybeIterator = toIterator(iterable);
    return null === maybeIterator ? new ArrayIterator(EMPTY_ARRAY, () => null) : new IteratorWrapper(maybeIterator, keyFor);
  });
}
function createIteratorItemRef(_value) {
  let value = _value,
    tag = createTag();
  return createComputeRef(() => (consumeTag(tag), value), newValue => {
    value !== newValue && (value = newValue, DIRTY_TAG(tag));
  });
}
class IteratorWrapper {
  constructor(inner, keyFor) {
    this.inner = inner, this.keyFor = keyFor;
  }
  isEmpty() {
    return this.inner.isEmpty();
  }
  next() {
    let nextValue = this.inner.next();
    return null !== nextValue && (nextValue.key = this.keyFor(nextValue.value, nextValue.memo)), nextValue;
  }
}
class ArrayIterator {
  constructor(iterator, keyFor) {
    this.iterator = iterator, this.keyFor = keyFor, this.pos = 0, 0 === iterator.length ? this.current = {
      kind: "empty"
    } : this.current = {
      kind: "first",
      value: iterator[this.pos]
    };
  }
  isEmpty() {
    return "empty" === this.current.kind;
  }
  next() {
    let value,
      current = this.current;
    if ("first" === current.kind) this.current = {
      kind: "progress"
    }, value = current.value;else {
      if (this.pos >= this.iterator.length - 1) return null;
      value = this.iterator[++this.pos];
    }
    let {
      keyFor: keyFor
    } = this;
    return {
      key: keyFor(value, this.pos),
      value: value,
      memo: this.pos
    };
  }
}

export { FALSE_REFERENCE, NULL_REFERENCE, REFERENCE, TRUE_REFERENCE, UNDEFINED_REFERENCE, childRefFor, childRefFromParts, createComputeRef, createConstRef, createDebugAliasRef, createInvokableRef, createIteratorItemRef, createIteratorRef, createPrimitiveRef, createReadOnlyRef, createUnboundRef, isConstRef, isInvokableRef, isUpdatableRef, updateRef, valueForRef };
