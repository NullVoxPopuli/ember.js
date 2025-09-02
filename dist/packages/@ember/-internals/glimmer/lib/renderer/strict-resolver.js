import { BUILTIN_HELPERS, BUILTIN_KEYWORD_HELPERS } from '../resolver.js';

///////////

/**
 * Resolution for non built ins is now handled by the vm as we are using strict mode
 */
class StrictResolver {
  lookupHelper(name, _owner) {
    return BUILTIN_HELPERS[name] ?? null;
  }
  lookupBuiltInHelper(name) {
    return BUILTIN_KEYWORD_HELPERS[name] ?? null;
  }
  lookupModifier(_name, _owner) {
    return null;
  }
  lookupComponent(_name, _owner) {
    return null;
  }
  lookupBuiltInModifier(_name) {
    return null;
  }
}

export { StrictResolver };
