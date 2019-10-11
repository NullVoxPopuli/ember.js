import { Tag, UpdatableTag } from '@glimmer/reference';

import { Tracker } from './tracker';

type Option<T> = T | null;

interface DebugTracking {
  history: { [revision: number]: TrackerSnapshot[] };
  objectMap: WeakMap<object, number>;
  isRecording: boolean;
  start: () => void;
  stop: () => void;
}

interface TrackerSnapshot {
  tag: TagSnapshot;
  dependencies: TagSnapshot[];
  all: TagSnapshot[];
}

interface TagSnapshot {
  propertyName: string;
  objectName: string;
  objectRef: object;
  objectId: number;
  revision: number;
  lastChecked: number;
  tag: Tag | UpdatableTag;
  dependencies: TagSnapshot[];
}

let objectId = 0;

Ember.EMBER_DEBUG = {};
Ember.EMBER_DEBUG.TRACKING = {
  history: {},
  isRecording: false,
  objectMap: new WeakMap(),
  start() {
    getTrackingInfo().history = {};
    getTrackingInfo().objectMap = new WeakMap();
    getTrackingInfo().isRecording = true;
  },
  stop() {
    getTrackingInfo().isRecording = false;
  },
} as DebugTracking;

function getTrackingInfo(): DebugTracking {
  return Ember.EMBER_DEBUG.TRACKING;
}

// NOTE:
//  track is a wrapper around a tag
//    cosume is called on other tags
//
//  let tag = track(() => {
//    cosume(someTag);
//    cosume(someTagB);
//  })
//
//  dirty(someTag); // also invalidates 'tag';
export function debugTracker(current: Tracker, _parent: Option<Tracker>) {
  if (!getTrackingInfo().isRecording) return;

  // In what scenarios would we get here with nothing on the tracker?
  if (!(current as any).last) return;

  // Put into "revision" buckets, based on "lastChecked"
  // (because the revision of a tag may not have changed if the value didn't changed
  //  but last-checked is the last revision to inspect it)
  let lastChecked = `${(current as any).last.lastChecked}`;

  // Convert the Tracker to an isolated moment in time
  // hack around tags being a private field
  let tags = Array.from((current as any).tags.values()) as Tag[];

  let trackerSnapshot = normalizeTags(tags);

  let currentBatch = getTrackingInfo().history[lastChecked];
  let batch = currentBatch || [];

  batch.push(trackerSnapshot);

  Ember.EMBER_DEBUG.TRACKING.history[lastChecked] = batch;
}

function prettyPrintTrackingInfo() {
  let history = getTrackingInfo().history;
  let revisions = Object.keys(history)
    .map(revision => parseInt(revision, 10))
    .sort((a, b) => a - b);

  let i;
  let currentRevision: number;
  let currentBatch: TrackerSnapshot[];
  let changedTag: TrackerSnapshot;

  for (i = 0; i < revisions.length; i++) {
    currentRevision = revisions[i];
    currentBatch = history[currentRevision] || [];

    if (`${currentRevision}` === '1') {
      continue;
    }

    // eslint-disable-next-line no-console
    console.log(`[Revision: ${currentRevision}]`, currentBatch);
    changedTag = currentBatch[0];

    currentBatch.forEach((tracker, idx: number) => {
      let { objectName, propertyName, objectId } = tracker.tag;

      if (tracker.dependencies.length === 0) {
        // eslint-disable-next-line no-console
        console.log(`  #${idx}: ${propertyName} on ${objectName} (#${objectId}) has been set!`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`  #${idx}: ${propertyName} on ${objectName} (#${objectId}) has changed!`);

        printDependents(changedTag, tracker.dependencies);
      }
    });
  }
}

function printDependents(rootTag: TrackerSnapshot, dependencies: TagSnapshot[], indent = 6) {
  if (!dependencies || dependencies.length === 0) return;

  let indentation = ' '.repeat(indent);

  dependencies.forEach(dependency => {
    let isChangedProperty = rootTag.tag.propertyName === dependency.propertyName;

    if (!dependency.objectRef && !dependency.propertyName) {
      // eslint-disable-next-line no-console
      console.log(`${indentation} Intermediate Tracking Tag @ rev: ${dependency.revision}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `${indentation}Dependency: ${dependency.propertyName} ` +
          `(rev: ${dependency.revision}) on ` +
          `${dependency.objectName} ` +
          `${isChangedProperty ? 'changed' : 'did not change'}`
      );
    }

    printDependents(rootTag, dependency.dependencies, indent + 2);
  });
}

Ember.EMBER_DEBUG.TRACKING.print = prettyPrintTrackingInfo;

function normalizeTags(tags: any[]): TrackerSnapshot {
  let [tag, ...trackedDependents] = tags;

  let normalizedDependents = normalizeDependents(tag, trackedDependents);

  let normalizedTag = toTagSnapshot(tag);

  return {
    tag: normalizedTag,
    dependencies: normalizedDependents,
    all: tags,
  } as TrackerSnapshot;
}

function normalizeDependents(root: any, dependencies?: any) {
  let result: any[] = [];

  result = result.concat(dependencies);
  result = result.concat(root.subtag);
  result = result.concat(root.subtags);

  return result
    .flat()
    .filter((item?: Tag) => item) // filter out falsey
    .map(toTagSnapshot)
    .map((snapshot: TagSnapshot) => {
      let subDependents = normalizeDependents(snapshot.tag);

      snapshot.dependencies = subDependents;

      return snapshot;
    });
}

function getOrAssignId(obj: object) {
  if (!obj) {
    return undefined;
  }

  let map = getTrackingInfo().objectMap;
  let id = map.get(obj);

  if (!id) {
    map.set(obj, ++objectId);
  }

  id = map.get(obj);

  return id;
}

function toTagSnapshot(tag: any): TagSnapshot {
  let hostObject = tag.key ? tag.ref.parentValue : tag._object;

  let objectId = getOrAssignId(hostObject);

  let result: Partial<TagSnapshot> = {
    objectName: hostObject && hostObject.__proto__.constructor.name,
    objectRef: hostObject,
    objectId,
    revision: tag.revision,
    lastChecked: tag.lastChecked,
    tag,
  };

  result.propertyName = tag.key || tag._propertyKey;

  return result as TagSnapshot;
}
