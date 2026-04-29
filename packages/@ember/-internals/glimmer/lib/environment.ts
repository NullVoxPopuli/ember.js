import { ENV } from '@ember/-internals/environment';
import { getDebugName } from '@ember/-internals/utils';
import { schedule, _backburner } from '@ember/runloop';
import { DEBUG } from '@glimmer/env';
import setGlobalContext from '@glimmer/global-context';
import type { EnvironmentDelegate } from '@glimmer/runtime';
import { debug } from '@glimmer/validator';
import toIterator from './utils/iterator';

///////////

// Setup global context

setGlobalContext({
  scheduleRevalidate() {
    _backburner.ensureInstance();
  },

  toIterator,

  scheduleDestroy(destroyable, destructor) {
    schedule('actions', null, destructor, destroyable);
  },

  scheduleDestroyed(finalizeDestructor) {
    schedule('destroy', null, finalizeDestructor);
  },
});

if (DEBUG) {
  debug?.setTrackingTransactionEnv?.({
    debugMessage(obj, keyName) {
      let dirtyString = keyName
        ? `\`${keyName}\` on \`${getDebugName?.(obj)}\``
        : `\`${getDebugName?.(obj)}\``;

      return `You attempted to update ${dirtyString}, but it had already been used previously in the same computation.  Attempting to update a value after using it in a computation can cause logical errors, infinite revalidation bugs, and performance issues, and is not supported.`;
    },
  });
}

///////////

// Define environment delegate

export class EmberEnvironmentDelegate implements EnvironmentDelegate {
  public enableDebugTooling: boolean = ENV._DEBUG_RENDER_TREE;

  constructor(public isInteractive: boolean) {}

  onTransactionCommit(): void {}
}
