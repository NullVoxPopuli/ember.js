import {getOwner as glimmerGetOwner, setOwner as glimmerSetOwner} from '@glimmer/owner';
import {assert} from '@ember/debug';
import {DEBUG} from '@glimmer/env';

/**
@module @ember/application
*/

export interface LookupOptions {
  singleton?: boolean;
  instantiate?: boolean;
}

export interface FactoryClass {
  positionalParams?: string | string[] | undefined | null;
}

export interface Factory<T, C extends FactoryClass | object = FactoryClass> {
  class?: C;
  name?: string;
  fullName?: string;
  normalizedName?: string;
  create(props?: {[prop: string]: any}): T;
}

export interface EngineInstanceOptions {
  mountPoint: string;
  routable: boolean;
}

import EngineInstance from '@ember/engine/instance';
export interface Owner {
  lookup<T>(fullName: string, options?: LookupOptions): T | undefined;
  factoryFor<T, C>(fullName: string, options?: LookupOptions): Factory<T, C> | undefined;
  factoryFor(fullName: string, options?: LookupOptions): Factory<any, any> | undefined;
  buildChildEngineInstance(name: string, options?: EngineInstanceOptions): EngineInstance;
  register<T, C>(fullName: string, factory: Factory<T, C>, options?: object): void;
  hasRegistration(name: string, options?: LookupOptions): boolean;
  mountPoint?: string;
  routable?: boolean;
}

/**
  Framework objects in an Ember application (components, services, routes, etc.)
  are created via a factory and dependency injection system. Each of these
  objects is the responsibility of an "owner", which handled its
  instantiation and manages its lifetime.

  `getOwner` fetches the owner object responsible for an instance. This can
  be used to lookup or resolve other class instances, or register new factories
  into the owner.

  For example, this component dynamically looks up a service based on the
  `audioType` passed as an argument:

  ```app/components/play-audio.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';
  import { getOwner } from '@ember/application';

  // Usage:
  //
  //   <PlayAudio @audioType={{@model.audioType}} @audioFile={{@model.file}}/>
  //
  export default class extends Component {
    get audioService() {
      let owner = getOwner(this);
      return owner.lookup(`service:${this.args.audioType}`);
    }

    @action
    onPlay() {
      let player = this.audioService;
      player.play(this.args.audioFile);
    }
  }
  ```

  @method getOwner
  @static
  @for @ember/application
  @param {Object} object An object with an owner.
  @return {Owner} An owner object.
  @since 2.3.0
  @public
*/
export function getOwner(object: any): Owner {
  return glimmerGetOwner(object) as Owner;
}

/**
  `setOwner` forces a new owner on a given object instance. This is primarily
  useful in some testing cases.

  @method setOwner
  @static
  @for @ember/application
  @param {Object} object An object instance.
  @param {Object} object The new owner object of the object instance.
  @since 2.3.0
  @public
*/
export function setOwner(object: any, owner: Owner): void {
  if (DEBUG) {
    let publicApiType = owner as any;

    assert(`Expected owner to be truthy`, publicApiType);
    assert('Passed owner must have a function, `lookup`', typeof publicApiType.lookup === 'function');
    assert('Passed owner must have a function, `factoryFor`', typeof publicApiType.factoryFor === 'function');
    assert('Passed owner must have a function, `register`', typeof publicApiType.register === 'function');
    assert('Passed owner must have a function, `hasRegistration`', typeof publicApiType.hasRegistration === 'function');
    assert(`Expected owner to match the Owner's buildChildEngineInstance`, typeof publicApiType.buildChildEngineInstance === 'function');
  }

  glimmerSetOwner(object, owner);
}
