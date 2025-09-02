import { registerDestructor, destroy, associateDestroyableChild, _hasDestroyableChildren, isDestroying, isDestroyed, destroyChildren } from '../destroyable/index.js';
import { toBool, warnIfStyleNotTrusted, debugAssert, assertGlobalContextWasSet, setPath, getPath } from '../global-context/index.js';
import { getInternalModifierManager, managerHasCapability, setInternalComponentManager, setInternalModifierManager, getInternalHelperManager, hasInternalComponentManager, hasInternalHelperManager, setInternalHelperManager, hasValue, hasDestroyable } from '../manager/index.js';
import { createConstRef, UNDEFINED_REFERENCE, NULL_REFERENCE, TRUE_REFERENCE, FALSE_REFERENCE, createPrimitiveRef, valueForRef, isConstRef, createComputeRef, childRefFor, createIteratorRef, createIteratorItemRef, updateRef, createDebugAliasRef, isInvokableRef } from '../reference/index.js';
import { isIndexable as isIndexable$1, EMPTY_STRING_ARRAY, dict, enumerate, emptyArray, assign, clearElement, Stack as StackImpl, reverse, isDict } from '../util/index.js';
import { $t0, $t1, $s0, $v0, ContentType, $pc, $ra, $fp, $sp, isLowLevelRegister, InternalComponentCapabilities } from '../vm/index.js';
import { consumeTag, valueForTag, validateTag, CURRENT_TAG, debug, resetTracking, createCache, track, updateTag as UPDATE_TAG, beginTrackFrame, endTrackFrame, getValue, CONSTANT_TAG, INITIAL, createUpdatableTag } from '../validator/index.js';
import { ProgramImpl } from '../program/index.js';
import { getOwner } from '../owner/index.js';
import { isDevelopingApp } from '@embroider/macros';

const NS_MATHML = "http://www.w3.org/1998/Math/MathML",
  NS_SVG = "http://www.w3.org/2000/svg";
