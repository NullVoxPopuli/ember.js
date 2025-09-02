import { EMPTY_STRING_ARRAY, reverse, enumerate, dict, EMPTY_ARRAY, assign, Stack as StackImpl } from '../util/index.js';
import { InstructionEncoderImpl } from '../encoder/index.js';
import { $v0, $fp, $s0, $sp, InternalComponentCapabilities, $s1, TYPE_SIZE, MACHINE_MASK, ARG_SHIFT, ContentType } from '../vm/index.js';
import { SexpOpcodes as opcodes } from '../wire-format/index.js';
import { hasCapability } from '../manager/index.js';
import { isDevelopingApp } from '@embroider/macros';

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
function encodeImmediate(num) {
  return (num |= 0) < 0 ? function (num) {
    return -536870913 & num;
  }(num) : function (num) {
    return ~num;
  }(num);
}
let debugCompiler;
function makeResolutionTypeVerifier(typeToVerify) {
  return opcode => {
    if (!function (opcode) {
      return Array.isArray(opcode) && 2 === opcode.length;
    }(opcode)) return false;
    let type = opcode[0];
    return type === opcodes.GetStrictKeyword || type === opcodes.GetLexicalSymbol || type === typeToVerify;
  };
}
[1, -1].forEach(x => {
  return num = encodeImmediate(x), (num |= 0) > -536870913 ? function (num) {
    return ~num;
  }(num) : function (num) {
    return 536870912 | num;
  }(num);
  var num;
});
const isGetFreeComponent = makeResolutionTypeVerifier(opcodes.GetFreeAsComponentHead),
  isGetFreeModifier = makeResolutionTypeVerifier(opcodes.GetFreeAsModifierHead),
  isGetFreeHelper = makeResolutionTypeVerifier(opcodes.GetFreeAsHelperHead),
  isGetFreeComponentOrHelper = makeResolutionTypeVerifier(opcodes.GetFreeAsComponentOrHelperHead);
function assertResolverInvariants(meta) {
  if (isDevelopingApp()) {
    if (!meta.symbols.upvars) throw new Error("Attempted to resolve a component, helper, or modifier, but no free vars were found");
    if (!meta.owner) throw new Error("Attempted to resolve a component, helper, or modifier, but no owner was associated with the template it was being resolved from");
  }
  return meta;
}

/**
 * <Foo/>
 * <Foo></Foo>
 * <Foo @arg={{true}} />
 */
