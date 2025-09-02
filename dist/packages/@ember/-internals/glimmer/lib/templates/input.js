import { on } from '../../../../modifier/on.js';
import { templateFactory } from '../../../../../@glimmer/opcode-compiler/index.js';

const input = templateFactory(
/*
  <input
  {{!-- for compatibility --}}
  id={{this.id}}
  class={{this.class}}

  ...attributes

  type={{this.type}}
  checked={{this.checked}}
  value={{this.value}}

  {{on "change" this.change}}
  {{on "input" this.input}}
  {{on "keyup" this.keyUp}}
  {{on "paste" this.valueDidChange}}
  {{on "cut" this.valueDidChange}}
/>
*/
{
  "id": "Cc/BCoQJ",
  "block": "[[[11,\"input\"],[16,1,[30,0,[\"id\"]]],[16,0,[30,0,[\"class\"]]],[17,1],[16,4,[30,0,[\"type\"]]],[16,\"checked\",[30,0,[\"checked\"]]],[16,2,[30,0,[\"value\"]]],[4,[32,0],[\"change\",[30,0,[\"change\"]]],null],[4,[32,0],[\"input\",[30,0,[\"input\"]]],null],[4,[32,0],[\"keyup\",[30,0,[\"keyUp\"]]],null],[4,[32,0],[\"paste\",[30,0,[\"valueDidChange\"]]],null],[4,[32,0],[\"cut\",[30,0,[\"valueDidChange\"]]],null],[12],[13]],[\"&attrs\"],[]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/input.hbs",
  "scope": () => [on],
  "isStrictMode": true
});

export { input as default };
