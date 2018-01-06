import { assert } from 'ember-debug';
import { ENV } from 'ember-environment';
import { textAreaMacro } from './syntax/-text-area';
import {
  blockComponentMacro,
  inlineComponentMacro,
} from './syntax/dynamic-component';
import { inputMacro } from './syntax/input';
import { mountMacro } from './syntax/mount';
import { outletMacro } from './syntax/outlet';
import { renderMacro } from './syntax/render';
import { hashToArgs } from './syntax/utils';
import { blockLetMacro } from './syntax/let';
import { wrapComponentClassAttribute } from './utils/bindings';
import { EMBER_TEMPLATE_BLOCK_LET_HELPER } from 'ember/features';

function refineInlineSyntax(name: string, params: any[], hash: any, builder: any) {
  assert(`You attempted to overwrite the built-in helper "${name}" which is not allowed. Please rename the helper.`, !(builder.env.builtInHelpers[name] && builder.env.owner.hasRegistration(`helper:${name}`)));

  let definition;
  if (name.indexOf('-') > -1) {
    definition = builder.env.getComponentDefinition(name, builder.meta.templateMeta);
  }

  if (definition) {
    wrapComponentClassAttribute(hash);
    builder.component.static(definition, [params, hashToArgs(hash), null, null]);
    return true;
  }

  return false;
}

function refineBlockSyntax(name: string, params: any[], hash: any, _default: any, inverse: any, builder: any) {
  if (name.indexOf('-') === -1) {
    return false;
  }

  let meta = builder.meta.templateMeta;

  let definition;
  if (name.indexOf('-') > -1) {
    definition = builder.env.getComponentDefinition(name, meta);
  }

  if (definition) {
    wrapComponentClassAttribute(hash);
    builder.component.static(definition, [params, hashToArgs(hash), _default, inverse]);
    return true;
  }

  assert(`A component or helper named "${name}" could not be found`, builder.env.hasHelper(name, meta));

  assert(`Helpers may not be used in the block form, for example {{#${name}}}{{/${name}}}. Please use a component, or alternatively use the helper in combination with a built-in Ember helper, for example {{#if (${name})}}{{/if}}.`, !builder.env.hasHelper(name, meta));

  return false;
}

export const experimentalMacros: any[] = [];

// This is a private API to allow for experimental macros
// to be created in user space. Registering a macro should
// should be done in an initializer.
export function registerMacros(macro: any) {
  experimentalMacros.push(macro);
}

export function populateMacros(blocks: any, inlines: any) {
  inlines.add('outlet', outletMacro);
  inlines.add('component', inlineComponentMacro);

  if (ENV._ENABLE_RENDER_SUPPORT === true) {
    inlines.add('render', renderMacro);
  }

  inlines.add('mount', mountMacro);
  inlines.add('input', inputMacro);
  inlines.add('textarea', textAreaMacro);
  inlines.addMissing(refineInlineSyntax);
  blocks.add('component', blockComponentMacro);
  if (EMBER_TEMPLATE_BLOCK_LET_HELPER === true) {
    blocks.add('let', blockLetMacro);
  }
  blocks.addMissing(refineBlockSyntax);

  for (let i = 0; i < experimentalMacros.length; i++) {
    let macro = experimentalMacros[i];
    macro(blocks, inlines);
  }

  return { blocks, inlines };
}
