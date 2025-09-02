import { G as GUID_KEY, i as intern } from './mandatory-setter-Bij6Bx8G.js';
import { isDevelopingApp } from '@embroider/macros';

const GENERATED_SYMBOLS = [];
function isInternalSymbol(possibleSymbol) {
  return GENERATED_SYMBOLS.indexOf(possibleSymbol) !== -1;
}

// Some legacy symbols still need to be enumerable for a variety of reasons.
// This code exists for that, and as a fallback in IE11. In general, prefer
// `symbol` below when creating a new symbol.
function enumerableSymbol(debugName) {
  // TODO: Investigate using platform symbols, but we do not
  // want to require non-enumerability for this API, which
  // would introduce a large cost.
  let id = GUID_KEY + Math.floor(Math.random() * Date.now()).toString();
  let symbol = intern(`__${debugName}${id}__`);
  if (isDevelopingApp()) {
    GENERATED_SYMBOLS.push(symbol);
  }
  return symbol;
}
const symbol = Symbol;

export { enumerableSymbol as e, isInternalSymbol as i, symbol as s };
