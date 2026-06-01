export type Revision = number;

// A Tag is just a callable that returns the current revision. Reading it
// inside an alien-signals subscriber registers a dependency.
export type Tag = () => Revision;

export type MonomorphicTag = Tag;
export type UpdatableTag = Tag;
export type DirtyableTag = Tag;
export type ConstantTag = Tag;
export type CombinatorTag = Tag;
