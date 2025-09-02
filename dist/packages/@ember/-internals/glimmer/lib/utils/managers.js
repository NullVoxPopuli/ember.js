import { setComponentManager as setComponentManager$1 } from '../../../../../@glimmer/manager/index.js';
export { componentCapabilities, modifierCapabilities } from '../../../../../@glimmer/manager/index.js';

/**
   Associate a class with a component manager (an object that is responsible for
   coordinating the lifecycle events that occurs when invoking, rendering and
   re-rendering a component).

   @method setComponentManager
   @param {Function} factory a function to create the owner for an object
   @param {Object} obj the object to associate with the componetn manager
   @return {Object} the same object passed in
   @public
  */
function setComponentManager(manager, obj) {
  return setComponentManager$1(manager, obj);
}

export { setComponentManager };