function lookupBuiltInHelper(expr, resolver, meta, constants, type) {
  let {
      symbols: {
        upvars: upvars
      }
    } = assertResolverInvariants(meta),
    name = upvars[expr[1]],
    helper = resolver?.lookupBuiltInHelper?.(name) ?? null;
  if (isDevelopingApp() && null === helper)
    // Keyword helper did not exist, which means that we're attempting to use a
    // value of some kind that is not in scope
    throw meta.isStrictMode, new Error(`Attempted to resolve a ${type} in a strict mode template, but that value was not in scope: ${
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    meta.symbols.upvars[expr[1]] ?? "{unknown variable}"}`);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
  return constants.helper(helper, name);
}
function labelOperand(value) {
  return {
    type: 1,
    value: value
  };
}
function stdlibOperand(value) {
  return {
    type: 5,
    value: value
  };
}
function symbolTableOperand(value) {
  return {
    type: 7,
    value: value
  };
}
function layoutOperand(value) {
  return {
    type: 8,
    value: value
  };
}
class Labels {
  label(name, index) {
    this.labels[name] = index;
  }
  target(at, target) {
    this.targets.push({
      at: at,
      target: target
    });
  }
  patch(heap) {
    let {
      targets: targets,
      labels: labels
    } = this;
    for (const {
      at: at,
      target: target
    } of targets) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
      let address = labels[target] - at;
      heap.getbyaddr(at), heap.setbyaddr(at, address);
    }
  }
  constructor() {
    this.labels = dict(), this.targets = [];
  }
}
function encodeOp(encoder, context, meta, op) {
  let {
    program: {
      constants: constants
    },
    resolver: resolver
  } = context;
  if (function (op) {
    return op < 1e3;
  }(op[0])) {
    let [type, ...operands] = op;
    encoder.push(constants, type, ...operands);
  } else switch (op[0]) {
    case 1e3:
      return encoder.label(op[1]);
    case 1001:
      return encoder.startLabels();
    case 1002:
      return encoder.stopLabels();
    case 1004:
      return function (resolver, constants, meta, [, expr, then]) {
        isGetFreeComponent(expr);
        let type = expr[0];
        if (isDevelopingApp() && expr[0] === opcodes.GetStrictKeyword) throw meta.isStrictMode, new Error(`Attempted to resolve a component in a strict mode template, but that value was not in scope: ${
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
        meta.symbols.upvars[expr[1]] ?? "{unknown variable}"}`);
        if (type === opcodes.GetLexicalSymbol) {
          let {
              scopeValues: scopeValues,
              owner: owner,
              symbols: {
                lexical: lexical
              }
            } = meta,
            definition = scopeValues[expr[1]];
          then(constants.component(definition, owner, false, lexical?.at(expr[1])));
        } else {
          let {
              symbols: {
                upvars: upvars
              },
              owner: owner
            } = assertResolverInvariants(meta),
            name = upvars[expr[1]],
            definition = resolver?.lookupComponent?.(name, owner) ?? null;
          if (isDevelopingApp() && ("object" != typeof definition || null === definition)) throw meta.isStrictMode, new Error(`Attempted to resolve \`${name}\`, which was expected to be a component, but nothing was found.`);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
          then(constants.resolvedComponent(definition, name));
        }
      }
      /**
      * (helper)
      * (helper arg)
      */(resolver, constants, meta, op);
    case 1003:
      /**
      * <div {{modifier}}/>
      * <div {{modifier arg}}/>
      * <Foo {{modifier}}/>
      */
      return function (resolver, constants, meta, [, expr, then]) {
        isGetFreeModifier(expr);
        let type = expr[0];
        if (type === opcodes.GetLexicalSymbol) {
          let {
              scopeValues: scopeValues,
              symbols: {
                lexical: lexical
              }
            } = meta,
            definition = scopeValues[expr[1]];
          then(constants.modifier(definition, lexical?.at(expr[1]) ?? void 0));
        } else if (type === opcodes.GetStrictKeyword) {
          let {
              symbols: {
                upvars: upvars
              }
            } = assertResolverInvariants(meta),
            name = upvars[expr[1]],
            modifier = resolver?.lookupBuiltInModifier?.(name) ?? null;
          if (isDevelopingApp() && null === modifier) throw meta.isStrictMode, new Error(`Attempted to resolve a modifier in a strict mode template, but it was not in scope: ${name}`);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
          then(constants.modifier(modifier, name));
        } else {
          let {
              symbols: {
                upvars: upvars
              },
              owner: owner
            } = assertResolverInvariants(meta),
            name = upvars[expr[1]],
            modifier = resolver?.lookupModifier?.(name, owner) ?? null;
          if (isDevelopingApp() && null === modifier) throw meta.isStrictMode, new Error(`Attempted to resolve \`${name}\`, which was expected to be a modifier, but nothing was found.`);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
          then(constants.modifier(modifier));
        }
      }
      /**
      * {{component-or-helper arg}}
      */(resolver, constants, meta, op);
    case 1005:
      return function (resolver, constants, meta, [, expr, then]) {
        isGetFreeHelper(expr);
        let type = expr[0];
        if (type === opcodes.GetLexicalSymbol) {
          let {
              scopeValues: scopeValues
            } = meta,
            definition = scopeValues[expr[1]];
          then(constants.helper(definition));
        } else if (type === opcodes.GetStrictKeyword) then(lookupBuiltInHelper(expr, resolver, meta, constants, "helper"));else {
          let {
              symbols: {
                upvars: upvars
              },
              owner: owner
            } = assertResolverInvariants(meta),
            name = upvars[expr[1]],
            helper = resolver?.lookupHelper?.(name, owner) ?? null;
          if (isDevelopingApp() && null === helper) throw meta.isStrictMode, new Error(`Attempted to resolve \`${name}\`, which was expected to be a helper, but nothing was found.`);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
          then(constants.helper(helper, name));
        }
      }(resolver, constants, meta, op);
    case 1007:
      return function (resolver, constants, meta, [, expr, {
        ifComponent: ifComponent,
        ifHelper: ifHelper
      }]) {
        isGetFreeComponentOrHelper(expr);
        let type = expr[0];
        if (type === opcodes.GetLexicalSymbol) {
          let {
              scopeValues: scopeValues,
              owner: owner,
              symbols: {
                lexical: lexical
              }
            } = meta,
            definition = scopeValues[expr[1]],
            component = constants.component(definition, owner, true, lexical?.at(expr[1]));
          if (null !== component) return void ifComponent(component);
          let helper = constants.helper(definition, null, true);
          if (isDevelopingApp() && null === helper) throw meta.isStrictMode, new Error(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
          `Attempted to use a value as either a component or helper, but it did not have a component manager or helper manager associated with it. The value was: ${debugToString$1(definition)}`);
          ifHelper(helper);
        } else if (type === opcodes.GetStrictKeyword) ifHelper(lookupBuiltInHelper(expr, resolver, meta, constants, "component or helper"));else {
          let {
              symbols: {
                upvars: upvars
              },
              owner: owner
            } = assertResolverInvariants(meta),
            name = upvars[expr[1]],
            definition = resolver?.lookupComponent?.(name, owner) ?? null;
          if (null !== definition) ifComponent(constants.resolvedComponent(definition, name));else {
            let helper = resolver?.lookupHelper?.(name, owner) ?? null;
            if (isDevelopingApp() && null === helper) throw meta.isStrictMode, new Error(`Attempted to resolve \`${name}\`, which was expected to be a component or helper, but nothing was found.`);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
            ifHelper(constants.helper(helper, name));
          }
        }
      }
      /**
      * {{maybeHelperOrComponent}}
      */(resolver, constants, meta, op);
    case 1008:
      return function (resolver, constants, meta, [, expr, {
        ifComponent: ifComponent,
        ifHelper: ifHelper,
        ifValue: ifValue
      }]) {
        isGetFreeComponentOrHelper(expr);
        let type = expr[0];
        if (type === opcodes.GetLexicalSymbol) {
          let {
              scopeValues: scopeValues,
              owner: owner,
              symbols: {
                lexical: lexical
              }
            } = meta,
            definition = scopeValues[expr[1]];
          if ("function" != typeof definition && ("object" != typeof definition || null === definition))
            // The value is not an object, so it can't be a component or helper.
            return void ifValue(constants.value(definition));
          let component = constants.component(definition, owner, true, lexical?.at(expr[1]));
          if (null !== component) return void ifComponent(component);
          let helper = constants.helper(definition, null, true);
          if (null !== helper) return void ifHelper(helper);
          ifValue(constants.value(definition));
        } else if (type === opcodes.GetStrictKeyword) ifHelper(lookupBuiltInHelper(expr, resolver, meta, constants, "value"));else {
          let {
              symbols: {
                upvars: upvars
              },
              owner: owner
            } = assertResolverInvariants(meta),
            name = upvars[expr[1]],
            definition = resolver?.lookupComponent?.(name, owner) ?? null;
          if (null !== definition) return void ifComponent(constants.resolvedComponent(definition, name));
          let helper = resolver?.lookupHelper?.(name, owner) ?? null;
          null !== helper && ifHelper(constants.helper(helper, name));
        }
      }(resolver, constants, meta, op);
    case 1010:
      {
        let [, freeVar, andThen] = op;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
        andThen(meta.symbols.upvars[freeVar], meta.moduleName);
        break;
      }
    case 1011:
      {
        let [, valueIndex, then] = op,
          value = meta.scopeValues[valueIndex];
        then(constants.value(value));
        break;
      }
    default:
      throw new Error(`Unexpected high level opcode ${op[0]}`);
  }
}
class EncoderImpl {
  constructor(heap, meta, stdlib) {
    this.heap = heap, this.meta = meta, this.stdlib = stdlib, this.labelsStack = new StackImpl(), this.encoder = new InstructionEncoderImpl([]), this.errors = [], this.handle = heap.malloc();
  }
  error(error) {
    this.encoder.encode(30, 0), this.errors.push(error);
  }
  commit(size) {
    let handle = this.handle;
    return this.heap.pushMachine(5), this.heap.finishMalloc(handle, size), (list = this.errors) && list.length > 0 ? {
      errors: this.errors,
      handle: handle
    } : handle;
    var list;
  }
  push(constants, type, ...args) {
    let {
      heap: heap
    } = this;
    if (isDevelopingApp() && type > TYPE_SIZE) throw new Error(`Opcode type over 8-bits. Got ${type}.`);
    var value;
    let first = type | ((value = type) >= 0 && value <= 15 ? MACHINE_MASK : 0) | args.length << ARG_SHIFT;
    heap.pushRaw(first);
    for (let i = 0; i < args.length; i++) {
      let op = args[i];
      heap.pushRaw(this.operand(constants, op));
    }
  }
  operand(constants, operand) {
    if ("number" == typeof operand) return operand;
    if ("object" == typeof operand && null !== operand) {
      if (Array.isArray(operand)) return constants.array(operand);
      switch (operand.type) {
        case 1:
          return this.currentLabels.target(this.heap.offset, operand.value), -1;
        case 2:
          return constants.value(this.meta.isStrictMode);
        case 3:
        case 6:
        case 7:
        case 8:
          return constants.value(operand.value);
        case 4:
          return constants.value((block = operand.value, containing = this.meta, new CompilableTemplateImpl(block[0], containing, {
            parameters: block[1] || EMPTY_ARRAY
          })));
        case 5:
          return this.stdlib[operand.value];
      }
    }
    var block, containing;
    return constants.value(operand);
  }
  get currentLabels() {
    return this.labelsStack.current;
  }
  label(name) {
    this.currentLabels.label(name, this.heap.offset + 1);
  }
  startLabels() {
    this.labelsStack.push(new Labels());
  }
  stopLabels() {
    this.labelsStack.pop().patch(this.heap);
  }
}
function templateCompilationContext(evaluation, meta) {
  return {
    evaluation: evaluation,
    encoder: new EncoderImpl(evaluation.program.heap, meta, evaluation.stdlib),
    meta: meta
  };
}
class Compilers {
  add(name, func) {
    this.names[name] = this.funcs.push(func) - 1;
  }
  compile(op, sexp) {
    let name = sexp[0],
      index = this.names[name],
      func = this.funcs[index];
    sexp[0], func(op, sexp);
  }
  constructor() {
    this.names = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.funcs = [];
  }
}
const EXPRESSIONS = new Compilers();
function withPath(op, path) {
  if (void 0 !== path && 0 !== path.length) for (let i = 0; i < path.length; i++) op(22, path[i]);
}
function expr(op, expression) {
  Array.isArray(expression) ? EXPRESSIONS.compile(op, expression) : (PushPrimitive(op, expression), op(31));
}