let debugToString;
if (isDevelopingApp()) {
  let getFunctionName = fn => {
      let functionName = fn.name;
      if ("" === functionName) {
        let match = /function (\w+)\s*\(/u.exec(String(fn));
        functionName = match && match[1] || "";
      }
      return functionName.replace(/^bound /u, "");
    },
    getObjectName = obj => {
      let name, className;
      // If the class has a decent looking name, and the `toString` is one of the
      // default Ember toStrings, replace the constructor portion of the toString
      // with the class name. We check the length of the class name to prevent doing
      // this when the value is minified.
      return "function" == typeof obj.constructor && (className = getFunctionName(obj.constructor)), "toString" in obj && obj.toString !== Object.prototype.toString && obj.toString !== Function.prototype.toString && (
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      name = obj.toString()), name && /<.*:ember\d+>/u.test(name) && className && "_" !== className[0] && className.length > 2 && "Class" !== className ? name.replace(/<.*:/u, `<${className}:`) : name || className;
    },
    getPrimitiveName = value => String(value);
  debugToString = value => "function" == typeof value ? getFunctionName(value) || "(unknown function)" : "object" == typeof value && null !== value ? getObjectName(value) || "(unknown object)" : getPrimitiveName(value);
}
var debugToString$1 = debugToString;
function castToSimple(node) {
  return function (node) {
    node.nodeType;
  }(node), node;
}
function unwrapHandle(handle) {
  if ("number" == typeof handle) return handle;
  {
    let error = handle.errors[0];
    throw new Error(`Compile Error: ${error.problem} @ ${error.span.start}..${error.span.end}`);
  }
}
function unwrapTemplate(template) {
  if ("error" === template.result) throw new Error(`Compile Error: ${template.problem} @ ${template.span.start}..${template.span.end}`);
  return template;
}

/* eslint-disable @typescript-eslint/no-empty-object-type */
function buildUntouchableThis(source) {
  let context = null;
  if (isDevelopingApp()) {
    let assertOnProperty = property => {
      let access = "symbol" == typeof property || "number" == typeof property ? `[${String(property)}]` : `.${property}`;
      throw new Error(`You accessed \`this${access}\` from a function passed to the ${source}, but the function itself was not bound to a valid \`this\` context. Consider updating to use a bound function (for instance, use an arrow function, \`() => {}\`).`);
    };
    context = new Proxy({}, {
      get(_target, property) {
        assertOnProperty(property);
      },
      set: (_target, property) => (assertOnProperty(property), false),
      has: (_target, property) => (assertOnProperty(property), false)
    });
  }
  return context;
}
function decodeImmediate(num) {
  return (num |= 0) > -536870913 ? function (num) {
    return ~num;
  }(num) : function (num) {
    return 536870912 | num;
  }(num);
}
[1, -1].forEach(x => {
  return decodeImmediate((num = x, (num |= 0) < 0 ? function (num) {
    return -536870913 & num;
  }(num) : function (num) {
    return ~num;
  }(num)));
  var num;
});
const APPEND_OPCODES = new class {
    constructor() {
      // This code is intentionally putting unsafe `null`s into the array that it
      // will intentionally overwrite before anyone can see them.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.evaluateOpcode = new Array(113).fill(null);
    }
    add(name, evaluate, kind = "syscall") {
      this.evaluateOpcode[name] = {
        syscall: "machine" !== kind,
        evaluate: evaluate
      };
    }
    evaluate(vm, opcode, type) {
      let operation = this.evaluateOpcode[type];
      operation.syscall ? (opcode.isMachine, operation.syscall, opcode.isMachine, opcode.type, operation.evaluate(vm, opcode)) : (opcode.isMachine, operation.syscall, opcode.isMachine, opcode.type, operation.evaluate(vm.lowlevel, opcode));
    }
  }(),
  TYPE = Symbol("TYPE"),
  INNER = Symbol("INNER"),
  OWNER = Symbol("OWNER"),
  ARGS = Symbol("ARGS"),
  RESOLVED = Symbol("RESOLVED"),
  CURRIED_VALUES = new WeakSet();
function isCurriedValue(value) {
  return CURRIED_VALUES.has(value);
}
function isCurriedType(value, type) {
  return isCurriedValue(value) && value[TYPE] === type;
}
class CurriedValue {
  /** @internal */constructor(type, inner, owner, args, resolved = false) {
    CURRIED_VALUES.add(this), this[TYPE] = type, this[INNER] = inner, this[OWNER] = owner, this[ARGS] = args, this[RESOLVED] = resolved;
  }
}
function resolveCurriedValue(curriedValue) {
  let positional,
    named,
    definition,
    owner,
    resolved,
    currentWrapper = curriedValue;
  for (;;) {
    let {
      [ARGS]: curriedArgs,
      [INNER]: inner
    } = currentWrapper;
    if (null !== curriedArgs) {
      let {
        named: curriedNamed,
        positional: curriedPositional
      } = curriedArgs;
      curriedPositional.length > 0 && (positional = void 0 === positional ? curriedPositional : curriedPositional.concat(positional)), void 0 === named && (named = []), named.unshift(curriedNamed);
    }
    if (!isCurriedValue(inner)) {
      // Save off the owner that this helper was curried with. Later on,
      // we'll fetch the value of this register and set it as the owner on the
      // new root scope.
      definition = inner, owner = currentWrapper[OWNER], resolved = currentWrapper[RESOLVED];
      break;
    }
    currentWrapper = inner;
  }
  return {
    definition: definition,
    owner: owner,
    resolved: resolved,
    positional: positional,
    named: named
  };
}
function curry(type, spec, owner, args, resolved = false) {
  return new CurriedValue(type, spec, owner, args, resolved);
}
class DynamicScopeImpl {
  constructor(bucket) {
    this.bucket = bucket ? assign({}, bucket) : {};
  }
  get(key) {
    return this.bucket[key];
  }
  set(key, reference) {
    return this.bucket[key] = reference;
  }
  child() {
    return new DynamicScopeImpl(this.bucket);
  }
}
class ScopeImpl {
  static root(owner, {
    self: self,
    size = 0
  }) {
    let refs = new Array(size + 1).fill(UNDEFINED_REFERENCE);
    return new ScopeImpl(owner, refs, null).init({
      self: self
    });
  }
  static sized(owner, size = 0) {
    let refs = new Array(size + 1).fill(UNDEFINED_REFERENCE);
    return new ScopeImpl(owner, refs, null);
  }
  constructor(owner,
  // the 0th slot is `self`
  slots,
  // a single program can mix owners via curried components, and the state lives on root scopes
  callerScope) {
    this.owner = owner, this.slots = slots, this.callerScope = callerScope;
  }
  init({
    self: self
  }) {
    return this.slots[0] = self, this;
  }
  /**
  * @debug
  */
  snapshot() {
    return this.slots.slice();
  }
  getSelf() {
    return this.get(0);
  }
  getSymbol(symbol) {
    return this.get(symbol);
  }
  getBlock(symbol) {
    let block = this.get(symbol);
    return block === UNDEFINED_REFERENCE ? null : block;
  }
  bind(symbol, value) {
    this.set(symbol, value);
  }
  bindSelf(self) {
    this.set(0, self);
  }
  bindSymbol(symbol, value) {
    this.set(symbol, value);
  }
  bindBlock(symbol, value) {
    this.set(symbol, value);
  }
  bindCallerScope(scope) {
    this.callerScope = scope;
  }
  getCallerScope() {
    return this.callerScope;
  }
  child() {
    return new ScopeImpl(this.owner, this.slots.slice(), this.callerScope);
  }
  get(index) {
    if (index >= this.slots.length) throw new RangeError(`BUG: cannot get $${index} from scope; length=${this.slots.length}`);
    return this.slots[index];
  }
  set(index, value) {
    if (index >= this.slots.length) throw new RangeError(`BUG: cannot get $${index} from scope; length=${this.slots.length}`);
    this.slots[index] = value;
  }
}
class CursorImpl {
  constructor(element, nextSibling) {
    this.element = element, this.nextSibling = nextSibling;
  }
}
class ConcreteBounds {
  constructor(parentNode, first, last) {
    this.parentNode = parentNode, this.first = first, this.last = last;
  }
  parentElement() {
    return this.parentNode;
  }
  firstNode() {
    return this.first;
  }
  lastNode() {
    return this.last;
  }
}
function move(bounds, reference) {
  let parent = bounds.parentElement(),
    first = bounds.firstNode(),
    last = bounds.lastNode(),
    current = first;
  for (;;) {
    let next = current.nextSibling;
    if (parent.insertBefore(current, reference), current === last) return next;
    current = next;
  }
}
function clear(bounds) {
  let parent = bounds.parentElement(),
    first = bounds.firstNode(),
    last = bounds.lastNode(),
    current = first;
  for (;;) {
    let next = current.nextSibling;
    if (parent.removeChild(current), current === last) return next;
    current = next;
  }
}

/** @internal */
function hasCustomDebugRenderTreeLifecycle(manager) {
  return "getDebugCustomRenderTree" in manager;
}
let GUID = 0;
class Ref {
  constructor(value) {
    this.id = GUID++, this.value = value;
  }
  get() {
    return this.value;
  }
  release() {
    if (isDevelopingApp() && null === this.value) throw new Error("BUG: double release?");
    this.value = null;
  }
  toString() {
    let label = `Ref ${this.id}`;
    if (null === this.value) return `${label} (released)`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return `${label}: ${this.value}`;
    } catch {
      return label;
    }
  }
}
class DebugRenderTreeImpl {
  begin() {
    this.reset();
  }
  create(state, node) {
    let internalNode = assign({}, node, {
      bounds: null,
      refs: new Set()
    });
    this.nodes.set(state, internalNode), this.appendChild(internalNode, state), this.enter(state);
  }
  update(state) {
    this.enter(state);
  }
  didRender(state, bounds) {
    if (isDevelopingApp() && this.stack.current !== state)
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      throw new Error(`BUG: expecting ${this.stack.current}, got ${state}`);
    this.nodeFor(state).bounds = bounds, this.exit();
  }
  willDestroy(state) {
    this.refs.get(state).release();
  }
  commit() {
    this.reset();
  }
  capture() {
    return this.captureRefs(this.roots);
  }
  reset() {
    if (0 !== this.stack.size) {
      // We probably encountered an error during the rendering loop. This will
      // likely trigger undefined behavior and memory leaks as the error left
      // things in an inconsistent state. It is recommended that the user
      // refresh the page.
      // TODO: We could warn here? But this happens all the time in our tests?
      // Clean up the root reference to prevent errors from happening if we
      // attempt to capture the render tree (Ember Inspector may do this)
      let root = this.stack.toArray()[0],
        ref = this.refs.get(root);
      for (void 0 !== ref && this.roots.delete(ref); !this.stack.isEmpty();) this.stack.pop();
    }
  }
  enter(state) {
    this.stack.push(state);
  }
  exit() {
    if (isDevelopingApp() && 0 === this.stack.size) throw new Error("BUG: unbalanced pop");
    this.stack.pop();
  }
  nodeFor(state) {
    return this.nodes.get(state);
  }
  appendChild(node, state) {
    if (isDevelopingApp() && this.refs.has(state)) throw new Error("BUG: child already appended");
    let parent = this.stack.current,
      ref = new Ref(state);
    if (this.refs.set(state, ref), parent) {
      let parentNode = this.nodeFor(parent);
      parentNode.refs.add(ref), node.parent = parentNode;
    } else this.roots.add(ref);
  }
  captureRefs(refs) {
    let captured = [];
    return refs.forEach(ref => {
      let state = ref.get();
      state ? captured.push(this.captureNode(`render-node:${ref.id}`, state)) : refs.delete(ref);
    }), captured;
  }
  captureNode(id, state) {
    let node = this.nodeFor(state),
      {
        type: type,
        name: name,
        args: args,
        instance: instance,
        refs: refs
      } = node,
      template = this.captureTemplate(node),
      bounds = this.captureBounds(node),
      children = this.captureRefs(refs);
    return {
      id: id,
      type: type,
      name: name,
      args: reifyArgsDebug(args),
      instance: instance,
      template: template,
      bounds: bounds,
      children: children
    };
  }
  captureTemplate({
    template: template
  }) {
    return template || null;
  }
  captureBounds(node) {
    let bounds = node.bounds;
    return {
      parentElement: bounds.parentElement(),
      firstNode: bounds.firstNode(),
      lastNode: bounds.lastNode()
    };
  }
  constructor() {
    this.stack = new StackImpl(), this.refs = new WeakMap(), this.roots = new Set(), this.nodes = new WeakMap();
  }
}
function getDebugName(definition, manager = definition.manager) {
  return definition.resolvedName ?? definition.debugName ?? manager.getDebugName(definition.state);
}
function normalizeStringValue(value) {
  return isEmpty$2(value) ? "" : String(value);
}
function isEmpty$2(value) {
  return null == value || "function" != typeof value.toString;
}
function isIndexable(value) {
  return null !== value && "object" == typeof value;
}
function isSafeString(value) {
  return isIndexable(value) && "function" == typeof value.toHTML;
}
function isString(value) {
  return "string" == typeof value;
}
APPEND_OPCODES.add(39, vm => vm.pushChildScope()), APPEND_OPCODES.add(40, vm => vm.popScope()), APPEND_OPCODES.add(59, vm => vm.pushDynamicScope()), APPEND_OPCODES.add(60, vm => vm.popDynamicScope()), APPEND_OPCODES.add(28, (vm, {
  op1: other
}) => {
  vm.stack.push(vm.constants.getValue(other));
}), APPEND_OPCODES.add(29, (vm, {
  op1: other
}) => {
  vm.stack.push(createConstRef(vm.constants.getValue(other), false));
}), APPEND_OPCODES.add(30, (vm, {
  op1: primitive
}) => {
  let stack = vm.stack;
  if (primitive >= 0) {
    // it is a handle which does not already exist on the stack
    let value = vm.constants.getValue(primitive);
    stack.push(value);
  } else
    // is already an encoded immediate or primitive handle
    stack.push(decodeImmediate(primitive));
}), APPEND_OPCODES.add(31, vm => {
  let ref,
    stack = vm.stack,
    value = stack.pop();
  ref = void 0 === value ? UNDEFINED_REFERENCE : null === value ? NULL_REFERENCE : true === value ? TRUE_REFERENCE : false === value ? FALSE_REFERENCE : createPrimitiveRef(value), stack.push(ref);
}), APPEND_OPCODES.add(33, (vm, {
  op1: register,
  op2: offset
}) => {
  let position = vm.fetchValue(register) - offset;
  vm.stack.dup(position);
}), APPEND_OPCODES.add(34, (vm, {
  op1: count
}) => {
  vm.stack.pop(count);
}), APPEND_OPCODES.add(35, (vm, {
  op1: register
}) => {
  vm.load(register);
}), APPEND_OPCODES.add(36, (vm, {
  op1: register
}) => {
  vm.fetch(register);
}), APPEND_OPCODES.add(58, (vm, {
  op1: _names
}) => {
  let names = vm.constants.getArray(_names);
  vm.bindDynamicScope(names);
}), APPEND_OPCODES.add(69, (vm, {
  op1: args
}) => {
  vm.enter(args);
}), APPEND_OPCODES.add(70, vm => {
  vm.exit();
}), APPEND_OPCODES.add(63, (vm, {
  op1: _table
}) => {
  vm.stack.push(vm.constants.getValue(_table));
}), APPEND_OPCODES.add(62, vm => {
  vm.stack.push(vm.scope());
}), APPEND_OPCODES.add(61, vm => {
  let stack = vm.stack,
    block = stack.pop();
  block ? stack.push(vm.compile(block)) : stack.push(null);
}), APPEND_OPCODES.add(64, vm => {
  let {
      stack: stack
    } = vm,
    handle = stack.pop(),
    scope = stack.pop(),
    table = stack.pop(),
    args = stack.pop();
  if (null === table || null === handle)
    // To balance the pop{Frame,Scope}
    return vm.lowlevel.pushFrame(), void vm.pushScope(scope ?? vm.scope());
  let invokingScope = scope;
  // If necessary, create a child scope
  {
    let locals = table.parameters,
      localsCount = locals.length;
    if (localsCount > 0) {
      invokingScope = invokingScope.child();
      for (let i = 0; i < localsCount; i++) invokingScope.bindSymbol(locals[i], args.at(i));
    }
  }
  vm.lowlevel.pushFrame(), vm.pushScope(invokingScope), vm.call(handle);
}), APPEND_OPCODES.add(65, (vm, {
  op1: target
}) => {
  let reference = vm.stack.pop(),
    value = Boolean(valueForRef(reference));
  isConstRef(reference) ? value && vm.lowlevel.goto(target) : (value && vm.lowlevel.goto(target), vm.updateWith(new Assert(reference)));
}), APPEND_OPCODES.add(66, (vm, {
  op1: target
}) => {
  let reference = vm.stack.pop(),
    value = Boolean(valueForRef(reference));
  isConstRef(reference) ? value || vm.lowlevel.goto(target) : (value || vm.lowlevel.goto(target), vm.updateWith(new Assert(reference)));
}), APPEND_OPCODES.add(67, (vm, {
  op1: target,
  op2: comparison
}) => {
  vm.stack.peek() === comparison && vm.lowlevel.goto(target);
}), APPEND_OPCODES.add(68, vm => {
  let reference = vm.stack.peek();
  isConstRef(reference) || vm.updateWith(new Assert(reference));
}), APPEND_OPCODES.add(71, vm => {
  let {
      stack: stack
    } = vm,
    valueRef = stack.pop();
  stack.push(createComputeRef(() => toBool(valueForRef(valueRef))));
});
class Assert {
  constructor(ref) {
    this.ref = ref, this.last = valueForRef(ref);
  }
  evaluate(vm) {
    let {
      last: last,
      ref: ref
    } = this;
    last !== valueForRef(ref) && vm.throw();
  }
}
class AssertFilter {
  constructor(ref, filter) {
    this.ref = ref, this.filter = filter, this.last = filter(valueForRef(ref));
  }
  evaluate(vm) {
    let {
      last: last,
      ref: ref,
      filter: filter
    } = this;
    last !== filter(valueForRef(ref)) && vm.throw();
  }
}
class JumpIfNotModifiedOpcode {
  finalize(tag, target) {
    this.target = target, this.didModify(tag);
  }
  evaluate(vm) {
    let {
      tag: tag,
      target: target,
      lastRevision: lastRevision
    } = this;
    !vm.alwaysRevalidate && validateTag(tag, lastRevision) && (consumeTag(tag), vm.goto(target));
  }
  didModify(tag) {
    this.tag = tag, this.lastRevision = valueForTag(this.tag), consumeTag(tag);
  }
  constructor() {
    this.tag = CONSTANT_TAG, this.lastRevision = INITIAL;
  }
}
class BeginTrackFrameOpcode {
  constructor(debugLabel) {
    this.debugLabel = debugLabel;
  }
  evaluate() {
    beginTrackFrame(this.debugLabel);
  }
}
class EndTrackFrameOpcode {
  constructor(target) {
    this.target = target;
  }
  evaluate() {
    let tag = endTrackFrame();
    this.target.didModify(tag);
  }
}
APPEND_OPCODES.add(41, (vm, {
  op1: text
}) => {
  vm.tree().appendText(vm.constants.getValue(text));
}), APPEND_OPCODES.add(42, (vm, {
  op1: text
}) => {
  vm.tree().appendComment(vm.constants.getValue(text));
}), APPEND_OPCODES.add(48, (vm, {
  op1: tag
}) => {
  vm.tree().openElement(vm.constants.getValue(tag));
}), APPEND_OPCODES.add(49, vm => {
  let tagName = valueForRef(vm.stack.pop());
  vm.tree().openElement(tagName);
}), APPEND_OPCODES.add(50, vm => {
  let elementRef = vm.stack.pop(),
    insertBeforeRef = vm.stack.pop(),
    guidRef = vm.stack.pop(),
    element = valueForRef(elementRef),
    insertBefore = valueForRef(insertBeforeRef),
    guid = valueForRef(guidRef);
  isConstRef(elementRef) || vm.updateWith(new Assert(elementRef)), void 0 === insertBefore || isConstRef(insertBeforeRef) || vm.updateWith(new Assert(insertBeforeRef));
  let block = vm.tree().pushRemoteElement(element, guid, insertBefore);
  if (vm.associateDestroyable(block), void 0 !== vm.env.debugRenderTree) {
    // Note that there is nothing to update – when the args for an
    // {{#in-element}} changes it gets torn down and a new one is
    // re-created/rendered in its place (see the `Assert`s above)
    let args = createCapturedArgs(void 0 === insertBefore ? {} : {
      insertBefore: insertBeforeRef
    }, [elementRef]);
    vm.env.debugRenderTree.create(block, {
      type: "keyword",
      name: "in-element",
      args: args,
      instance: null
    }), registerDestructor(block, () => {
      vm.env.debugRenderTree?.willDestroy(block);
    });
  }
}), APPEND_OPCODES.add(56, vm => {
  let bounds = vm.tree().popRemoteElement();
  void 0 !== vm.env.debugRenderTree &&
  // The RemoteBlock is also its bounds
  vm.env.debugRenderTree.didRender(bounds, bounds);
}), APPEND_OPCODES.add(54, vm => {
  let operations = vm.fetchValue($t0),
    modifiers = null;
  operations && (modifiers = operations.flush(vm), vm.loadValue($t0, null)), vm.tree().flushElement(modifiers);
}), APPEND_OPCODES.add(55, vm => {
  let modifiers = vm.tree().closeElement();
  null !== modifiers && modifiers.forEach(modifier => {
    vm.env.scheduleInstallModifier(modifier);
    const d = modifier.manager.getDestroyable(modifier.state);
    null !== d && vm.associateDestroyable(d);
  });
}), APPEND_OPCODES.add(57, (vm, {
  op1: handle
}) => {
  if (!vm.env.isInteractive) return;
  let owner = vm.getOwner(),
    args = vm.stack.pop(),
    definition = vm.constants.getValue(handle),
    {
      manager: manager
    } = definition,
    {
      constructing: constructing
    } = vm.tree(),
    capturedArgs = args.capture(),
    state = manager.create(owner, constructing, definition.state, capturedArgs),
    instance = {
      manager: manager,
      state: state,
      definition: definition
    };
  vm.fetchValue($t0).addModifier(vm, instance, capturedArgs);
  let tag = manager.getTag(state);
  return null !== tag ? (consumeTag(tag), vm.updateWith(new UpdateModifierOpcode(tag, instance))) : void 0;
}), APPEND_OPCODES.add(108, vm => {
  if (!vm.env.isInteractive) return;
  let {
      stack: stack
    } = vm,
    ref = stack.pop(),
    args = stack.pop().capture(),
    {
      positional: outerPositional,
      named: outerNamed
    } = args,
    {
      constructing: constructing
    } = vm.tree(),
    initialOwner = vm.getOwner(),
    instanceRef = createComputeRef(() => {
      let owner,
        hostDefinition,
        value = valueForRef(ref);
      if (!isIndexable$1(value)) return;
      if (isCurriedType(value, 2)) {
        let {
          definition: resolvedDefinition,
          owner: curriedOwner,
          positional: positional,
          named: named
        } = resolveCurriedValue(value);
        hostDefinition = resolvedDefinition, owner = curriedOwner, void 0 !== positional && (args.positional = positional.concat(outerPositional)), void 0 !== named && (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        args.named = Object.assign({}, ...named, outerNamed));
      } else hostDefinition = value, owner = initialOwner;
      let manager = getInternalModifierManager(hostDefinition, true);
      if (null === manager) throw isDevelopingApp() ? new Error(`Expected a dynamic modifier definition, but received an object or function that did not have a modifier manager associated with it. The dynamic invocation was \`{{${ref.debugLabel}}}\`, and the incorrect definition is the value at the path \`${ref.debugLabel}\`, which was: ${debugToString$1?.(hostDefinition)}`) : new Error("BUG: modifier manager expected");
      let definition = {
          resolvedName: null,
          manager: manager,
          state: hostDefinition
        },
        state = manager.create(owner, constructing, definition.state, args);
      return {
        manager: manager,
        state: state,
        definition: definition
      };
    }),
    instance = valueForRef(instanceRef),
    tag = null;
  return void 0 !== instance && (vm.fetchValue($t0).addModifier(vm, instance, args), tag = instance.manager.getTag(instance.state), null !== tag && consumeTag(tag)), !isConstRef(ref) || tag ? vm.updateWith(new UpdateDynamicModifierOpcode(tag, instance, instanceRef)) : void 0;
});
class UpdateModifierOpcode {
  constructor(tag, modifier) {
    this.tag = tag, this.modifier = modifier, this.lastUpdated = valueForTag(tag);
  }
  evaluate(vm) {
    let {
      modifier: modifier,
      tag: tag,
      lastUpdated: lastUpdated
    } = this;
    consumeTag(tag), validateTag(tag, lastUpdated) || (vm.env.scheduleUpdateModifier(modifier), this.lastUpdated = valueForTag(tag));
  }
}
class UpdateDynamicModifierOpcode {
  constructor(tag, instance, instanceRef) {
    this.tag = tag, this.instance = instance, this.instanceRef = instanceRef, this.lastUpdated = valueForTag(tag ?? CURRENT_TAG);
  }
  evaluate(vm) {
    let {
        tag: tag,
        lastUpdated: lastUpdated,
        instance: instance,
        instanceRef: instanceRef
      } = this,
      newInstance = valueForRef(instanceRef);
    if (newInstance !== instance) {
      if (void 0 !== instance) {
        let destroyable = instance.manager.getDestroyable(instance.state);
        null !== destroyable && destroy(destroyable);
      }
      if (void 0 !== newInstance) {
        let {
            manager: manager,
            state: state
          } = newInstance,
          destroyable = manager.getDestroyable(state);
        null !== destroyable && associateDestroyableChild(this, destroyable), tag = manager.getTag(state), null !== tag && (this.lastUpdated = valueForTag(tag)), this.tag = tag, vm.env.scheduleInstallModifier(newInstance);
      }
      this.instance = newInstance;
    } else null === tag || validateTag(tag, lastUpdated) || (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    vm.env.scheduleUpdateModifier(instance), this.lastUpdated = valueForTag(tag));
    null !== tag && consumeTag(tag);
  }
}
APPEND_OPCODES.add(51, (vm, {
  op1: _name,
  op2: _value,
  op3: _namespace
}) => {
  let name = vm.constants.getValue(_name),
    value = vm.constants.getValue(_value),
    namespace = _namespace ? vm.constants.getValue(_namespace) : null;
  vm.tree().setStaticAttribute(name, value, namespace);
}), APPEND_OPCODES.add(52, (vm, {
  op1: _name,
  op2: _trusting,
  op3: _namespace
}) => {
  let name = vm.constants.getValue(_name),
    trusting = vm.constants.getValue(_trusting),
    reference = vm.stack.pop(),
    value = valueForRef(reference),
    namespace = _namespace ? vm.constants.getValue(_namespace) : null,
    attribute = vm.tree().setDynamicAttribute(name, value, trusting, namespace);
  isConstRef(reference) || vm.updateWith(new UpdateDynamicAttributeOpcode(reference, attribute, vm.env));
});
class UpdateDynamicAttributeOpcode {
  constructor(reference, attribute, env) {
    let initialized = false;
    this.updateRef = createComputeRef(() => {
      let value = valueForRef(reference);
      initialized ? attribute.update(value, env) : initialized = true;
    }), valueForRef(this.updateRef);
  }
  evaluate() {
    valueForRef(this.updateRef);
  }
}
APPEND_OPCODES.add(78, (vm, {
  op1: handle
}) => {
  let definition = vm.constants.getValue(handle),
    {
      manager: manager,
      capabilities: capabilities
    } = definition,
    instance = {
      definition: definition,
      manager: manager,
      capabilities: capabilities,
      state: null,
      handle: null,
      table: null,
      lookup: null
    };
  vm.stack.push(instance);
}), APPEND_OPCODES.add(80, (vm, {
  op1: _isStrict
}) => {
  let definition,
    stack = vm.stack,
    component = valueForRef(stack.pop()),
    constants = vm.constants,
    owner = vm.getOwner(),
    isStrict = constants.getValue(_isStrict);
  if (vm.loadValue($t1, null), "string" == typeof component) {
    if (isDevelopingApp() && isStrict) throw new Error(`Attempted to resolve a dynamic component with a string definition, \`${component}\` in a strict mode template. In strict mode, using strings to resolve component definitions is prohibited. You can instead import the component definition and use it directly.`);
    let resolvedDefinition = function (resolver, constants, name, owner) {
      let definition = resolver?.lookupComponent?.(name, owner) ?? null;
      if (isDevelopingApp() && !definition) throw new Error(`Attempted to resolve \`${name}\`, which was expected to be a component, but nothing was found.`);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      return constants.resolvedComponent(definition, name);
    }(vm.context.resolver, constants, component, owner);
    definition = resolvedDefinition;
  } else definition = isCurriedValue(component) ? component : constants.component(component, owner);
  stack.push(definition);
}), APPEND_OPCODES.add(81, vm => {
  let definition,
    stack = vm.stack,
    ref = stack.pop(),
    value = valueForRef(ref),
    constants = vm.constants;
  if (isDevelopingApp() && "function" != typeof value && ("object" != typeof value || null === value)) throw new Error(`Expected a component definition, but received ${value}. You may have accidentally done <${ref.debugLabel}>, where "${ref.debugLabel}" was a string instead of a curried component definition. You must either use the component definition directly, or use the {{component}} helper to create a curried component definition when invoking dynamically.`);
  if (isCurriedValue(value)) definition = value;else if (definition = constants.component(value, vm.getOwner(), true), isDevelopingApp() && null === definition) throw new Error(`Expected a dynamic component definition, but received an object or function that did not have a component manager associated with it. The dynamic invocation was \`<${ref.debugLabel}>\` or \`{{${ref.debugLabel}}}\`, and the incorrect definition is the value at the path \`${ref.debugLabel}\`, which was: ${debugToString$1?.(value) ?? value}`);
  stack.push(definition);
}), APPEND_OPCODES.add(79, vm => {
  let capabilities,
    manager,
    {
      stack: stack
    } = vm,
    definition = stack.pop();
  isCurriedValue(definition) ? manager = capabilities = null : (manager = definition.manager, capabilities = definition.capabilities), stack.push({
    definition: definition,
    capabilities: capabilities,
    manager: manager,
    state: null,
    handle: null,
    table: null
  });
}), APPEND_OPCODES.add(82, (vm, {
  op1: _names,
  op2: _blockNames,
  op3: flags
}) => {
  let stack = vm.stack,
    names = vm.constants.getArray(_names),
    positionalCount = flags >> 4,
    atNames = 8 & flags,
    blockNames = 7 & flags ? vm.constants.getArray(_blockNames) : EMPTY_STRING_ARRAY;
  vm.args.setup(stack, names, blockNames, positionalCount, !!atNames), stack.push(vm.args);
}), APPEND_OPCODES.add(83, vm => {
  let {
    stack: stack
  } = vm;
  stack.push(vm.args.empty(stack));
}), APPEND_OPCODES.add(86, vm => {
  let stack = vm.stack,
    capturedArgs = stack.pop().capture();
  stack.push(capturedArgs);
}), APPEND_OPCODES.add(85, (vm, {
  op1: register
}) => {
  let stack = vm.stack,
    instance = vm.fetchValue(register),
    args = stack.pop(),
    {
      definition: definition
    } = instance;
  if (isCurriedType(definition, 0)) {
    definition.manager;
    let constants = vm.constants,
      {
        definition: resolvedDefinition,
        owner: owner,
        resolved: resolved,
        positional: positional,
        named: named
      } = resolveCurriedValue(definition);
    if (resolved) definition = resolvedDefinition;else if ("string" == typeof resolvedDefinition) {
      let resolvedValue = vm.context.resolver?.lookupComponent?.(resolvedDefinition, owner) ?? null;
      definition = constants.resolvedComponent(resolvedValue, resolvedDefinition);
    } else definition = constants.component(resolvedDefinition, owner);
    void 0 !== named &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    args.named.merge(assign({}, ...named)), void 0 !== positional && (args.realloc(positional.length), args.positional.prepend(positional));
    let {
      manager: manager
    } = definition;
    instance.definition = definition, instance.manager = manager, instance.capabilities = definition.capabilities,
    // Save off the owner that this component was curried with. Later on,
    // we'll fetch the value of this register and set it as the owner on the
    // new root scope.
    vm.loadValue($t1, owner);
  }
  let {
      manager: manager,
      state: state
    } = definition,
    capabilities = instance.capabilities;
  if (!managerHasCapability(manager, capabilities, InternalComponentCapabilities.prepareArgs)) return void stack.push(args);
  let blocks = args.blocks.values,
    blockNames = args.blocks.names,
    preparedArgs = manager.prepareArgs(state, args);
  if (preparedArgs) {
    args.clear();
    for (let i = 0; i < blocks.length; i++) stack.push(blocks[i]);
    let {
        positional: positional,
        named: named
      } = preparedArgs,
      positionalCount = positional.length;
    for (let i = 0; i < positionalCount; i++) stack.push(positional[i]);
    let names = Object.keys(named);
    for (let i = 0; i < names.length; i++) stack.push(named[names[i]]);
    args.setup(stack, names, blockNames, positionalCount, false);
  }
  stack.push(args);
}), APPEND_OPCODES.add(87, (vm, {
  op1: flags
}) => {
  let instance = vm.fetchValue($s0),
    {
      definition: definition,
      manager: manager,
      capabilities: capabilities
    } = instance;
  if (!managerHasCapability(manager, capabilities, InternalComponentCapabilities.createInstance))
    // TODO: Closure and Main components are always invoked dynamically, so this
    // opcode may run even if this capability is not enabled. In the future we
    // should handle this in a better way.
    return;
  let dynamicScope = null;
  managerHasCapability(manager, capabilities, InternalComponentCapabilities.dynamicScope) && (dynamicScope = vm.dynamicScope());
  let hasDefaultBlock = 1 & flags,
    args = null;
  managerHasCapability(manager, capabilities, InternalComponentCapabilities.createArgs) && (args = vm.stack.peek());
  let self = null;
  managerHasCapability(manager, capabilities, InternalComponentCapabilities.createCaller) && (self = vm.getSelf());
  let state = manager.create(vm.getOwner(), definition.state, args, vm.env, dynamicScope, self, !!hasDefaultBlock);
  // We want to reuse the `state` POJO here, because we know that the opcodes
  // only transition at exactly one place.
  instance.state = state, managerHasCapability(manager, capabilities, InternalComponentCapabilities.updateHook) && vm.updateWith(new UpdateComponentOpcode(state, manager, dynamicScope));
}), APPEND_OPCODES.add(88, (vm, {
  op1: register
}) => {
  let {
      manager: manager,
      state: state,
      capabilities: capabilities
    } = vm.fetchValue(register),
    d = manager.getDestroyable(state);
  if (isDevelopingApp() && !managerHasCapability(manager, capabilities, InternalComponentCapabilities.willDestroy) && null !== d && "string" in d) throw new Error("BUG: Destructor has willDestroy, but the willDestroy capability was not enabled for this component. Pre-destruction hooks must be explicitly opted into");
  d && vm.associateDestroyable(d);
}), APPEND_OPCODES.add(97, (vm, {
  op1: register
}) => {
  let name;
  if (isDevelopingApp()) {
    let {
      definition: definition,
      manager: manager
    } = vm.fetchValue(register);
    name = getDebugName(definition, manager);
  }
  vm.beginCacheGroup(name), vm.tree().pushAppendingBlock();
}), APPEND_OPCODES.add(89, vm => {
  vm.loadValue($t0, new ComponentElementOperations());
}), APPEND_OPCODES.add(53, (vm, {
  op1: _name,
  op2: _trusting,
  op3: _namespace
}) => {
  let name = vm.constants.getValue(_name),
    trusting = vm.constants.getValue(_trusting),
    reference = vm.stack.pop(),
    namespace = _namespace ? vm.constants.getValue(_namespace) : null;
  vm.fetchValue($t0).setAttribute(name, reference, trusting, namespace);
}), APPEND_OPCODES.add(105, (vm, {
  op1: _name,
  op2: _value,
  op3: _namespace
}) => {
  let name = vm.constants.getValue(_name),
    value = vm.constants.getValue(_value),
    namespace = _namespace ? vm.constants.getValue(_namespace) : null;
  vm.fetchValue($t0).setStaticAttribute(name, value, namespace);
});
class ComponentElementOperations {
  setAttribute(name, value, trusting, namespace) {
    let deferred = {
      value: value,
      namespace: namespace,
      trusting: trusting
    };
    "class" === name && this.classes.push(value), this.attributes[name] = deferred;
  }
  setStaticAttribute(name, value, namespace) {
    let deferred = {
      value: value,
      namespace: namespace
    };
    "class" === name && this.classes.push(value), this.attributes[name] = deferred;
  }
  addModifier(vm, modifier, capturedArgs) {
    if (this.modifiers.push(modifier), void 0 !== vm.env.debugRenderTree) {
      const {
        manager: manager,
        definition: definition,
        state: state
      } = modifier;
      // TODO: we need a stable object for the debugRenderTree as the key, add support for
      // the case where the state is a primitive, or if in practice we always have/require
      // an object, then change the internal types to reflect that
      if (null === state || "object" != typeof state && "function" != typeof state) return;
      let {
          element: element,
          constructing: constructing
        } = vm.tree(),
        name = definition.resolvedName ?? manager.getDebugName(definition.state),
        instance = manager.getDebugInstance(state),
        bounds = new ConcreteBounds(element, constructing, constructing);
      vm.env.debugRenderTree.create(state, {
        type: "modifier",
        name: name,
        args: capturedArgs,
        instance: instance
      }), vm.env.debugRenderTree.didRender(state, bounds),
      // For tearing down the debugRenderTree
      vm.associateDestroyable(state), vm.updateWith(new DebugRenderTreeUpdateOpcode(state)), vm.updateWith(new DebugRenderTreeDidRenderOpcode(state, bounds)), registerDestructor(state, () => {
        vm.env.debugRenderTree?.willDestroy(state);
      });
    }
  }
  flush(vm) {
    let type,
      attributes = this.attributes;
    for (let name in this.attributes) {
      if ("type" === name) {
        type = attributes[name];
        continue;
      }
      let attr = this.attributes[name];
      "class" === name ? setDeferredAttr(vm, "class", mergeClasses(this.classes), attr.namespace, attr.trusting) : setDeferredAttr(vm, name, attr.value, attr.namespace, attr.trusting);
    }
    return void 0 !== type && setDeferredAttr(vm, "type", type.value, type.namespace, type.trusting), this.modifiers;
  }
  constructor() {
    this.attributes = dict(), this.classes = [], this.modifiers = [];
  }
}
function mergeClasses(classes) {
  return 0 === classes.length ? "" : 1 === classes.length ? classes[0] : function (classes) {
    return classes.every(c => "string" == typeof c);
  }(classes) ? classes.join(" ") : (list = classes, createComputeRef(() => {
    let ret = [];
    for (const ref of list) {
      let value = normalizeStringValue("string" == typeof ref ? ref : valueForRef(ref));
      value && ret.push(value);
    }
    return 0 === ret.length ? null : ret.join(" ");
  }));
  var list;
}
function setDeferredAttr(vm, name, value, namespace, trusting = false) {
  if ("string" == typeof value) vm.tree().setStaticAttribute(name, value, namespace);else {
    let attribute = vm.tree().setDynamicAttribute(name, valueForRef(value), trusting, namespace);
    isConstRef(value) || vm.updateWith(new UpdateDynamicAttributeOpcode(value, attribute, vm.env));
  }
}
function bindBlock(symbolName, blockName, state, blocks, vm) {
  let symbol = state.table.symbols.indexOf(symbolName),
    block = blocks.get(blockName);
  -1 !== symbol && vm.scope().bindBlock(symbol + 1, block), state.lookup && (state.lookup[symbolName] = block);
}
APPEND_OPCODES.add(99, (vm, {
  op1: register
}) => {
  let {
      definition: definition,
      state: state
    } = vm.fetchValue(register),
    {
      manager: manager
    } = definition,
    operations = vm.fetchValue($t0);
  manager.didCreateElement(state, vm.tree().constructing, operations);
}), APPEND_OPCODES.add(90, (vm, {
  op1: register,
  op2: _names
}) => {
  let instance = vm.fetchValue(register),
    {
      definition: definition,
      state: state
    } = instance,
    {
      manager: manager
    } = definition,
    selfRef = manager.getSelf(state);
  if (void 0 !== vm.env.debugRenderTree) {
    let args,
      moduleName,
      instance = vm.fetchValue(register),
      {
        definition: definition,
        manager: manager
      } = instance;
    if (vm.stack.peek() === vm.args) args = vm.args.capture();else {
      let names = vm.constants.getArray(_names);
      vm.args.setup(vm.stack, names, [], 0, true), args = vm.args.capture();
    }
    let compilable = definition.compilable;
    if (null === compilable) {
      managerHasCapability(manager, instance.capabilities, InternalComponentCapabilities.dynamicLayout);
      let resolver = vm.context.resolver;
      compilable = null === resolver ? null : manager.getDynamicLayout(state, resolver), moduleName = null !== compilable ? compilable.moduleName : "__default__.hbs";
    } else moduleName = compilable.moduleName;
    // For tearing down the debugRenderTree
    if (vm.associateDestroyable(instance), hasCustomDebugRenderTreeLifecycle(manager)) manager.getDebugCustomRenderTree(instance.definition.state, instance.state, args, moduleName).forEach(node => {
      let {
        bucket: bucket
      } = node;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      vm.env.debugRenderTree.create(bucket, node), registerDestructor(instance, () => {
        vm.env.debugRenderTree?.willDestroy(bucket);
      }), vm.updateWith(new DebugRenderTreeUpdateOpcode(bucket));
    });else {
      let name = getDebugName(definition, manager);
      vm.env.debugRenderTree.create(instance, {
        type: "component",
        name: name,
        args: args,
        template: moduleName,
        instance: valueForRef(selfRef)
      }), registerDestructor(instance, () => {
        vm.env.debugRenderTree?.willDestroy(instance);
      }), vm.updateWith(new DebugRenderTreeUpdateOpcode(instance));
    }
  }
  vm.stack.push(selfRef);
}), APPEND_OPCODES.add(91, (vm, {
  op1: register
}) => {
  let {
      definition: definition,
      state: state
    } = vm.fetchValue(register),
    {
      manager: manager
    } = definition,
    tagName = manager.getTagName(state);
  // User provided value from JS, so we don't bother to encode
  vm.stack.push(tagName);
}),
// Dynamic Invocation Only
APPEND_OPCODES.add(92, (vm, {
  op1: register
}) => {
  let instance = vm.fetchValue(register),
    {
      manager: manager,
      definition: definition
    } = instance,
    {
      stack: stack
    } = vm,
    {
      compilable: compilable
    } = definition;
  if (null === compilable) {
    let {
      capabilities: capabilities
    } = instance;
    managerHasCapability(manager, capabilities, InternalComponentCapabilities.dynamicLayout);
    let resolver = vm.context.resolver;
    compilable = null === resolver ? null : manager.getDynamicLayout(instance.state, resolver), null === compilable && (compilable = managerHasCapability(manager, capabilities, InternalComponentCapabilities.wrapped) ? unwrapTemplate(vm.constants.defaultTemplate).asWrappedLayout() : unwrapTemplate(vm.constants.defaultTemplate).asLayout());
  }
  let handle = compilable.compile(vm.context);
  stack.push(compilable.symbolTable), stack.push(handle);
}), APPEND_OPCODES.add(75, (vm, {
  op1: register
}) => {
  let definition = vm.stack.pop(),
    invocation = vm.stack.pop(),
    {
      manager: manager,
      capabilities: capabilities
    } = definition,
    state = {
      definition: definition,
      manager: manager,
      capabilities: capabilities,
      state: null,
      handle: invocation.handle,
      table: invocation.symbolTable,
      lookup: null
    };
  vm.loadValue(register, state);
}), APPEND_OPCODES.add(95, (vm, {
  op1: register
}) => {
  let {
      stack: stack
    } = vm,
    handle = stack.pop(),
    table = stack.pop(),
    state = vm.fetchValue(register);
  // In DEBUG handles could be ErrHandle objects
  state.handle = handle, state.table = table;
}), APPEND_OPCODES.add(38, (vm, {
  op1: register
}) => {
  let owner,
    {
      table: table,
      manager: manager,
      capabilities: capabilities,
      state: state
    } = vm.fetchValue(register);
  managerHasCapability(manager, capabilities, InternalComponentCapabilities.hasSubOwner) ? (owner = manager.getOwner(state), vm.loadValue($t1, null)) : (
  // Check the temp register to see if an owner was resolved from currying
  owner = vm.fetchValue($t1), null === owner ?
  // If an owner wasn't found, default to using the current owner. This
  // will happen for normal dynamic component invocation,
  // e.g. <SomeClassicEmberComponent/>
  owner = vm.getOwner() :
  // Else the owner was found, so clear the temp register. This will happen
  // if we are loading a curried component, e.g. <@someCurriedComponent/>
  vm.loadValue($t1, null)), vm.pushRootScope(table.symbols.length + 1, owner);
}), APPEND_OPCODES.add(17, (vm, {
  op1: register
}) => {
  let state = vm.fetchValue(register),
    scope = vm.scope(),
    args = vm.stack.peek(),
    callerNames = args.named.atNames;
  for (let i = callerNames.length - 1; i >= 0; i--) {
    let atName = callerNames[i],
      symbol = state.table.symbols.indexOf(atName),
      value = args.named.get(atName, true);
    -1 !== symbol && scope.bindSymbol(symbol + 1, value), state.lookup && (state.lookup[atName] = value);
  }
}), APPEND_OPCODES.add(18, (vm, {
  op1: register
}) => {
  let state = vm.fetchValue(register),
    {
      blocks: blocks
    } = vm.stack.peek();
  for (const [i] of enumerate(blocks.names)) bindBlock(blocks.symbolNames[i], blocks.names[i], state, blocks, vm);
}),
// Dynamic Invocation Only
APPEND_OPCODES.add(96, (vm, {
  op1: register
}) => {
  let state = vm.fetchValue(register);
  vm.call(state.handle);
}), APPEND_OPCODES.add(100, (vm, {
  op1: register
}) => {
  let instance = vm.fetchValue(register),
    {
      manager: manager,
      state: state,
      capabilities: capabilities
    } = instance,
    bounds = vm.tree().popBlock();
  void 0 !== vm.env.debugRenderTree && (hasCustomDebugRenderTreeLifecycle(manager) ? manager.getDebugCustomRenderTree(instance.definition.state, state, EMPTY_ARGS).reverse().forEach(node => {
    let {
      bucket: bucket
    } = node;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    vm.env.debugRenderTree.didRender(bucket, bounds), vm.updateWith(new DebugRenderTreeDidRenderOpcode(bucket, bounds));
  }) : (vm.env.debugRenderTree.didRender(instance, bounds), vm.updateWith(new DebugRenderTreeDidRenderOpcode(instance, bounds)))), managerHasCapability(manager, capabilities, InternalComponentCapabilities.createInstance) && (
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- @fixme
  manager.didRenderLayout(state, bounds), vm.env.didCreate(instance), vm.updateWith(new DidUpdateLayoutOpcode(instance, bounds)));
}), APPEND_OPCODES.add(98, vm => {
  vm.commitCacheGroup();
});
class UpdateComponentOpcode {
  constructor(component, manager, dynamicScope) {
    this.component = component, this.manager = manager, this.dynamicScope = dynamicScope;
  }
  evaluate(_vm) {
    let {
      component: component,
      manager: manager,
      dynamicScope: dynamicScope
    } = this;
    manager.update(component, dynamicScope);
  }
}
class DidUpdateLayoutOpcode {
  constructor(component, bounds) {
    this.component = component, this.bounds = bounds;
  }
  evaluate(vm) {
    let {
        component: component,
        bounds: bounds
      } = this,
      {
        manager: manager,
        state: state
      } = component;
    manager.didUpdateLayout(state, bounds), vm.env.didUpdate(component);
  }
}
class DebugRenderTreeUpdateOpcode {
  constructor(bucket) {
    this.bucket = bucket;
  }
  evaluate(vm) {
    vm.env.debugRenderTree?.update(this.bucket);
  }
}
class DebugRenderTreeDidRenderOpcode {
  constructor(bucket, bounds) {
    this.bucket = bucket, this.bounds = bounds;
  }
  evaluate(vm) {
    vm.env.debugRenderTree?.didRender(this.bucket, this.bounds);
  }
}

