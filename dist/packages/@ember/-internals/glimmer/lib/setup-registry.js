import { p as privatize } from '../../../../shared-chunks/registry-CU7X7HvH.js';
import { getOwner } from '../../owner/index.js';
import '../../../debug/index.js';
import { clientBuilder, rehydrationBuilder } from '../../../../@glimmer/runtime/index.js';
import { serializeBuilder } from '../../../../@glimmer/node/index.js';
import { Renderer } from './renderer.js';
import RootTemplate from './templates/root.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../debug/lib/assert.js';

function setupApplicationRegistry(registry) {
  // because we are using injections we can't use instantiate false
  // we need to use bind() to copy the function so factory for
  // association won't leak
  registry.register('service:-dom-builder', {
    // Additionally, we *must* constrain this to require `props` on create, else
    // we *know* it cannot have an owner.
    create(props) {
      let owner = getOwner(props);
      (isDevelopingApp() && !(owner) && assert('DomBuilderService is unexpectedly missing an owner', owner));
      let env = owner.lookup('-environment:main');
      switch (env._renderMode) {
        case 'serialize':
          return serializeBuilder.bind(null);
        case 'rehydrate':
          return rehydrationBuilder.bind(null);
        default:
          return clientBuilder.bind(null);
      }
    }
  });
  registry.register(privatize`template:-root`, RootTemplate);
  registry.register('renderer:-dom', Renderer);
}
function setupEngineRegistry(registry) {
  registry.optionsForType('template', {
    instantiate: false
  });
  registry.optionsForType('helper', {
    instantiate: false
  });
}

export { setupApplicationRegistry, setupEngineRegistry };
