import { scheduleRevalidate, assert } from '../global-context/index.js';
import { isDevelopingApp } from '@embroider/macros';

const debug = {};
if (isDevelopingApp()) {
  let CONSUMED_TAGS = null;
  const TRANSACTION_STACK = [],
    TRANSACTION_ENV = {
      debugMessage(obj, keyName) {
        let objName;
        return objName = "function" == typeof obj ? obj.name : "object" == typeof obj && null !== obj ? `(an instance of ${obj.constructor.name || "(unknown class)"})` : void 0 === obj ? "(an unknown tag)" : String(obj), `You attempted to update ${keyName ? `\`${keyName}\` on \`${objName}\`` : `\`${objName}\``}, but it had already been used previously in the same computation.  Attempting to update a value after using it in a computation can cause logical errors, infinite revalidation bugs, and performance issues, and is not supported.`;
      }
    };
  /////////
  debug.setTrackingTransactionEnv = env => Object.assign(TRANSACTION_ENV, env), debug.beginTrackingTransaction = _debugLabel => {
    CONSUMED_TAGS = CONSUMED_TAGS || new WeakMap();
    let debugLabel = _debugLabel || void 0,
      parent = TRANSACTION_STACK[TRANSACTION_STACK.length - 1] ?? null;
    TRANSACTION_STACK.push({
      parent: parent,
      debugLabel: debugLabel
    });
  }, debug.endTrackingTransaction = () => {
    if (0 === TRANSACTION_STACK.length) throw new Error("attempted to close a tracking transaction, but one was not open");
    TRANSACTION_STACK.pop(), 0 === TRANSACTION_STACK.length && (CONSUMED_TAGS = null);
  }, debug.resetTrackingTransaction = () => {
    let stack = "";
    return TRANSACTION_STACK.length > 0 && (stack = debug.logTrackingStack(TRANSACTION_STACK[TRANSACTION_STACK.length - 1])), TRANSACTION_STACK.splice(0, TRANSACTION_STACK.length), CONSUMED_TAGS = null, stack;
  },
  /**
  * Creates a global autotracking transaction. This will prevent any backflow
  * in any `track` calls within the transaction, even if they are not
  * externally consumed.
  *
  * `runInAutotrackingTransaction` can be called within itself, and it will add
  * onto the existing transaction if one exists.
  *
  * TODO: Only throw an error if the `track` is consumed.
  */
  debug.runInTrackingTransaction = (fn, debugLabel) => {
    debug.beginTrackingTransaction(debugLabel);
    let didError = true;
    try {
      let value = fn();
      return didError = !1, value;
    } finally {
      didError || debug.endTrackingTransaction();
      // if (id !== TRANSACTION_STACK.length) {
      //   throw new Error(
      //     `attempted to close a tracking transaction (${id}), but it was not the last transaction (${TRANSACTION_STACK.length})`
      //   );
      // }
    }
  };
  let nthIndex = (str, pattern, n, startingPos = -1) => {
      let i = startingPos;
      for (; n-- > 0 && i++ < str.length && (i = str.indexOf(pattern, i), !(i < 0)););
      return i;
    },
    makeTrackingErrorMessage = (transaction, obj, keyName) => {
      let message = [TRANSACTION_ENV.debugMessage(obj, keyName && String(keyName))];
      return message.push(`\`${String(keyName)}\` was first used:`), message.push(debug.logTrackingStack(transaction)), message.push("Stack trace for the update:"), message.join("\n\n");
    };
  debug.logTrackingStack = transaction => {
    let trackingStack = [],
      current = transaction || TRANSACTION_STACK[TRANSACTION_STACK.length - 1];
    if (void 0 === current) return "";
    for (; current;) current.debugLabel && trackingStack.unshift(current.debugLabel), current = current.parent;
    return trackingStack.map((label, index) => " ".repeat(2 * index) + label).join("\n");
  }, debug.markTagAsConsumed = _tag => {
    if (!CONSUMED_TAGS || CONSUMED_TAGS.has(_tag)) return;
    var list;
    CONSUMED_TAGS.set(_tag, 0 === (list = TRANSACTION_STACK).length ? void 0 : list[list.length - 1]);
    // We need to mark the tag and all of its subtags as consumed, so we need to
    // cast it and access its internals. In the future this shouldn't be necessary,
    // this is only for computed properties.
    let subtag = _tag.subtag;
    subtag && debug.markTagAsConsumed && (Array.isArray(subtag) ? subtag.forEach(debug.markTagAsConsumed) : debug.markTagAsConsumed(subtag));
  }, debug.assertTagNotConsumed = (tag, obj, keyName) => {
    if (null === CONSUMED_TAGS) return;
    let transaction = CONSUMED_TAGS.get(tag);
    var error;
    if (transaction)
      // This hack makes the assertion message nicer, we can cut off the first
      // few lines of the stack trace and let users know where the actual error
      // occurred.
      try {
        assert(!1, makeTrackingErrorMessage(transaction, obj, keyName));
      } catch (e) {
        if ("object" == typeof (error = e) && null !== error && "stack" in error && "string" == typeof error.stack) {
          let updateStackBegin = e.stack.indexOf("Stack trace for the update:");
          if (-1 !== updateStackBegin) {
            let start = nthIndex(e.stack, "\n", 1, updateStackBegin),
              end = nthIndex(e.stack, "\n", 4, updateStackBegin);
            // eslint-disable-next-line @typescript-eslint/no-deprecated -- @fixme
            e.stack = e.stack.substr(0, start) + e.stack.substr(end);
          }
        }
        throw e;
      }
  };
}
function unwrap(val) {
  if (null == val) throw new Error("Expected value to be present");
  return val;
}
const CONSTANT = 0,
  INITIAL = 1,
  VOLATILE = NaN;
