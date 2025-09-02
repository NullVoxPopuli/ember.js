import { warn } from '@ember/debug';

interface Library {
  readonly name: string;
  readonly version: string;
}

/**
 @module ember
*/
/**
  Helper class that allows you to register your library with Ember.

  Singleton created at `Ember.libraries`.

  @class Libraries
  @constructor
  @private
*/
export class Libraries {
  readonly _registry: Library[];
  _coreLibIndex: number;

  constructor() {
    this._registry = [];
    this._coreLibIndex = 0;
  }

  _getLibraryByName(name: string): Library | undefined {
    let libs = this._registry;

    for (let lib of libs) {
      if (lib.name === name) {
        return lib;
      }
    }
    return undefined;
  }

  register(name: string, version: string, isCoreLibrary?: boolean): void {
    let index = this._registry.length;

    if (!this._getLibraryByName(name)) {
      if (isCoreLibrary) {
        index = this._coreLibIndex++;
      }
      this._registry.splice(index, 0, { name, version });
    } else {
      warn(`Library "${name}" is already registered with Ember.`, false, {
        id: 'ember-metal.libraries-register',
      });
    }
  }

  registerCoreLibrary(name: string, version: string): void {
    this.register(name, version, true);
  }

  deRegister(name: string): void {
    let lib = this._getLibraryByName(name);
    let index;

    if (lib) {
      index = this._registry.indexOf(lib);
      this._registry.splice(index, 1);
    }
  }

  declare isRegistered?: (name: string) => boolean;
  declare logVersions?: () => void;
}

const LIBRARIES = new Libraries();

export default LIBRARIES;
