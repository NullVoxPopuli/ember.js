import { isDevelopingApp } from '@embroider/macros';

//////////
/**
 * Schedules a VM revalidation.
 *
 * Note: this has a default value so that tags can warm themselves when first loaded.
 */
let scheduleDestroy,
  scheduleDestroyed,
  toIterator,
  toBool,
  getProp,
  setProp,
  getPath,
  setPath,
  warnIfStyleNotTrusted,
  assert,
  deprecate,
  scheduleRevalidate = () => {};

/**
 * Schedules a destructor to run
 *
 * @param destroyable The destroyable being destroyed
 * @param destructor The destructor being scheduled
 */
function debugAssert(test, msg, options) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  isDevelopingApp() && assert && assert(test, "string" == typeof msg ? msg : msg(), options);
}

/**
 * Hook to customize deprecation messages in the VM. Usages can be stripped out
 * by using the @glimmer/vm-babel-plugins package.
 */
let assertGlobalContextWasSet,
  testOverrideGlobalContext,
  globalContextWasSet = false;
function setGlobalContext(context) {
  if (isDevelopingApp()) {
    if (globalContextWasSet) throw new Error("Attempted to set the global context twice. This should only be set once.");
    globalContextWasSet = true;
  }
  scheduleRevalidate = context.scheduleRevalidate, scheduleDestroy = context.scheduleDestroy, scheduleDestroyed = context.scheduleDestroyed, toIterator = context.toIterator, toBool = context.toBool, getProp = context.getProp, setProp = context.setProp, getPath = context.getPath, setPath = context.setPath, warnIfStyleNotTrusted = context.warnIfStyleNotTrusted, assert = context.assert, deprecate = context.deprecate;
}
isDevelopingApp() && (assertGlobalContextWasSet = () => {
  if (!globalContextWasSet) throw new Error("The global context for Glimmer VM was not set. You must set these global context functions to let Glimmer VM know how to accomplish certain operations. You can do this by importing `setGlobalContext` from `@glimmer/global-context`");
}, testOverrideGlobalContext = context => {
  let originalGlobalContext = globalContextWasSet ? {
    scheduleRevalidate: scheduleRevalidate,
    scheduleDestroy: scheduleDestroy,
    scheduleDestroyed: scheduleDestroyed,
    toIterator: toIterator,
    toBool: toBool,
    getProp: getProp,
    setProp: setProp,
    getPath: getPath,
    setPath: setPath,
    warnIfStyleNotTrusted: warnIfStyleNotTrusted,
    assert: assert,
    deprecate: deprecate
  } : null;
  return globalContextWasSet = null !== context,
  // We use `undefined as any` here to unset the values when resetting the
  // context at the end of a test.
  scheduleRevalidate = context?.scheduleRevalidate || void 0, scheduleDestroy = context?.scheduleDestroy || void 0, scheduleDestroyed = context?.scheduleDestroyed || void 0, toIterator = context?.toIterator || void 0, toBool = context?.toBool || void 0, getProp = context?.getProp || void 0, setProp = context?.setProp || void 0, getPath = context?.getPath || void 0, setPath = context?.setPath || void 0, warnIfStyleNotTrusted = context?.warnIfStyleNotTrusted || void 0, assert = context?.assert || void 0, deprecate = context?.deprecate || void 0, originalGlobalContext;
});

export { assert, assertGlobalContextWasSet, debugAssert, setGlobalContext as default, deprecate, getPath, getProp, scheduleDestroy, scheduleDestroyed, scheduleRevalidate, setPath, setProp, testOverrideGlobalContext, toBool, toIterator, warnIfStyleNotTrusted };