/**
 * Push a reference onto the stack corresponding to a statically known primitive
 * @param value A JavaScript primitive (undefined, null, boolean, number or string)
 */
function PushPrimitiveReference(op, value) {
  PushPrimitive(op, value), op(31);
}

/**
 * Push an encoded representation of a JavaScript primitive on the stack
 *
 * @param value A JavaScript primitive (undefined, null, boolean, number or string)
 */
function PushPrimitive(op, primitive) {
  let p = primitive;
  var value;
  "number" == typeof p && (p = (value = p) % 1 == 0 && value <= 536870911 && value >= -536870912 ? encodeImmediate(p) : function (value) {
    return {
      type: 6,
      value: value
    };
  }(p)), op(30, p);
}

/**
 * Invoke a foreign function (a "helper") based on a statically known handle
 *
 * @param op The op creation function
 * @param handle A handle
 * @param positional An optional list of expressions to compile
 * @param named An optional list of named arguments (name + expression) to compile
 */
function Call(op, handle, positional, named) {
  op(0), SimpleArgs(op, positional, named, false), op(16, handle), op(1), op(36, $v0);
}

/**
 * Invoke a foreign function (a "helper") based on a dynamically loaded definition
 *
 * @param op The op creation function
 * @param positional An optional list of expressions to compile
 * @param named An optional list of named arguments (name + expression) to compile
 */
function CallDynamic(op, positional, named, append) {
  op(0), SimpleArgs(op, positional, named, false), op(33, $fp, 1), op(107), append ? (op(36, $v0), append(), op(1), op(34, 1)) : (op(1), op(34, 1), op(36, $v0));
}

/**
 * Evaluate statements in the context of new dynamic scope entries. Move entries from the
 * stack into named entries in the dynamic scope, then evaluate the statements, then pop
 * the dynamic scope
 *
 * @param names a list of dynamic scope names
 * @param block a function that returns a list of statements to evaluate
 */
function Curry(op, type, definition, positional, named) {
  op(0), SimpleArgs(op, positional, named, false), op(86), expr(op, definition), op(77, type, {
    type: 2,
    value: void 0
  }), op(1), op(36, $v0);
}

/**
 * Yield to a block located at a particular symbol location.
 *
 * @param to the symbol containing the block to yield to
 * @param params optional block parameters to yield to the block
 */
function YieldBlock(op, to, positional) {
  SimpleArgs(op, positional, null, true), op(23, to), op(24), op(61), op(64), op(40), op(1);
}

/**
 * Push an (optional) yieldable block onto the stack. The yieldable block must be known
 * statically at compile time.
 *
 * @param block An optional Compilable block
 */
function PushYieldableBlock(op, block) {
  !function (op, parameters) {
    null !== parameters ? op(63, symbolTableOperand({
      parameters: parameters
    })) : PushPrimitive(op, null);
  }(op, block && block[1]), op(62), PushCompilable(op, block);
}

/**
 * Invoke a block that is known statically at compile time.
 *
 * @param block a Compilable block
 */
function InvokeStaticBlock(op, block) {
  op(0), PushCompilable(op, block), op(61), op(2), op(1);
}

/**
 * Invoke a static block, preserving some number of stack entries for use in
 * updating.
 *
 * @param block A compilable block
 * @param callerCount A number of stack entries to preserve
 */
function InvokeStaticBlockWithStack(op, block, callerCount) {
  let parameters = block[1],
    calleeCount = parameters.length,
    count = Math.min(callerCount, calleeCount);
  if (0 !== count) {
    if (op(0), count) {
      op(39);
      for (let i = 0; i < count; i++) op(33, $fp, callerCount - i), op(19, parameters[i]);
    }
    PushCompilable(op, block), op(61), op(2), count && op(40), op(1);
  } else InvokeStaticBlock(op, block);
}
function PushCompilable(op, _block) {
  null === _block ? PushPrimitive(op, null) : op(28, {
    type: 4,
    value: _block
  });
}

/**
 * Compile arguments, pushing an Arguments object onto the stack.
 *
 * @param args.params
 * @param args.hash
 * @param args.blocks
 * @param args.atNames
 */
function SimpleArgs(op, positional, named, atNames) {
  if (null === positional && null === named) return void op(83);
  let flags = CompilePositional(op, positional) << 4;
  atNames && (flags |= 8);
  let names = EMPTY_STRING_ARRAY;
  if (named) {
    names = named[0];
    let val = named[1];
    for (let i = 0; i < val.length; i++) expr(op, val[i]);
  }
  op(82, names, EMPTY_STRING_ARRAY, flags);
}

/**
 * Compile an optional list of positional arguments, which pushes each argument
 * onto the stack and returns the number of parameters compiled
 *
 * @param positional an optional list of positional arguments
 */