let $REVISION = 1;
function bump() {
  $REVISION++;
}

//////////
const COMPUTE = Symbol("TAG_COMPUTE");

//////////
/**
 * `value` receives a tag and returns an opaque Revision based on that tag. This
 * snapshot can then later be passed to `validate` with the same tag to
 * determine if the tag has changed at all since the time that `value` was
 * called.
 *
 * @param tag
 */
function valueForTag(tag) {
  return tag[COMPUTE]();
}

/**
 * `validate` receives a tag and a snapshot from a previous call to `value` with
 * the same tag, and determines if the tag is still valid compared to the
 * snapshot. If the tag's state has changed at all since then, `validate` will
 * return false, otherwise it will return true. This is used to determine if a
 * calculation related to the tags should be rerun.
 *
 * @param tag
 * @param snapshot
 */
function validateTag(tag, snapshot) {
  return snapshot >= tag[COMPUTE]();
}

//////////
Reflect.set(globalThis, "COMPUTE_SYMBOL", COMPUTE);
const TYPE = Symbol("TAG_TYPE");

// this is basically a const
let ALLOW_CYCLES;
isDevelopingApp() && (ALLOW_CYCLES = new WeakMap());
class MonomorphicTagImpl {
  static combine(tags) {
    switch (tags.length) {
      case 0:
        return CONSTANT_TAG;
      case 1:
        return tags[0];
      default:
        {
          let tag = new MonomorphicTagImpl(2);
          return tag.subtag = tags, tag;
        }
    }
  }
  constructor(type) {
    this.revision = 1, this.lastChecked = 1, this.lastValue = 1, this.isUpdating = false, this.subtag = null, this.subtagBufferCache = null, this[TYPE] = type;
  }
  [COMPUTE]() {
    let {
      lastChecked: lastChecked
    } = this;
    if (this.isUpdating) {
      if (isDevelopingApp() && void 0 !== ALLOW_CYCLES && !ALLOW_CYCLES.has(this)) throw new Error("Cycles in tags are not allowed");
      this.lastChecked = ++$REVISION;
    } else if (lastChecked !== $REVISION) {
      this.isUpdating = true, this.lastChecked = $REVISION;
      try {
        let {
          subtag: subtag,
          revision: revision
        } = this;
        if (null !== subtag) if (Array.isArray(subtag)) for (const tag of subtag) {
          let value = tag[COMPUTE]();
          revision = Math.max(value, revision);
        } else {
          let subtagValue = subtag[COMPUTE]();
          subtagValue === this.subtagBufferCache ? revision = Math.max(revision, this.lastValue) : (
          // Clear the temporary buffer cache
          this.subtagBufferCache = null, revision = Math.max(revision, subtagValue));
        }
        this.lastValue = revision;
      } finally {
        this.isUpdating = false;
      }
    }
    return this.lastValue;
  }
  static updateTag(_tag, _subtag) {
    // catch bug by non-TS users
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (isDevelopingApp() && 1 !== _tag[TYPE]) throw new Error("Attempted to update a tag that was not updatable");
    // TODO: TS 3.7 should allow us to do this via assertion
    let tag = _tag,
      subtag = _subtag;
    subtag === CONSTANT_TAG ? tag.subtag = null : (
    // There are two different possibilities when updating a subtag:
    // 1. subtag[COMPUTE]() <= tag[COMPUTE]();
    // 2. subtag[COMPUTE]() > tag[COMPUTE]();
    // The first possibility is completely fine within our caching model, but
    // the second possibility presents a problem. If the parent tag has
    // already been read, then it's value is cached and will not update to
    // reflect the subtag's greater value. Next time the cache is busted, the
    // subtag's value _will_ be read, and it's value will be _greater_ than
    // the saved snapshot of the parent, causing the resulting calculation to
    // be rerun erroneously.
    // In order to prevent this, when we first update to a new subtag we store
    // its computed value, and then check against that computed value on
    // subsequent updates. If its value hasn't changed, then we return the
    // parent's previous value. Once the subtag changes for the first time,
    // we clear the cache and everything is finally in sync with the parent.
    tag.subtagBufferCache = subtag[COMPUTE](), tag.subtag = subtag);
  }
  static dirtyTag(tag, disableConsumptionAssertion) {
    if (isDevelopingApp() && 1 !== tag[TYPE] && 0 !== tag[TYPE]) throw new Error("Attempted to dirty a tag that was not dirtyable");
    isDevelopingApp() && true !== disableConsumptionAssertion &&
    // Usually by this point, we've already asserted with better error information,
    // but this is our last line of defense.
    unwrap(debug.assertTagNotConsumed)(tag), tag.revision = ++$REVISION, scheduleRevalidate();
  }
}
const DIRTY_TAG = MonomorphicTagImpl.dirtyTag,
  UPDATE_TAG = MonomorphicTagImpl.updateTag;

