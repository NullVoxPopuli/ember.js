import { DEBUG } from '@glimmer/env';
import type { Tag } from '@glimmer/interfaces';
import { scheduleRevalidate } from '@glimmer/global-context';
import { signal } from 'alien-signals';

import { debug } from './debug';
import { unwrap } from './utils';

// `Tag` is just `() => Revision`. Read it to get the current revision and,
// inside an alien-signals subscriber, register a dependency.

export type Revision = number;
export const INITIAL: Revision = 1;
const VOLATILE: Revision = NaN;

const $tick = signal<Revision>(INITIAL);
const advance = (): Revision => {
  const n = $tick() + 1;
  $tick(n);
  return n;
};
export const bump = (): void => {
  advance();
};

// Dirtyable tags: read-only Tag fn paired with a hidden `dirty` writer.
const dirtyWriters = new WeakMap<Tag, (v: Revision) => void>();

export function createTag(): Tag {
  const s = signal<Revision>(INITIAL);
  const tag: Tag = () => s();
  dirtyWriters.set(tag, s);
  return tag;
}

// Updatable tags: a dirtyable that can have its subtag re-pointed via
// updateTag. Two pieces of bookkeeping survive (each verified by removing
// it and watching specific tests fail):
//
// 1. Cycle re-entrance guard. ember's CP set/get both call
//    `updateTag(propertyTag, depsChain)`, building reciprocal subtag
//    pointers between two property tags whose CPs depend on each other.
//    alien-signals re-entry returns NaN; ember needs a stable last value
//    plus a tick bump so neighbouring caches revalidate.
// 2. Adoption "buffer". `updateTag` may adopt a subtag whose revision is
//    already higher than the parent's; naive `max(own, sub())` makes the
//    parent jump and fires observers on the parent without anything they
//    care about having changed.
const computing = new WeakSet<Tag>();
interface UpdatableState {
  buffer: Revision | null;
  last: Revision;
  own: (v: Revision) => void;
  sub: (s: Tag | null) => void;
}
const updatables = new WeakMap<Tag, UpdatableState>();

export function createUpdatableTag(): Tag {
  const ownSig = signal<Revision>(INITIAL);
  const subSig = signal<Tag | null>(null);
  const state: UpdatableState = { buffer: null, last: INITIAL, own: ownSig, sub: subSig };
  const tag: Tag = () => {
    if (computing.has(tag)) {
      advance();
      return state.last;
    }
    computing.add(tag);
    try {
      const o = ownSig();
      const s = subSig();
      if (s === null) {
        state.last = o;
        return o;
      }
      const sv = s();
      const r =
        sv === state.buffer ? Math.max(o, state.last) : ((state.buffer = null), Math.max(o, sv));
      state.last = r;
      return r;
    } finally {
      computing.delete(tag);
    }
  };
  dirtyWriters.set(tag, ownSig);
  updatables.set(tag, state);
  return tag;
}

export function updateTag(tag: Tag, sub: Tag): void {
  const state = updatables.get(tag);
  if (state === undefined) {
    if (DEBUG) throw new Error('Attempted to update a tag that was not updatable');
    return;
  }
  if (sub === CONSTANT_TAG) {
    state.buffer = null;
    state.sub(null);
  } else {
    state.buffer = sub();
    state.sub(sub);
  }
}
export const UPDATE_TAG = updateTag;

export function combine(tags: Tag[]): Tag {
  if (tags.length === 0) return CONSTANT_TAG;
  if (tags.length === 1) return tags[0] as Tag;
  return () => {
    let max: Revision = INITIAL;
    // Math.max propagates NaN, keeping combinators that include VOLATILE_TAG
    // always-stale (validateTag is `snapshot >= NaN`).
    for (const t of tags) max = Math.max(max, t());
    return max;
  };
}

export const CONSTANT_TAG: Tag = () => INITIAL;
export const isConstTag = (tag: Tag): boolean => tag === CONSTANT_TAG;

export const VOLATILE_TAG: Tag = () => {
  $tick();
  return VOLATILE;
};

export const CURRENT_TAG: Tag = () => $tick();

export function dirtyTag(tag: Tag, skipAssertion?: boolean): void {
  const s = dirtyWriters.get(tag);
  if (s === undefined) {
    if (DEBUG) throw new Error('Attempted to dirty a tag that was not dirtyable');
    return;
  }
  if (DEBUG && skipAssertion !== true) {
    unwrap(debug.assertTagNotConsumed)(tag);
  }
  s(advance());
  scheduleRevalidate();
}
export const DIRTY_TAG = dirtyTag;

export const valueForTag = (tag: Tag): Revision => tag();
export const validateTag = (tag: Tag, snapshot: Revision): boolean => snapshot >= tag();