/*
  The calling convention is:

  * 0-N block arguments at the bottom
  * 0-N positional arguments next (left-to-right)
  * 0-N named arguments next
*/
class VMArgumentsImpl {
  constructor() {
    this.stack = null, this.positional = new PositionalArgumentsImpl(), this.named = new NamedArgumentsImpl(), this.blocks = new BlockArgumentsImpl();
  }
  empty(stack) {
    let base = stack.registers[$sp] + 1;
    return this.named.empty(stack, base), this.positional.empty(stack, base), this.blocks.empty(stack, base), this;
  }
  setup(stack, names, blockNames, positionalCount, atNames) {
    this.stack = stack;
    /*
       | ... | blocks      | positional  | named |
       | ... | b0    b1    | p0 p1 p2 p3 | n0 n1 |
    index | ... | 4/5/6 7/8/9 | 10 11 12 13 | 14 15 |
               ^             ^             ^  ^
             bbase         pbase       nbase  sp
    */
    let named = this.named,
      namedCount = names.length,
      namedBase = stack.registers[$sp] - namedCount + 1;
    named.setup(stack, namedBase, namedCount, names, atNames);
    let positionalBase = namedBase - positionalCount;
    this.positional.setup(stack, positionalBase, positionalCount);
    let blocks = this.blocks,
      blocksCount = blockNames.length,
      blocksBase = positionalBase - 3 * blocksCount;
    blocks.setup(stack, blocksBase, blocksCount, blockNames);
  }
  get base() {
    return this.blocks.base;
  }
  get length() {
    return this.positional.length + this.named.length + 3 * this.blocks.length;
  }
  at(pos) {
    return this.positional.at(pos);
  }
  realloc(offset) {
    let {
      stack: stack
    } = this;
    if (offset > 0 && null !== stack) {
      let {
          positional: positional,
          named: named
        } = this,
        newBase = positional.base + offset;
      for (let i = positional.length + named.length - 1; i >= 0; i--) stack.copy(i + positional.base, i + newBase);
      positional.base += offset, named.base += offset, stack.registers[$sp] += offset;
    }
  }
  capture() {
    let positional = 0 === this.positional.length ? EMPTY_POSITIONAL : this.positional.capture();
    return {
      named: 0 === this.named.length ? EMPTY_NAMED : this.named.capture(),
      positional: positional
    };
  }
  clear() {
    let {
      stack: stack,
      length: length
    } = this;
    length > 0 && null !== stack && stack.pop(length);
  }
}
const EMPTY_REFERENCES = emptyArray();
class PositionalArgumentsImpl {
  constructor() {
    this.base = 0, this.length = 0, this.stack = null, this._references = null;
  }
  empty(stack, base) {
    this.stack = stack, this.base = base, this.length = 0, this._references = EMPTY_REFERENCES;
  }
  setup(stack, base, length) {
    this.stack = stack, this.base = base, this.length = length, this._references = 0 === length ? EMPTY_REFERENCES : null;
  }
  at(position) {
    let {
      base: base,
      length: length,
      stack: stack
    } = this;
    return position < 0 || position >= length ? UNDEFINED_REFERENCE : stack.get(position, base);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  }
  capture() {
    return this.references;
  }
  prepend(other) {
    let additions = other.length;
    if (additions > 0) {
      let {
        base: base,
        length: length,
        stack: stack
      } = this;
      this.base = base -= additions, this.length = length + additions;
      for (let i = 0; i < additions; i++)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      stack.set(other[i], i, base);
      this._references = null;
    }
  }
  get references() {
    let references = this._references;
    if (!references) {
      let {
        stack: stack,
        base: base,
        length: length
      } = this;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      references = this._references = stack.slice(base, base + length);
    }
    return references;
  }
}
class NamedArgumentsImpl {
  constructor() {
    this.base = 0, this.length = 0, this._references = null, this._names = EMPTY_STRING_ARRAY, this._atNames = EMPTY_STRING_ARRAY;
  }
  empty(stack, base) {
    this.stack = stack, this.base = base, this.length = 0, this._references = EMPTY_REFERENCES, this._names = EMPTY_STRING_ARRAY, this._atNames = EMPTY_STRING_ARRAY;
  }
  setup(stack, base, length, names, atNames) {
    this.stack = stack, this.base = base, this.length = length, 0 === length ? (this._references = EMPTY_REFERENCES, this._names = EMPTY_STRING_ARRAY, this._atNames = EMPTY_STRING_ARRAY) : (this._references = null, atNames ? (this._names = null, this._atNames = names) : (this._names = names, this._atNames = null));
  }
  get names() {
    let names = this._names;
    return names || (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    names = this._names = this._atNames.map(this.toSyntheticName)), names;
  }
  get atNames() {
    let atNames = this._atNames;
    return atNames || (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    atNames = this._atNames = this._names.map(this.toAtName)), atNames;
  }
  has(name) {
    return -1 !== this.names.indexOf(name);
  }
  get(name, atNames = false) {
    let {
        base: base,
        stack: stack
      } = this,
      idx = (atNames ? this.atNames : this.names).indexOf(name);
    if (-1 === idx) return UNDEFINED_REFERENCE;
    let ref = stack.get(idx, base);
    return isDevelopingApp() ? createDebugAliasRef(atNames ? name : `@${name}`, ref) : ref;
  }
  capture() {
    let {
        names: names,
        references: references
      } = this,
      map = dict();
    for (const [i, name] of enumerate(names))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    map[name] = isDevelopingApp() ? createDebugAliasRef(`@${name}`, references[i]) : references[i];
    return map;
  }
  merge(other) {
    let keys = Object.keys(other);
    if (keys.length > 0) {
      let {
          names: names,
          length: length,
          stack: stack
        } = this,
        newNames = names.slice();
      for (const name of keys) -1 === newNames.indexOf(name) && (length = newNames.push(name), stack.push(other[name]));
      this.length = length, this._references = null, this._names = newNames, this._atNames = null;
    }
  }
  get references() {
    let references = this._references;
    if (!references) {
      let {
        base: base,
        length: length,
        stack: stack
      } = this;
      references = this._references = stack.slice(base, base + length);
    }
    return references;
  }
  toSyntheticName(name) {
    return name.slice(1);
  }
  toAtName(name) {
    return `@${name}`;
  }
}
function toSymbolName(name) {
  return `&${name}`;
}
const EMPTY_BLOCK_VALUES = emptyArray();
class BlockArgumentsImpl {
  constructor() {
    this.internalValues = null, this._symbolNames = null, this.internalTag = null, this.names = EMPTY_STRING_ARRAY, this.length = 0, this.base = 0;
  }
  empty(stack, base) {
    this.stack = stack, this.names = EMPTY_STRING_ARRAY, this.base = base, this.length = 0, this._symbolNames = null, this.internalTag = CONSTANT_TAG, this.internalValues = EMPTY_BLOCK_VALUES;
  }
  setup(stack, base, length, names) {
    this.stack = stack, this.names = names, this.base = base, this.length = length, this._symbolNames = null, 0 === length ? (this.internalTag = CONSTANT_TAG, this.internalValues = EMPTY_BLOCK_VALUES) : (this.internalTag = null, this.internalValues = null);
  }
  get values() {
    let values = this.internalValues;
    if (!values) {
      let {
        base: base,
        length: length,
        stack: stack
      } = this;
      values = this.internalValues = stack.slice(base, base + 3 * length);
    }
    return values;
  }
  has(name) {
    return -1 !== this.names.indexOf(name);
  }
  get(name) {
    let idx = this.names.indexOf(name);
    if (-1 === idx) return null;
    let {
        base: base,
        stack: stack
      } = this,
      table = stack.get(3 * idx, base),
      scope = stack.get(3 * idx + 1, base),
      handle = stack.get(3 * idx + 2, base);
    return null === handle ? null : [handle, scope, table];
  }
  capture() {
    return new CapturedBlockArgumentsImpl(this.names, this.values);
  }
  get symbolNames() {
    let symbolNames = this._symbolNames;
    return null === symbolNames && (symbolNames = this._symbolNames = this.names.map(toSymbolName)), symbolNames;
  }
}
class CapturedBlockArgumentsImpl {
  constructor(names, values) {
    this.names = names, this.values = values, this.length = names.length;
  }
  has(name) {
    return -1 !== this.names.indexOf(name);
  }
  get(name) {
    let idx = this.names.indexOf(name);
    return -1 === idx ? null : [this.values[3 * idx + 2], this.values[3 * idx + 1], this.values[3 * idx]];
  }
}
function createCapturedArgs(named, positional) {
  return {
    named: named,
    positional: positional
  };
}
function reifyNamed(named) {
  let reified = dict();
  for (const [key, value] of Object.entries(named)) reified[key] = valueForRef(value);
  return reified;
}
function reifyPositional(positional) {
  return positional.map(valueForRef);
}
function reifyArgs(args) {
  return {
    named: reifyNamed(args.named),
    positional: reifyPositional(args.positional)
  };
}
const ARGUMENT_ERROR = Symbol("ARGUMENT_ERROR");
function isArgumentError(arg) {
  return null !== arg && "object" == typeof arg && arg[ARGUMENT_ERROR];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArgumentErrorImpl(error) {
  return {
    [ARGUMENT_ERROR]: true,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error: error
  };
}
function reifyArgsDebug(args) {
  return {
    named: function (named) {
      let reified = dict();
      for (const [key, value] of Object.entries(named)) try {
        reified[key] = valueForRef(value);
      } catch (e) {
        reified[key] = ArgumentErrorImpl(e);
      }
      return reified;
    }(args.named),
    positional: (positional = args.positional, positional.map(p => {
      try {
        return valueForRef(p);
      } catch (e) {
        return ArgumentErrorImpl(e);
      }
    }))
  };
  var positional;
}
const EMPTY_NAMED = Object.freeze(Object.create(null)),
  EMPTY_POSITIONAL = EMPTY_REFERENCES,
  EMPTY_ARGS = createCapturedArgs(EMPTY_NAMED, EMPTY_POSITIONAL);
function castToString(value) {
  return "string" == typeof value ? value : "function" != typeof value.toString ? "" : String(value);
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- @fixme
}
function resolveHelper(definition, ref) {
  let helper,
    managerOrHelper = getInternalHelperManager(definition, true);
  return helper = null === managerOrHelper ? null : "function" == typeof managerOrHelper ? managerOrHelper : managerOrHelper.getHelper(definition), debugAssert(null !== helper, () => `Expected a dynamic helper definition, but received an object or function that did not have a helper manager associated with it. The dynamic invocation was \`{{${ref.debugLabel}}}\` or \`(${ref.debugLabel})\`, and the incorrect definition is the value at the path \`${ref.debugLabel}\`, which was: ${debugToString$1?.(definition)}`), helper;
}
function isUndefinedReference(input) {
  return input === UNDEFINED_REFERENCE;
}
APPEND_OPCODES.add(77, (vm, {
  op1: type,
  op2: _isStrict
}) => {
  let stack = vm.stack,
    definition = stack.pop(),
    capturedArgs = stack.pop(),
    owner = vm.getOwner(),
    resolver = vm.context.resolver,
    isStrict = false;
  isDevelopingApp() && (
  // strict check only happens in DEBUG builds, no reason to load it otherwise
  isStrict = vm.constants.getValue(_isStrict)), vm.loadValue($v0, function (type, inner, owner, args, resolver, isStrict) {
    let lastValue, curriedDefinition;
    return createComputeRef(() => {
      let value = valueForRef(inner);
      if (value === lastValue) return curriedDefinition;
      if (isCurriedType(value, type)) curriedDefinition = args ? curry(type, value, owner, args) : args;else if (0 === type && "string" == typeof value && value) {
        // Only components should enter this path, as helpers and modifiers do not
        // support string based resolution
        if (isDevelopingApp()) {
          if (isStrict) throw new Error(`Attempted to resolve a dynamic component with a string definition, \`${value}\` in a strict mode template. In strict mode, using strings to resolve component definitions is prohibited. You can instead import the component definition and use it directly.`);
          if (!resolver.lookupComponent?.(value, owner)) throw new Error(`Attempted to resolve \`${value}\`, which was expected to be a component, but nothing was found.`);
        }
        curriedDefinition = curry(type, value, owner, args);
      } else curriedDefinition = isIndexable$1(value) ? curry(type, value, owner, args) : null;
      return lastValue = value, curriedDefinition;
    });
  }(type, definition, owner, capturedArgs, resolver, isStrict));
}), APPEND_OPCODES.add(107, vm => {
  let helperRef,
    stack = vm.stack,
    ref = stack.pop(),
    args = stack.pop().capture(),
    initialOwner = vm.getOwner(),
    helperInstanceRef = createComputeRef(() => {
      void 0 !== helperRef && destroy(helperRef);
      let definition = valueForRef(ref);
      if (isCurriedType(definition, 1)) {
        let {
            definition: resolvedDef,
            owner: owner,
            positional: positional,
            named: named
          } = resolveCurriedValue(definition),
          helper = resolveHelper(resolvedDef, ref);
        void 0 !== named && (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        args.named = assign({}, ...named, args.named)), void 0 !== positional && (args.positional = positional.concat(args.positional)), helperRef = helper(args, owner), associateDestroyableChild(helperInstanceRef, helperRef);
      } else if (isIndexable$1(definition)) {
        let helper = resolveHelper(definition, ref);
        helperRef = helper(args, initialOwner), _hasDestroyableChildren(helperRef) && associateDestroyableChild(helperInstanceRef, helperRef);
      } else helperRef = UNDEFINED_REFERENCE;
    }),
    helperValueRef = createComputeRef(() => (valueForRef(helperInstanceRef), valueForRef(helperRef)));
  vm.associateDestroyable(helperInstanceRef), vm.loadValue($v0, helperValueRef);
}), APPEND_OPCODES.add(16, (vm, {
  op1: handle
}) => {
  let stack = vm.stack,
    value = vm.constants.getValue(handle)(stack.pop().capture(), vm.getOwner(), vm.dynamicScope());
  _hasDestroyableChildren(value) && vm.associateDestroyable(value), vm.loadValue($v0, value);
}), APPEND_OPCODES.add(21, (vm, {
  op1: symbol
}) => {
  let expr = vm.referenceForSymbol(symbol);
  vm.stack.push(expr);
}), APPEND_OPCODES.add(19, (vm, {
  op1: symbol
}) => {
  let expr = vm.stack.pop();
  vm.scope().bindSymbol(symbol, expr);
}), APPEND_OPCODES.add(20, (vm, {
  op1: symbol
}) => {
  let handle = vm.stack.pop(),
    scope = vm.stack.pop(),
    table = vm.stack.pop();
  vm.scope().bindBlock(symbol, [handle, scope, table]);
}), APPEND_OPCODES.add(37, (vm, {
  op1: size
}) => {
  vm.pushRootScope(size, vm.getOwner());
}), APPEND_OPCODES.add(22, (vm, {
  op1: _key
}) => {
  let key = vm.constants.getValue(_key),
    expr = vm.stack.pop();
  vm.stack.push(childRefFor(expr, key));
}), APPEND_OPCODES.add(23, (vm, {
  op1: _block
}) => {
  let {
      stack: stack
    } = vm,
    block = vm.scope().getBlock(_block);
  stack.push(block);
}), APPEND_OPCODES.add(24, vm => {
  let {
      stack: stack
    } = vm,
    block = stack.pop();
  if (block && !isUndefinedReference(block)) {
    let [handleOrCompilable, scope, table] = block;
    stack.push(table), stack.push(scope), stack.push(handleOrCompilable);
  } else stack.push(null), stack.push(null), stack.push(null);
}), APPEND_OPCODES.add(25, vm => {
  let {
      stack: stack
    } = vm,
    block = stack.pop();
  block && !isUndefinedReference(block) ? stack.push(TRUE_REFERENCE) : stack.push(FALSE_REFERENCE);
}), APPEND_OPCODES.add(26, vm => {
  // FIXME(mmun): should only need to push the symbol table
  vm.stack.pop(), vm.stack.pop();
  let table = vm.stack.pop(),
    hasBlockParams = table && table.parameters.length;
  vm.stack.push(hasBlockParams ? TRUE_REFERENCE : FALSE_REFERENCE);
}), APPEND_OPCODES.add(27, (vm, {
  op1: count
}) => {
  let out = new Array(count);
  for (let i = count; i > 0; i--) out[i - 1] = vm.stack.pop();
  var partsRefs;
  vm.stack.push((partsRefs = out, createComputeRef(() => {
    const parts = [];
    for (const ref of partsRefs) {
      const value = valueForRef(ref);
      null != value && parts.push(castToString(value));
    }
    return parts.length > 0 ? parts.join("") : null;
  })));
}), APPEND_OPCODES.add(109, vm => {
  let condition = vm.stack.pop(),
    truthy = vm.stack.pop(),
    falsy = vm.stack.pop();
  vm.stack.push(createComputeRef(() => toBool(valueForRef(condition)) ? valueForRef(truthy) : valueForRef(falsy)));
}), APPEND_OPCODES.add(110, vm => {
  let ref = vm.stack.pop();
  vm.stack.push(createComputeRef(() => !toBool(valueForRef(ref))));
}), APPEND_OPCODES.add(111, vm => {
  let scope = vm.dynamicScope(),
    stack = vm.stack,
    nameRef = stack.pop();
  stack.push(createComputeRef(() => {
    let name = String(valueForRef(nameRef));
    return valueForRef(scope.get(name));
  }));
}), APPEND_OPCODES.add(112, vm => {
  let {
    positional: positional
  } = vm.stack.pop().capture();
  vm.loadValue($v0, createComputeRef(() => {
    // eslint-disable-next-line no-console
    console.log(...reifyPositional(positional));
  }));
});
class DynamicTextContent {
  constructor(node, reference, lastValue) {
    this.node = node, this.reference = reference, this.lastValue = lastValue;
  }
  evaluate() {
    let normalized,
      value = valueForRef(this.reference),
      {
        lastValue: lastValue
      } = this;
    value !== lastValue && (normalized = isEmpty$2(value) ? "" : isString(value) ? value : String(value), normalized !== lastValue) && (this.node.nodeValue = this.lastValue = normalized);
  }
}
function toContentType(value) {
  return function (value) {
    return isString(value) || isEmpty$2(value) || "boolean" == typeof value || "number" == typeof value;
  }(value) ? ContentType.String : isCurriedType(value, 0) || hasInternalComponentManager(value) ? ContentType.Component : isCurriedType(value, 1) || hasInternalHelperManager(value) ? ContentType.Helper : isSafeString(value) ? ContentType.SafeString : function (value) {
    return isIndexable(value) && 11 === value.nodeType;
  }(value) ? ContentType.Fragment : function (value) {
    return isIndexable(value) && "number" == typeof value.nodeType;
  }(value) ? ContentType.Node : ContentType.String;
}
function toDynamicContentType(value) {
  if (!isIndexable$1(value)) return ContentType.String;
  if (isCurriedType(value, 0) || hasInternalComponentManager(value)) return ContentType.Component;
  if (isDevelopingApp() && !isCurriedType(value, 1) && !hasInternalHelperManager(value)) throw new Error(
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- @fixme
  `Attempted use a dynamic value as a component or helper, but that value did not have an associated component or helper manager. The value was: ${value}`);
  return ContentType.Helper;
}
function debugCallback(context, get) {
  // eslint-disable-next-line no-console
  console.info("Use `context`, and `get(<path>)` to debug this template."), get("this");
  // eslint-disable-next-line no-debugger
  debugger;
}
APPEND_OPCODES.add(76, vm => {
  let reference = vm.stack.peek();
  vm.stack.push(toContentType(valueForRef(reference))), isConstRef(reference) || vm.updateWith(new AssertFilter(reference, toContentType));
}), APPEND_OPCODES.add(106, vm => {
  let reference = vm.stack.peek();
  vm.stack.push(toDynamicContentType(valueForRef(reference))), isConstRef(reference) || vm.updateWith(new AssertFilter(reference, toDynamicContentType));
}), APPEND_OPCODES.add(43, vm => {
  let reference = vm.stack.pop(),
    rawValue = valueForRef(reference),
    value = isEmpty$2(rawValue) ? "" : String(rawValue);
  vm.tree().appendDynamicHTML(value);
}), APPEND_OPCODES.add(44, vm => {
  let reference = vm.stack.pop(),
    rawValue = valueForRef(reference).toHTML(),
    value = isEmpty$2(rawValue) ? "" : rawValue;
  vm.tree().appendDynamicHTML(value);
}), APPEND_OPCODES.add(47, vm => {
  let reference = vm.stack.pop(),
    rawValue = valueForRef(reference),
    value = isEmpty$2(rawValue) ? "" : String(rawValue),
    node = vm.tree().appendDynamicText(value);
  isConstRef(reference) || vm.updateWith(new DynamicTextContent(node, reference, value));
}), APPEND_OPCODES.add(45, vm => {
  let reference = vm.stack.pop(),
    value = valueForRef(reference);
  vm.tree().appendDynamicFragment(value);
}), APPEND_OPCODES.add(46, vm => {
  let reference = vm.stack.pop(),
    value = valueForRef(reference);
  vm.tree().appendDynamicNode(value);
});
let callback = debugCallback;

// For testing purposes
function setDebuggerCallback(cb) {
  callback = cb;
}
function resetDebuggerCallback() {
  callback = debugCallback;
}
class ScopeInspector {
  #symbols;
  constructor(scope, symbols) {
    this.scope = scope, this.#symbols = symbols;
  }
  get(path) {
    let ref,
      {
        scope: scope
      } = this,
      symbols = this.#symbols,
      parts = path.split("."),
      [head, ...tail] = path.split(".");
    return "this" === head ? ref = scope.getSelf() : symbols.locals[head] ? ref = scope.getSymbol(symbols.locals[head]) : (ref = this.scope.getSelf(), tail = parts), tail.reduce((r, part) => childRefFor(r, part), ref);
  }
}
APPEND_OPCODES.add(103, (vm, {
  op1: _debugInfo
}) => {
  let debuggerInfo = vm.constants.getValue(_debugInfo),
    inspector = new ScopeInspector(vm.scope(), debuggerInfo);
  callback(valueForRef(vm.getSelf()), path => valueForRef(inspector.get(path)));
}), APPEND_OPCODES.add(72, (vm, {
  op1: relativeStart,
  op2: elseTarget
}) => {
  let stack = vm.stack,
    listRef = stack.pop(),
    keyRef = stack.pop(),
    keyValue = valueForRef(keyRef),
    key = null === keyValue ? "@identity" : String(keyValue),
    iteratorRef = createIteratorRef(listRef, key),
    iterator = valueForRef(iteratorRef);
  vm.updateWith(new AssertFilter(iteratorRef, iterator => iterator.isEmpty())), iterator.isEmpty() ?
  // TODO: Fix this offset, should be accurate
  vm.lowlevel.goto(elseTarget + 1) : (vm.enterList(iteratorRef, relativeStart), vm.stack.push(iterator));
}), APPEND_OPCODES.add(73, vm => {
  vm.exitList();
}), APPEND_OPCODES.add(74, (vm, {
  op1: breaks
}) => {
  let item = vm.stack.peek().next();
  null !== item ? vm.registerItem(vm.enterItem(item)) : vm.lowlevel.goto(breaks);
});
const CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: false,
  attributeHook: false,
  elementHook: false,
  createCaller: false,
  dynamicScope: false,
  updateHook: false,
  createInstance: false,
  wrapped: false,
  willDestroy: false,
  hasSubOwner: false
};
class TemplateOnlyComponentManager {
  getCapabilities() {
    return CAPABILITIES;
  }
  getDebugName({
    name: name
  }) {
    return name;
  }
  getSelf() {
    return NULL_REFERENCE;
  }
  getDestroyable() {
    return null;
  }
}
const TEMPLATE_ONLY_COMPONENT_MANAGER = new TemplateOnlyComponentManager();