//////////
function createTag() {
  return new MonomorphicTagImpl(0);
}
function createUpdatableTag() {
  return new MonomorphicTagImpl(1);
}

//////////
const CONSTANT_TAG = new MonomorphicTagImpl(3);
function isConstTag(tag) {
  return tag === CONSTANT_TAG;
}

//////////
class VolatileTag {
  [COMPUTE]() {
    return NaN;
  }
  constructor() {
    this[TYPE] = 100;
  }
}
const VOLATILE_TAG = new VolatileTag();

//////////
class CurrentTag {
  [COMPUTE]() {
    return $REVISION;
  }
  constructor() {
    this[TYPE] = 101;
  }
}
const CURRENT_TAG = new CurrentTag(),
  combine = MonomorphicTagImpl.combine;

//////////
// Warm
let tag1 = createUpdatableTag(),
  tag2 = createUpdatableTag(),
  tag3 = createUpdatableTag();
valueForTag(tag1), DIRTY_TAG(tag1), valueForTag(tag1), UPDATE_TAG(tag1, combine([tag2, tag3])), valueForTag(tag1), DIRTY_TAG(tag2), valueForTag(tag1), DIRTY_TAG(tag3), valueForTag(tag1), UPDATE_TAG(tag1, tag3), valueForTag(tag1), DIRTY_TAG(tag3), valueForTag(tag1);

/**
 * An object that that tracks @tracked properties that were consumed.
 */
class Tracker {
  add(tag) {
    tag !== CONSTANT_TAG && (this.tags.add(tag), isDevelopingApp() && unwrap(debug.markTagAsConsumed)(tag), this.last = tag);
  }
  combine() {
    let {
      tags: tags
    } = this;
    return 0 === tags.size ? CONSTANT_TAG : 1 === tags.size ? this.last : combine(Array.from(this.tags));
  }
  constructor() {
    this.tags = new Set(), this.last = null;
  }
}

/**
 * Whenever a tracked computed property is entered, the current tracker is
 * saved off and a new tracker is replaced.
 *
 * Any tracked properties consumed are added to the current tracker.
 *
 * When a tracked computed property is exited, the tracker's tags are
 * combined and added to the parent tracker.
 *
 * The consequence is that each tracked computed property has a tag
 * that corresponds to the tracked properties consumed inside of
 * itself, including child tracked computed properties.
 */
let CURRENT_TRACKER = null;
const OPEN_TRACK_FRAMES = [];
function beginTrackFrame(debuggingContext) {
  OPEN_TRACK_FRAMES.push(CURRENT_TRACKER), CURRENT_TRACKER = new Tracker(), isDevelopingApp() && unwrap(debug.beginTrackingTransaction)(debuggingContext);
}
function endTrackFrame() {
  let current = CURRENT_TRACKER;
  if (isDevelopingApp()) {
    if (0 === OPEN_TRACK_FRAMES.length) throw new Error("attempted to close a tracking frame, but one was not open");
    unwrap(debug.endTrackingTransaction)();
  }
  return CURRENT_TRACKER = OPEN_TRACK_FRAMES.pop() || null, unwrap(current).combine();
}
function beginUntrackFrame() {
  OPEN_TRACK_FRAMES.push(CURRENT_TRACKER), CURRENT_TRACKER = null;
}
function endUntrackFrame() {
  if (isDevelopingApp() && 0 === OPEN_TRACK_FRAMES.length) throw new Error("attempted to close a tracking frame, but one was not open");
  CURRENT_TRACKER = OPEN_TRACK_FRAMES.pop() || null;
}

