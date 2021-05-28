/**
@module ember
*/
import { importSync, moduleExists } from '@embroider/macros';
import { EmberPrecompileOptions } from '../types';
import precompile from './precompile';

// FIXME
type StaticTemplate = unknown;
type Factory = any;
type InternalGlimmer = any;

let template: (templateJS: StaticTemplate) => Factory;

/**
  Uses HTMLBars `compile` function to process a string into a compiled template.
  This is not present in production builds.
  @private
  @method compile
  @param {String} templateString This is the string to be compiled by HTMLBars.
  @param {Object} options This is an options hash to augment the compiler options.
*/
export default function compile(
  templateString: string,
  options: Partial<EmberPrecompileOptions> = {}
): Factory {
  if (!template && moduleExists('@ember/-internals/glimmer')) {
    // tslint:disable-next-line:no-require-imports
    template = (importSync('@ember/-internals/glimmer') as InternalGlimmer).template;
  }

  if (!template) {
    throw new Error(
      'Cannot call `compile` with only the template compiler loaded. Please load `ember.debug.js` or `ember.prod.js` prior to calling `compile`.'
    );
  }

  return template(evaluate(precompile(templateString, options)));
}

function evaluate(precompiled: string): StaticTemplate {
  return new Function(`return ${precompiled}`)();
}
