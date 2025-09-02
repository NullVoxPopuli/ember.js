import { b as isObject } from './mandatory-setter-Bij6Bx8G.js';

const NAMES = new WeakMap();
function setName(obj, name) {
  if (isObject(obj)) NAMES.set(obj, name);
}
function getName(obj) {
  return NAMES.get(obj);
}

export { getName as g, setName as s };