function CompilePositional(op, positional) {
  if (null === positional) return 0;
  for (let i = 0; i < positional.length; i++) expr(op, positional[i]);
  return positional.length;
}
function meta(layout) {
  let [, locals, upvars, lexicalSymbols] = layout.block;
  return {
    symbols: {
      locals: locals,
      upvars: upvars,
      lexical: lexicalSymbols
    },
    scopeValues: layout.scope?.() ?? null,
    isStrictMode: layout.isStrictMode,
    moduleName: layout.moduleName,
    owner: layout.owner,
    size: locals.length
  };
}
EXPRESSIONS.add(opcodes.Concat, (op, [, parts]) => {
  for (let part of parts) expr(op, part);
  op(27, parts.length);
}), EXPRESSIONS.add(opcodes.Call, (op, [, expression, positional, named]) => {
  isGetFreeHelper(expression) ? op(1005, expression, handle => {
    Call(op, handle, positional, named);
  }) : (expr(op, expression), CallDynamic(op, positional, named));
}), EXPRESSIONS.add(opcodes.Curry, (op, [, expr, type, positional, named]) => {
  Curry(op, type, expr, positional, named);
}), EXPRESSIONS.add(opcodes.GetSymbol, (op, [, sym, path]) => {
  op(21, sym), withPath(op, path);
}), EXPRESSIONS.add(opcodes.GetLexicalSymbol, (op, [, sym, path]) => {
  op(1011, sym, handle => {
    op(29, handle), withPath(op, path);
  });
}), EXPRESSIONS.add(opcodes.GetStrictKeyword, (op, expr) => {
  op(1010, expr[1], () => {
    op(1005, expr, handle => {
      Call(op, handle, null, null);
    });
  });
}), EXPRESSIONS.add(opcodes.GetFreeAsHelperHead, (op, expr) => {
  op(1010, expr[1], () => {
    op(1005, expr, handle => {
      Call(op, handle, null, null);
    });
  });
}), EXPRESSIONS.add(opcodes.Undefined, op => PushPrimitiveReference(op, void 0)), EXPRESSIONS.add(opcodes.HasBlock, (op, [, block]) => {
  expr(op, block), op(25);
}), EXPRESSIONS.add(opcodes.HasBlockParams, (op, [, block]) => {
  expr(op, block), op(24), op(61), op(26);
}), EXPRESSIONS.add(opcodes.IfInline, (op, [, condition, truthy, falsy]) => {
  // Push in reverse order
  expr(op, falsy), expr(op, truthy), expr(op, condition), op(109);
}), EXPRESSIONS.add(opcodes.Not, (op, [, value]) => {
  expr(op, value), op(110);
}), EXPRESSIONS.add(opcodes.GetDynamicVar, (op, [, expression]) => {
  expr(op, expression), op(111);
}), EXPRESSIONS.add(opcodes.Log, (op, [, positional]) => {
  op(0), SimpleArgs(op, positional, null, false), op(112), op(1), op(36, $v0);
});
class NamedBlocksImpl {
  constructor(blocks) {
    this.blocks = blocks, this.names = blocks ? Object.keys(blocks) : [];
  }
  get(name) {
    return this.blocks && this.blocks[name] || null;
  }
  has(name) {
    let {
      blocks: blocks
    } = this;
    return null !== blocks && name in blocks;
  }
  with(name, block) {
    let {
      blocks: blocks
    } = this;
    return new NamedBlocksImpl(blocks ? assign({}, blocks, {
      [name]: block
    }) : {
      [name]: block
    });
  }
  get hasAny() {
    return null !== this.blocks;
  }
}
const EMPTY_BLOCKS = new NamedBlocksImpl(null);
function namedBlocks(blocks) {
  if (null === blocks) return EMPTY_BLOCKS;
  let out = dict(),
    [keys, values] = blocks;
  for (const [i, key] of enumerate(keys)) out[key] = values[i];
  return new NamedBlocksImpl(out);
}
function SwitchCases(op, bootstrap, matcher) {
  // Setup the switch DSL
  let clauses = [],
    count = 0;
  // Call the callback
  matcher(function (match, callback) {
    clauses.push({
      match: match,
      callback: callback,
      label: "CLAUSE" + count++
    });
  }),
  // Emit the opcodes for the switch
  op(69, 1), bootstrap(), op(1001);
  // First, emit the jump opcodes. We don't need a jump for the last
  // opcode, since it bleeds directly into its clause.
  for (let clause of clauses.slice(0, -1)) op(67, labelOperand(clause.label), clause.match);
  // Enumerate the clauses in reverse order. Earlier matches will
  // require fewer checks.
  for (let i = clauses.length - 1; i >= 0; i--) {
    let clause = clauses[i];
    op(1e3, clause.label), op(34, 1), clause.callback(),
    // The first match is special: it is placed directly before the END
    // label, so no additional jump is needed at the end of it.
    0 !== i && op(4, labelOperand("END"));
  }
  op(1e3, "END"), op(1002), op(70);
}

/**
 * A convenience for pushing some arguments on the stack and
 * running some code if the code needs to be re-executed during
 * updating execution if some of the arguments have changed.
 *
 * # Initial Execution
 *
 * The `args` function should push zero or more arguments onto
 * the stack and return the number of arguments pushed.
 *
 * The `body` function provides the instructions to execute both
 * during initial execution and during updating execution.
 *
 * Internally, this function starts by pushing a new frame, so
 * that the body can return and sets the return point ($ra) to
 * the ENDINITIAL label.
 *
 * It then executes the `args` function, which adds instructions
 * responsible for pushing the arguments for the block to the
 * stack. These arguments will be restored to the stack before
 * updating execution.
 *
 * Next, it adds the Enter opcode, which marks the current position
 * in the DOM, and remembers the current $pc (the next instruction)
 * as the first instruction to execute during updating execution.
 *
 * Next, it runs `body`, which adds the opcodes that should
 * execute both during initial execution and during updating execution.
 * If the `body` wishes to finish early, it should Jump to the
 * `FINALLY` label.
 *
 * Next, it adds the FINALLY label, followed by:
 *
 * - the Exit opcode, which finalizes the marked DOM started by the
 *   Enter opcode.
 * - the Return opcode, which returns to the current return point
 *   ($ra).
 *
 * Finally, it adds the ENDINITIAL label followed by the PopFrame
 * instruction, which restores $fp, $sp and $ra.
 *
 * # Updating Execution
 *
 * Updating execution for this `replayable` occurs if the `body` added an
 * assertion, via one of the `JumpIf`, `JumpUnless` or `AssertSame` opcodes.
 *
 * If, during updating executon, the assertion fails, the initial VM is
 * restored, and the stored arguments are pushed onto the stack. The DOM
 * between the starting and ending markers is cleared, and the VM's cursor
 * is set to the area just cleared.
 *
 * The return point ($ra) is set to -1, the exit instruction.
 *
 * Finally, the $pc is set to to the instruction saved off by the
 * Enter opcode during initial execution, and execution proceeds as
 * usual.
 *
 * The only difference is that when a `Return` instruction is
 * encountered, the program jumps to -1 rather than the END label,
 * and the PopFrame opcode is not needed.
 */
function Replayable(op, args, body) {
  // Start a new label frame, to give END and RETURN
  // a unique meaning.
  op(1001), op(0),
  // If the body invokes a block, its return will return to
  // END. Otherwise, the return in RETURN will return to END.
  op(6, labelOperand("ENDINITIAL")),
  // Start a new updating closure, remembering `count` elements
  // from the stack. Everything after this point, and before END,
  // will execute both initially and to update the block.
  // The enter and exit opcodes also track the area of the DOM
  // associated with this block. If an assertion inside the block
  // fails (for example, the test value changes from true to false
  // in an #if), the DOM is cleared and the program is re-executed,
  // restoring `count` elements to the stack and executing the
  // instructions between the enter and exit.
  op(69, args()),
  // Evaluate the body of the block. The body of the block may
  // return, which will jump execution to END during initial
  // execution, and exit the updating routine.
  body(),
  // All execution paths in the body should run the FINALLY once
  // they are done. It is executed both during initial execution
  // and during updating execution.
  op(1e3, "FINALLY"),
  // Finalize the DOM.
  op(70),
  // In initial execution, this is a noop: it returns to the
  // immediately following opcode. In updating execution, this
  // exits the updating routine.
  op(5),
  // Cleanup code for the block. Runs on initial execution
  // but not on updating.
  op(1e3, "ENDINITIAL"), op(1), op(1002);
}

