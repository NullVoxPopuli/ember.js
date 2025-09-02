import { on } from '../../../../modifier/on.js';
import { templateFactory } from '../../../../../@glimmer/opcode-compiler/index.js';

const textarea = templateFactory(
/*
  <textarea
  {{!-- for compatibility --}}
  id={{this.id}}
  class={{this.class}}

  ...attributes

  value={{this.value}}

  {{on "change" this.change}}
  {{on "input" this.input}}
  {{on "keyup" this.keyUp}}
  {{on "paste" this.valueDidChange}}
  {{on "cut" this.valueDidChange}}
/>
*/
{
  "id": "KVdeMchh",
  "block": "[[[11,\"textarea\"],[16,1,[30,0,[\"id\"]]],[16,0,[30,0,[\"class\"]]],[17,1],[16,2,[30,0,[\"value\"]]],[4,[32,0],[\"change\",[30,0,[\"change\"]]],null],[4,[32,0],[\"input\",[30,0,[\"input\"]]],null],[4,[32,0],[\"keyup\",[30,0,[\"keyUp\"]]],null],[4,[32,0],[\"paste\",[30,0,[\"valueDidChange\"]]],null],[4,[32,0],[\"cut\",[30,0,[\"valueDidChange\"]]],null],[12],[13]],[\"&attrs\"],[]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/textarea.hbs",
  "scope": () => [on],
  "isStrictMode": true
});

export { textarea as default };
