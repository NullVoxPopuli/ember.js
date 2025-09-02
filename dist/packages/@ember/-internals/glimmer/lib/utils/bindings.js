import '../../../../debug/index.js';
import { dasherize } from '../../../string/index.js';
import { createComputeRef, valueForRef, createPrimitiveRef, childRefFor, childRefFromParts } from '../../../../../@glimmer/reference/index.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../../debug/lib/assert.js';

function referenceForParts(rootRef, parts) {
  let isAttrs = parts[0] === 'attrs';

  // TODO deprecate this
  if (isAttrs) {
    parts.shift();
    if (parts.length === 1) {
      return childRefFor(rootRef, parts[0]);
    }
  }
  return childRefFromParts(rootRef, parts);
}
function parseAttributeBinding(microsyntax) {
  let colonIndex = microsyntax.indexOf(':');
  if (colonIndex === -1) {
    (isDevelopingApp() && !(microsyntax !== 'class') && assert('You cannot use class as an attributeBinding, use classNameBindings instead.', microsyntax !== 'class'));
    return [microsyntax, microsyntax, true];
  } else {
    let prop = microsyntax.substring(0, colonIndex);
    let attribute = microsyntax.substring(colonIndex + 1);
    (isDevelopingApp() && !(attribute !== 'class') && assert('You cannot use class as an attributeBinding, use classNameBindings instead.', attribute !== 'class'));
    return [prop, attribute, false];
  }
}
function installAttributeBinding(component, rootRef, parsed, operations) {
  let [prop, attribute, isSimple] = parsed;
  if (attribute === 'id') {
    // SAFETY: `get` could not infer the type of `prop` and just gave us `unknown`.
    //         we may want to throw an error in the future if the value isn't string or null/undefined.
    let elementId = get(component, prop);
    if (elementId === undefined || elementId === null) {
      elementId = component.elementId;
    }
    let elementIdRef = createPrimitiveRef(elementId);
    operations.setAttribute('id', elementIdRef, true, null);
    return;
  }
  let isPath = prop.indexOf('.') > -1;
  let reference = isPath ? referenceForParts(rootRef, prop.split('.')) : childRefFor(rootRef, prop);
  (isDevelopingApp() && !(!(isSimple && isPath)) && assert(`Illegal attributeBinding: '${prop}' is not a valid attribute name.`, !(isSimple && isPath)));
  operations.setAttribute(attribute, reference, false, null);
}
function createClassNameBindingRef(rootRef, microsyntax, operations) {
  let parts = microsyntax.split(':');
  let [prop, truthy, falsy] = parts;
  // NOTE: This could be an empty string
  (isDevelopingApp() && !(prop !== undefined) && assert('has prop', prop !== undefined)); // Will always have at least one part
  let isStatic = prop === '';
  if (isStatic) {
    operations.setAttribute('class', createPrimitiveRef(truthy), true, null);
  } else {
    let isPath = prop.indexOf('.') > -1;
    let parts = isPath ? prop.split('.') : [];
    let value = isPath ? referenceForParts(rootRef, parts) : childRefFor(rootRef, prop);
    let ref;
    if (truthy === undefined) {
      ref = createSimpleClassNameBindingRef(value, isPath ? parts[parts.length - 1] : prop);
    } else {
      ref = createColonClassNameBindingRef(value, truthy, falsy);
    }
    operations.setAttribute('class', ref, false, null);
  }
}
function createSimpleClassNameBindingRef(inner, path) {
  let dasherizedPath;
  return createComputeRef(() => {
    let value = valueForRef(inner);
    if (value === true) {
      (isDevelopingApp() && !(path !== undefined) && assert('You must pass a path when binding a to a class name using classNameBindings', path !== undefined));
      return dasherizedPath || (dasherizedPath = dasherize(path));
    } else if (value || value === 0) {
      return String(value);
    } else {
      return null;
    }
  });
}
function createColonClassNameBindingRef(inner, truthy, falsy) {
  return createComputeRef(() => {
    return valueForRef(inner) ? truthy : falsy;
  });
}

export { createClassNameBindingRef, createColonClassNameBindingRef, createSimpleClassNameBindingRef, installAttributeBinding, parseAttributeBinding };
