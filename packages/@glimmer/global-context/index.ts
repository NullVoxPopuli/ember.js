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
}

// Default value so tags can warm themselves when first loaded.
export let scheduleRevalidate: GlobalContext['scheduleRevalidate'] = () => {};
export let scheduleDestroy: GlobalContext['scheduleDestroy'];
export let scheduleDestroyed: GlobalContext['scheduleDestroyed'];
export let toIterator: GlobalContext['toIterator'];

export function debugAssert(test: unknown, msg: string | (() => string)): asserts test {
  if (DEBUG && !test) {
    throw new Error(typeof msg === 'string' ? msg : msg());
  }
}

let isSet = false;

export default function setGlobalContext(context: GlobalContext) {
  isSet = true;
  ({ scheduleRevalidate, scheduleDestroy, scheduleDestroyed, toIterator } = context);
}

export let testOverrideGlobalContext:
  | ((context: Partial<GlobalContext> | null) => GlobalContext | null)
  | undefined;

if (DEBUG) {
  testOverrideGlobalContext = (context) => {
    let original: GlobalContext | null = isSet
      ? { scheduleRevalidate, scheduleDestroy, scheduleDestroyed, toIterator }
      : null;

    isSet = context !== null;

    scheduleRevalidate = context?.scheduleRevalidate ?? (undefined as any);
    scheduleDestroy = context?.scheduleDestroy ?? (undefined as any);
    scheduleDestroyed = context?.scheduleDestroyed ?? (undefined as any);
    toIterator = context?.toIterator ?? (undefined as any);

    return original;
  };
}
