import { b as isObject } from '../../../../../shared-chunks/mandatory-setter-Bij6Bx8G.js';
import '@embroider/macros';
import { isTracking, consumeTag, tagFor } from '../../../../../@glimmer/validator/index.js';
import { EachInWrapper } from '../helpers/each-in.js';

function toIterator(iterable) {
  if (iterable instanceof EachInWrapper) {
    return toEachInIterator(iterable.inner);
  } else {
    return toEachIterator(iterable);
  }
}
function toEachInIterator(iterable) {
  if (!isIndexable(iterable)) {
    return null;
  }
  if (Array.isArray(iterable)) {
    return ObjectIterator.fromIndexable(iterable);
  } else if (isNativeIterable(iterable)) {
    return MapLikeNativeIterator.from(iterable);
  } else if (hasForEach(iterable)) {
    return ObjectIterator.fromForEachable(iterable);
  } else {
    return ObjectIterator.fromIndexable(iterable);
  }
}
function toEachIterator(iterable) {
  if (!isObject(iterable)) {
    return null;
  }
  if (Array.isArray(iterable)) {
    return ArrayIterator.from(iterable);
  } else if (isNativeIterable(iterable)) {
    return ArrayLikeNativeIterator.from(iterable);
  } else if (hasForEach(iterable)) {
    return ArrayIterator.fromForEachable(iterable);
  } else {
    return null;
  }
}
class BoundedIterator {
  position = 0;
  constructor(length) {
    this.length = length;
  }
  isEmpty() {
    return false;
  }
  memoFor(position) {
    return position;
  }
  next() {
    let {
      length,
      position
    } = this;
    if (position >= length) {
      return null;
    }
    let value = this.valueFor(position);
    let memo = this.memoFor(position);
    this.position++;
    return {
      value,
      memo
    };
  }
}
class ArrayIterator extends BoundedIterator {
  static from(iterable) {
    return iterable.length > 0 ? new this(iterable) : null;
  }
  static fromForEachable(object) {
    let array = [];
    object.forEach(item => array.push(item));
    return this.from(array);
  }
  constructor(array) {
    super(array.length);
    this.array = array;
  }
  valueFor(position) {
    return this.array[position];
  }
}
class ObjectIterator extends BoundedIterator {
  static fromIndexable(obj) {
    let keys = Object.keys(obj);
    if (keys.length === 0) {
      return null;
    } else {
      let values = [];
      for (let key of keys) {
        let value;
        value = obj[key];

        // Add the tag of the returned value if it is an array, since arrays
        // should always cause updates if they are consumed and then changed
        if (isTracking()) {
          consumeTag(tagFor(obj, key));
          if (Array.isArray(value)) {
            consumeTag(tagFor(value, '[]'));
          }
        }
        values.push(value);
      }
      return new this(keys, values);
    }
  }
  static fromForEachable(obj) {
    let keys = [];
    let values = [];
    let length = 0;
    let isMapLike = false;

    // Not using an arrow function here so we can get an accurate `arguments`
    obj.forEach(function (value, key) {
      isMapLike = isMapLike || arguments.length >= 2;
      if (isMapLike) {
        keys.push(key);
      }
      values.push(value);
      length++;
    });
    if (length === 0) {
      return null;
    } else if (isMapLike) {
      return new this(keys, values);
    } else {
      return new ArrayIterator(values);
    }
  }
  constructor(keys, values) {
    super(values.length);
    this.keys = keys;
    this.values = values;
  }
  valueFor(position) {
    return this.values[position];
  }
  memoFor(position) {
    return this.keys[position];
  }
}
class NativeIterator {
  static from(iterable) {
    let iterator = iterable[Symbol.iterator]();
    let result = iterator.next();
    let {
      done
    } = result;
    if (done) {
      return null;
    } else {
      return new this(iterator, result);
    }
  }
  position = 0;
  constructor(iterable, result) {
    this.iterable = iterable;
    this.result = result;
  }
  isEmpty() {
    return false;
  }
  next() {
    let {
      iterable,
      result,
      position
    } = this;
    if (result.done) {
      return null;
    }
    let value = this.valueFor(result, position);
    let memo = this.memoFor(result, position);
    this.position++;
    this.result = iterable.next();
    return {
      value,
      memo
    };
  }
}
class ArrayLikeNativeIterator extends NativeIterator {
  valueFor(result) {
    return result.value;
  }
  memoFor(_result, position) {
    return position;
  }
}
class MapLikeNativeIterator extends NativeIterator {
  valueFor(result) {
    return result.value[1];
  }
  memoFor(result) {
    return result.value[0];
  }
}
function hasForEach(value) {
  return value != null && typeof value['forEach'] === 'function';
}
function isNativeIterable(value) {
  return value != null && typeof value[Symbol.iterator] === 'function';
}
function isIndexable(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

export { toIterator as default };