// This is only exported for types, don't use this class directly
class TemplateOnlyComponentDefinition {
  constructor(moduleName = "@glimmer/component/template-only", name = "(unknown template-only component)") {
    this.moduleName = moduleName, this.name = name;
  }
  toString() {
    return this.moduleName;
  }
}

/**
  This utility function is used to declare a given component has no backing class. When the rendering engine detects this it
  is able to perform a number of optimizations. Templates that are associated with `templateOnly()` will be rendered _as is_
  without adding a wrapping `<div>` (or any of the other element customization behaviors of [@ember/component](/ember/release/classes/Component)).
  Specifically, this means that the template will be rendered as "outer HTML".

  In general, this method will be used by build time tooling and would not be directly written in an application. However,
  at times it may be useful to use directly to leverage the "outer HTML" semantics mentioned above. For example, if an addon would like
  to use these semantics for its templates but cannot be certain it will only be consumed by applications that have enabled the
  `template-only-glimmer-components` optional feature.

  @example

  ```js
  import { templateOnlyComponent } from '@glimmer/runtime';

  export default templateOnlyComponent();
  ```

  @public
  @method templateOnly
  @param {String} moduleName the module name that the template only component represents, this will be used for debugging purposes
  @category EMBER_GLIMMER_SET_COMPONENT_TEMPLATE
*/
function templateOnlyComponent(moduleName, name) {
  return new TemplateOnlyComponentDefinition(moduleName, name);
}

// http://www.w3.org/TR/html/syntax.html#html-integration-point
setInternalComponentManager(TEMPLATE_ONLY_COMPONENT_MANAGER, TemplateOnlyComponentDefinition.prototype);
const SVG_INTEGRATION_POINTS = {
    foreignObject: 1,
    desc: 1,
    title: 1
  },
  BLACKLIST_TABLE = Object.create(null);

// http://www.w3.org/TR/html/syntax.html#adjust-svg-attributes
// TODO: Adjust SVG attributes
// http://www.w3.org/TR/html/syntax.html#parsing-main-inforeign
// TODO: Adjust SVG elements
// http://www.w3.org/TR/html/syntax.html#parsing-main-inforeign
class DOMOperations {
  constructor(document) {
    this.document = document, this.setupUselessElement();
  }
  // split into separate method so that NodeDOMTreeConstruction
  // can override it.
  setupUselessElement() {
    this.uselessElement = this.document.createElement("div");
  }
  createElement(tag, context) {
    let isElementInSVGNamespace, isHTMLIntegrationPoint, isElementInMathMlNamespace, ns;
    if (context ? (isElementInSVGNamespace = context.namespaceURI === NS_SVG || "svg" === tag, isElementInMathMlNamespace = context.namespaceURI === NS_MATHML || "math" === tag, isHTMLIntegrationPoint = !!SVG_INTEGRATION_POINTS[context.tagName]) : (isElementInSVGNamespace = "svg" === tag, isElementInMathMlNamespace = "math" === tag, isHTMLIntegrationPoint = false), !isElementInMathMlNamespace && !isElementInSVGNamespace || isHTMLIntegrationPoint) return this.document.createElement(tag);
    // FIXME: This does not properly handle <font> with color, face, or
    // size attributes, which is also disallowed by the spec. We should fix
    // this.
    if (BLACKLIST_TABLE[tag]) throw new Error(`Cannot create a ${tag} inside an SVG context`);
    return ns = isElementInMathMlNamespace ? NS_MATHML : NS_SVG, this.document.createElementNS(ns, tag);
  }
  insertBefore(parent, node, reference) {
    parent.insertBefore(node, reference);
  }
  insertHTMLBefore(parent, nextSibling, html) {
    if ("" === html) {
      const comment = this.createComment("");
      return parent.insertBefore(comment, nextSibling), new ConcreteBounds(parent, comment, comment);
    }
    const prev = nextSibling ? nextSibling.previousSibling : parent.lastChild;
    let last;
    if (null === nextSibling) parent.insertAdjacentHTML("beforeend", html), last = parent.lastChild;else if (nextSibling instanceof HTMLElement) nextSibling.insertAdjacentHTML("beforebegin", html), last = nextSibling.previousSibling;else {
      // Non-element nodes do not support insertAdjacentHTML, so add an
      // element and call it on that element. Then remove the element.
      // This also protects Edge, IE and Firefox w/o the inspector open
      // from merging adjacent text nodes. See ./compat/text-node-merging-fix.ts
      const {
        uselessElement: uselessElement
      } = this;
      parent.insertBefore(uselessElement, nextSibling), uselessElement.insertAdjacentHTML("beforebegin", html), last = uselessElement.previousSibling, parent.removeChild(uselessElement);
    }
    const first = prev ? prev.nextSibling : parent.firstChild;
    return new ConcreteBounds(parent, first, last);
  }
  createTextNode(text) {
    return this.document.createTextNode(text);
  }
  createComment(data) {
    return this.document.createComment(data);
  }
}