/**
 * A specialized version of the `replayable` convenience that allows the
 * caller to provide different code based upon whether the item at
 * the top of the stack is true or false.
 *
 * As in `replayable`, the `ifTrue` and `ifFalse` code can invoke `return`.
 *
 * During the initial execution, a `return` will continue execution
 * in the cleanup code, which finalizes the current DOM block and pops
 * the current frame.
 *
 * During the updating execution, a `return` will exit the updating
 * routine, as it can reuse the DOM block and is always only a single
 * frame deep.
 */
function ReplayableIf(op, args, ifTrue, ifFalse) {
  return Replayable(op, args, () => {
    // If the conditional is false, jump to the ELSE label.
    op(66, labelOperand("ELSE")),
    // Otherwise, execute the code associated with the true branch.
    ifTrue(),
    // We're done, so return. In the initial execution, this runs
    // the cleanup code. In the updating VM, it exits the updating
    // routine.
    op(4, labelOperand("FINALLY")), op(1e3, "ELSE"),
    // If the conditional is false, and code associatied ith the
    // false branch was provided, execute it. If there was no code
    // associated with the false branch, jumping to the else statement
    // has no other behavior.
    void 0 !== ifFalse && ifFalse();
  });
}
function InvokeComponent(op, component, _elementBlock, positional, named, _blocks) {
  let {
      compilable: compilable,
      capabilities: capabilities,
      handle: handle
    } = component,
    elementBlock = _elementBlock ? [_elementBlock, []] : null,
    blocks = namedBlocks(_blocks);
  compilable ? (op(78, handle), function (op, {
    capabilities: capabilities,
    layout: layout,
    elementBlock: elementBlock,
    positional: positional,
    named: named,
    blocks: blocks
  }) {
    let {
      symbolTable: symbolTable
    } = layout;
    if (hasCapability(capabilities, InternalComponentCapabilities.prepareArgs)) return void InvokeNonStaticComponent(op, {
      capabilities: capabilities,
      elementBlock: elementBlock,
      positional: positional,
      named: named,
      atNames: true,
      blocks: blocks,
      layout: layout
    });
    op(36, $s0), op(33, $sp, 1), op(35, $s0), op(0);
    // Setup arguments
    let {
        symbols: symbols
      } = symbolTable,
      blockSymbols = [],
      argSymbols = [],
      argNames = [],
      blockNames = blocks.names;
    // As we push values onto the stack, we store the symbols associated  with them
    // so that we can set them on the scope later on with SetVariable and SetBlock
    // Starting with the attrs block, if it exists and is referenced in the component
    if (null !== elementBlock) {
      let symbol = symbols.indexOf("&attrs");
      -1 !== symbol && (PushYieldableBlock(op, elementBlock), blockSymbols.push(symbol));
    }
    // Followed by the other blocks, if they exist and are referenced in the component.
    // Also store the index of the associated symbol.
    for (const name of blockNames) {
      let symbol = symbols.indexOf(`&${name}`);
      -1 !== symbol && (PushYieldableBlock(op, blocks.get(name)), blockSymbols.push(symbol));
    }
    // Next up we have arguments. If the component has the `createArgs` capability,
    // then it wants access to the arguments in JavaScript. We can't know whether
    // or not an argument is used, so we have to give access to all of them.
    if (hasCapability(capabilities, InternalComponentCapabilities.createArgs)) {
      // First we push positional arguments
      let flags = CompilePositional(op, positional) << 4;
      // setup the flags with the count of positionals, and to indicate that atNames
      // are used
      flags |= 8;
      let names = EMPTY_STRING_ARRAY;
      // Next, if named args exist, push them all. If they have an associated symbol
      // in the invoked component (e.g. they are used within its template), we push
      // that symbol. If not, we still push the expression as it may be used, and
      // we store the symbol as -1 (this is used later).
      if (null !== named) {
        names = named[0];
        let val = named[1];
        for (let i = 0; i < val.length; i++) {
          let symbol = symbols.indexOf(names[i]);
          expr(op, val[i]), argSymbols.push(symbol);
        }
      }
      // Finally, push the VM arguments themselves. These args won't need access
      // to blocks (they aren't accessible from userland anyways), so we push an
      // empty array instead of the actual block names.
      op(82, names, EMPTY_STRING_ARRAY, flags),
      // And push an extra pop operation to remove the args before we begin setting
      // variables on the local context
      argSymbols.push(-1);
    } else if (null !== named) {
      // If the component does not have the `createArgs` capability, then the only
      // expressions we need to push onto the stack are those that are actually
      // referenced in the template of the invoked component (e.g. have symbols).
      let names = named[0],
        val = named[1];
      for (let i = 0; i < val.length; i++) {
        let name = names[i],
          symbol = symbols.indexOf(name);
        -1 !== symbol && (expr(op, val[i]), argSymbols.push(symbol), argNames.push(name));
      }
    }
    op(97, $s0), hasCapability(capabilities, InternalComponentCapabilities.dynamicScope) && op(59), hasCapability(capabilities, InternalComponentCapabilities.createInstance) &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    op(87, 0 | blocks.has("default")), op(88, $s0), hasCapability(capabilities, InternalComponentCapabilities.createArgs) ? op(90, $s0) : op(90, $s0, argNames),
    // Setup the new root scope for the component
    op(37, symbols.length + 1, Object.keys(blocks).length > 0 ? 1 : 0),
    // Pop the self reference off the stack and set it to the symbol for `this`
    // in the new scope. This is why all subsequent symbols are increased by one.
    op(19, 0);
    // Going in reverse, now we pop the args/blocks off the stack, starting with
    // arguments, and assign them to their symbols in the new scope.
    for (const symbol of reverse(argSymbols))
    // for (let i = argSymbols.length - 1; i >= 0; i--) {
    //   let symbol = argSymbols[i];
    -1 === symbol ?
    // The expression was not bound to a local symbol, it was only pushed to be
    // used with VM args in the javascript side
    op(34, 1) : op(19, symbol + 1);
    // if any positional params exist, pop them off the stack as well
    null !== positional && op(34, positional.length);
    // Finish up by popping off and assigning blocks
    for (const symbol of reverse(blockSymbols)) op(20, symbol + 1);
    op(28, layoutOperand(layout)), op(61), op(2), op(100, $s0), op(1), op(40), hasCapability(capabilities, InternalComponentCapabilities.dynamicScope) && op(60), op(98), op(35, $s0);
  }(op, {
    capabilities: capabilities,
    layout: compilable,
    elementBlock: elementBlock,
    positional: positional,
    named: named,
    blocks: blocks
  })) : (op(78, handle), InvokeNonStaticComponent(op, {
    capabilities: capabilities,
    elementBlock: elementBlock,
    positional: positional,
    named: named,
    atNames: true,
    blocks: blocks
  }));
}
function InvokeDynamicComponent(op, definition, _elementBlock, positional, named, _blocks, atNames, curried) {
  let elementBlock = _elementBlock ? [_elementBlock, []] : null,
    blocks = namedBlocks(_blocks);
  Replayable(op, () => (expr(op, definition), op(33, $sp, 0), 2), () => {
    op(66, labelOperand("ELSE")), curried ? op(81) : op(80, {
      type: 2,
      value: void 0
    }), op(79), InvokeNonStaticComponent(op, {
      capabilities: true,
      elementBlock: elementBlock,
      positional: positional,
      named: named,
      atNames: atNames,
      blocks: blocks
    }), op(1e3, "ELSE");
  });
}
function InvokeNonStaticComponent(op, {
  capabilities: capabilities,
  elementBlock: elementBlock,
  positional: positional,
  named: named,
  atNames: atNames,
  blocks: namedBlocks,
  layout: layout
}) {
  let bindableBlocks = !!namedBlocks,
    bindableAtNames = true === capabilities || hasCapability(capabilities, InternalComponentCapabilities.prepareArgs) || !(!named || 0 === named[0].length),
    blocks = namedBlocks.with("attrs", elementBlock);
  op(36, $s0), op(33, $sp, 1), op(35, $s0), op(0), function (op, positional, named, blocks, atNames) {
    let blockNames = blocks.names;
    for (const name of blockNames) PushYieldableBlock(op, blocks.get(name));
    let flags = CompilePositional(op, positional) << 4;
    atNames && (flags |= 8), blocks.hasAny && (flags |= 7);
    let names = EMPTY_ARRAY;
    if (named) {
      names = named[0];
      let val = named[1];
      for (let i = 0; i < val.length; i++) expr(op, val[i]);
    }
    op(82, names, blockNames, flags);
  }(op, positional, named, blocks, atNames), op(85, $s0), invokePreparedComponent(op, blocks.has("default"), bindableBlocks, bindableAtNames, () => {
    layout ? (op(63, symbolTableOperand(layout.symbolTable)), op(28, layoutOperand(layout)), op(61)) : op(92, $s0), op(95, $s0);
  }), op(35, $s0);
}
function invokePreparedComponent(op, hasBlock, bindableBlocks, bindableAtNames, populateLayout = null) {
  op(97, $s0), op(59),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  op(87, 0 | hasBlock),
  // this has to run after createComponent to allow
  // for late-bound layouts, but a caller is free
  // to populate the layout earlier if it wants to
  // and do nothing here.
  populateLayout && populateLayout(), op(88, $s0), op(90, $s0), op(38, $s0), op(19, 0), bindableAtNames && op(17, $s0), bindableBlocks && op(18, $s0), op(34, 1), op(96, $s0), op(100, $s0), op(1), op(40), op(60), op(98);
}
const STATEMENTS = new Compilers(),
  INFLATE_ATTR_TABLE = ["class", "id", "value", "name", "type", "style", "href"],
  INFLATE_TAG_TABLE = ["div", "span", "p", "a"];
