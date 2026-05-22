import type { Nullable } from '@glimmer/interfaces';
import { StackImpl as Stack } from '@glimmer/util/lib/collections';

/**
 * The publicly observable shape of a render-tree scope. See RFC #1154.
 *
 * `entries` walks the scope's own entries first, then up the parent chain --
 * which matches the user-visible "look up the render tree" semantics that
 * provide/consume needs.
 *
 * Reactivity is intentionally _not_ part of this object: access happens during
 * rendering, and entries only change when the surrounding render node itself
 * re-renders (or is torn down), so consumers do not need to subscribe.
 */
export interface RenderScope {
  readonly entries: Iterable<unknown>;
}

interface RenderScopeNode {
  parent: Nullable<RenderScopeNode>;
  // Lazily allocated -- most render nodes never call addToScope, and we want
  // iteration to skip them cheaply.
  data: Nullable<unknown[]>;
  // Cached view; lazily created the first time getCurrentScope() is observed
  // for this node so the same identity is returned for repeated calls.
  view: Nullable<RenderScope>;
}

function* iterateUp(start: Nullable<RenderScopeNode>): Iterator<unknown> {
  let node = start;
  while (node !== null) {
    if (node.data !== null) {
      // Most recent additions first -- consumers searching for "the nearest
      // provider" can short-circuit as soon as they find a match.
      for (let i = node.data.length - 1; i >= 0; i--) {
        yield node.data[i];
      }
    }
    node = node.parent;
  }
}

function viewFor(node: RenderScopeNode): RenderScope {
  if (node.view === null) {
    node.view = {
      get entries() {
        return {
          [Symbol.iterator]: () => iterateUp(node),
        };
      },
    };
  }
  return node.view;
}

/**
 * Tracks the render-tree scope hierarchy for the public `getScope` /
 * `addToScope` API proposed in RFC #1154.
 *
 * This mirrors the stack management of `DebugRenderTree`, but is always-on
 * because it is part of the framework's public surface area (not a debug-only
 * tool).
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
      data: null,
      view: null,
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
   * node naturally; we just drop the explicit reference so the node's
   * `data` (which may hold user state) can be released eagerly.
   */
  willDestroy(bucket: object): void {
    let node = this.nodes.get(bucket);
    if (node !== undefined) {
      node.data = null;
      node.parent = null;
      node.view = null;
      this.nodes.delete(bucket);
    }
  }

  /**
   * Returns the publicly observable scope for the top of the stack, or
   * `undefined` when called outside of rendering.
   */
  getCurrentScope(): RenderScope | undefined {
    let node = this.stack.current;
    if (node === undefined || node === null) {
      return undefined;
    }
    return viewFor(node);
  }

  addToCurrentScope(entry: unknown): void {
    let node = this.stack.current;
    if (node === undefined || node === null) {
      throw new Error(
        'addToScope() may only be called while rendering -- there is no active scope.'
      );
    }
    if (node.data === null) {
      node.data = [];
    }
    node.data.push(entry);
  }

  private reset(): void {
    while (!this.stack.isEmpty()) {
      this.stack.pop();
    }
  }
}

// Module-level reference to the active tracker. The renderer assigns this
// before invoking the render loop and clears it on commit, so that the public
// `getScope` / `addToScope` helpers can be called from anywhere within a
// rendering tick.
let CURRENT_TRACKER: RenderScopeTracker | undefined;

export function setCurrentRenderScopeTracker(tracker: RenderScopeTracker | undefined): void {
  CURRENT_TRACKER = tracker;
}

export function getCurrentRenderScope(): RenderScope | undefined {
  return CURRENT_TRACKER?.getCurrentScope();
}

export function addToCurrentRenderScope(entry: unknown): void {
  if (CURRENT_TRACKER === undefined) {
    throw new Error(
      'addToScope() may only be called while rendering -- there is no active scope.'
    );
  }
  CURRENT_TRACKER.addToCurrentScope(entry);
}
