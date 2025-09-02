import { setModifierManager as setModifierManager$1 } from '../../@glimmer/manager/index.js';
export { modifierCapabilities as capabilities } from '../../@glimmer/manager/index.js';
export { on } from './on.js';
import '../../@glimmer/opcode-compiler/index.js';
import '../-internals/glimmer/lib/templates/root.js';
import '../-internals/glimmer/lib/helper.js';
import '../-internals/glimmer/lib/renderer.js';
import '../../shared-chunks/registry-CU7X7HvH.js';
import '../debug/index.js';
import '../../@glimmer/runtime/index.js';
import '@embroider/macros';
import '../runloop/index.js';
import '../../@glimmer/reference/index.js';
import '../../@glimmer/validator/index.js';
import '../-internals/glimmer/lib/helpers/unique-id.js';

// NOTE: this uses assignment to *require* that the `glimmerSetModifierManager`
// is legally assignable to this type, i.e. that variance is properly upheld.
const setModifierManager = setModifierManager$1;

export { setModifierManager };