function inflateTagName(tagName) {
  return "string" == typeof tagName ? tagName : INFLATE_TAG_TABLE[tagName];
}
function inflateAttrName(attrName) {
  return "string" == typeof attrName ? attrName : INFLATE_ATTR_TABLE[attrName];
}
function hashToArgs(hash) {
  return null === hash ? null : [hash[0].map(key => `@${key}`), hash[1]];
}
STATEMENTS.add(opcodes.Comment, (op, sexp) => op(42, sexp[1])), STATEMENTS.add(opcodes.CloseElement, op => op(55)), STATEMENTS.add(opcodes.FlushElement, op => op(54)), STATEMENTS.add(opcodes.Modifier, (op, [, expression, positional, named]) => {
  isGetFreeModifier(expression) ? op(1003, expression, handle => {
    op(0), SimpleArgs(op, positional, named, false), op(57, handle), op(1);
  }) : (expr(op, expression), op(0), SimpleArgs(op, positional, named, false), op(33, $fp, 1), op(108), op(1));
}), STATEMENTS.add(opcodes.StaticAttr, (op, [, name, value, namespace]) => {
  op(51, inflateAttrName(name), value, namespace ?? null);
}), STATEMENTS.add(opcodes.StaticComponentAttr, (op, [, name, value, namespace]) => {
  op(105, inflateAttrName(name), value, namespace ?? null);
}), STATEMENTS.add(opcodes.DynamicAttr, (op, [, name, value, namespace]) => {
  expr(op, value), op(52, inflateAttrName(name), false, namespace ?? null);
}), STATEMENTS.add(opcodes.TrustingDynamicAttr, (op, [, name, value, namespace]) => {
  expr(op, value), op(52, inflateAttrName(name), true, namespace ?? null);
}), STATEMENTS.add(opcodes.ComponentAttr, (op, [, name, value, namespace]) => {
  expr(op, value), op(53, inflateAttrName(name), false, namespace ?? null);
}), STATEMENTS.add(opcodes.TrustingComponentAttr, (op, [, name, value, namespace]) => {
  expr(op, value), op(53, inflateAttrName(name), true, namespace ?? null);
}), STATEMENTS.add(opcodes.OpenElement, (op, [, tag]) => {
  op(48, inflateTagName(tag));
}), STATEMENTS.add(opcodes.OpenElementWithSplat, (op, [, tag]) => {
  op(89), op(48, inflateTagName(tag));
}), STATEMENTS.add(opcodes.Component, (op, [, expr, elementBlock, named, blocks]) => {
  isGetFreeComponent(expr) ? op(1004, expr, component => {
    InvokeComponent(op, component, elementBlock, null, named, blocks);
  }) :
  // otherwise, the component name was an expression, so resolve the expression
  // and invoke it as a dynamic component
  InvokeDynamicComponent(op, expr, elementBlock, null, named, blocks, true, true);
}), STATEMENTS.add(opcodes.Yield, (op, [, to, params]) => YieldBlock(op, to, params)), STATEMENTS.add(opcodes.AttrSplat, (op, [, to]) => YieldBlock(op, to, null)), STATEMENTS.add(opcodes.Debugger, (op, [, locals, upvars, lexical]) => {
  op(103, function (locals, upvars, lexical) {
    return {
      type: 3,
      value: {
        locals: locals,
        upvars: upvars,
        lexical: lexical
      }
    };
  }(locals, upvars, lexical));
}), STATEMENTS.add(opcodes.Append, (op, [, value]) => {
  // Special case for static values
  if (Array.isArray(value)) {
    if (isGetFreeComponentOrHelper(value)) op(1008, value, {
      ifComponent(component) {
        InvokeComponent(op, component, null, null, null, null);
      },
      ifHelper(handle) {
        op(0), Call(op, handle, null, null), op(3, stdlibOperand("cautious-non-dynamic-append")), op(1);
      },
      ifValue(handle) {
        op(0), op(29, handle), op(3, stdlibOperand("cautious-non-dynamic-append")), op(1);
      }
    });else if (value[0] === opcodes.Call) {
      let [, expression, positional, named] = value;
      isGetFreeComponentOrHelper(expression) ? op(1007, expression, {
        ifComponent(component) {
          InvokeComponent(op, component, null, positional, hashToArgs(named), null);
        },
        ifHelper(handle) {
          op(0), Call(op, handle, positional, named), op(3, stdlibOperand("cautious-non-dynamic-append")), op(1);
        }
      }) : SwitchCases(op, () => {
        expr(op, expression), op(106);
      }, when => {
        when(ContentType.Component, () => {
          op(81), op(79), InvokeNonStaticComponent(op, {
            capabilities: true,
            elementBlock: null,
            positional: positional,
            named: named,
            atNames: false,
            blocks: namedBlocks(null)
          });
        }), when(ContentType.Helper, () => {
          CallDynamic(op, positional, named, () => {
            op(3, stdlibOperand("cautious-non-dynamic-append"));
          });
        });
      });
    } else op(0), expr(op, value), op(3, stdlibOperand("cautious-append")), op(1);
  } else op(41, null == value ? "" : String(value));
}), STATEMENTS.add(opcodes.TrustingAppend, (op, [, value]) => {
  Array.isArray(value) ? (op(0), expr(op, value), op(3, stdlibOperand("trusting-append")), op(1)) : op(41, null == value ? "" : String(value));
}), STATEMENTS.add(opcodes.Block, (op, [, expr, positional, named, blocks]) => {
  isGetFreeComponent(expr) ? op(1004, expr, component => {
    InvokeComponent(op, component, null, positional, hashToArgs(named), blocks);
  }) : InvokeDynamicComponent(op, expr, null, positional, named, blocks, false, false);
}), STATEMENTS.add(opcodes.InElement, (op, [, block, guid, destination, insertBefore]) => {
  ReplayableIf(op, () => (expr(op, guid), void 0 === insertBefore ? PushPrimitiveReference(op, void 0) : expr(op, insertBefore), expr(op, destination), op(33, $sp, 0), 4), () => {
    op(50), InvokeStaticBlock(op, block), op(56);
  });
}), STATEMENTS.add(opcodes.If, (op, [, condition, block, inverse]) => ReplayableIf(op, () => (expr(op, condition), op(71), 1), () => {
  InvokeStaticBlock(op, block);
}, inverse ? () => {
  InvokeStaticBlock(op, inverse);
} : void 0)), STATEMENTS.add(opcodes.Each, (op, [, value, key, block, inverse]) => Replayable(op, () => (key ? expr(op, key) : PushPrimitiveReference(op, null), expr(op, value), 2), () => {
  op(72, labelOperand("BODY"), labelOperand("ELSE")), op(0), op(33, $fp, 1), op(6, labelOperand("ITER")), op(1e3, "ITER"), op(74, labelOperand("BREAK")), op(1e3, "BODY"), InvokeStaticBlockWithStack(op, block, 2), op(34, 2), op(4, labelOperand("FINALLY")), op(1e3, "BREAK"), op(1), op(73), op(4, labelOperand("FINALLY")), op(1e3, "ELSE"), inverse && InvokeStaticBlock(op, inverse);
})), STATEMENTS.add(opcodes.Let, (op, [, positional, block]) => {
  InvokeStaticBlockWithStack(op, block, CompilePositional(op, positional));
}), STATEMENTS.add(opcodes.WithDynamicVars, (op, [, named, block]) => {
  if (named) {
    let [names, expressions] = named;
    CompilePositional(op, expressions), function (op, names, block) {
      op(59), op(58, names), block(), op(60);
    }(op, names, () => {
      InvokeStaticBlock(op, block);
    });
  } else InvokeStaticBlock(op, block);
}), STATEMENTS.add(opcodes.InvokeComponent, (op, [, expr, positional, named, blocks]) => {
  isGetFreeComponent(expr) ? op(1004, expr, component => {
    InvokeComponent(op, component, null, positional, hashToArgs(named), blocks);
  }) : InvokeDynamicComponent(op, expr, null, positional, named, blocks, false, false);
});
class CompilableTemplateImpl {
  constructor(statements, meta,
  // Part of CompilableTemplate
  symbolTable,
  // Used for debugging
  moduleName = "plain block") {
    this.statements = statements, this.meta = meta, this.symbolTable = symbolTable, this.moduleName = moduleName, this.compiled = null;
  }
  // Part of CompilableTemplate
  compile(context) {
    return function (compilable, context) {
      if (null !== compilable.compiled) return compilable.compiled;
      compilable.compiled = -1;
      let {
          statements: statements,
          meta: meta
        } = compilable,
        result = compileStatements(statements, meta, context);
      return compilable.compiled = result, result;
    }(this, context);
  }
}
function compilable(layout, moduleName) {
  let [statements, symbols] = layout.block;
  return new CompilableTemplateImpl(statements, meta(layout), {
    symbols: symbols
  }, moduleName);
}
function compileStatements(statements, meta, syntaxContext) {
  let sCompiler = STATEMENTS,
    context = templateCompilationContext(syntaxContext, meta),
    {
      encoder: encoder,
      evaluation: evaluation
    } = context;
  function pushOp(...op) {
    encodeOp(encoder, evaluation, meta, op);
  }
  for (const statement of statements) sCompiler.compile(pushOp, statement);
  return context.encoder.commit(meta.size);
}
const DEFAULT_CAPABILITIES = {
    dynamicLayout: true,
    dynamicTag: true,
    prepareArgs: true,
    createArgs: true,
    attributeHook: false,
    elementHook: false,
    dynamicScope: true,
    createCaller: false,
    updateHook: true,
    createInstance: true,
    wrapped: false,
    willDestroy: false,
    hasSubOwner: false
  },
  MINIMAL_CAPABILITIES = {
    dynamicLayout: false,
    dynamicTag: false,
    prepareArgs: false,
    createArgs: false,
    attributeHook: false,
    elementHook: false,
    dynamicScope: false,
    createCaller: false,
    updateHook: false,
    createInstance: false,
    wrapped: false,
    willDestroy: false,
    hasSubOwner: false
  };
