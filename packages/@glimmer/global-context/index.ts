import { DEBUG } from '@glimmer/env';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

type Destroyable = object;
type Destructor<T extends Destroyable> = (destroyable: T) => void;

interface GlobalContext {
  scheduleRevalidate: () => void;
  scheduleDestroy: <T extends Destroyable>(destroyable: T, destructor: Destructor<T>) => void;
  scheduleDestroyed: (finalizer: () => void) => void;
}

// Default value so tags can warm themselves when first loaded.
export let scheduleRevalidate: GlobalContext['scheduleRevalidate'] = () => {};
export let scheduleDestroy: GlobalContext['scheduleDestroy'];
export let scheduleDestroyed: GlobalContext['scheduleDestroyed'];

export function debugAssert(test: unknown, msg: string | (() => string)): asserts test {
  if (DEBUG && !test) {
    throw new Error(typeof msg === 'string' ? msg : msg());
  }
}

let isSet = false;

export default function setGlobalContext(context: GlobalContext) {
  isSet = true;
  ({ scheduleRevalidate, scheduleDestroy, scheduleDestroyed } = context);
}

export let testOverrideGlobalContext:
  | ((context: Partial<GlobalContext> | null) => GlobalContext | null)
  | undefined;

if (DEBUG) {
  testOverrideGlobalContext = (context) => {
    let original: GlobalContext | null = isSet
      ? { scheduleRevalidate, scheduleDestroy, scheduleDestroyed }
      : null;

    isSet = context !== null;

    scheduleRevalidate = context?.scheduleRevalidate ?? (undefined as any);
    scheduleDestroy = context?.scheduleDestroy ?? (undefined as any);
    scheduleDestroyed = context?.scheduleDestroyed ?? (undefined as any);

    return original;
  };
}