// This function is only for handling errors and resetting to a valid state
function resetTracking() {
  for (; OPEN_TRACK_FRAMES.length > 0;) OPEN_TRACK_FRAMES.pop();
  if (CURRENT_TRACKER = null, isDevelopingApp()) return unwrap(debug.resetTrackingTransaction)();
}
function isTracking() {
  return null !== CURRENT_TRACKER;
}
function consumeTag(tag) {
  null !== CURRENT_TRACKER && CURRENT_TRACKER.add(tag);
}
const FN = Symbol("FN"),
  LAST_VALUE = Symbol("LAST_VALUE"),
  TAG = Symbol("TAG"),
  SNAPSHOT = Symbol("SNAPSHOT"),
  DEBUG_LABEL = Symbol("DEBUG_LABEL");
function createCache(fn, debuggingLabel) {
  if (isDevelopingApp() && "function" != typeof fn) throw new Error(`createCache() must be passed a function as its first parameter. Called with: ${String(fn)}`);
  let cache = {
    [FN]: fn,
    [LAST_VALUE]: void 0,
    [TAG]: void 0,
    [SNAPSHOT]: -1
  };
  return isDevelopingApp() && (cache[DEBUG_LABEL] = debuggingLabel), cache;
}
function getValue(cache) {
  assertCache(cache, "getValue");
  let fn = cache[FN],
    tag = cache[TAG],
    snapshot = cache[SNAPSHOT];
  if (void 0 !== tag && validateTag(tag, snapshot)) consumeTag(tag);else {
    beginTrackFrame();
    try {
      cache[LAST_VALUE] = fn();
    } finally {
      tag = endTrackFrame(), cache[TAG] = tag, cache[SNAPSHOT] = valueForTag(tag), consumeTag(tag);
    }
  }
  return cache[LAST_VALUE];
}
function isConst(cache) {
  assertCache(cache, "isConst");
  let tag = cache[TAG];
  // replace this with `expect` when we can
  return function (tag, cache) {
    if (isDevelopingApp() && void 0 === tag) throw new Error(`isConst() can only be used on a cache once getValue() has been called at least once. Called with cache function:\n\n${String(cache[FN])}`);
  }
  //////////
  // Legacy tracking APIs
  // track() shouldn't be necessary at all in the VM once the autotracking
  // refactors are merged, and we should generally be moving away from it. It may
  // be necessary in Ember for a while longer, but I think we'll be able to drop
  // it in favor of cache sooner rather than later.
  (tag, cache), isConstTag(tag);
}
function assertCache(value, fnName) {
  if (isDevelopingApp() && ("object" != typeof value || !(FN in value))) throw new Error(`${fnName}() can only be used on an instance of a cache created with createCache(). Called with: ${String(
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- @fixme
  value)}`);
}
function track(block, debugLabel) {
  let tag;
  beginTrackFrame(debugLabel);
  try {
    block();
  } finally {
    tag = endTrackFrame();
  }
  return tag;
}