// Patch:    insertAdjacentHTML on SVG Fix
// Browsers: Safari, IE, Edge, Firefox ~33-34
// Reason:   insertAdjacentHTML does not exist on SVG elements in Safari. It is
//           present but throws an exception on IE and Edge. Old versions of
//           Firefox create nodes in the incorrect namespace.
// Fix:      Since IE and Edge silently fail to create SVG nodes using
//           innerHTML, and because Firefox may create nodes in the incorrect
//           namespace using innerHTML on SVG elements, an HTML-string wrapping
//           approach is used. A pre/post SVG tag is added to the string, then
//           that whole string is added to a div. The created nodes are plucked
//           out and applied to the target location on DOM.
function applySVGInnerHTMLFix(document, DOMClass, svgNamespace) {
  if (!document) return DOMClass;
  if (!function (document, svgNamespace) {
    const svg = document.createElementNS(svgNamespace, "svg");
    try {
      svg.insertAdjacentHTML("beforeend", "<circle></circle>");
    } catch {
      // IE, Edge: Will throw, insertAdjacentHTML is unsupported on SVG
      // Safari: Will throw, insertAdjacentHTML is not present on SVG
    } finally {
      // FF: Old versions will create a node in the wrong namespace
      return 1 !== svg.childNodes.length || svg.firstChild.namespaceURI !== NS_SVG;
      // eslint-disable-next-line no-unsafe-finally
    }
  }
  // Patch:    Adjacent text node merging fix
  // Browsers: IE, Edge, Firefox w/o inspector open
  // Reason:   These browsers will merge adjacent text nodes. For example given
  //           <div>Hello</div> with div.insertAdjacentHTML(' world') browsers
  //           with proper behavior will populate div.childNodes with two items.
  //           These browsers will populate it with one merged node instead.
  // Fix:      Add these nodes to a wrapper element, then iterate the childNodes
  //           of that wrapper and move the nodes to their target location. Note
  //           that potential SVG bugs will have been handled before this fix.
  //           Note that this fix must only apply to the previous text node, as
  //           the base implementation of `insertHTMLBefore` already handles
  //           following text nodes correctly.
  (document, svgNamespace)) return DOMClass;
  const div = document.createElement("div");
  return class extends DOMClass {
    insertHTMLBefore(parent, nextSibling, html) {
      return "" === html || parent.namespaceURI !== svgNamespace ? super.insertHTMLBefore(parent, nextSibling, html) : function (parent, div, html, reference) {
        let source;
        // This is important, because descendants of the <foreignObject> integration
        // point are parsed in the HTML namespace
        if ("FOREIGNOBJECT" === parent.tagName.toUpperCase()) {
          // IE, Edge: also do not correctly support using `innerHTML` on SVG
          // namespaced elements. So here a wrapper is used.
          const wrappedHtml = "<svg><foreignObject>" + html + "</foreignObject></svg>";
          clearElement(div), div.insertAdjacentHTML("afterbegin", wrappedHtml),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
          source = div.firstChild.firstChild;
        } else {
          // IE, Edge: also do not correctly support using `innerHTML` on SVG
          // namespaced elements. So here a wrapper is used.
          const wrappedHtml = "<svg>" + html + "</svg>";
          clearElement(div), div.insertAdjacentHTML("afterbegin", wrappedHtml),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
          source = div.firstChild;
        }
        return function (source, target, nextSibling) {
          const first = source.firstChild;
          let last = first,
            current = first;
          for (; current;) {
            const next = current.nextSibling;
            target.insertBefore(current, nextSibling), last = current, current = next;
          }
          return new ConcreteBounds(target, first, last);
        }(source, parent, reference);
      }(parent, div, html, nextSibling);
    }
  };
}
function applyTextNodeMergingFix(document, DOMClass) {
  return document && function (document) {
    const mergingTextDiv = document.createElement("div");
    return mergingTextDiv.appendChild(document.createTextNode("first")), mergingTextDiv.insertAdjacentHTML("beforeend", "second"), 2 !== mergingTextDiv.childNodes.length;
  }(document) ? class extends DOMClass {
    constructor(document) {
      super(document), this.uselessComment = document.createComment("");
    }
    insertHTMLBefore(parent, nextSibling, html) {
      if ("" === html) return super.insertHTMLBefore(parent, nextSibling, html);
      let didSetUselessComment = false;
      const nextPrevious = nextSibling ? nextSibling.previousSibling : parent.lastChild;
      nextPrevious && nextPrevious instanceof Text && (didSetUselessComment = true, parent.insertBefore(this.uselessComment, nextSibling));
      const bounds = super.insertHTMLBefore(parent, nextSibling, html);
      return didSetUselessComment && parent.removeChild(this.uselessComment), bounds;
    }
  } : DOMClass;
}
const doc$1 = "undefined" == typeof document ? null : castToSimple(document);
let appliedTreeConstruction = class extends DOMOperations {
  createElementNS(namespace, tag) {
    return this.document.createElementNS(namespace, tag);
  }
  setAttribute(element, name, value, namespace = null) {
    namespace ? element.setAttributeNS(namespace, name, value) : element.setAttribute(name, value);
  }
};
appliedTreeConstruction = applyTextNodeMergingFix(doc$1, appliedTreeConstruction), appliedTreeConstruction = applySVGInnerHTMLFix(doc$1, appliedTreeConstruction, NS_SVG);
const DOMTreeConstruction = appliedTreeConstruction;
["b", "big", "blockquote", "body", "br", "center", "code", "dd", "div", "dl", "dt", "em", "embed", "h1", "h2", "h3", "h4", "h5", "h6", "head", "hr", "i", "img", "li", "listing", "main", "meta", "nobr", "ol", "p", "pre", "ruby", "s", "small", "span", "strong", "strike", "sub", "sup", "table", "tt", "u", "ul", "var"].forEach(tag => BLACKLIST_TABLE[tag] = 1);
const WHITESPACE = /[\t\n\v\f\r \xa0\u{1680}\u{180e}\u{2000}-\u{200a}\u{2028}\u{2029}\u{202f}\u{205f}\u{3000}\u{feff}]/u,
  doc = "undefined" == typeof document ? null : castToSimple(document);
function isWhitespace(string) {
  return WHITESPACE.test(string);
}
class DOMChangesImpl extends DOMOperations {
  constructor(document1) {
    super(document1), this.document = document1, this.namespace = null;
  }
  setAttribute(element, name, value) {
    element.setAttribute(name, value);
  }
  removeAttribute(element, name) {
    element.removeAttribute(name);
  }
  insertAfter(element, node, reference) {
    this.insertBefore(element, node, reference.nextSibling);
  }
}
let helper = DOMChangesImpl;
helper = applyTextNodeMergingFix(doc, helper), helper = applySVGInnerHTMLFix(doc, helper, NS_SVG);
const DOMChanges = helper;

/*
 * @method normalizeProperty
 * @param element {HTMLElement}
 * @param slotName {String}
 * @returns {Object} { name, type }
 */
function normalizeProperty(element, slotName) {
  let type, normalized;
  if (slotName in element) normalized = slotName, type = "prop";else {
    let lower = slotName.toLowerCase();
    lower in element ? (type = "prop", normalized = lower) : (type = "attr", normalized = slotName);
  }
  return "prop" !== type || "style" !== normalized.toLowerCase() && !function (tagName, propName) {
    let tag = ATTR_OVERRIDES[tagName.toUpperCase()];
    return !(!tag || !tag[propName.toLowerCase()]);
  }(element.tagName, normalized) || (type = "attr"), {
    normalized: normalized,
    type: type
  };
}

// properties that MUST be set as attributes, due to:
// * browser bug
// * strange spec outlier
const ATTR_OVERRIDES = {
    INPUT: {
      form: true,
      // Chrome 46.0.2464.0: 'autocorrect' in document.createElement('input') === false
      // Safari 8.0.7: 'autocorrect' in document.createElement('input') === false
      // Mobile Safari (iOS 8.4 simulator): 'autocorrect' in document.createElement('input') === true
      autocorrect: true,
      // Chrome 54.0.2840.98: 'list' in document.createElement('input') === true
      // Safari 9.1.3: 'list' in document.createElement('input') === false
      list: true
    },
    // element.form is actually a legitimate readOnly property, that is to be
    // mutated, but must be mutated by setAttribute...
    SELECT: {
      form: true
    },
    OPTION: {
      form: true
    },
    TEXTAREA: {
      form: true
    },
    LABEL: {
      form: true
    },
    FIELDSET: {
      form: true
    },
    LEGEND: {
      form: true
    },
    OBJECT: {
      form: true
    },
    OUTPUT: {
      form: true
    },
    BUTTON: {
      form: true
    }
  },
  TRANSACTION = Symbol("TRANSACTION");
class TransactionImpl {
  didCreate(component) {
    this.createdComponents.push(component);
  }
  didUpdate(component) {
    this.updatedComponents.push(component);
  }
  scheduleInstallModifier(modifier) {
    this.scheduledInstallModifiers.push(modifier);
  }
  scheduleUpdateModifier(modifier) {
    this.scheduledUpdateModifiers.push(modifier);
  }
  commit() {
    let {
      createdComponents: createdComponents,
      updatedComponents: updatedComponents
    } = this;
    for (const {
      manager: manager,
      state: state
    } of createdComponents) manager.didCreate(state);
    for (const {
      manager: manager,
      state: state
    } of updatedComponents) manager.didUpdate(state);
    let {
      scheduledInstallModifiers: scheduledInstallModifiers,
      scheduledUpdateModifiers: scheduledUpdateModifiers
    } = this;
    for (const {
      manager: manager,
      state: state,
      definition: definition
    } of scheduledInstallModifiers) {
      let modifierTag = manager.getTag(state);
      if (null !== modifierTag) {
        let tag = track(() => manager.install(state), isDevelopingApp() && `- While rendering:\n  (instance of a \`${definition.resolvedName || manager.getDebugName(definition.state)}\` modifier)`);
        UPDATE_TAG(modifierTag, tag);
      } else manager.install(state);
    }
    for (const {
      manager: manager,
      state: state,
      definition: definition
    } of scheduledUpdateModifiers) {
      let modifierTag = manager.getTag(state);
      if (null !== modifierTag) {
        let tag = track(() => manager.update(state), isDevelopingApp() && `- While rendering:\n  (instance of a \`${definition.resolvedName || manager.getDebugName(definition.state)}\` modifier)`);
        UPDATE_TAG(modifierTag, tag);
      } else manager.update(state);
    }
  }
  constructor() {
    this.scheduledInstallModifiers = [], this.scheduledUpdateModifiers = [], this.createdComponents = [], this.updatedComponents = [];
  }
}
class EnvironmentImpl {
  static {
    _TRANSACTION = TRANSACTION;
  }
  constructor(options, delegate) {
    if (this.delegate = delegate, this[_TRANSACTION] = null, this.isInteractive = delegate.isInteractive, this.debugRenderTree = this.delegate.enableDebugTooling ? new DebugRenderTreeImpl() : void 0, this.isArgumentCaptureError = this.delegate.enableDebugTooling ? isArgumentError : void 0, options.appendOperations) this.appendOperations = options.appendOperations, this.updateOperations = options.updateOperations;else if (options.document) this.appendOperations = new DOMTreeConstruction(options.document), this.updateOperations = new DOMChangesImpl(options.document);else if (isDevelopingApp()) throw new Error("you must pass document or appendOperations to a new runtime");
  }
  getAppendOperations() {
    return this.appendOperations;
  }
  getDOM() {
    return this.updateOperations;
  }
  begin() {
    this[TRANSACTION], this.debugRenderTree?.begin(), this[TRANSACTION] = new TransactionImpl();
  }
  get transaction() {
    return this[TRANSACTION];
  }
  didCreate(component) {
    this.transaction.didCreate(component);
  }
  didUpdate(component) {
    this.transaction.didUpdate(component);
  }
  scheduleInstallModifier(modifier) {
    this.isInteractive && this.transaction.scheduleInstallModifier(modifier);
  }
  scheduleUpdateModifier(modifier) {
    this.isInteractive && this.transaction.scheduleUpdateModifier(modifier);
  }
  commit() {
    let transaction = this.transaction;
    this[TRANSACTION] = null, transaction.commit(), this.debugRenderTree?.commit(), this.delegate.onTransactionCommit();
  }
}
function runtimeOptions(options, delegate, artifacts, resolver) {
  return {
    env: new EnvironmentImpl(options, delegate),
    program: new ProgramImpl(artifacts.constants, artifacts.heap),
    resolver: resolver
  };
}
function inTransaction(env, block) {
  if (env[TRANSACTION]) block();else {
    env.begin();
    try {
      block();
    } finally {
      env.commit();
    }
  }
}
var _TRANSACTION;
function internalHelper(helper) {
  return setInternalHelperManager(helper, {});
}

/**
   Use the `{{array}}` helper to create an array to pass as an option to your
   components.

   ```handlebars
   <MyComponent @people={{array
     'Tom Dale'
     'Yehuda Katz'
     this.myOtherPerson}}
   />
   ```
    or
   ```handlebars
   {{my-component people=(array
     'Tom Dale'
     'Yehuda Katz'
     this.myOtherPerson)
   }}
   ```

   Would result in an object such as:

   ```js
   ['Tom Dale', 'Yehuda Katz', this.get('myOtherPerson')]
   ```

   Where the 3rd item in the array is bound to updates of the `myOtherPerson` property.

   @method array
   @param {Array} options
   @return {Array} Array
   @public
 */
const array = internalHelper(({
    positional: positional
  }) => createComputeRef(() => reifyPositional(positional), null, "array")),
  normalizeTextValue = value => (value => null == value || "function" != typeof value.toString)(value) ? "" : String(value),
  concat = internalHelper(({
    positional: positional
  }) => createComputeRef(() => reifyPositional(positional).map(normalizeTextValue).join(""), null, "concat")),
  context = buildUntouchableThis("`fn` helper"),
  fn = internalHelper(({
    positional: positional
  }) => {
    let callbackRef = positional[0];
    return createComputeRef(() => (...invocationArgs) => {
      let [fn, ...args] = reifyPositional(positional);
      if (isDevelopingApp() && function (callbackRef) {
        if (!callbackRef || !isInvokableRef(callbackRef) && "function" != typeof valueForRef(callbackRef)) throw new Error(`You must pass a function as the \`fn\` helper's first argument, you passed ${callbackRef ? valueForRef(callbackRef) : callbackRef}. While rendering:\n\n${callbackRef?.debugLabel}`);
      }
      /**
      Dynamically look up a property on an object. The second argument to `{{get}}`
      should have a string value, although it can be bound.
      For example, these two usages are equivalent:
      ```app/components/developer-detail.js
      import Component from '@glimmer/component';
      import { tracked } from '@glimmer/tracking';
      export default class extends Component {
      @tracked developer = {
      name: "Sandi Metz",
      language: "Ruby"
      }
      }
      ```
      ```handlebars
      {{this.developer.name}}
      {{get this.developer "name"}}
      ```
      If there were several facts about a person, the `{{get}}` helper can dynamically
      pick one:
      ```app/templates/application.hbs
      <DeveloperDetail @factName="language" />
      ```
      ```handlebars
      {{get this.developer @factName}}
      ```
      For a more complex example, this template would allow the user to switch
      between showing the user's height and weight with a click:
      ```app/components/developer-detail.js
      import Component from '@glimmer/component';
      import { tracked } from '@glimmer/tracking';
      export default class extends Component {
      @tracked developer = {
      name: "Sandi Metz",
      language: "Ruby"
      }
      @tracked currentFact = 'name'
      showFact = (fact) => {
      this.currentFact = fact;
      }
      }
      ```
      ```app/components/developer-detail.js
      {{get this.developer this.currentFact}}
      <button {{on 'click' (fn this.showFact "name")}}>Show name</button>
      <button {{on 'click' (fn this.showFact "language")}}>Show language</button>
      ```
      The `{{get}}` helper can also respect mutable values itself. For example:
      ```app/components/developer-detail.js
      <Input @value={{mut (get this.person this.currentFact)}} />
      <button {{on 'click' (fn this.showFact "name")}}>Show name</button>
      <button {{on 'click' (fn this.showFact "language")}}>Show language</button>
      ```
      Would allow the user to swap what fact is being displayed, and also edit
      that fact via a two-way mutable binding.
      @public
      @method get
      */(callbackRef), !isInvokableRef(callbackRef))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- @fixme
        return fn.call(context, ...args, ...invocationArgs);
      {
        let value = args.length > 0 ? args[0] : invocationArgs[0];
        updateRef(callbackRef, value);
      }
    }, null, "fn");
  }),
  get = internalHelper(({
    positional: positional
  }) => {
    let sourceRef = positional[0] ?? UNDEFINED_REFERENCE,
      pathRef = positional[1] ?? UNDEFINED_REFERENCE;
    return createComputeRef(() => {
      let source = valueForRef(sourceRef);
      if (isDict(source)) return getPath(source, String(valueForRef(pathRef)));
    }, value => {
      let source = valueForRef(sourceRef);
      if (isDict(source)) return setPath(source, String(valueForRef(pathRef)), value);
    }, "get");
  }),
  hash = internalHelper(({
    named: named
  }) => {
    let ref = createComputeRef(() => reifyNamed(named), null, "hash"),
      children = new Map();
    // Setup the children so that templates can bypass getting the value of
    // the reference and treat children lazily
    for (let name in named) children.set(name, named[name]);
    return ref.children = children, ref;
  });
let ARGS_CACHES = isDevelopingApp() ? new WeakMap() : void 0;
function getArgs(proxy) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  return getValue(isDevelopingApp() ? ARGS_CACHES.get(proxy) : proxy.argsCache);
}
class SimpleArgsProxy {
  constructor(context, computeArgs = () => EMPTY_ARGS) {
    let argsCache = createCache(() => computeArgs(context));
    isDevelopingApp() ? (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    ARGS_CACHES.set(this, argsCache), Object.freeze(this)) : this.argsCache = argsCache;
  }
  get named() {
    return getArgs(this).named || EMPTY_NAMED;
  }
  get positional() {
    return getArgs(this).positional || EMPTY_POSITIONAL;
  }
}

////////////
function invokeHelper(context, definition, computeArgs) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS usage
  if (isDevelopingApp() && ("object" != typeof context || null === context)) throw new Error(`Expected a context object to be passed as the first parameter to invokeHelper, got ${context}`);
  const owner = getOwner(context),
    internalManager = getInternalHelperManager(definition);
  if (isDevelopingApp() && "function" == typeof internalManager) throw new Error("Found a helper manager, but it was an internal built-in helper manager. `invokeHelper` does not support internal helpers yet.");
  const manager = internalManager.getDelegateFor(owner);
  let cache,
    args = new SimpleArgsProxy(context, computeArgs),
    bucket = manager.createHelper(definition, args);
  if (!hasValue(manager)) throw new Error("TODO: unreachable, to be implemented with hasScheduledEffect");
  if (cache = createCache(() => {
    if (isDevelopingApp() && (isDestroying(cache) || isDestroyed(cache))) throw new Error("You attempted to get the value of a helper after the helper was destroyed, which is not allowed");
    return manager.getValue(bucket);
  }), associateDestroyableChild(context, cache), hasDestroyable(manager)) {
    let destroyable = manager.getDestroyable(bucket);
    associateDestroyableChild(cache, destroyable);
  }
  return cache;
}
const untouchableContext = buildUntouchableThis("`on` modifier");
class OnModifierState {
  constructor(element, args) {
    this.tag = createUpdatableTag(), this.listener = null, this.element = element, this.args = args, registerDestructor(this, () => {
      let {
        element: element,
        listener: listener
      } = this;
      if (listener) {
        let {
          eventName: eventName,
          callback: callback,
          options: options
        } = listener;
        removeEventListener(element, eventName, callback, options);
      }
    });
  }
  // Update this.listener if needed
  updateListener() {
    let {
      element: element,
      args: args,
      listener: listener
    } = this;
    args.positional[0];
    let eventName = valueForRef(args.positional[0]);
    args.positional[1];
    let once,
      passive,
      capture,
      userProvidedCallback = valueForRef(args.positional[1]);
    if (isDevelopingApp() && 2 !== args.positional.length) throw new Error(`You can only pass two positional arguments (event name and callback) to the \`on\` modifier, but you provided ${args.positional.length}. Consider using the \`fn\` helper to provide additional arguments to the \`on\` callback.`);
    if (isDevelopingApp()) {
      let {
        once: _once,
        passive: _passive,
        capture: _capture,
        ...extra
      } = reifyNamed(args.named);
      if (once = _once, passive = _passive, capture = _capture, Object.keys(extra).length > 0) throw new Error(`You can only \`once\`, \`passive\` or \`capture\` named arguments to the \`on\` modifier, but you provided ${Object.keys(extra).join(", ")}.`);
    } else {
      let {
        once: _once,
        passive: _passive,
        capture: _capture
      } = args.named;
      _once && (once = valueForRef(_once)), _passive && (passive = valueForRef(_passive)), _capture && (capture = valueForRef(_capture));
    }
    let options,
      shouldUpdate = false;
    if (shouldUpdate = null === listener || eventName !== listener.eventName || userProvidedCallback !== listener.userProvidedCallback || once !== listener.once || passive !== listener.passive || capture !== listener.capture,
    // we want to handle both `true` and `false` because both have a meaning:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=770208
    shouldUpdate && (void 0 === once && void 0 === passive && void 0 === capture || (options = {
      once: once,
      passive: passive,
      capture: capture
    })), shouldUpdate) {
      let callback = userProvidedCallback;
      if (isDevelopingApp() && (callback = userProvidedCallback.bind(untouchableContext), passive)) {
        let _callback = callback;
        callback = event => (event.preventDefault = () => {
          throw new Error(`You marked this listener as 'passive', meaning that you must not call 'event.preventDefault()': \n\n${userProvidedCallback.name || "{anonymous function}"}`);
        }, _callback(event));
      }
      this.listener = {
        eventName: eventName,
        callback: callback,
        userProvidedCallback: userProvidedCallback,
        once: once,
        passive: passive,
        capture: capture,
        options: options
      }, listener && removeEventListener(element, listener.eventName, listener.callback, listener.options), function (element, eventName, callback, options) {
        adds++, element.addEventListener(eventName, callback, options);
      }
      /**
      The `{{on}}` modifier lets you easily add event listeners (it uses
      [EventTarget.addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
      internally).
      For example, if you'd like to run a function on your component when a `<button>`
      in the components template is clicked you might do something like:
      ```app/components/like-post.hbs
      <button {{on 'click' this.saveLike}}>Like this post!</button>
      ```
      ```app/components/like-post.js
      import Component from '@glimmer/component';
      import { action } from '@ember/object';
      export default class LikePostComponent extends Component {
      saveLike = () => {
      // someone likes your post!
      // better send a request off to your server...
      }
      }
      ```
      ### Arguments
      `{{on}}` accepts two positional arguments, and a few named arguments.
      The positional arguments are:
      - `event` -- the name to use when calling `addEventListener`
      - `callback` -- the function to be passed to `addEventListener`
      The named arguments are:
      - capture -- a `true` value indicates that events of this type will be dispatched
      to the registered listener before being dispatched to any EventTarget beneath it
      in the DOM tree.
      - once -- indicates that the listener should be invoked at most once after being
      added. If true, the listener would be automatically removed when invoked.
      - passive -- if `true`, indicates that the function specified by listener will never
      call preventDefault(). If a passive listener does call preventDefault(), the user
      agent will do nothing other than generate a console warning. See
      [Improving scrolling performance with passive listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners)
      to learn more.
      The callback function passed to `{{on}}` will receive any arguments that are passed
      to the event handler. Most commonly this would be the `event` itself.
      If you would like to pass additional arguments to the function you should use
      the `{{fn}}` helper.
      For example, in our example case above if you'd like to pass in the post that
      was being liked when the button is clicked you could do something like:
      ```app/components/like-post.hbs
      <button {{on 'click' (fn this.saveLike @post)}}>Like this post!</button>
      ```
      In this case, the `saveLike` function will receive two arguments: the click event
      and the value of `@post`.
      ### Function Context
      In the example above, we used an arrow function to ensure that `likePost` is
      properly bound to the `items-list`, but let's explore what happens if we
      left out the arrow function:
      ```app/components/like-post.js
      import Component from '@glimmer/component';
      export default class LikePostComponent extends Component {
      saveLike() {
      // ...snip...
      }
      }
      ```
      In this example, when the button is clicked `saveLike` will be invoked,
      it will **not** have access to the component instance. In other
      words, it will have no `this` context, so please make sure your functions
      are bound (via an arrow function or other means) before passing into `on`!
      @method on
      @public
      */(element, eventName, callback, options);
    }
  }
}
let adds = 0,
  removes = 0;
