import { getInternalHelperManager, getInternalModifierManager, getInternalComponentManager, capabilityFlagsFrom, getComponentTemplate, managerHasCapability } from '../manager/index.js';
import { templateFactory } from '../opcode-compiler/index.js';
import { enumerate } from '../util/index.js';
import { InternalComponentCapabilities, MACHINE_MASK, OPERAND_LEN_MASK, ARG_SHIFT, TYPE_MASK } from '../vm/index.js';
import { SexpOpcodes as opcodes } from '../wire-format/index.js';

function unwrapTemplate(template) {
  if ("error" === template.result) throw new Error(`Compile Error: ${template.problem} @ ${template.span.start}..${template.span.end}`);
  return template;
}

/**
 * Default component template, which is a plain yield
 */
const DEFAULT_TEMPLATE_BLOCK = [[[opcodes.Yield, 1, null]], ["&default"], []],
  DEFAULT_TEMPLATE = {
    // random uuid
    id: "1b32f5c2-7623-43d6-a0ad-9672898920a1",
    moduleName: "__default__.hbs",
    block: JSON.stringify(DEFAULT_TEMPLATE_BLOCK),
    scope: null,
    isStrictMode: true
  },
  WELL_KNOWN_EMPTY_ARRAY = Object.freeze([]),
  STARTER_CONSTANTS = [false, true, null, void 0, WELL_KNOWN_EMPTY_ARRAY],
  WELL_KNOWN_EMPTY_ARRAY_POSITION = STARTER_CONSTANTS.indexOf(WELL_KNOWN_EMPTY_ARRAY);
class ConstantsImpl {
  value(value) {
    let indexMap = this.indexMap,
      index = indexMap.get(value);
    return void 0 === index && (index = this.values.push(value) - 1, indexMap.set(value, index)), index;
  }
  array(values) {
    if (0 === values.length) return WELL_KNOWN_EMPTY_ARRAY_POSITION;
    let handles = new Array(values.length);
    for (let i = 0; i < values.length; i++) handles[i] = this.value(values[i]);
    return this.value(handles);
  }
  toPool() {
    return this.values;
  }
  hasHandle(handle) {
    return this.values.length > handle;
  }
  helper(definitionState,
  // TODO: Add a way to expose resolved name for debugging
  _resolvedName = null, isOptional) {
    let handle = this.helperDefinitionCache.get(definitionState);
    if (void 0 === handle) {
      let managerOrHelper = getInternalHelperManager(definitionState, isOptional);
      if (null === managerOrHelper) return this.helperDefinitionCache.set(definitionState, null), null;
      let helper = "function" == typeof managerOrHelper ? managerOrHelper : managerOrHelper.getHelper(definitionState);
      handle = this.value(helper), this.helperDefinitionCache.set(definitionState, handle), this.helperDefinitionCount++;
    }
    return handle;
  }
  modifier(definitionState, resolvedName = null, isOptional) {
    let handle = this.modifierDefinitionCache.get(definitionState);
    if (void 0 === handle) {
      let manager = getInternalModifierManager(definitionState, isOptional);
      if (null === manager) return this.modifierDefinitionCache.set(definitionState, null), null;
      let definition = {
        resolvedName: resolvedName,
        manager: manager,
        state: definitionState
      };
      handle = this.value(definition), this.modifierDefinitionCache.set(definitionState, handle), this.modifierDefinitionCount++;
    }
    return handle;
  }
  component(definitionState, owner, isOptional, debugName) {
    let definition = this.componentDefinitionCache.get(definitionState);
    if (void 0 === definition) {
      let manager = getInternalComponentManager(definitionState, isOptional);
      if (null === manager) return this.componentDefinitionCache.set(definitionState, null), null;
      let template,
        capabilities = capabilityFlagsFrom(manager.getCapabilities(definitionState)),
        templateFactory = getComponentTemplate(definitionState),
        compilable = null;
      template = managerHasCapability(manager, capabilities, InternalComponentCapabilities.dynamicLayout) ? templateFactory?.(owner) : templateFactory?.(owner) ?? this.defaultTemplate, void 0 !== template && (template = unwrapTemplate(template), compilable = managerHasCapability(manager, capabilities, InternalComponentCapabilities.wrapped) ? template.asWrappedLayout() : template.asLayout()), definition = {
        resolvedName: null,
        handle: -1,
        manager: manager,
        capabilities: capabilities,
        state: definitionState,
        compilable: compilable
      }, definition.handle = this.value(definition), debugName && (definition.debugName = debugName), this.componentDefinitionCache.set(definitionState, definition), this.componentDefinitionCount++;
    }
    return definition;
  }
  resolvedComponent(resolvedDefinition, resolvedName) {
    let definition = this.componentDefinitionCache.get(resolvedDefinition);
    if (void 0 === definition) {
      let {
          manager: manager,
          state: state,
          template: template
        } = resolvedDefinition,
        capabilities = capabilityFlagsFrom(manager.getCapabilities(resolvedDefinition)),
        compilable = null;
      managerHasCapability(manager, capabilities, InternalComponentCapabilities.dynamicLayout) || (template = template ?? this.defaultTemplate), null !== template && (template = unwrapTemplate(template), compilable = managerHasCapability(manager, capabilities, InternalComponentCapabilities.wrapped) ? template.asWrappedLayout() : template.asLayout()), definition = {
        resolvedName: resolvedName,
        handle: -1,
        manager: manager,
        capabilities: capabilities,
        state: state,
        compilable: compilable
      }, definition.handle = this.value(definition), this.componentDefinitionCache.set(resolvedDefinition, definition), this.componentDefinitionCount++;
    }
    return definition;
  }
  getValue(index) {
    return this.values[index];
  }
  getArray(index) {
    let reifiedArrs = this.reifiedArrs,
      reified = reifiedArrs[index];
    if (void 0 === reified) {
      let names = this.getValue(index);
      reified = new Array(names.length);
      for (const [i, name] of enumerate(names)) reified[i] = this.getValue(name);
      reifiedArrs[index] = reified;
    }
    return reified;
  }
  constructor() {
    this.reifiedArrs = {
      [WELL_KNOWN_EMPTY_ARRAY_POSITION]: WELL_KNOWN_EMPTY_ARRAY
    }, this.defaultTemplate = templateFactory(DEFAULT_TEMPLATE)(),
    // Used for tests and debugging purposes, and to be able to analyze large apps
    // This is why it's enabled even in production
    this.helperDefinitionCount = 0, this.modifierDefinitionCount = 0, this.componentDefinitionCount = 0, this.values = STARTER_CONSTANTS.slice(), this.indexMap = new Map(this.values.map((value, index) => [value, index])), this.helperDefinitionCache = new WeakMap(), this.modifierDefinitionCache = new WeakMap(), this.componentDefinitionCache = new WeakMap();
  }
}
class RuntimeOpImpl {
  constructor(heap) {
    this.heap = heap, this.offset = 0;
  }
  get size() {
    return 1 + ((this.heap.getbyaddr(this.offset) & OPERAND_LEN_MASK) >> ARG_SHIFT);
  }
  get isMachine() {
    return this.heap.getbyaddr(this.offset) & MACHINE_MASK ? 1 : 0;
  }
  get type() {
    return this.heap.getbyaddr(this.offset) & TYPE_MASK;
  }
  get op1() {
    return this.heap.getbyaddr(this.offset + 1);
  }
  get op2() {
    return this.heap.getbyaddr(this.offset + 2);
  }
  get op3() {
    return this.heap.getbyaddr(this.offset + 3);
  }
}

