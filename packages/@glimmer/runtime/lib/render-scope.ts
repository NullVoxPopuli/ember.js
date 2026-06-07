import type { Nullable } from '@glimmer/interfaces';
import { StackImpl as Stack } from '@glimmer/util/lib/collections';

/**
 * Render-tree scope tracking that backs `makeContext` (RFC #1154).
 *
 * This is intentionally narrow: the only thing it supports is "provide a value
 * for a key at the current render node" and "look up the nearest provider of a
 * key walking up the render tree". `makeContext` is the sole consumer, so there
 * is no general-purpose `getScope`/`addToScope` surface -- just the two
 * context-specific helpers exported at the bottom of this file.
 *
 * Reactivity is intentionally not modeled here: lookups happen during
 * rendering, and the providers visible at a node only change when that node
 * re-renders (or is torn down), so consumers do not need to subscribe.
 */

// A read function returns the currently-provided value for a context key. It is
// evaluated lazily so that auto-tracking inside it (e.g. reading `@value`) makes
// consumers reactive to the provided value.
type ContextRead = () => unknown;

interface RenderScopeNode {
  parent: Nullable<RenderScopeNode>;
  // key -> read fn for the contexts provided at this node. Lazily allocated --
  // the overwhelming majority of render nodes never provide a context.
  contexts: Nullable<Map<object, ContextRead>>;
}

/**
 * Tracks the render-tree scope hierarchy. This mirrors the stack management of
 * `DebugRenderTree`, but is always-on because it backs a real (non-debug)
 * feature.
 */
export class RenderScopeTracker {
  // Stack of currently-rendering scope nodes; the top is the "current" scope.
  private stack = new Stack<RenderScopeNode>();
  // bucket -> scope node, so we can re-enter on update without losing entries.
  private nodes = new WeakMap<object, RenderScopeNode>();

  begin(): void {
    this.reset();
  }

  commit(): void {
    this.reset();
  }

  /**
   * Called when a render node is first created during rendering. The bucket
   * is whatever stable object the caller wants to associate with the scope
   * (e.g. the component instance).
   */
  create(bucket: object): void {
    let node: RenderScopeNode = {
      parent: this.stack.current ?? null,
      contexts: null,
    };
    this.nodes.set(bucket, node);
    this.stack.push(node);
  }

  /**
   * Called for the bucket on re-render. Re-pushes the existing scope node so
   * descendants link back to the same parent chain.
   */
  enter(bucket: object): void {
    let node = this.nodes.get(bucket);
    if (node !== undefined) {
      this.stack.push(node);
    }
  }

  /**
   * Called once the bucket has finished rendering for this tick.
   */
  exit(): void {
    this.stack.pop();
  }

  /**
   * Called when the render node is torn down. The WeakMap will collect the
   * node naturally; we just drop the explicit references so the provided
   * values (which may hold user state) can be released eagerly.
   */
  willDestroy(bucket: object): void {
    let node = this.nodes.get(bucket);
    if (node !== undefined) {
      node.contexts = null;
      node.parent = null;
      this.nodes.delete(bucket);
    }
  }

  get isRendering(): boolean {
    let node = this.stack.current;
    return node !== undefined && node !== null;
  }

  /** Provide `key`'s value (via the lazy `read`) at the current render node. */
  provide(key: object, read: ContextRead): void {
    let node = this.stack.current;
    if (node === undefined || node === null) {
      throw new Error('Cannot provide a context value -- there is no active render scope.');
    }
    (node.contexts ??= new Map()).set(key, read);
  }

  /**
   * Walk from the current node up the parent chain for the nearest provider of
   * `key`. Returns its read fn, or `null` if no provider exists in the tree.
   */
  lookup(key: object): Nullable<ContextRead> {
    let node = this.stack.current ?? null;
    while (node !== null) {
      let read = node.contexts?.get(key);
      if (read !== undefined) {
        return read;
      }
      node = node.parent;
    }
    return null;
  }

  private reset(): void {
    while (!this.stack.isEmpty()) {
      this.stack.pop();
    }
  }
}

// Module-level reference to the active tracker. The renderer assigns this
// before invoking the render loop and clears it on commit, so that the
// context helpers below can be called from anywhere within a rendering tick
// (e.g. a `consume()` helper that has no handle to the VM).
let CURRENT_TRACKER: RenderScopeTracker | undefined;

export function setCurrentRenderScopeTracker(tracker: RenderScopeTracker | undefined): void {
  CURRENT_TRACKER = tracker;
}

/**
 * Provide `key`'s value (via the lazy `read`) at the current render node. Used
 * by `makeContext`'s `<Provide>`. Throws if called outside of rendering.
 */
export function provideRenderContext(key: object, read: ContextRead): void {
  if (CURRENT_TRACKER === undefined) {
    throw new Error('Cannot provide a context value -- there is no active render scope.');
  }
  CURRENT_TRACKER.provide(key, read);
}

/**
 * Look up the nearest provider of `key` in the render tree. Returns:
 *
 * - `undefined` when called outside of rendering,
 * - `null` when rendering but no provider for `key` exists,
 * - the nearest provider's read fn otherwise.
 */
export function lookupRenderContext(key: object): ContextRead | null | undefined {
  if (CURRENT_TRACKER === undefined || !CURRENT_TRACKER.isRendering) {
    return undefined;
  }
  return CURRENT_TRACKER.lookup(key);
}