function removeEventListener(element, eventName, callback, options) {
  removes++, element.removeEventListener(eventName, callback, options);
}
const on = setInternalModifierManager(new class {
  getDebugName() {
    return "on";
  }
  getDebugInstance() {
    return null;
  }
  get counters() {
    return {
      adds: adds,
      removes: removes
    };
  }
  create(_owner, element, _state, args) {
    return new OnModifierState(element, args);
  }
  getTag({
    tag: tag
  }) {
    return tag;
  }
  install(state) {
    state.updateListener();
  }
  update(state) {
    state.updateListener();
  }
  getDestroyable(state) {
    return state;
  }
}(), {});
class LowLevelVM {
  constructor(stack, context, externs, registers) {
    this.stack = stack, this.externs = externs, this.currentOpSize = 0, this.context = context, this.registers = registers;
  }
  fetchRegister(register) {
    return this.registers[register];
  }
  loadRegister(register, value) {
    this.registers[register] = value;
  }
  setPc(pc) {
    this.registers[$pc] = pc;
  }
  // Start a new frame and save $ra and $fp on the stack
  pushFrame() {
    this.stack.push(this.registers[$ra]), this.stack.push(this.registers[$fp]), this.registers[$fp] = this.registers[$sp] - 1;
  }
  // Restore $ra, $sp and $fp
  popFrame() {
    this.registers[$sp] = this.registers[$fp] - 1, this.registers[$ra] = this.stack.get(0), this.registers[$fp] = this.stack.get(1);
  }
  pushSmallFrame() {
    this.stack.push(this.registers[$ra]);
  }
  popSmallFrame() {
    this.registers[$ra] = this.stack.pop();
  }
  // Jump to an address in `program`
  goto(offset) {
    this.setPc(this.target(offset));
  }
  target(offset) {
    return this.registers[$pc] + offset - this.currentOpSize;
  }
  // Save $pc into $ra, then jump to a new address in `program` (jal in MIPS)
  call(handle) {
    this.registers[$ra] = this.registers[$pc], this.setPc(this.context.program.heap.getaddr(handle));
  }
  // Put a specific `program` address in $ra
  returnTo(offset) {
    this.registers[$ra] = this.target(offset);
  }
  // Return to the `program` address stored in $ra
  return() {
    this.setPc(this.registers[$ra]);
  }
  nextStatement() {
    let {
        registers: registers,
        context: context
      } = this,
      pc = registers[$pc];
    if (-1 === pc) return null;
    // We have to save off the current operations size so that
    // when we do a jump we can calculate the correct offset
    // to where we are going. We can't simply ask for the size
    // in a jump because we have have already incremented the
    // program counter to the next instruction prior to executing.
    let opcode = context.program.opcode(pc),
      operationSize = this.currentOpSize = opcode.size;
    return this.registers[$pc] += operationSize, opcode;
  }
  evaluateOuter(opcode, vm) {
    this.evaluateInner(opcode, vm);
  }
  evaluateInner(opcode, vm) {
    opcode.isMachine ? this.evaluateMachine(opcode, vm) : this.evaluateSyscall(opcode, vm);
  }
  evaluateMachine(opcode, vm) {
    switch (opcode.type) {
      case 0:
        return void this.pushFrame();
      case 1:
        return void this.popFrame();
      case 3:
        return void this.call(opcode.op1);
      case 2:
        return void vm.call(this.stack.pop());
      case 4:
        return void this.goto(opcode.op1);
      case 5:
        return void vm.return();
      case 6:
        return void this.returnTo(opcode.op1);
    }
  }
  evaluateSyscall(opcode, vm) {
    APPEND_OPCODES.evaluate(vm, opcode, opcode.type);
  }
}
const badProtocols = ["javascript:", "vbscript:"],
  badTags = ["A", "BODY", "LINK", "IMG", "IFRAME", "BASE", "FORM"],
  badTagsForDataURI = ["EMBED"],
  badAttributes = ["href", "src", "background", "action"],
  badAttributesForDataURI = ["src"];
function has(array, item) {
  return -1 !== array.indexOf(item);
}
function checkURI(tagName, attribute) {
  return (null === tagName || has(badTags, tagName)) && has(badAttributes, attribute);
}
function checkDataURI(tagName, attribute) {
  return null !== tagName && has(badTagsForDataURI, tagName) && has(badAttributesForDataURI, attribute);
}
function requiresSanitization(tagName, attribute) {
  return checkURI(tagName, attribute) || checkDataURI(tagName, attribute);
}
let _protocolForUrlImplementation, DebugStyleAttributeManager;
function sanitizeAttributeValue(element, attribute, value) {
  if (null == value) return value;
  if (isSafeString(value)) return value.toHTML();
  const tagName = element.tagName.toUpperCase();
  let str = normalizeStringValue(value);
  if (checkURI(tagName, attribute)) {
    let protocol = (url = str, _protocolForUrlImplementation || (_protocolForUrlImplementation = function () {
      const weirdURL = URL;
      if ("object" == typeof weirdURL && null !== weirdURL &&
      // this is super annoying, TS thinks that URL **must** be a function so `URL.parse` check
      // thinks it is `never` without this `as unknown as any`
      "function" == typeof weirdURL.parse) {
        // In Ember-land the `fastboot` package sets the `URL` global to `require('url')`
        // ultimately, this should be changed (so that we can either rely on the natural `URL` global
        // that exists) but for now we have to detect the specific `FastBoot` case first
        // a future version of `fastboot` will detect if this legacy URL setup is required (by
        // inspecting Ember version) and if new enough, it will avoid shadowing the `URL` global
        // constructor with `require('url')`.
        let nodeURL = weirdURL;
        return url => {
          let protocol = null;
          return "string" == typeof url && (protocol = nodeURL.parse(url).protocol), null === protocol ? ":" : protocol;
        };
      }
      if ("function" == typeof weirdURL) return _url => {
        try {
          return new weirdURL(_url).protocol;
        } catch {
          // any non-fully qualified url string will trigger an error (because there is no
          // baseURI that we can provide; in that case we **know** that the protocol is
          // "safe" because it isn't specifically one of the `badProtocols` listed above
          // (and those protocols can never be the default baseURI)
          return ":";
        }
      };
      throw new Error('@glimmer/runtime needs a valid "globalThis.URL"');
    }()), _protocolForUrlImplementation(url));
    if (has(badProtocols, protocol)) return `unsafe:${str}`;
  }
  var url;
  return checkDataURI(tagName, attribute) ? `unsafe:${str}` : str;
}
function dynamicAttribute(element, attr, namespace, isTrusting = false) {
  const {
      tagName: tagName,
      namespaceURI: namespaceURI
    } = element,
    attribute = {
      element: element,
      name: attr,
      namespace: namespace
    };
  if (isDevelopingApp() && "style" === attr && !isTrusting) return new DebugStyleAttributeManager(attribute);
  if (namespaceURI === NS_SVG) return buildDynamicAttribute(tagName, attr, attribute);
  const {
    type: type,
    normalized: normalized
  } = normalizeProperty(element, attr);
  return "attr" === type ? buildDynamicAttribute(tagName, normalized, attribute) : function (tagName, name, attribute) {
    return requiresSanitization(tagName, name) ? new SafeDynamicProperty(name, attribute) : function (tagName, attribute) {
      return ("INPUT" === tagName || "TEXTAREA" === tagName) && "value" === attribute;
    }(tagName, name) ? new InputValueDynamicAttribute(name, attribute) : function (tagName, attribute) {
      return "OPTION" === tagName && "selected" === attribute;
    }(tagName, name) ? new OptionSelectedDynamicAttribute(name, attribute) : new DefaultDynamicProperty(name, attribute);
  }(tagName, normalized, attribute);
}
function buildDynamicAttribute(tagName, name, attribute) {
  return requiresSanitization(tagName, name) ? new SafeDynamicAttribute(attribute) : new SimpleDynamicAttribute(attribute);
}
class DynamicAttribute {
  constructor(attribute) {
    this.attribute = attribute;
  }
}
class SimpleDynamicAttribute extends DynamicAttribute {
  set(dom, value, _env) {
    const normalizedValue = normalizeValue(value);
    if (null !== normalizedValue) {
      const {
        name: name,
        namespace: namespace
      } = this.attribute;
      dom.__setAttribute(name, normalizedValue, namespace);
    }
  }
  update(value, _env) {
    const normalizedValue = normalizeValue(value),
      {
        element: element,
        name: name
      } = this.attribute;
    null === normalizedValue ? element.removeAttribute(name) : element.setAttribute(name, normalizedValue);
  }
}
class DefaultDynamicProperty extends DynamicAttribute {
  constructor(normalizedName, attribute) {
    super(attribute), this.normalizedName = normalizedName;
  }
  set(dom, value, _env) {
    null != value && (this.value = value, dom.__setProperty(this.normalizedName, value));
  }
  update(value, _env) {
    const {
      element: element
    } = this.attribute;
    this.value !== value && (element[this.normalizedName] = this.value = value, null == value && this.removeAttribute());
  }
  removeAttribute() {
    // TODO this sucks but to preserve properties first and to meet current
    // semantics we must do this.
    const {
      element: element,
      namespace: namespace
    } = this.attribute;
    namespace ? element.removeAttributeNS(namespace, this.normalizedName) : element.removeAttribute(this.normalizedName);
  }
}
class SafeDynamicProperty extends DefaultDynamicProperty {
  set(dom, value, env) {
    const {
        element: element,
        name: name
      } = this.attribute,
      sanitized = sanitizeAttributeValue(element, name, value);
    super.set(dom, sanitized, env);
  }
  update(value, env) {
    const {
        element: element,
        name: name
      } = this.attribute,
      sanitized = sanitizeAttributeValue(element, name, value);
    super.update(sanitized, env);
  }
}
class SafeDynamicAttribute extends SimpleDynamicAttribute {
  set(dom, value, env) {
    const {
        element: element,
        name: name
      } = this.attribute,
      sanitized = sanitizeAttributeValue(element, name, value);
    super.set(dom, sanitized, env);
  }
  update(value, env) {
    const {
        element: element,
        name: name
      } = this.attribute,
      sanitized = sanitizeAttributeValue(element, name, value);
    super.update(sanitized, env);
  }
}
class InputValueDynamicAttribute extends DefaultDynamicProperty {
  set(dom, value) {
    dom.__setProperty("value", normalizeStringValue(value));
  }
  update(value) {
    const input = this.attribute.element,
      currentValue = input.value,
      normalizedValue = normalizeStringValue(value);
    currentValue !== normalizedValue && (input.value = normalizedValue);
  }
}
class OptionSelectedDynamicAttribute extends DefaultDynamicProperty {
  set(dom, value) {
    null != value && false !== value && dom.__setProperty("selected", true);
  }
  update(value) {
    this.attribute.element.selected = !!value;
  }
}
function normalizeValue(value) {
  return false === value || null == value || void 0 === value.toString ? null : true === value ? "" :
  // onclick function etc in SSR
  "function" == typeof value ? null : String(value);
}
isDevelopingApp() && (DebugStyleAttributeManager = class extends SimpleDynamicAttribute {
  set(dom, value, env) {
    warnIfStyleNotTrusted(value), super.set(dom, value, env);
  }
  update(value, env) {
    warnIfStyleNotTrusted(value), super.update(value, env);
  }
});
class First {
  constructor(node) {
    this.node = node;
  }
  firstNode() {
    return this.node;
  }
}
class Last {
  constructor(node) {
    this.node = node;
  }
  lastNode() {
    return this.node;
  }
}
class NewTreeBuilder {
  static forInitialRender(env, cursor) {
    return new this(env, cursor.element, cursor.nextSibling).initialize();
  }
  static resume(env, block) {
    let stack = new this(env, block.parentElement(), block.reset(env)).initialize();
    return stack.pushBlock(block), stack;
  }
  constructor(env, parentNode, nextSibling) {
    this.constructing = null, this.operations = null, this.cursors = new StackImpl(), this.modifierStack = new StackImpl(), this.blockStack = new StackImpl(), this.pushElement(parentNode, nextSibling), this.env = env, this.dom = env.getAppendOperations(), this.updateOperations = env.getDOM();
  }
  initialize() {
    return this.pushAppendingBlock(), this;
  }
  debugBlocks() {
    return this.blockStack.toArray();
  }
  get element() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    return this.cursors.current.element;
  }
  get nextSibling() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    return this.cursors.current.nextSibling;
  }
  get hasBlocks() {
    return this.blockStack.size > 0;
  }
  block() {
    return this.blockStack.current;
  }
  popElement() {
    this.cursors.pop(), this.cursors.current;
  }
  pushAppendingBlock() {
    return this.pushBlock(new AppendingBlockImpl(this.element));
  }
  pushResettableBlock() {
    return this.pushBlock(new ResettableBlockImpl(this.element));
  }
  pushBlockList(list) {
    return this.pushBlock(new AppendingBlockList(this.element, list));
  }
  pushBlock(block, isRemote = false) {
    let current = this.blockStack.current;
    return null !== current && (isRemote || current.didAppendBounds(block)), this.__openBlock(), this.blockStack.push(block), block;
  }
  popBlock() {
    return this.block().finalize(this), this.__closeBlock(), this.blockStack.pop();
  }
  __openBlock() {}
  __closeBlock() {}
  // todo return seems unused
  openElement(tag) {
    let element = this.__openElement(tag);
    return this.constructing = element, element;
  }
  __openElement(tag) {
    return this.dom.createElement(tag, this.element);
  }
  flushElement(modifiers) {
    let parent = this.element,
      element = this.constructing;
    this.__flushElement(parent, element), this.constructing = null, this.operations = null, this.pushModifiers(modifiers), this.pushElement(element, null), this.didOpenElement(element);
  }
  __flushElement(parent, constructing) {
    this.dom.insertBefore(parent, constructing, this.nextSibling);
  }
  closeElement() {
    return this.willCloseElement(), this.popElement(), this.popModifiers();
  }
  pushRemoteElement(element, guid, insertBefore) {
    return this.__pushRemoteElement(element, guid, insertBefore);
  }
  __pushRemoteElement(element, _guid, insertBefore) {
    if (this.pushElement(element, insertBefore), void 0 === insertBefore) for (; element.lastChild;) element.removeChild(element.lastChild);
    let block = new RemoteBlock(element);
    return this.pushBlock(block, true);
  }
  popRemoteElement() {
    const block = this.popBlock();
    return this.popElement(), block;
  }
  pushElement(element, nextSibling = null) {
    this.cursors.push(new CursorImpl(element, nextSibling));
  }
  pushModifiers(modifiers) {
    this.modifierStack.push(modifiers);
  }
  popModifiers() {
    return this.modifierStack.pop();
  }
  didAppendBounds(bounds) {
    return this.block().didAppendBounds(bounds), bounds;
  }
  didAppendNode(node) {
    return this.block().didAppendNode(node), node;
  }
  didOpenElement(element) {
    return this.block().openElement(element), element;
  }
  willCloseElement() {
    this.block().closeElement();
  }
  appendText(string) {
    return this.didAppendNode(this.__appendText(string));
  }
  __appendText(text) {
    let {
        dom: dom,
        element: element,
        nextSibling: nextSibling
      } = this,
      node = dom.createTextNode(text);
    return dom.insertBefore(element, node, nextSibling), node;
  }
  __appendNode(node) {
    return this.dom.insertBefore(this.element, node, this.nextSibling), node;
  }
  __appendFragment(fragment) {
    let first = fragment.firstChild;
    if (first) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      let ret = new ConcreteBounds(this.element, first, fragment.lastChild);
      return this.dom.insertBefore(this.element, fragment, this.nextSibling), ret;
    }
    {
      const comment = this.__appendComment("");
      return new ConcreteBounds(this.element, comment, comment);
    }
  }
  __appendHTML(html) {
    return this.dom.insertHTMLBefore(this.element, this.nextSibling, html);
  }
  appendDynamicHTML(value) {
    let bounds = this.trustedContent(value);
    this.didAppendBounds(bounds);
  }
  appendDynamicText(value) {
    let node = this.untrustedContent(value);
    return this.didAppendNode(node), node;
  }
  appendDynamicFragment(value) {
    let bounds = this.__appendFragment(value);
    this.didAppendBounds(bounds);
  }
  appendDynamicNode(value) {
    let node = this.__appendNode(value),
      bounds = new ConcreteBounds(this.element, node, node);
    this.didAppendBounds(bounds);
  }
  trustedContent(value) {
    return this.__appendHTML(value);
  }
  untrustedContent(value) {
    return this.__appendText(value);
  }
  appendComment(string) {
    return this.didAppendNode(this.__appendComment(string));
  }
  __appendComment(string) {
    let {
        dom: dom,
        element: element,
        nextSibling: nextSibling
      } = this,
      node = dom.createComment(string);
    return dom.insertBefore(element, node, nextSibling), node;
  }
  __setAttribute(name, value, namespace) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    this.dom.setAttribute(this.constructing, name, value, namespace);
  }
  __setProperty(name, value) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    this.constructing[name] = value;
  }
  setStaticAttribute(name, value, namespace) {
    this.__setAttribute(name, value, namespace);
  }
  setDynamicAttribute(name, value, trusting, namespace) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    let attribute = dynamicAttribute(this.constructing, name, namespace, trusting);
    return attribute.set(this, value, this.env), attribute;
  }
}
class AppendingBlockImpl {
  constructor(parent) {
    this.parent = parent, this.first = null, this.last = null, this.nesting = 0;
  }
  parentElement() {
    return this.parent;
  }
  firstNode() {
    return this.first.firstNode();
  }
  lastNode() {
    return this.last.lastNode();
  }
  openElement(element) {
    this.didAppendNode(element), this.nesting++;
  }
  closeElement() {
    this.nesting--;
  }
  didAppendNode(node) {
    0 === this.nesting && (this.first || (this.first = new First(node)), this.last = new Last(node));
  }
  didAppendBounds(bounds) {
    0 === this.nesting && (this.first || (this.first = bounds), this.last = bounds);
  }
  finalize(stack) {
    null === this.first && stack.appendComment("");
  }
}
class RemoteBlock extends AppendingBlockImpl {
  constructor(parent) {
    super(parent), registerDestructor(this, () => {
      // In general, you only need to clear the root of a hierarchy, and should never
      // need to clear any child nodes. This is an important constraint that gives us
      // a strong guarantee that clearing a subtree is a single DOM operation.
      // Because remote blocks are not normally physically nested inside of the tree
      // that they are logically nested inside, we manually clear remote blocks when
      // a logical parent is cleared.
      // HOWEVER, it is currently possible for a remote block to be physically nested
      // inside of the block it is logically contained inside of. This happens when
      // the remote block is appended to the end of the application's entire element.
      // The problem with that scenario is that Glimmer believes that it owns more of
      // the DOM than it actually does. The code is attempting to write past the end
      // of the Glimmer-managed root, but Glimmer isn't aware of that.
      // The correct solution to that problem is for Glimmer to be aware of the end
      // of the bounds that it owns, and once we make that change, this check could
      // be removed.
      // For now, a more targeted fix is to check whether the node was already removed
      // and avoid clearing the node if it was. In most cases this shouldn't happen,
      // so this might hide bugs where the code clears nested nodes unnecessarily,
      // so we should eventually try to do the correct fix.
      this.parentElement() === this.firstNode().parentNode && clear(this);
    });
  }
}
class ResettableBlockImpl extends AppendingBlockImpl {
  constructor(parent) {
    super(parent);
  }
  reset() {
    destroy(this);
    let nextSibling = clear(this);
    return this.first = null, this.last = null, this.nesting = 0, nextSibling;
  }
}

