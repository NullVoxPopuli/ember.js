import { on } from '../../../../modifier/on.js';
import { templateFactory } from '../../../../../@glimmer/opcode-compiler/index.js';

const linkTo = templateFactory(
/*
  <a
  {{!-- for compatibility --}}
  id={{this.id}}
  class={{this.class}}

  {{!-- deprecated attribute bindings --}}
  role={{this.role}}
  title={{this.title}}
  rel={{this.rel}}
  tabindex={{this.tabindex}}
  target={{this.target}}

  ...attributes

  href={{this.href}}

  {{on 'click' this.click}}
>{{yield}}</a>
*/
{
  "id": "7Z3LFeO/",
  "block": "[[[11,3],[16,1,[30,0,[\"id\"]]],[16,0,[30,0,[\"class\"]]],[16,\"role\",[30,0,[\"role\"]]],[16,\"title\",[30,0,[\"title\"]]],[16,\"rel\",[30,0,[\"rel\"]]],[16,\"tabindex\",[30,0,[\"tabindex\"]]],[16,\"target\",[30,0,[\"target\"]]],[17,1],[16,6,[30,0,[\"href\"]]],[4,[32,0],[\"click\",[30,0,[\"click\"]]],null],[12],[18,2,null],[13]],[\"&attrs\",\"&default\"],[\"yield\"]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/link-to.hbs",
  "scope": () => [on],
  "isStrictMode": true
});

export { linkTo as default };