// untrack() is currently mainly used to handle places that were previously not
// tracked, and that tracking now would cause backtracking rerender assertions.
// I think once we move everyone forward onto modern APIs, we'll probably be
// able to remove it, but I'm not sure yet.
function untrack(callback) {
  beginUntrackFrame();
  try {
    return callback();
  } finally {
    endUntrackFrame();
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */ // Unfortunately, TypeScript's ability to do inference *or* type-checking in a
// `Proxy`'s body is very limited, so we have to use a number of casts `as any`
// to make the internal accesses work. The type safety of these is guaranteed at
// the *call site* instead of within the body: you cannot do `Array.blah` in TS,
// and it will blow up in JS in exactly the same way, so it is safe to assume
// that properties within the getter have the correct type in TS.
const ARRAY_GETTER_METHODS = new Set([Symbol.iterator, "concat", "entries", "every", "filter", "find", "findIndex", "flat", "flatMap", "forEach", "includes", "indexOf", "join", "keys", "lastIndexOf", "map", "reduce", "reduceRight", "slice", "some", "values"]),
  ARRAY_WRITE_THEN_READ_METHODS = new Set(["fill", "push", "unshift"]);

// For these methods, `Array` itself immediately gets the `.length` to return
// after invoking them.
function convertToInt(prop) {
  if ("symbol" == typeof prop) return null;
  const num = Number(prop);
  return isNaN(num) ? null : num % 1 == 0 ? num : null;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class TrackedArray {
  #options;
  constructor(arr, options) {
    this.#collection = createUpdatableTag(), this.#storages = new Map(), this.#options = options;
    const clone = arr.slice(),
      self = this,
      boundFns = new Map();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    /**
    Flag to track whether we have *just* intercepted a call to `.push()` or
    `.unshift()`, since in those cases (and only those cases!) the `Array`
    itself checks `.length` to return from the function call.
    */
    let nativelyAccessingLengthFromPushOrUnshift = false;
    return new Proxy(clone, {
      get(target, prop /*, _receiver */) {
        const index = convertToInt(prop);
        if (null !== index) return self.#readStorageFor(index), consumeTag(self.#collection), target[index];
        if ("length" === prop)
          // If we are reading `.length`, it may be a normal user-triggered
          // read, or it may be a read triggered by Array itself. In the latter
          // case, it is because we have just done `.push()` or `.unshift()`; in
          // that case it is safe not to mark this as a *read* operation, since
          // calling `.push()` or `.unshift()` cannot otherwise be part of a
          // "read" operation safely, and if done during an *existing* read
          // (e.g. if the user has already checked `.length` *prior* to this),
          // that will still trigger the mutation-after-consumption assertion.
          return nativelyAccessingLengthFromPushOrUnshift ? nativelyAccessingLengthFromPushOrUnshift = false : consumeTag(self.#collection), target[prop];
        // Here, track that we are doing a `.push()` or `.unshift()` by setting
        // the flag to `true` so that when the `.length` is read by `Array` (see
        // immediately above), it knows not to dirty the collection.
        if (ARRAY_WRITE_THEN_READ_METHODS.has(prop) && (nativelyAccessingLengthFromPushOrUnshift = true), ARRAY_GETTER_METHODS.has(prop)) {
          let fn = boundFns.get(prop);
          return void 0 === fn && (fn = (...args) => (consumeTag(self.#collection), target[prop](...args)), boundFns.set(prop, fn)), fn;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return target[prop];
      },
      set(target, prop, value /*, _receiver */) {
        if (self.#options.equals(target[prop], value)) return true;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        target[prop] = value;
        const index = convertToInt(prop);
        return null !== index ? (self.#dirtyStorageFor(index), self.#dirtyCollection()) : "length" === prop && self.#dirtyCollection(), true;
      },
      getPrototypeOf: () => TrackedArray.prototype
    });
  }
  #collection;
  #storages;
  #readStorageFor(index) {
    let storage = this.#storages.get(index);
    void 0 === storage && (storage = createUpdatableTag(), this.#storages.set(index, storage)), consumeTag(storage);
  }
  #dirtyStorageFor(index) {
    const storage = this.#storages.get(index);
    storage && DIRTY_TAG(storage);
  }
  #dirtyCollection() {
    DIRTY_TAG(this.#collection), this.#storages.clear();
  }
}

// Ensure instanceof works correctly
function trackedArray(data, options) {
  return new TrackedArray(data ?? [], {
    equals: options?.equals ?? Object.is,
    description: options?.description
  });
}
Object.setPrototypeOf(TrackedArray.prototype, Array.prototype);
class TrackedMap {
  #options;
  #collection;
  #storages;
  #vals;
  #storageFor(key) {
    const storages = this.#storages;
    let storage = storages.get(key);
    return void 0 === storage && (storage = createUpdatableTag(), storages.set(key, storage)), storage;
  }
  #dirtyStorageFor(key) {
    const storage = this.#storages.get(key);
    storage && DIRTY_TAG(storage);
  }
  constructor(existing, options) {
    this.#collection = createUpdatableTag(), this.#storages = new Map(),
    // TypeScript doesn't correctly resolve the overloads for calling the `Map`
    // constructor for the no-value constructor. This resolves that.
    this.#vals = existing instanceof Map ? new Map(existing.entries()) : new Map(existing), this.#options = options;
  }
  get(key) {
    return consumeTag(this.#storageFor(key)), this.#vals.get(key);
  }
  has(key) {
    return consumeTag(this.#storageFor(key)), this.#vals.has(key);
  }
  // **** ALL GETTERS ****
  entries() {
    return consumeTag(this.#collection), this.#vals.entries();
  }
  keys() {
    return consumeTag(this.#collection), this.#vals.keys();
  }
  values() {
    return consumeTag(this.#collection), this.#vals.values();
  }
  forEach(fn) {
    consumeTag(this.#collection), this.#vals.forEach(fn);
  }
  get size() {
    return consumeTag(this.#collection), this.#vals.size;
  }
  /**
  * When iterating:
  * - we entangle with the collection (as we iterate over the whole thing
  * - for each individual item, we entangle with the item as well
  */
  [Symbol.iterator]() {
    let keys = this.keys(),
      self = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    return {
      next() {
        let next = keys.next(),
          currentKey = next.value;
        return next.done ? {
          value: [void 0, void 0],
          done: true
        } : {
          value: [currentKey, self.get(currentKey)],
          done: false
        };
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      }
    };
  }
  get [Symbol.toStringTag]() {
    return this.#vals[Symbol.toStringTag];
  }
  set(key, value) {
    let existing = this.#vals.get(key);
    return existing && this.#options.equals(existing, value) || (this.#dirtyStorageFor(key), existing || DIRTY_TAG(this.#collection), this.#vals.set(key, value)), this;
  }
  delete(key) {
    return !this.#vals.has(key) || (this.#dirtyStorageFor(key), DIRTY_TAG(this.#collection), this.#storages.delete(key), this.#vals.delete(key));
  }
  clear() {
    0 !== this.#vals.size && (this.#storages.forEach(s => DIRTY_TAG(s)), this.#storages.clear(), DIRTY_TAG(this.#collection), this.#vals.clear());
  }
}

// So instanceof works
function trackedMap(data, options) {
  return new TrackedMap(data ?? [], {
    equals: options?.equals ?? Object.is,
    description: options?.description
  });
}
Object.setPrototypeOf(TrackedMap.prototype, Map.prototype);
class TrackedObject {
  #options;
  #storages;
  #collection;
  #readStorageFor(key) {
    let storage = this.#storages.get(key);
    void 0 === storage && (storage = createUpdatableTag(), this.#storages.set(key, storage)), consumeTag(storage);
  }
  #dirtyStorageFor(key) {
    const storage = this.#storages.get(key);
    storage && DIRTY_TAG(storage);
  }
  #dirtyCollection() {
    DIRTY_TAG(this.#collection);
  }
  /**
  * This implementation of trackedObject is far too dynamic for TS to be happy with
  */
  constructor(obj, options) {
    this.#storages = new Map(), this.#collection = createUpdatableTag(), this.#options = options;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const proto = Object.getPrototypeOf(obj),
      descs = Object.getOwnPropertyDescriptors(obj),
      clone = Object.create(proto);
    for (const prop in descs)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Object.defineProperty(clone, prop, descs[prop]);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return new Proxy(clone, {
      get: (target, prop) => (self.#readStorageFor(prop), target[prop]),
      has: (target, prop) => (self.#readStorageFor(prop), prop in target),
      ownKeys: target => (consumeTag(self.#collection), Reflect.ownKeys(target)),
      set: (target, prop, value) => (self.#options.equals(target[prop], value) || (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      target[prop] = value, self.#dirtyStorageFor(prop), self.#dirtyCollection()), true),
      deleteProperty: (target, prop) => (prop in target && (
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete target[prop], self.#dirtyStorageFor(prop), self.#storages.delete(prop), self.#dirtyCollection()), true),
      getPrototypeOf: () => TrackedObject.prototype
    });
  }
}
function trackedObject(data, options) {
  return new TrackedObject(data ?? {}, {
    equals: options?.equals ?? Object.is,
    description: options?.description
  });
}
class TrackedSet {
  #options;
  #collection;
  #storages;
  #vals;
  #storageFor(key) {
    const storages = this.#storages;
    let storage = storages.get(key);
    return void 0 === storage && (storage = createUpdatableTag(), storages.set(key, storage)), storage;
  }
  #dirtyStorageFor(key) {
    const storage = this.#storages.get(key);
    storage && DIRTY_TAG(storage);
  }
  constructor(existing, options) {
    this.#collection = createUpdatableTag(), this.#storages = new Map(), this.#vals = new Set(existing), this.#options = options;
  }
  // **** KEY GETTERS ****
  has(value) {
    return consumeTag(this.#storageFor(value)), this.#vals.has(value);
  }
  // **** ALL GETTERS ****
  entries() {
    return consumeTag(this.#collection), this.#vals.entries();
  }
  keys() {
    return consumeTag(this.#collection), this.#vals.keys();
  }
  values() {
    return consumeTag(this.#collection), this.#vals.values();
  }
  union(other) {
    return consumeTag(this.#collection), this.#vals.union(other);
  }
  intersection(other) {
    return consumeTag(this.#collection), this.#vals.intersection(other);
  }
  difference(other) {
    return consumeTag(this.#collection), this.#vals.difference(other);
  }
  symmetricDifference(other) {
    return consumeTag(this.#collection), this.#vals.symmetricDifference(other);
  }
  isSubsetOf(other) {
    return consumeTag(this.#collection), this.#vals.isSubsetOf(other);
  }
  isSupersetOf(other) {
    return consumeTag(this.#collection), this.#vals.isSupersetOf(other);
  }
  isDisjointFrom(other) {
    return consumeTag(this.#collection), this.#vals.isDisjointFrom(other);
  }
  forEach(fn) {
    consumeTag(this.#collection), this.#vals.forEach(fn);
  }
  get size() {
    return consumeTag(this.#collection), this.#vals.size;
  }
  [Symbol.iterator]() {
    return consumeTag(this.#collection), this.#vals[Symbol.iterator]();
  }
  get [Symbol.toStringTag]() {
    return this.#vals[Symbol.toStringTag];
  }
  add(value) {
    if (this.#vals.has(value)) {
      if (this.#options.equals(value, value)) return this;
    } else DIRTY_TAG(this.#collection);
    return this.#dirtyStorageFor(value), this.#vals.add(value), this;
  }
  delete(value) {
    return !this.#vals.has(value) || (this.#dirtyStorageFor(value), DIRTY_TAG(this.#collection), this.#storages.delete(value), this.#vals.delete(value));
  }
  // **** ALL SETTERS ****
  clear() {
    0 !== this.#vals.size && (this.#storages.forEach(s => DIRTY_TAG(s)), DIRTY_TAG(this.#collection), this.#storages.clear(), this.#vals.clear());
  }
}

// So instanceof works
function trackedSet(data, options) {
  return new TrackedSet(data ?? [], {
    equals: options?.equals ?? Object.is,
    description: options?.description
  });
}
Object.setPrototypeOf(TrackedSet.prototype, Set.prototype);
class TrackedWeakMap {
  #options;
  #storages;
  #vals;
  #storageFor(key) {
    let storage = this.#storages.get(key);
    return void 0 === storage && (storage = createUpdatableTag(), this.#storages.set(key, storage)), storage;
  }
  #dirtyStorageFor(key) {
    const storage = this.#storages.get(key);
    storage && DIRTY_TAG(storage);
  }
  constructor(existing, options) {
    this.#storages = new WeakMap(),
    /**
    * SAFETY: note that wehn passing in an existing weak map, we can't
    *         clone it as it is not iterable and not a supported type of structuredClone
    */
    this.#vals = existing instanceof WeakMap ? existing : new WeakMap(existing), this.#options = options;
  }
  get(key) {
    return consumeTag(this.#storageFor(key)), this.#vals.get(key);
  }
  has(key) {
    return consumeTag(this.#storageFor(key)), this.#vals.has(key);
  }
  set(key, value) {
    let existing = this.#vals.get(key);
    return existing && this.#options.equals(existing, value) || (this.#dirtyStorageFor(key), this.#vals.set(key, value)), this;
  }
  delete(key) {
    return !this.#vals.has(key) || (this.#dirtyStorageFor(key), this.#storages.delete(key), this.#vals.delete(key));
  }
  get [Symbol.toStringTag]() {
    return this.#vals[Symbol.toStringTag];
  }
}

// So instanceof works
function trackedWeakMap(data, options) {
  return new TrackedWeakMap(data ?? [], {
    equals: options?.equals ?? Object.is,
    description: options?.description
  });
}
Object.setPrototypeOf(TrackedWeakMap.prototype, WeakMap.prototype);
class TrackedWeakSet {
  #options;
  #storages;
  #vals;
  #storageFor(key) {
    let storage = this.#storages.get(key);
    return void 0 === storage && (storage = createUpdatableTag(), this.#storages.set(key, storage)), storage;
  }
  #dirtyStorageFor(key) {
    const storage = this.#storages.get(key);
    storage && DIRTY_TAG(storage);
  }
  constructor(values, options) {
    this.#storages = new WeakMap(), this.#options = options, this.#vals = new WeakSet(values);
  }
  has(value) {
    return consumeTag(this.#storageFor(value)), this.#vals.has(value);
  }
  add(value) {
    /**
    * In a WeakSet, there is no `.get()`, but if there was,
    * we could assume it's the same value as what we passed.
    *
    * So for a WeakSet, if we try to add something that already exists
    * we no-op.
    *
    * WeakSet already does this internally for us,
    * but we want the ability for the reactive behavior to reflect the same behavior.
    *
    * i.e.: doing weakSet.add(value) should never dirty with the defaults
    *       if the `value` is already in the weakSet
    */
    return this.#vals.has(value) && this.#options.equals(value, value) || (
    // Add to vals first to get better error message
    this.#vals.add(value), this.#dirtyStorageFor(value)), this;
  }
  delete(value) {
    return !this.#vals.has(value) || (this.#dirtyStorageFor(value), this.#storages.delete(value), this.#vals.delete(value));
  }
  get [Symbol.toStringTag]() {
    return this.#vals[Symbol.toStringTag];
  }
}

// So instanceof works
/**
 * NOTE: we cannot pass a WeakSet because WeakSets are not iterable
 */
/**
 * Creates an instanceof WeakSet from an optional list of entries
 *
 */
function trackedWeakSet(data, options) {
  return new TrackedWeakSet(data ?? [], {
    equals: options?.equals ?? Object.is,
    description: options?.description
  });
}
Object.setPrototypeOf(TrackedWeakSet.prototype, WeakSet.prototype);
const TRACKED_TAGS = new WeakMap();
function dirtyTagFor(obj, key, meta) {
  if (isDevelopingApp() && ("object" != typeof (u = obj) || null === u) && "function" != typeof u) throw new Error("BUG: Can't update a tag for a primitive");
  var u;
  let tags = void 0 === meta ? TRACKED_TAGS.get(obj) : meta;
  // No tags have been setup for this object yet, return
  if (void 0 === tags) return;
  // Dirty the tag for the specific property if it exists
  let propertyTag = tags.get(key);
  void 0 !== propertyTag && (isDevelopingApp() && unwrap(debug.assertTagNotConsumed)(propertyTag, obj, key), DIRTY_TAG(propertyTag, true));
}
function tagMetaFor(obj) {
  let tags = TRACKED_TAGS.get(obj);
  return void 0 === tags && (tags = new Map(), TRACKED_TAGS.set(obj, tags)), tags;
}
function tagFor(obj, key, meta) {
  let tags = void 0 === meta ? tagMetaFor(obj) : meta,
    tag = tags.get(key);
  return void 0 === tag && (tag = createUpdatableTag(), tags.set(key, tag)), tag;
}
function trackedData(key, initializer) {
  let values = new WeakMap(),
    hasInitializer = "function" == typeof initializer;
  return {
    getter: function (self) {
      let value;
      // If the field has never been initialized, we should initialize it
      return consumeTag(tagFor(self, key)), hasInitializer && !values.has(self) ? (
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      value = initializer.call(self), values.set(self, value)) : value = values.get(self), value;
    },
    setter: function (self, value) {
      dirtyTagFor(self, key), values.set(self, value);
    }
  };
}
const GLIMMER_VALIDATOR_REGISTRATION = Symbol("GLIMMER_VALIDATOR_REGISTRATION");
if (Reflect.has(globalThis, GLIMMER_VALIDATOR_REGISTRATION)) throw new Error("The `@glimmer/validator` library has been included twice in this application. It could be different versions of the package, or the same version included twice by mistake. `@glimmer/validator` depends on having a single copy of the package in use at any time in an application, even if they are the same version. You must dedupe your build to remove the duplicate packages in order to prevent this error.");
Reflect.set(globalThis, GLIMMER_VALIDATOR_REGISTRATION, true);

export { ALLOW_CYCLES, COMPUTE, CONSTANT, CONSTANT_TAG, CURRENT_TAG, CurrentTag, INITIAL, VOLATILE, VOLATILE_TAG, VolatileTag, beginTrackFrame, beginUntrackFrame, bump, combine, consumeTag, createCache, createTag, createUpdatableTag, debug, DIRTY_TAG as dirtyTag, dirtyTagFor, endTrackFrame, endUntrackFrame, getValue, isConst, isConstTag, isTracking, resetTracking, tagFor, tagMetaFor, track, trackedArray, trackedData, trackedMap, trackedObject, trackedSet, trackedWeakMap, trackedWeakSet, untrack, UPDATE_TAG as updateTag, validateTag, valueForTag };