/**
 * The Program Heap is responsible for dynamically allocating
 * memory in which we read/write the VM's instructions
 * from/to. When we malloc we pass out a VMHandle, which
 * is used as an indirect way of accessing the memory during
 * execution of the VM. Internally we track the different
 * regions of the memory in an int array known as the table.
 *
 * The table 32-bit aligned and has the following layout:
 *
 * | ... | hp (u32) |       info (u32)   | size (u32) |
 * | ... |  Handle  | Scope Size | State | Size       |
 * | ... | 32bits   | 30bits     | 2bits | 32bit      |
 *
 * With this information we effectively have the ability to
 * control when we want to free memory. That being said you
 * can not free during execution as raw address are only
 * valid during the execution. This means you cannot close
 * over them as you will have a bad memory access exception.
 */
class ProgramHeapImpl {
  constructor() {
    this.offset = 0, this.handle = 0, this.heap = new Int32Array(1048576), this.handleTable = [], this.handleState = [];
  }
  entries() {
    return this.offset;
  }
  pushRaw(value) {
    this.sizeCheck(), this.heap[this.offset++] = value;
  }
  pushOp(item) {
    this.pushRaw(item);
  }
  pushMachine(item) {
    this.pushRaw(item | MACHINE_MASK);
  }
  sizeCheck() {
    let {
      heap: heap
    } = this;
    if (this.offset === this.heap.length) {
      let newHeap = new Int32Array(heap.length + 1048576);
      newHeap.set(heap, 0), this.heap = newHeap;
    }
  }
  getbyaddr(address) {
    return this.heap[address];
  }
  setbyaddr(address, value) {
    this.heap[address] = value;
  }
  malloc() {
    // push offset, info, size
    return this.handleTable.push(this.offset), this.handleTable.length - 1;
  }
  finishMalloc(handle) {}
  size() {
    return this.offset;
  }
  // It is illegal to close over this address, as compaction
  // may move it. However, it is legal to use this address
  // multiple times between compactions.
  getaddr(handle) {
    return this.handleTable[handle];
  }
  sizeof(handle) {
    return this.handleTable, -1;
  }
  free(handle) {
    this.handleState[handle] = 1;
  }
  /**
  * The heap uses the [Mark-Compact Algorithm](https://en.wikipedia.org/wiki/Mark-compact_algorithm) to shift
  * reachable memory to the bottom of the heap and freeable
  * memory to the top of the heap. When we have shifted all
  * the reachable memory to the top of the heap, we move the
  * offset to the next free position.
  */
  compact() {
    let compactedSize = 0,
      {
        handleTable: handleTable,
        handleState: handleState,
        heap: heap
      } = this;
    for (let i = 0; i < length; i++) {
      let offset = handleTable[i],
        size = handleTable[i + 1] - offset,
        state = handleState[i];
      if (2 !== state) if (1 === state)
        // transition to "already freed" aka "purged"
        // a good improvement would be to reuse
        // these slots
        handleState[i] = 2, compactedSize += size;else if (0 === state) {
        for (let j = offset; j <= i + size; j++) heap[j - compactedSize] = heap[j];
        handleTable[i] = offset - compactedSize;
      } else 3 === state && (handleTable[i] = offset - compactedSize);
    }
    this.offset = this.offset - compactedSize;
  }
}
class ProgramImpl {
  constructor(constants, heap) {
    this.constants = constants, this.heap = heap, this._opcode = new RuntimeOpImpl(this.heap);
  }
  opcode(offset) {
    return this._opcode.offset = offset, this._opcode;
  }
}
function artifacts() {
  return {
    constants: new ConstantsImpl(),
    heap: new ProgramHeapImpl()
  };
}

export { ConstantsImpl, ProgramHeapImpl, ProgramImpl, RuntimeOpImpl, artifacts };