class StdLib {
  constructor(main, trustingGuardedAppend, cautiousGuardedAppend, trustingNonDynamicAppend, cautiousNonDynamicAppend) {
    this.main = main, this.trustingGuardedAppend = trustingGuardedAppend, this.cautiousGuardedAppend = cautiousGuardedAppend, this.trustingNonDynamicAppend = trustingNonDynamicAppend, this.cautiousNonDynamicAppend = cautiousNonDynamicAppend;
  }
  get "trusting-append"() {
    return this.trustingGuardedAppend;
  }
  get "cautious-append"() {
    return this.cautiousGuardedAppend;
  }
  get "trusting-non-dynamic-append"() {
    return this.trustingNonDynamicAppend;
  }
  get "cautious-non-dynamic-append"() {
    return this.cautiousNonDynamicAppend;
  }
  getAppend(trusting) {
    return trusting ? this.trustingGuardedAppend : this.cautiousGuardedAppend;
  }
}

/**
 * Append content to the DOM. This standard function triages content and does the
 * right thing based upon whether it's a string, safe string, component, fragment
 * or node.
 *
 * @param trusting whether to interpolate a string as raw HTML (corresponds to
 * triple curlies)
 */
function StdAppend(op, trusting, nonDynamicAppend) {
  SwitchCases(op, () => op(76), when => {
    when(ContentType.String, () => {
      trusting ? (op(68), op(43)) : op(47);
    }), "number" == typeof nonDynamicAppend ? (when(ContentType.Component, () => {
      op(81), op(79), function (op) {
        op(36, $s0), op(33, $sp, 1), op(35, $s0), op(0), op(83), op(85, $s0), invokePreparedComponent(op, false, false, true, () => {
          op(92, $s0), op(95, $s0);
        }), op(35, $s0);
      }(op);
    }), when(ContentType.Helper, () => {
      CallDynamic(op, null, null, () => {
        op(3, nonDynamicAppend);
      });
    })) : (
    // when non-dynamic, we can no longer call the value (potentially because we've already called it)
    // this prevents infinite loops. We instead coerce the value, whatever it is, into the DOM.
    when(ContentType.Component, () => {
      op(47);
    }), when(ContentType.Helper, () => {
      op(47);
    })), when(ContentType.SafeString, () => {
      op(68), op(44);
    }), when(ContentType.Fragment, () => {
      op(68), op(45);
    }), when(ContentType.Node, () => {
      op(68), op(46);
    });
  });
}
function compileStd(context) {
  let mainHandle = build(context, op => function (op) {
      op(75, $s0), invokePreparedComponent(op, false, false, true);
    }(op)),
    trustingGuardedNonDynamicAppend = build(context, op => StdAppend(op, true, null)),
    cautiousGuardedNonDynamicAppend = build(context, op => StdAppend(op, false, null)),
    trustingGuardedDynamicAppend = build(context, op => StdAppend(op, true, trustingGuardedNonDynamicAppend)),
    cautiousGuardedDynamicAppend = build(context, op => StdAppend(op, false, cautiousGuardedNonDynamicAppend));
  return new StdLib(mainHandle, trustingGuardedDynamicAppend, cautiousGuardedDynamicAppend, trustingGuardedNonDynamicAppend, cautiousGuardedNonDynamicAppend);
}
const STDLIB_META = {
  symbols: {
    locals: null,
    upvars: null
  },
  moduleName: "stdlib",
  // TODO: ??
  scopeValues: null,
  isStrictMode: true,
  owner: null,
  size: 0
};
function build(evaluation, builder) {
  let encoder = new EncoderImpl(evaluation.program.heap, STDLIB_META);
  builder(function (...op) {
    encodeOp(encoder, evaluation, STDLIB_META, op);
  });
  let result = encoder.commit(0);
  if ("number" != typeof result)
    // This shouldn't be possible
    throw new Error("Unexpected errors compiling std");
  return result;
}
class EvaluationContextImpl {
  constructor({
    constants: constants,
    heap: heap
  }, createOp, runtime) {
    this.constants = constants, this.heap = heap, this.resolver = runtime.resolver, this.createOp = createOp, this.env = runtime.env, this.program = runtime.program, this.stdlib = compileStd(this);
  }
}
class WrappedBuilder {
  constructor(layout, moduleName) {
    this.layout = layout, this.moduleName = moduleName, this.compiled = null;
    let {
        block: block
      } = layout,
      [, symbols] = block;
    symbols = symbols.slice();
    // ensure ATTRS_BLOCK is always included (only once) in the list of symbols
    let attrsBlockIndex = symbols.indexOf("&attrs");
    this.attrsBlockNumber = -1 === attrsBlockIndex ? symbols.push("&attrs") : attrsBlockIndex + 1, this.symbolTable = {
      symbols: symbols
    }, this.meta = meta(layout);
  }
  compile(syntax) {
    if (null !== this.compiled) return this.compiled;
    let m = meta(this.layout),
      context = templateCompilationContext(syntax, m),
      {
        encoder: encoder,
        evaluation: evaluation
      } = context;
    var op, layout, attrsBlockNumber;
    op = function (...op) {
      encodeOp(encoder, evaluation, m, op);
    }, layout = this.layout, attrsBlockNumber = this.attrsBlockNumber, op(1001), function (op, register, block) {
      op(36, register), block(), op(35, register);
    }(op, $s1, () => {
      op(91, $s0), op(31), op(33, $sp, 0);
    }), op(66, labelOperand("BODY")), op(36, $s1), op(89), op(49), op(99, $s0), YieldBlock(op, attrsBlockNumber, null), op(54), op(1e3, "BODY"), InvokeStaticBlock(op, [layout.block[0], []]), op(36, $s1), op(66, labelOperand("END")), op(55), op(1e3, "END"), op(35, $s1), op(1002);
    let handle = context.encoder.commit(m.size);
    return "number" != typeof handle || (this.compiled = handle), handle;
  }
}
let clientId = 0,
  templateCacheCounters = {
    cacheHit: 0,
    cacheMiss: 0
  };

