import { b as isObject } from './mandatory-setter-Bij6Bx8G.js';

const PROXIES = new WeakSet();
function isProxy(value) {
  if (isObject(value)) {
    return PROXIES.has(value);
  }
  return false;
}
function setProxy(object) {
  if (isObject(object)) {
    PROXIES.add(object);
  }
}

export { isProxy as i, setProxy as s };
