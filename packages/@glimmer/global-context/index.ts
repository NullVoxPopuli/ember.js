import { DEBUG } from '@glimmer/env';
/* eslint-disable @typescript-eslint/no-explicit-any */

type Destroyable = object;
type Destructor<T extends Destroyable> = (destroyable: T) => void;

interface IteratorDelegate {
  isEmpty(): boolean;
  next(): { value: unknown; memo: unknown } | null;
}

interface GlobalContext {
  scheduleRevalidate: () => void;
  scheduleDestroy: <T extends Destroyable>(destroyable: T, destructor: Destructor<T>) => void;
  scheduleDestroyed: (finalizer: () => void) => void;
  toIterator: (value: unknown) => IteratorDelegate | null;
  toBool: (value: unknown) => boolean;
  getProp: (obj: object, path: string) => unknown;
  setProp: (obj: object, prop: string, value: unknown) => void;
  getPath: (obj: object, path: string) => unknown;
  setPath: (obj: object, prop: string, value: unknown) => void;
  warnIfStyleNotTrusted: (value: unknown) => void;
  assert: (test: unknown, msg: string) => asserts test;
}

// Default value so tags can warm themselves when first loaded.
export let scheduleRevalidate: GlobalContext['scheduleRevalidate'] = () => {};
export let scheduleDestroy: GlobalContext['scheduleDestroy'];
export let scheduleDestroyed: GlobalContext['scheduleDestroyed'];
export let toIterator: GlobalContext['toIterator'];
export let toBool: GlobalContext['toBool'];
export let getProp: GlobalContext['getProp'];
export let setProp: GlobalContext['setProp'];
export let getPath: GlobalContext['getPath'];
export let setPath: GlobalContext['setPath'];
export let warnIfStyleNotTrusted: GlobalContext['warnIfStyleNotTrusted'];
export let assert: GlobalContext['assert'];

export function debugAssert(test: unknown, msg: string | (() => string)): asserts test {
  if (DEBUG && assert) {
    assert(test, typeof msg === 'string' ? msg : msg());
  }
}

let isSet = false;

export default function setGlobalContext(context: GlobalContext) {
  isSet = true;
  ({
    scheduleRevalidate,
    scheduleDestroy,
    scheduleDestroyed,
    toIterator,
    toBool,
    getProp,
    setProp,
    getPath,
    setPath,
    warnIfStyleNotTrusted,
    assert,
  } = context);
}

export let testOverrideGlobalContext:
  | ((context: Partial<GlobalContext> | null) => GlobalContext | null)
  | undefined;

if (DEBUG) {
  testOverrideGlobalContext = (context) => {
    let original: GlobalContext | null = isSet
      ? {
          scheduleRevalidate,
          scheduleDestroy,
          scheduleDestroyed,
          toIterator,
          toBool,
          getProp,
          setProp,
          getPath,
          setPath,
          warnIfStyleNotTrusted,
          assert,
        }
      : null;

    isSet = context !== null;

    scheduleRevalidate = context?.scheduleRevalidate ?? (undefined as any);
    scheduleDestroy = context?.scheduleDestroy ?? (undefined as any);
    scheduleDestroyed = context?.scheduleDestroyed ?? (undefined as any);
    toIterator = context?.toIterator ?? (undefined as any);
    toBool = context?.toBool ?? (undefined as any);
    getProp = context?.getProp ?? (undefined as any);
    setProp = context?.setProp ?? (undefined as any);
    getPath = context?.getPath ?? (undefined as any);
    setPath = context?.setPath ?? (undefined as any);
    warnIfStyleNotTrusted = context?.warnIfStyleNotTrusted ?? (undefined as any);
    assert = context?.assert ?? (undefined as any);

    return original;
  };
}