/**
 * Wraps a template js in a template module to change it into a factory
 * that handles lazy parsing the template and to create per env singletons
 * of the template.
 */
function templateFactory({
  id: templateId,
  moduleName: moduleName,
  block: block,
  scope: scope,
  isStrictMode: isStrictMode
}) {
  // TODO(template-refactors): This should be removed in the near future, as it
  // appears that id is unused. It is currently kept for backwards compat reasons.
  let parsedBlock,
    id = templateId || "client-" + clientId++,
    ownerlessTemplate = null,
    templateCache = new WeakMap(),
    factory = owner => {
      if (void 0 === parsedBlock && (parsedBlock = JSON.parse(block)), void 0 === owner) return null === ownerlessTemplate ? (templateCacheCounters.cacheMiss++, ownerlessTemplate = new TemplateImpl({
        id: id,
        block: parsedBlock,
        moduleName: moduleName,
        owner: null,
        scope: scope,
        isStrictMode: isStrictMode
      })) : templateCacheCounters.cacheHit++, ownerlessTemplate;
      let result = templateCache.get(owner);
      return void 0 === result ? (templateCacheCounters.cacheMiss++, result = new TemplateImpl({
        id: id,
        block: parsedBlock,
        moduleName: moduleName,
        owner: owner,
        scope: scope,
        isStrictMode: isStrictMode
      }), templateCache.set(owner, result)) : templateCacheCounters.cacheHit++, result;
    };
  // TODO: This caches JSON serialized output once in case a template is
  // compiled by multiple owners, but we haven't verified if this is actually
  // helpful. We should benchmark this in the future.
  return factory.__id = id, factory.__meta = {
    moduleName: moduleName
  }, factory;
}
class TemplateImpl {
  constructor(parsedLayout) {
    this.parsedLayout = parsedLayout, this.result = "ok", this.layout = null, this.wrappedLayout = null;
  }
  get moduleName() {
    return this.parsedLayout.moduleName;
  }
  get id() {
    return this.parsedLayout.id;
  }
  // TODO(template-refactors): This should be removed in the near future, it is
  // only being exposed for backwards compatibility
  get referrer() {
    return {
      moduleName: this.parsedLayout.moduleName,
      owner: this.parsedLayout.owner
    };
  }
  asLayout() {
    return this.layout ? this.layout : this.layout = compilable(assign({}, this.parsedLayout), this.moduleName);
  }
  asWrappedLayout() {
    return this.wrappedLayout ? this.wrappedLayout : this.wrappedLayout = new WrappedBuilder(assign({}, this.parsedLayout), this.moduleName);
  }
}

export { DEFAULT_CAPABILITIES, EMPTY_BLOCKS, EvaluationContextImpl, MINIMAL_CAPABILITIES, StdLib, WrappedBuilder, compilable, compileStatements, compileStd, debugCompiler, InvokeStaticBlock as invokeStaticBlock, InvokeStaticBlockWithStack as invokeStaticBlockWithStack, meta, templateCacheCounters, templateCompilationContext, templateFactory };