// FIXME: All the noops in here indicate a modelling problem
class AppendingBlockList {
  constructor(parent, boundList) {
    this.parent = parent, this.boundList = boundList, this.parent = parent, this.boundList = boundList;
  }
  parentElement() {
    return this.parent;
  }
  firstNode() {
    return this.boundList[0].firstNode();
  }
  lastNode() {
    let boundList = this.boundList;
    return boundList[boundList.length - 1].lastNode();
  }
  openElement(_element) {}
  closeElement() {}
  didAppendNode(_node) {}
  didAppendBounds(_bounds) {}
  finalize(_stack) {
    this.boundList.length;
  }
}
function clientBuilder(env, cursor) {
  return NewTreeBuilder.forInitialRender(env, cursor);
}
class UpdatingVM {
  constructor(env, {
    alwaysRevalidate = false
  }) {
    this.frameStack = new StackImpl(), this.env = env, this.dom = env.getDOM(), this.alwaysRevalidate = alwaysRevalidate;
  }
  execute(opcodes, handler) {
    if (isDevelopingApp()) {
      let hasErrored = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
        debug.runInTrackingTransaction(() => this._execute(opcodes, handler), "- While rendering:"),
        // using a boolean here to avoid breaking ergonomics of "pause on uncaught exceptions"
        // which would happen with a `catch` + `throw`
        hasErrored = !1;
      } finally {
        hasErrored &&
        // eslint-disable-next-line no-console
        console.error(`\n\nError occurred:\n\n${resetTracking()}\n\n`);
      }
    } else this._execute(opcodes, handler);
  }
  _execute(opcodes, handler) {
    let {
      frameStack: frameStack
    } = this;
    for (this.try(opcodes, handler); !frameStack.isEmpty();) {
      let opcode = this.frame.nextStatement();
      void 0 !== opcode ? opcode.evaluate(this) : frameStack.pop();
    }
  }
  get frame() {
    return this.frameStack.current;
  }
  goto(index) {
    this.frame.goto(index);
  }
  try(ops, handler) {
    this.frameStack.push(new UpdatingVMFrame(ops, handler));
  }
  throw() {
    this.frame.handleException(), this.frameStack.pop();
  }
}
class BlockOpcode {
  constructor(state, context, bounds, children) {
    this.state = state, this.context = context, this.children = children, this.bounds = bounds;
  }
  parentElement() {
    return this.bounds.parentElement();
  }
  firstNode() {
    return this.bounds.firstNode();
  }
  lastNode() {
    return this.bounds.lastNode();
  }
  evaluate(vm) {
    vm.try(this.children, null);
  }
}
class TryOpcode extends BlockOpcode {
  evaluate(vm) {
    vm.try(this.children, this);
  }
  handleException() {
    let {
      state: state,
      bounds: bounds,
      context: {
        env: env
      }
    } = this;
    destroyChildren(this);
    let tree = NewTreeBuilder.resume(env, bounds),
      vm = state.evaluate(tree),
      children = this.children = [],
      result = vm.execute(vm => {
        vm.updateWith(this), vm.pushUpdating(children);
      });
    associateDestroyableChild(this, result.drop);
  }
  constructor(...args) {
    super(...args), this.type = "try";
  }
}
class ListItemOpcode extends TryOpcode {
  constructor(state, context, bounds, key, memo, value) {
    super(state, context, bounds, []), this.key = key, this.memo = memo, this.value = value, this.retained = false, this.index = -1;
  }
  shouldRemove() {
    return !this.retained;
  }
  reset() {
    this.retained = false;
  }
}
class ListBlockOpcode extends BlockOpcode {
  constructor(state, context, bounds, children, iterableRef) {
    super(state, context, bounds, children), this.iterableRef = iterableRef, this.type = "list-block", this.opcodeMap = new Map(), this.marker = null, this.lastIterator = valueForRef(iterableRef);
  }
  initializeChild(opcode) {
    opcode.index = this.children.length - 1, this.opcodeMap.set(opcode.key, opcode);
  }
  evaluate(vm) {
    let iterator = valueForRef(this.iterableRef);
    if (this.lastIterator !== iterator) {
      let {
          bounds: bounds
        } = this,
        {
          dom: dom
        } = vm,
        marker = this.marker = dom.createComment("");
      dom.insertAfter(bounds.parentElement(), marker, bounds.lastNode()), this.sync(iterator), this.parentElement().removeChild(marker), this.marker = null, this.lastIterator = iterator;
    }
    // Run now-updated updating opcodes
    super.evaluate(vm);
  }
  sync(iterator) {
    let {
        opcodeMap: itemMap,
        children: children
      } = this,
      currentOpcodeIndex = 0,
      seenIndex = 0;
    for (this.children = this.bounds.boundList = [];;) {
      let item = iterator.next();
      if (null === item) break;
      let opcode = children[currentOpcodeIndex],
        {
          key: key
        } = item;
      // Items that have already been found and moved will already be retained,
      // we can continue until we find the next unretained item
      for (; void 0 !== opcode && opcode.retained;) opcode = children[++currentOpcodeIndex];
      if (void 0 !== opcode && opcode.key === key) this.retainItem(opcode, item), currentOpcodeIndex++;else if (itemMap.has(key)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
        let itemOpcode = itemMap.get(key);
        // The item opcode was seen already, so we should move it.
        if (itemOpcode.index < seenIndex) this.moveItem(itemOpcode, item, opcode);else {
          // Update the seen index, we are going to be moving this item around
          // so any other items that come before it will likely need to move as
          // well.
          seenIndex = itemOpcode.index;
          let seenUnretained = false;
          // iterate through all of the opcodes between the current position and
          // the position of the item's opcode, and determine if they are all
          // retained.
          for (let i = currentOpcodeIndex + 1; i < seenIndex; i++) if (!children[i].retained) {
            seenUnretained = true;
            break;
          }
          // If we have seen only retained opcodes between this and the matching
          // opcode, it means that all the opcodes in between have been moved
          // already, and we can safely retain this item's opcode.
          seenUnretained ? (this.moveItem(itemOpcode, item, opcode), currentOpcodeIndex++) : (this.retainItem(itemOpcode, item), currentOpcodeIndex = seenIndex + 1);
        }
      } else this.insertItem(item, opcode);
    }
    for (const opcode of children) opcode.retained ? opcode.reset() : this.deleteItem(opcode);
  }
  retainItem(opcode, item) {
    let {
      children: children
    } = this;
    updateRef(opcode.memo, item.memo), updateRef(opcode.value, item.value), opcode.retained = true, opcode.index = children.length, children.push(opcode);
  }
  insertItem(item, before) {
    let {
        opcodeMap: opcodeMap,
        bounds: bounds,
        state: state,
        children: children,
        context: {
          env: env
        }
      } = this,
      {
        key: key
      } = item,
      nextSibling = void 0 === before ? this.marker : before.firstNode(),
      elementStack = NewTreeBuilder.forInitialRender(env, {
        element: bounds.parentElement(),
        nextSibling: nextSibling
      });
    state.evaluate(elementStack).execute(vm => {
      let opcode = vm.enterItem(item);
      opcode.index = children.length, children.push(opcode), opcodeMap.set(key, opcode), associateDestroyableChild(this, opcode);
    });
  }
  moveItem(opcode, item, before) {
    let currentSibling,
      nextSibling,
      {
        children: children
      } = this;
    updateRef(opcode.memo, item.memo), updateRef(opcode.value, item.value), opcode.retained = true, void 0 === before ? move(opcode, this.marker) : (currentSibling = opcode.lastNode().nextSibling, nextSibling = before.firstNode(),
    // Items are moved throughout the algorithm, so there are cases where the
    // the items already happen to be siblings (e.g. an item in between was
    // moved before this move happened). Check to see if they are siblings
    // first before doing the move.
    currentSibling !== nextSibling && move(opcode, nextSibling)), opcode.index = children.length, children.push(opcode);
  }
  deleteItem(opcode) {
    destroy(opcode), clear(opcode), this.opcodeMap.delete(opcode.key);
  }
}
class UpdatingVMFrame {
  constructor(ops, exceptionHandler) {
    this.ops = ops, this.exceptionHandler = exceptionHandler, this.current = 0;
  }
  goto(index) {
    this.current = index;
  }
  nextStatement() {
    return this.ops[this.current++];
  }
  handleException() {
    this.exceptionHandler && this.exceptionHandler.handleException();
  }
}
class RenderResultImpl {
  constructor(env, updating, bounds, drop) {
    this.env = env, this.updating = updating, this.bounds = bounds, this.drop = drop, associateDestroyableChild(this, drop), registerDestructor(this, () => clear(this.bounds));
  }
  rerender({
    alwaysRevalidate = false
  } = {
    alwaysRevalidate: false
  }) {
    let {
      env: env,
      updating: updating
    } = this;
    new UpdatingVM(env, {
      alwaysRevalidate: alwaysRevalidate
    }).execute(updating, this);
  }
  parentElement() {
    return this.bounds.parentElement();
  }
  firstNode() {
    return this.bounds.firstNode();
  }
  lastNode() {
    return this.bounds.lastNode();
  }
  handleException() {}
}
class EvaluationStackImpl {
  static restore(snapshot, pc) {
    const stack = new this(snapshot.slice(), [0, -1, snapshot.length - 1, 0]);
    return stack.registers[$pc] = pc, stack.registers[$sp] = snapshot.length - 1, stack.registers[$fp] = -1, stack;
  }
  // fp -> sp
  constructor(stack = [], registers) {
    this.stack = stack, this.registers = registers;
  }
  push(value) {
    this.stack[++this.registers[$sp]] = value;
  }
  dup(position = this.registers[$sp]) {
    this.stack[++this.registers[$sp]] = this.stack[position];
  }
  copy(from, to) {
    this.stack[to] = this.stack[from];
  }
  pop(n = 1) {
    let top = this.stack[this.registers[$sp]];
    return this.registers[$sp] -= n, top;
  }
  peek(offset = 0) {
    return this.stack[this.registers[$sp] - offset];
  }
  get(offset, base = this.registers[$fp]) {
    return this.stack[base + offset];
  }
  set(value, offset, base = this.registers[$fp]) {
    this.stack[base + offset] = value;
  }
  slice(start, end) {
    return this.stack.slice(start, end);
  }
  capture(items) {
    let end = this.registers[$sp] + 1,
      start = end - items;
    return this.stack.slice(start, end);
  }
  reset() {
    this.stack.length = 0;
  }
}
class Stacks {
  constructor(scope, dynamicScope) {
    this.drop = {}, this.scope = new StackImpl(), this.dynamicScope = new StackImpl(), this.updating = new StackImpl(), this.cache = new StackImpl(), this.list = new StackImpl(), this.destroyable = new StackImpl(), this.scope.push(scope), this.dynamicScope.push(dynamicScope), this.destroyable.push(this.drop);
  }
}
class VM {
  #stacks;
  get stack() {
    return this.lowlevel.stack;
  }
  /* Registers */
  get pc() {
    return this.lowlevel.fetchRegister($pc);
  }
  #registers;
  /**
  * Fetch a value from a syscall register onto the stack.
  *
  * ## Opcodes
  *
  * - Append: `Fetch`
  *
  * ## State changes
  *
  * [!] push Eval Stack <- $register
  */
  fetch(register) {
    let value = this.fetchValue(register);
    this.stack.push(value);
  }
  /**
  * Load a value from the stack into a syscall register.
  *
  * ## Opcodes
  *
  * - Append: `Load`
  *
  * ## State changes
  *
  * [!] pop Eval Stack -> `value`
  * [$] $register <- `value`
  */
  load(register) {
    let value = this.stack.pop();
    this.loadValue(register, value);
  }
  /**
  * Load a value into a syscall register.
  *
  * ## State changes
  *
  * [$] $register <- `value`
  *
  * @utility
  */
  loadValue(register, value) {
    this.#registers[register] = value;
  }
  fetchValue(register) {
    return isLowLevelRegister(register) ? this.lowlevel.fetchRegister(register) : this.#registers[register];
  }
  // Save $pc into $ra, then jump to a new address in `program` (jal in MIPS)
  call(handle) {
    null !== handle && this.lowlevel.call(handle);
  }
  // Return to the `program` address stored in $ra
  return() {
    this.lowlevel.return();
  }
  #tree;
  constructor({
    scope: scope,
    dynamicScope: dynamicScope,
    stack: stack,
    pc: pc
  }, context, tree) {
    this.#registers = [null, null, null, null, null, null, null, null, null], isDevelopingApp() &&
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    assertGlobalContextWasSet();
    let evalStack = EvaluationStackImpl.restore(stack, pc);
    this.#tree = tree, this.context = context, this.#stacks = new Stacks(scope, dynamicScope), this.args = new VMArgumentsImpl(), this.lowlevel = new LowLevelVM(evalStack, context, void 0, evalStack.registers), this.pushUpdating();
  }
  static initial(context, options) {
    let scope = ScopeImpl.root(options.owner, options.scope ?? {
      self: UNDEFINED_REFERENCE,
      size: 0
    });
    const state = function (pc, scope, dynamicScope) {
      return {
        pc: pc,
        scope: scope,
        dynamicScope: dynamicScope,
        stack: []
      };
    }
    /**
    * A closure captures the state of the VM for a particular block of code that is necessary to
    * re-invoke the block in the future.
    *
    * In practice, this allows us to clear the previous render and "replay" the block's execution,
    * rendering content in the same position as the first render.
    */(context.program.heap.getaddr(options.handle), scope, options.dynamicScope);
    return new VM(state, context, options.tree);
  }
  compile(block) {
    return unwrapHandle(block.compile(this.context));
  }
  get constants() {
    return this.context.program.constants;
  }
  get program() {
    return this.context.program;
  }
  get env() {
    return this.context.env;
  }
  captureClosure(args, pc = this.lowlevel.fetchRegister($pc)) {
    return {
      pc: pc,
      scope: this.scope(),
      dynamicScope: this.dynamicScope(),
      stack: this.stack.capture(args)
    };
  }
  capture(args, pc = this.lowlevel.fetchRegister($pc)) {
    return new Closure(this.captureClosure(args, pc), this.context);
  }
  /**
  * ## Opcodes
  *
  * - Append: `BeginComponentTransaction`
  *
  * ## State Changes
  *
  * [ ] create `guard` (`JumpIfNotModifiedOpcode`)
  * [ ] create `tracker` (`BeginTrackFrameOpcode`)
  * [!] push Updating Stack <- `guard`
  * [!] push Updating Stack <- `tracker`
  * [!] push Cache Stack <- `guard`
  * [!] push Tracking Stack
  */
  beginCacheGroup(name) {
    let opcodes = this.updating(),
      guard = new JumpIfNotModifiedOpcode();
    opcodes.push(guard), opcodes.push(new BeginTrackFrameOpcode(name)), this.#stacks.cache.push(guard), beginTrackFrame(name);
  }
  /**
  * ## Opcodes
  *
  * - Append: `CommitComponentTransaction`
  *
  * ## State Changes
  *
  * Create a new `EndTrackFrameOpcode` (`end`)
  *
  * [!] pop CacheStack -> `guard`
  * [!] pop Tracking Stack -> `tag`
  * [ ] create `end` (`EndTrackFrameOpcode`) with `guard`
  * [-] consume `tag`
  */
  commitCacheGroup() {
    let opcodes = this.updating(),
      guard = this.#stacks.cache.pop(),
      tag = endTrackFrame();
    opcodes.push(new EndTrackFrameOpcode(guard)), guard.finalize(tag, opcodes.length);
  }
  /**
  * ## Opcodes
  *
  * - Append: `Enter`
  *
  * ## State changes
  *
  * [!] push Element Stack as `block`
  * [ ] create `try` (`TryOpcode`) with `block`, capturing `args` from the Eval Stack
  *
  * Did Enter (`try`):
  * [-] associate destroyable `try`
  * [!] push Destroyable Stack <- `try`
  * [!] push Updating List <- `try`
  * [!] push Updating Stack <- `try.children`
  */
  enter(args) {
    let state = this.capture(args),
      block = this.tree().pushResettableBlock(),
      tryOpcode = new TryOpcode(state, this.context, block, []);
    this.didEnter(tryOpcode);
  }
  /**
  * ## Opcodes
  *
  * - Append: `Iterate`
  * - Update: `ListBlock`
  *
  * ## State changes
  *
  * Create a new ref for the iterator item (`value`).
  * Create a new ref for the iterator key (`key`).
  *
  * [ ] create `valueRef` (`Reference`) from `value`
  * [ ] create `keyRef` (`Reference`) from `key`
  * [!] push Eval Stack <- `valueRef`
  * [!] push Eval Stack <- `keyRef`
  * [!] push Element Stack <- `UpdatableBlock` as `block`
  * [ ] capture `closure` with *2* items from the Eval Stack
  * [ ] create `iteration` (`ListItemOpcode`) with `closure`, `block`, `key`, `keyRef` and `valueRef`
  *
  * Did Enter (`iteration`):
  * [-] associate destroyable `iteration`
  * [!] push Destroyable Stack <- `iteration`
  * [!] push Updating List <- `iteration`
  * [!] push Updating Stack <- `iteration.children`
  */
  enterItem({
    key: key,
    value: value,
    memo: memo
  }) {
    let {
        stack: stack
      } = this,
      valueRef = createIteratorItemRef(value),
      memoRef = createIteratorItemRef(memo);
    stack.push(valueRef), stack.push(memoRef);
    let state = this.capture(2),
      block = this.tree().pushResettableBlock(),
      opcode = new ListItemOpcode(state, this.context, block, key, memoRef, valueRef);
    return this.didEnter(opcode), opcode;
  }
  registerItem(opcode) {
    this.listBlock().initializeChild(opcode);
  }
  /**
  * ## Opcodes
  *
  * - Append: `EnterList`
  *
  * ## State changes
  *
  * [ ] capture `closure` with *0* items from the Eval Stack, and `$pc` from `offset`
  * [ ] create `updating` (empty `Array`)
  * [!] push Element Stack <- `list` (`BlockList`) with `updating`
  * [ ] create `list` (`ListBlockOpcode`) with `closure`, `list`, `updating` and `iterableRef`
  * [!] push List Stack <- `list`
  *
  * Did Enter (`list`):
  * [-] associate destroyable `list`
  * [!] push Destroyable Stack <- `list`
  * [!] push Updating List <- `list`
  * [!] push Updating Stack <- `list.children`
  */
  enterList(iterableRef, offset) {
    let updating = [],
      addr = this.lowlevel.target(offset),
      state = this.capture(0, addr),
      list = this.tree().pushBlockList(updating),
      opcode = new ListBlockOpcode(state, this.context, list, updating, iterableRef);
    this.#stacks.list.push(opcode), this.didEnter(opcode);
  }
  /**
  * ## Opcodes
  *
  * - Append: `Enter`
  * - Append: `Iterate`
  * - Append: `EnterList`
  * - Update: `ListBlock`
  *
  * ## State changes
  *
  * [-] associate destroyable `opcode`
  * [!] push Destroyable Stack <- `opcode`
  * [!] push Updating List <- `opcode`
  * [!] push Updating Stack <- `opcode.children`
  *
  */
  didEnter(opcode) {
    this.associateDestroyable(opcode), this.#stacks.destroyable.push(opcode), this.updateWith(opcode), this.pushUpdating(opcode.children);
  }
  /**
  * ## Opcodes
  *
  * - Append: `Exit`
  * - Append: `ExitList`
  *
  * ## State changes
  *
  * [!] pop Destroyable Stack
  * [!] pop Element Stack
  * [!] pop Updating Stack
  */
  exit() {
    this.#stacks.destroyable.pop(), this.#tree.popBlock(), this.popUpdating();
  }
  /**
  * ## Opcodes
  *
  * - Append: `ExitList`
  *
  * ## State changes
  *
  * Pop List:
  * [!] pop Destroyable Stack
  * [!] pop Element Stack
  * [!] pop Updating Stack
  *
  * [!] pop List Stack
  */
  exitList() {
    this.exit(), this.#stacks.list.pop();
  }
  /**
  * ## Opcodes
  *
  * - Append: `RootScope`
  * - Append: `VirtualRootScope`
  *
  * ## State changes
  *
  * [!] push Scope Stack
  */
  pushRootScope(size, owner) {
    let scope = ScopeImpl.sized(owner, size);
    return this.#stacks.scope.push(scope), scope;
  }
  /**
  * ## Opcodes
  *
  * - Append: `ChildScope`
  *
  * ## State changes
  *
  * [!] push Scope Stack <- `child` of current Scope
  */
  pushChildScope() {
    this.#stacks.scope.push(this.scope().child());
  }
  /**
  * ## Opcodes
  *
  * - Append: `Yield`
  *
  * ## State changes
  *
  * [!] push Scope Stack <- `scope`
  */
  pushScope(scope) {
    this.#stacks.scope.push(scope);
  }
  /**
  * ## Opcodes
  *
  * - Append: `PopScope`
  *
  * ## State changes
  *
  * [!] pop Scope Stack
  */
  popScope() {
    this.#stacks.scope.pop();
  }
  /**
  * ## Opcodes
  *
  * - Append: `PushDynamicScope`
  *
  * ## State changes:
  *
  * [!] push Dynamic Scope Stack <- child of current Dynamic Scope
  */
  pushDynamicScope() {
    let child = this.dynamicScope().child();
    return this.#stacks.dynamicScope.push(child), child;
  }
  /**
  * ## Opcodes
  *
  * - Append: `BindDynamicScope`
  *
  * ## State changes:
  *
  * [!] pop Dynamic Scope Stack `names.length` times
  */
  bindDynamicScope(names) {
    let scope = this.dynamicScope();
    for (const name of reverse(names)) scope.set(name, this.stack.pop());
  }
  /**
  * ## State changes
  *
  * - [!] push Updating Stack
  *
  * @utility
  */
  pushUpdating(list = []) {
    this.#stacks.updating.push(list);
  }
  /**
  * ## State changes
  *
  * [!] pop Updating Stack
  *
  * @utility
  */
  popUpdating() {
    return this.#stacks.updating.pop();
  }
  /**
  * ## State changes
  *
  * [!] push Updating List
  *
  * @utility
  */
  updateWith(opcode) {
    this.updating().push(opcode);
  }
  listBlock() {
    return this.#stacks.list.current;
  }
  /**
  * ## State changes
  *
  * [-] associate destroyable `child`
  *
  * @utility
  */
  associateDestroyable(child) {
    let parent = this.#stacks.destroyable.current;
    associateDestroyableChild(parent, child);
  }
  updating() {
    return this.#stacks.updating.current;
  }
  /**
  * Get Tree Builder
  */
  tree() {
    return this.#tree;
  }
  /**
  * Get current Scope
  */
  scope() {
    return this.#stacks.scope.current;
  }
  /**
  * Get current Dynamic Scope
  */
  dynamicScope() {
    return this.#stacks.dynamicScope.current;
  }
  popDynamicScope() {
    this.#stacks.dynamicScope.pop();
  }
  /// SCOPE HELPERS
  getOwner() {
    return this.scope().owner;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSelf() {
    return this.scope().getSelf();
  }
  referenceForSymbol(symbol) {
    return this.scope().getSymbol(symbol);
  }
  /// EXECUTION
  execute(initialize) {
    if (!isDevelopingApp()) return this._execute(initialize);
    {
      let hasErrored = true;
      try {
        let value = this._execute(initialize);
        // using a boolean here to avoid breaking ergonomics of "pause on uncaught exceptions"
        // which would happen with a `catch` + `throw`
        return hasErrored = !1, value;
      } finally {
        if (hasErrored) {
          // If any existing blocks are open, due to an error or something like
          // that, we need to close them all and clean things up properly.
          let elements = this.tree();
          for (; elements.hasBlocks;) elements.popBlock();
          // eslint-disable-next-line no-console
          console.error(`\n\nError occurred:\n\n${resetTracking()}\n\n`);
        }
      }
    }
  }
  _execute(initialize) {
    let result;
    initialize && initialize(this);
    do {
      result = this.next();
    } while (!result.done);
    return result.value;
  }
  next() {
    let result,
      {
        env: env
      } = this,
      opcode = this.lowlevel.nextStatement();
    return null !== opcode ? (this.lowlevel.evaluateOuter(opcode, this), result = {
      done: false,
      value: null
    }) : (
    // Unload the stack
    this.stack.reset(), result = {
      done: true,
      value: new RenderResultImpl(env, this.popUpdating(), this.#tree.popBlock(), this.#stacks.drop)
    }), result;
  }
}
class Closure {
  constructor(state, context) {
    this.state = state, this.context = context;
  }
  evaluate(tree) {
    return new VM(this.state, this.context, tree);
  }
}
class TemplateIteratorImpl {
  constructor(vm) {
    this.vm = vm;
  }
  next() {
    return this.vm.next();
  }
  sync() {
    return isDevelopingApp() ? debug.runInTrackingTransaction(() => this.vm.execute(), "- While rendering:") : this.vm.execute();
  }
}
function renderSync(env, iterator) {
  let result;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  return inTransaction(env, () => result = iterator.sync()), result;
}
function renderMain(context, owner, self, tree, layout, dynamicScope = new DynamicScopeImpl()) {
  let handle = unwrapHandle(layout.compile(context)),
    numSymbols = layout.symbolTable.symbols.length,
    vm = VM.initial(context, {
      scope: {
        self: self,
        size: numSymbols
      },
      dynamicScope: dynamicScope,
      tree: tree,
      handle: handle,
      owner: owner
    });
  return new TemplateIteratorImpl(vm);
}
function renderComponent(context, tree, owner, definition, args = {}, dynamicScope = new DynamicScopeImpl()) {
  return function (vm, context, owner, definition, args) {
    // Get a list of tuples of argument names and references, like
    // [['title', reference], ['name', reference]]
    const argList = Object.keys(args).map(key => [key, args[key]]),
      blockNames = ["main", "else", "attrs"],
      argNames = argList.map(([name]) => `@${name}`);
    let reified = vm.constants.component(definition, owner, void 0, "{ROOT}");
    vm.lowlevel.pushFrame();
    // Push blocks on to the stack, three stack values per block
    for (let i = 0; i < 3 * blockNames.length; i++) vm.stack.push(null);
    vm.stack.push(null),
    // For each argument, push its backing reference on to the stack
    argList.forEach(([, reference]) => {
      vm.stack.push(reference);
    }),
    // Configure VM based on blocks and args just pushed on to the stack.
    vm.args.setup(vm.stack, argNames, blockNames, 0, true);
    const compilable = reified.compilable,
      invocation = {
        handle: unwrapHandle(compilable.compile(context)),
        symbolTable: compilable.symbolTable
      };
    // Needed for the Op.Main opcode: arguments, component invocation object, and
    // component definition.
    return vm.stack.push(vm.args), vm.stack.push(invocation), vm.stack.push(reified), new TemplateIteratorImpl(vm);
  }(VM.initial(context, {
    tree: tree,
    handle: context.stdlib.main,
    dynamicScope: dynamicScope,
    owner: owner
  }), context, owner, definition, function (record) {
    const root = createConstRef(record, "args");
    return Object.keys(record).reduce((acc, key) => (acc[key] = childRefFor(root, key), acc), {});
  }(args));
}
const SERIALIZATION_FIRST_NODE_STRING = "%+b:0%";
function isSerializationFirstNode(node) {
  return "%+b:0%" === node.nodeValue;
}
class RehydratingCursor extends CursorImpl {
  constructor(element, nextSibling, startingBlockDepth) {
    super(element, nextSibling), this.startingBlockDepth = startingBlockDepth, this.candidate = null, this.injectedOmittedNode = false, this.openBlockDepth = startingBlockDepth - 1;
  }
}
class RehydrateTree extends NewTreeBuilder {
  constructor(env, parentNode, nextSibling) {
    if (super(env, parentNode, nextSibling), this.unmatchedAttributes = null, this.blockDepth = 0, nextSibling) throw new Error("Rehydration with nextSibling not supported");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    let node = this.currentCursor.element.firstChild;
    for (; null !== node && !isOpenBlock(node);) node = node.nextSibling;
    this.candidate = node;
    const startingBlockOffset = getBlockDepth(node);
    if (0 !== startingBlockOffset) {
      // We are rehydrating from a partial tree and not the root component
      // We need to add an extra block before the first block to rehydrate correctly
      // The extra block is needed since the renderComponent API creates a synthetic component invocation which generates the extra block
      const newBlockDepth = startingBlockOffset - 1,
        newCandidate = this.dom.createComment(`%+b:${newBlockDepth}%`);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      node.parentNode.insertBefore(newCandidate, this.candidate);
      let closingNode = node.nextSibling;
      for (; null !== closingNode && (!isCloseBlock(closingNode) || getBlockDepth(closingNode) !== startingBlockOffset);) closingNode = closingNode.nextSibling;
      const newClosingBlock = this.dom.createComment(`%-b:${newBlockDepth}%`);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      node.parentNode.insertBefore(newClosingBlock, closingNode.nextSibling), this.candidate = newCandidate, this.startingBlockOffset = newBlockDepth;
    } else this.startingBlockOffset = 0;
  }
  get currentCursor() {
    return this.cursors.current;
  }
  get candidate() {
    return this.currentCursor ? this.currentCursor.candidate : null;
  }
  set candidate(node) {
    this.currentCursor.candidate = node;
  }
  disableRehydration(nextSibling) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    const currentCursor = this.currentCursor;
    // rehydration will be disabled until we either:
    // * hit popElement (and return to using the parent elements cursor)
    // * hit closeBlock and the next sibling is a close block comment
    //   matching the expected openBlockDepth
    currentCursor.candidate = null, currentCursor.nextSibling = nextSibling;
  }
  enableRehydration(candidate) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    const currentCursor = this.currentCursor;
    currentCursor.candidate = candidate, currentCursor.nextSibling = null;
  }
  pushElement(element, nextSibling = null) {
    const cursor = new RehydratingCursor(element, nextSibling, this.blockDepth || 0);
    /**
    * <div>   <---------------  currentCursor.element
    *   <!--%+b:1%--> <-------  would have been removed during openBlock
    *   <div> <---------------  currentCursor.candidate -> cursor.element
    *     <!--%+b:2%--> <-----  currentCursor.candidate.firstChild -> cursor.candidate
    *     Foo
    *     <!--%-b:2%-->
    *   </div>
    *   <!--%-b:1%-->  <------  becomes currentCursor.candidate
    */
    null !== this.candidate && (cursor.candidate = element.firstChild, this.candidate = element.nextSibling), this.cursors.push(cursor);
  }
  // clears until the end of the current container
  // either the current open block or higher
  clearMismatch(candidate) {
    let current = candidate;
    const currentCursor = this.currentCursor;
    if (null !== currentCursor) {
      const openBlockDepth = currentCursor.openBlockDepth;
      if (openBlockDepth >= currentCursor.startingBlockDepth) for (; current && !(isCloseBlock(current) && openBlockDepth >= getBlockDepthWithOffset(current, this.startingBlockOffset));) current = this.remove(current);else for (; null !== current;) current = this.remove(current);
      // current cursor parentNode should be openCandidate if element
      // or openCandidate.parentNode if comment
      this.disableRehydration(current);
    }
  }
  __openBlock() {
    const {
      currentCursor: currentCursor
    } = this;
    if (null === currentCursor) return;
    const blockDepth = this.blockDepth;
    this.blockDepth++;
    const {
      candidate: candidate
    } = currentCursor;
    if (null === candidate) return;
    const {
      tagName: tagName
    } = currentCursor.element;
    isOpenBlock(candidate) && getBlockDepthWithOffset(candidate, this.startingBlockOffset) === blockDepth ? (this.candidate = this.remove(candidate), currentCursor.openBlockDepth = blockDepth) : "TITLE" !== tagName && "SCRIPT" !== tagName && "STYLE" !== tagName && this.clearMismatch(candidate);
  }
  __closeBlock() {
    const {
      currentCursor: currentCursor
    } = this;
    if (null === currentCursor) return;
    // openBlock is the last rehydrated open block
    const openBlockDepth = currentCursor.openBlockDepth;
    // this currently is the expected next open block depth
    this.blockDepth--;
    const {
      candidate: candidate
    } = currentCursor;
    let isRehydrating = false;
    if (null !== candidate)
      //assert(
      //  openBlockDepth === this.blockDepth,
      //  'when rehydrating, openBlockDepth should match this.blockDepth here'
      //);
      if (isRehydrating = true, isCloseBlock(candidate) && getBlockDepthWithOffset(candidate, this.startingBlockOffset) === openBlockDepth) {
        const nextSibling = this.remove(candidate);
        this.candidate = nextSibling, currentCursor.openBlockDepth--;
      } else
        // close the block and clear mismatch in parent container
        // we will be either at the end of the element
        // or at the end of our containing block
        this.clearMismatch(candidate), isRehydrating = false;
    if (!isRehydrating) {
      // check if nextSibling matches our expected close block
      // if so, we remove the close block comment and
      // restore rehydration after clearMismatch disabled
      const nextSibling = currentCursor.nextSibling;
      if (null !== nextSibling && isCloseBlock(nextSibling) && getBlockDepthWithOffset(nextSibling, this.startingBlockOffset) === this.blockDepth) {
        // restore rehydration state
        const candidate = this.remove(nextSibling);
        this.enableRehydration(candidate), currentCursor.openBlockDepth--;
      }
    }
  }
  __appendNode(node) {
    const {
      candidate: candidate
    } = this;
    // This code path is only used when inserting precisely one node. It needs more
    // comparison logic, but we can probably lean on the cases where this code path
    // is actually used.
    return candidate || super.__appendNode(node);
  }
  __appendHTML(html) {
    const candidateBounds = this.markerBounds();
    if (candidateBounds) {
      const first = candidateBounds.firstNode(),
        last = candidateBounds.lastNode(),
        newBounds = new ConcreteBounds(this.element, first.nextSibling, last.previousSibling),
        possibleEmptyMarker = this.remove(first);
      return this.remove(last), null !== possibleEmptyMarker && isEmpty(possibleEmptyMarker) && (this.candidate = this.remove(possibleEmptyMarker), null !== this.candidate && this.clearMismatch(this.candidate)), newBounds;
    }
    return super.__appendHTML(html);
  }
  remove(node) {
    const element = node.parentNode,
      next = node.nextSibling;
    return element.removeChild(node), next;
  }
  markerBounds() {
    const _candidate = this.candidate;
    if (_candidate && isMarker(_candidate)) {
      const first = _candidate;
      let last = first.nextSibling;
      for (; !isMarker(last);) last = last.nextSibling;
      return new ConcreteBounds(this.element, first, last);
    }
    return null;
  }
  __appendText(string) {
    const {
      candidate: candidate
    } = this;
    return candidate ? 3 === candidate.nodeType ? (candidate.nodeValue !== string && (candidate.nodeValue = string), this.candidate = candidate.nextSibling, candidate) : 8 === (node = candidate).nodeType && "%|%" === node.nodeValue || isEmpty(candidate) && "" === string ? (this.candidate = this.remove(candidate), this.__appendText(string)) : (this.clearMismatch(candidate), super.__appendText(string)) : super.__appendText(string);
    var node;
  }
  __appendComment(string) {
    const _candidate = this.candidate;
    return _candidate && 8 === _candidate.nodeType ? (_candidate.nodeValue !== string && (_candidate.nodeValue = string), this.candidate = _candidate.nextSibling, _candidate) : (_candidate && this.clearMismatch(_candidate), super.__appendComment(string));
  }
  __openElement(tag) {
    const _candidate = this.candidate;
    if (_candidate && isElement(_candidate) && function (candidate, tag) {
      return candidate.namespaceURI === NS_SVG ? candidate.tagName === tag : candidate.tagName === tag.toUpperCase();
    }(_candidate, tag)) return this.unmatchedAttributes = [].slice.call(_candidate.attributes), _candidate;
    if (_candidate) {
      if (isElement(_candidate) && "TBODY" === _candidate.tagName) return this.pushElement(_candidate, null),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      this.currentCursor.injectedOmittedNode = true, this.__openElement(tag);
      this.clearMismatch(_candidate);
    }
    return super.__openElement(tag);
  }
  __setAttribute(name, value, namespace) {
    const unmatched = this.unmatchedAttributes;
    if (unmatched) {
      const attr = findByName(unmatched, name);
      if (attr) return attr.value !== value && (attr.value = value), void unmatched.splice(unmatched.indexOf(attr), 1);
    }
    return super.__setAttribute(name, value, namespace);
  }
  __setProperty(name, value) {
    const unmatched = this.unmatchedAttributes;
    if (unmatched) {
      const attr = findByName(unmatched, name);
      if (attr) return attr.value !== value && (attr.value = value), void unmatched.splice(unmatched.indexOf(attr), 1);
    }
    return super.__setProperty(name, value);
  }
  __flushElement(parent, constructing) {
    const {
      unmatchedAttributes: unmatched
    } = this;
    if (unmatched) {
      for (const attr of unmatched)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      this.constructing.removeAttribute(attr.name);
      this.unmatchedAttributes = null;
    } else super.__flushElement(parent, constructing);
  }
  willCloseElement() {
    const {
      candidate: candidate,
      currentCursor: currentCursor
    } = this;
    null !== candidate && this.clearMismatch(candidate), currentCursor && currentCursor.injectedOmittedNode && this.popElement(), super.willCloseElement();
  }
  getMarker(element, guid) {
    const marker = element.querySelector(`script[glmr="${guid}"]`);
    return marker ? castToSimple(marker) : null;
  }
  __pushRemoteElement(element, cursorId, insertBefore) {
    const marker = this.getMarker(element, cursorId);
    // when insertBefore is not present, we clear the element
    if (!marker || marker.parentNode, void 0 === insertBefore) {
      for (; null !== element.firstChild && element.firstChild !== marker;) this.remove(element.firstChild);
      insertBefore = null;
    }
    const cursor = new RehydratingCursor(element, null, this.blockDepth);
    this.cursors.push(cursor), null === marker ? this.disableRehydration(insertBefore) : this.candidate = this.remove(marker);
    const block = new RemoteBlock(element);
    return this.pushBlock(block, true);
  }
  didAppendBounds(bounds) {
    if (super.didAppendBounds(bounds), this.candidate) {
      const last = bounds.lastNode();
      this.candidate = last.nextSibling;
    }
    return bounds;
  }
}
function isOpenBlock(node) {
  return 8 === node.nodeType && 0 === node.nodeValue.lastIndexOf("%+b:", 0);
}
function isCloseBlock(node) {
  return 8 === node.nodeType && 0 === node.nodeValue.lastIndexOf("%-b:", 0);
}
function getBlockDepth(node) {
  return parseInt(node.nodeValue.slice(4), 10);
}
function getBlockDepthWithOffset(node, offset) {
  return getBlockDepth(node) - offset;
}
function isElement(node) {
  return 1 === node.nodeType;
}
function isMarker(node) {
  return 8 === node.nodeType && "%glmr%" === node.nodeValue;
}
function isEmpty(node) {
  return 8 === node.nodeType && "% %" === node.nodeValue;
}
function findByName(array, name) {
  for (const attr of array) if (attr.name === name) return attr;
}
function rehydrationBuilder(env, cursor) {
  return RehydrateTree.forInitialRender(env, cursor);
}

export { ConcreteBounds, CurriedValue, CursorImpl, DOMChanges, DOMTreeConstruction, DynamicAttribute, DynamicScopeImpl, EMPTY_ARGS, EMPTY_NAMED, EMPTY_POSITIONAL, EnvironmentImpl, DOMChangesImpl as IDOMChanges, LowLevelVM, NewTreeBuilder, RehydrateTree, RemoteBlock, ResettableBlockImpl, SERIALIZATION_FIRST_NODE_STRING, ScopeImpl, SimpleDynamicAttribute, TEMPLATE_ONLY_COMPONENT_MANAGER, TemplateOnlyComponentDefinition as TemplateOnlyComponent, TemplateOnlyComponentManager, UpdatingVM, array, clear, clientBuilder, concat, createCapturedArgs, curry, destroy, dynamicAttribute, fn, get, hash, inTransaction, invokeHelper, isDestroyed, isDestroying, isSerializationFirstNode, isWhitespace, normalizeProperty, on, registerDestructor, rehydrationBuilder, reifyArgs, reifyNamed, reifyPositional, renderComponent, renderMain, renderSync, resetDebuggerCallback, runtimeOptions, setDebuggerCallback, templateOnlyComponent };
