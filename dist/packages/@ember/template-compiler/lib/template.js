import templateOnly from '../../component/template-only.js';
import { SexpOpcodes as opcodes, WellKnownTagNames, WellKnownAttrNames } from '../../../@glimmer/wire-format/index.js';
import { n as node, a as api$1, g as generateSyntaxError, b as api, m as maybeLoc, i as isKeyword, K as KEYWORDS_TYPES, S as SourceSlice, c as normalize, l as loc } from '../../../shared-chunks/transform-resolutions-DEAl6ije.js';
import { setComponentTemplate } from '../../../@glimmer/manager/index.js';
import { templateFactory } from '../../../@glimmer/opcode-compiler/index.js';
import compileOptions from './compile-options.js';

/// Builder ///
const CURRIED_COMPONENT = 0,
  CURRIED_HELPER = 1,
  CURRIED_MODIFIER = 2;
function isPresentArray(list) {
  return !!list && list.length > 0;
}
function mapPresentArray(list, mapper) {
  if (null === list) return null;
  let out = [];
  for (let item of list) out.push(mapper(item));
  return out;
}
class Template extends node("Template").fields() {}
class InElement extends node("InElement").fields() {}
class Not extends node("Not").fields() {}
class If extends node("If").fields() {}
class IfInline extends node("IfInline").fields() {}
class Each extends node("Each").fields() {}
class Let extends node("Let").fields() {}
class WithDynamicVars extends node("WithDynamicVars").fields() {}
class GetDynamicVar extends node("GetDynamicVar").fields() {}
class Log extends node("Log").fields() {}
class InvokeComponent extends node("InvokeComponent").fields() {}
class NamedBlocks extends node("NamedBlocks").fields() {}
class NamedBlock extends node("NamedBlock").fields() {}
class AppendTrustedHTML extends node("AppendTrustedHTML").fields() {}
class AppendTextNode extends node("AppendTextNode").fields() {}
class AppendComment extends node("AppendComment").fields() {}
class Component extends node("Component").fields() {}
class StaticAttr extends node("StaticAttr").fields() {}
class DynamicAttr extends node("DynamicAttr").fields() {}
class SimpleElement extends node("SimpleElement").fields() {}
class ElementParameters extends node("ElementParameters").fields() {}
class Yield extends node("Yield").fields() {}
class Debugger extends node("Debugger").fields() {}
class CallExpression extends node("CallExpression").fields() {}
class Modifier extends node("Modifier").fields() {}
class InvokeBlock extends node("InvokeBlock").fields() {}
class SplatAttr extends node("SplatAttr").fields() {}
class PathExpression extends node("PathExpression").fields() {}
class Missing extends node("Missing").fields() {}
class InterpolateExpression extends node("InterpolateExpression").fields() {}
class HasBlock extends node("HasBlock").fields() {}
class HasBlockParams extends node("HasBlockParams").fields() {}
class Curry extends node("Curry").fields() {}
class Positional extends node("Positional").fields() {}
class NamedArguments extends node("NamedArguments").fields() {}
class NamedArgument extends node("NamedArgument").fields() {}
class Args extends node("Args").fields() {}
class Tail extends node("Tail").fields() {}
class PresentList {
  constructor(list) {
    this.list = list;
  }
  toArray() {
    return this.list;
  }
  map(callback) {
    let result = mapPresentArray(this.list, callback);
    return new PresentList(result);
  }
  filter(predicate) {
    let out = [];
    for (let item of this.list) predicate(item) && out.push(item);
    return OptionalList(out);
  }
  toPresentArray() {
    return this.list;
  }
  into({
    ifPresent: ifPresent
  }) {
    return ifPresent(this);
  }
}
class EmptyList {
  map(_callback) {
    return new EmptyList();
  }
  filter(_predicate) {
    return new EmptyList();
  }
  toArray() {
    return this.list;
  }
  toPresentArray() {
    return null;
  }
  into({
    ifEmpty: ifEmpty
  }) {
    return ifEmpty();
  }
  constructor() {
    this.list = [];
  }
}

// export type OptionalList<T> = PresentList<T> | EmptyList<T>;
function OptionalList(value) {
  return isPresentArray(value) ? new PresentList(value) : new EmptyList();
}
class ResultImpl {
  static all(...results) {
    let out = [];
    for (let result of results) {
      if (result.isErr) return result.cast();
      out.push(result.value);
    }
    return Ok(out);
  }
}
const Result = ResultImpl;
class OkImpl extends ResultImpl {
  constructor(value) {
    super(), this.value = value, this.isOk = true, this.isErr = false;
  }
  expect(_message) {
    return this.value;
  }
  ifOk(callback) {
    return callback(this.value), this;
  }
  andThen(callback) {
    return callback(this.value);
  }
  mapOk(callback) {
    return Ok(callback(this.value));
  }
  ifErr(_callback) {
    return this;
  }
  mapErr(_callback) {
    return this;
  }
}
class ErrImpl extends ResultImpl {
  constructor(reason) {
    super(), this.reason = reason, this.isOk = false, this.isErr = true;
  }
  expect(message) {
    throw new Error(message || "expected an Ok, got Err");
  }
  andThen(_callback) {
    return this.cast();
  }
  mapOk(_callback) {
    return this.cast();
  }
  ifOk(_callback) {
    return this;
  }
  mapErr(callback) {
    return Err(callback(this.reason));
  }
  ifErr(callback) {
    return callback(this.reason), this;
  }
  cast() {
    return this;
  }
}
function Ok(value) {
  return new OkImpl(value);
}
function Err(reason) {
  return new ErrImpl(reason);
}
class ResultArray {
  constructor(items = []) {
    this.items = items;
  }
  add(item) {
    this.items.push(item);
  }
  toArray() {
    let err = this.items.filter(item => item instanceof ErrImpl)[0];
    return void 0 !== err ? err.cast() : Ok(this.items.map(item => item.value));
  }
  toOptionalList() {
    return this.toArray().mapOk(arr => OptionalList(arr));
  }
}
function convertPathToCallIfKeyword(path) {
  return "Path" === path.type && "Free" === path.ref.type && path.ref.name in KEYWORDS_TYPES ? new api.CallExpression({
    callee: path,
    args: api.Args.empty(path.loc),
    loc: path.loc
  }) : path;
}
const VISIT_EXPRS = new class {
  visit(node, state) {
    switch (node.type) {
      case "Literal":
        return Ok(this.Literal(node));
      case "Keyword":
        return Ok(this.Keyword(node));
      case "Interpolate":
        return this.Interpolate(node, state);
      case "Path":
        return this.PathExpression(node);
      case "Call":
        {
          let translated = CALL_KEYWORDS.translate(node, state);
          return null !== translated ? translated : this.CallExpression(node, state);
        }
    }
  }
  visitList(nodes, state) {
    return new ResultArray(nodes.map(e => VISIT_EXPRS.visit(e, state))).toOptionalList();
  }
  /**
  * Normalize paths into `hir.Path` or a `hir.Expr` that corresponds to the ref.
  *
  * TODO since keywords don't support tails anyway, distinguish PathExpression from
  * VariableReference in ASTv2.
  */
  PathExpression(path) {
    let ref = this.VariableReference(path.ref),
      {
        tail: tail
      } = path;
    if (isPresentArray(tail)) {
      let tailLoc = tail[0].loc.extend((list = tail, 0 === list.length ? void 0 : list[list.length - 1]).loc);
      return Ok(new PathExpression({
        loc: path.loc,
        head: ref,
        tail: new Tail({
          loc: tailLoc,
          members: tail
        })
      }));
    }
    return Ok(ref);
    var list;
  }
  VariableReference(ref) {
    return ref;
  }
  Literal(literal) {
    return literal;
  }
  Keyword(keyword) {
    return keyword;
  }
  Interpolate(expr, state) {
    let parts = expr.parts.map(convertPathToCallIfKeyword);
    return VISIT_EXPRS.visitList(parts, state).mapOk(parts => new InterpolateExpression({
      loc: expr.loc,
      parts: parts
    }));
  }
  CallExpression(expr, state) {
    if ("Call" === expr.callee.type) throw new Error("unimplemented: subexpression at the head of a subexpression");
    return Result.all(VISIT_EXPRS.visit(expr.callee, state), VISIT_EXPRS.Args(expr.args, state)).mapOk(([callee, args]) => new CallExpression({
      loc: expr.loc,
      callee: callee,
      args: args
    }));
  }
  Args({
    positional: positional,
    named: named,
    loc: loc
  }, state) {
    return Result.all(this.Positional(positional, state), this.NamedArguments(named, state)).mapOk(([positional, named]) => new Args({
      loc: loc,
      positional: positional,
      named: named
    }));
  }
  Positional(positional, state) {
    return VISIT_EXPRS.visitList(positional.exprs, state).mapOk(list => new Positional({
      loc: positional.loc,
      list: list
    }));
  }
  NamedArguments(named, state) {
    let pairs = named.entries.map(arg => {
      let value = convertPathToCallIfKeyword(arg.value);
      return VISIT_EXPRS.visit(value, state).mapOk(value => new NamedArgument({
        loc: arg.loc,
        key: arg.name,
        value: value
      }));
    });
    return new ResultArray(pairs).toOptionalList().mapOk(pairs => new NamedArguments({
      loc: named.loc,
      entries: pairs
    }));
  }
}();
class KeywordImpl {
  constructor(keyword, type, delegate) {
    this.keyword = keyword, this.delegate = delegate;
    let nodes = new Set();
    for (let nodeType of KEYWORD_NODES[type]) nodes.add(nodeType);
    this.types = nodes;
  }
  match(node) {
    if (!this.types.has(node.type)) return false;
    let path = getCalleeExpression(node);
    return null !== path && "Path" === path.type && "Free" === path.ref.type && path.ref.name === this.keyword;
  }
  translate(node, state) {
    if (this.match(node)) {
      let path = getCalleeExpression(node);
      return null !== path && "Path" === path.type && path.tail.length > 0 ? Err(generateSyntaxError(`The \`${this.keyword}\` keyword was used incorrectly. It was used as \`${path.loc.asString()}\`, but it cannot be used with additional path segments. \n\nError caused by`, node.loc)) : this.delegate.assert(node, state).andThen(param => this.delegate.translate({
        node: node,
        state: state
      }, param));
    }
    return null;
  }
}
const KEYWORD_NODES = {
  Call: ["Call"],
  Block: ["InvokeBlock"],
  Append: ["AppendContent"],
  Modifier: ["ElementModifier"]
};
function getCalleeExpression(node) {
  switch (node.type) {
    // This covers the inside of attributes and expressions, as well as the callee
    // of call nodes
    case "Path":
      return node;
    case "AppendContent":
      return getCalleeExpression(node.value);
    case "Call":
    case "InvokeBlock":
    case "ElementModifier":
      return node.callee;
    default:
      return null;
  }
}
class Keywords {
  constructor(type) {
    this._keywords = [], this._type = type;
  }
  kw(name, delegate) {
    return this._keywords.push(new KeywordImpl(name, this._type, delegate)), this;
  }
  translate(node, state) {
    for (let keyword of this._keywords) {
      let result = keyword.translate(node, state);
      if (null !== result) return result;
    }
    let path = getCalleeExpression(node);
    if (path && "Path" === path.type && "Free" === path.ref.type && isKeyword(path.ref.name)) {
      let {
          name: name
        } = path.ref,
        usedType = this._type,
        validTypes = KEYWORDS_TYPES[name];
      if (!validTypes.includes(usedType)) return Err(generateSyntaxError(`The \`${name}\` keyword was used incorrectly. It was used as ${typesToReadableName[usedType]}, but its valid usages are:\n\n${function (name, types) {
        return types.map(type => {
          switch (type) {
            case "Append":
              return `- As an append statement, as in: {{${name}}}`;
            case "Block":
              return `- As a block statement, as in: {{#${name}}}{{/${name}}}`;
            case "Call":
              return `- As an expression, as in: (${name})`;
            case "Modifier":
              return `- As a modifier, as in: <div {{${name}}}></div>`;
            default:
              return;
          }
        }).join("\n\n");
      }
      /**
      * This function builds keyword definitions for a particular type of AST node (`KeywordType`).
      *
      * You can build keyword definitions for:
      *
      * - `Expr`: A `SubExpression` or `PathExpression`
      * - `Block`: A `BlockStatement`
      *   - A `BlockStatement` is a keyword candidate if its head is a
      *     `PathExpression`
      * - `Append`: An `AppendStatement`
      *
      * A node is a keyword candidate if:
      *
      * - A `PathExpression` is a keyword candidate if it has no tail, and its
      *   head expression is a `LocalVarHead` or `FreeVarHead` whose name is
      *   the keyword's name.
      * - A `SubExpression`, `AppendStatement`, or `BlockStatement` is a keyword
      *   candidate if its head is a keyword candidate.
      *
      * The keyword infrastructure guarantees that:
      *
      * - If a node is not a keyword candidate, it is never passed to any keyword's
      *   `assert` method.
      * - If a node is not the `KeywordType` for a particular keyword, it will not
      *   be passed to the keyword's `assert` method.
      *
      * `Expr` keywords are used in expression positions and should return HIR
      * expressions. `Block` and `Append` keywords are used in statement
      * positions and should return HIR statements.
      *
      * A keyword definition has two parts:
      *
      * - `match`, which determines whether an AST node matches the keyword, and can
      *   optionally return some information extracted from the AST node.
      * - `translate`, which takes a matching AST node as well as the extracted
      *   information and returns an appropriate HIR instruction.
      *
      * # Example
      *
      * This keyword:
      *
      * - turns `(hello)` into `"hello"`
      *   - as long as `hello` is not in scope
      * - makes it an error to pass any arguments (such as `(hello world)`)
      *
      * ```ts
      * keywords('SubExpr').kw('hello', {
      *   assert(node: ExprKeywordNode): Result<void> | false {
      *     // we don't want to transform `hello` as a `PathExpression`
      *     if (node.type !== 'SubExpression') {
      *       return false;
      *     }
      *
      *     // node.head would be `LocalVarHead` if `hello` was in scope
      *     if (node.head.type !== 'FreeVarHead') {
      *       return false;
      *     }
      *
      *     if (node.params.length || node.hash) {
      *       return Err(generateSyntaxError(`(hello) does not take any arguments`), node.loc);
      *     } else {
      *       return Ok();
      *     }
      *   },
      *
      *   translate(node: ASTv2.SubExpression): hir.Expression {
      *     return ASTv2.builders.literal("hello", node.loc)
      *   }
      * })
      * ```
      *
      * The keyword infrastructure checks to make sure that the node is the right
      * type before calling `assert`, so you only need to consider `SubExpression`
      * and `PathExpression` here. It also checks to make sure that the node passed
      * to `assert` has the keyword name in the right place.
      *
      * Note the important difference between returning `false` from `assert`,
      * which just means that the node didn't match, and returning `Err`, which
      * means that the node matched, but there was a keyword-specific syntax
      * error.
      */(name, validTypes)}\n\nError caused by`, node.loc));
    }
    return null;
  }
}
const typesToReadableName = {
  Append: "an append statement",
  Block: "a block statement",
  Call: "a call expression",
  Modifier: "a modifier"
};
function keywords(type) {
  return new Keywords(type);
}
function toAppend({
  assert: assert,
  translate: translate
}) {
  return {
    assert: assert,
    translate: ({
      node: node,
      state: state
    }, value) => translate({
      node: node,
      state: state
    }, value).mapOk(text => new AppendTextNode({
      text: text,
      loc: node.loc
    }))
  };
}
const CurriedTypeToReadableType = {
  [CURRIED_COMPONENT]: "component",
  [CURRIED_HELPER]: "helper",
  [CURRIED_MODIFIER]: "modifier"
};
function assertCurryKeyword(curriedType) {
  return (node, state) => {
    let readableType = CurriedTypeToReadableType[curriedType],
      stringsAllowed = 0 === curriedType,
      {
        args: args
      } = node,
      definition = args.nth(0);
    if (null === definition) return Err(generateSyntaxError(`(${readableType}) requires a ${readableType} definition or identifier as its first positional parameter, did not receive any parameters.`, args.loc));
    if ("Literal" === definition.type) {
      if (stringsAllowed && state.isStrict) return Err(generateSyntaxError(`(${readableType}) cannot resolve string values in strict mode templates`, node.loc));
      if (!stringsAllowed) return Err(generateSyntaxError(`(${readableType}) cannot resolve string values, you must pass a ${readableType} definition directly`, node.loc));
    }
    return args = new api.Args({
      positional: new api.PositionalArguments({
        exprs: args.positional.exprs.slice(1),
        loc: args.positional.loc
      }),
      named: args.named,
      loc: args.loc
    }), Ok({
      definition: definition,
      args: args
    });
  };
}
function translateCurryKeyword(curriedType) {
  return ({
    node: node,
    state: state
  }, {
    definition: definition,
    args: args
  }) => {
    let definitionResult = VISIT_EXPRS.visit(definition, state),
      argsResult = VISIT_EXPRS.Args(args, state);
    return Result.all(definitionResult, argsResult).mapOk(([definition, args]) => new Curry({
      loc: node.loc,
      curriedType: curriedType,
      definition: definition,
      args: args
    }));
  };
}
function curryKeyword(curriedType) {
  return {
    assert: assertCurryKeyword(curriedType),
    translate: translateCurryKeyword(curriedType)
  };
}
const getDynamicVarKeyword = {
  assert: function (node) {
    let call = "AppendContent" === node.type ? node.value : node,
      named = "Call" === call.type ? call.args.named : null,
      positionals = "Call" === call.type ? call.args.positional : null;
    if (named && !named.isEmpty()) return Err(generateSyntaxError("(-get-dynamic-vars) does not take any named arguments", node.loc));
    let varName = positionals?.nth(0);
    return varName ? positionals && positionals.size > 1 ? Err(generateSyntaxError("(-get-dynamic-vars) only receives one positional arg", node.loc)) : Ok(varName) : Err(generateSyntaxError("(-get-dynamic-vars) requires a var name to get", node.loc));
  },
  translate: function ({
    node: node,
    state: state
  }, name) {
    return VISIT_EXPRS.visit(name, state).mapOk(name => new GetDynamicVar({
      name: name,
      loc: node.loc
    }));
  }
};
function assertHasBlockKeyword(type) {
  return node => {
    let call = "AppendContent" === node.type ? node.value : node,
      named = "Call" === call.type ? call.args.named : null,
      positionals = "Call" === call.type ? call.args.positional : null;
    if (named && !named.isEmpty()) return Err(generateSyntaxError(`(${type}) does not take any named arguments`, call.loc));
    if (!positionals || positionals.isEmpty()) return Ok(SourceSlice.synthetic("default"));
    if (1 === positionals.exprs.length) {
      let positional = positionals.exprs[0];
      return api.isLiteral(positional, "string") ? Ok(positional.toSlice()) : Err(generateSyntaxError(`(${type}) can only receive a string literal as its first argument`, call.loc));
    }
    return Err(generateSyntaxError(`(${type}) only takes a single positional argument`, call.loc));
  };
}
function translateHasBlockKeyword(type) {
  return ({
    node: node,
    state: {
      scope: scope
    }
  }, target) => Ok("has-block" === type ? new HasBlock({
    loc: node.loc,
    target: target,
    symbol: scope.allocateBlock(target.chars)
  }) : new HasBlockParams({
    loc: node.loc,
    target: target,
    symbol: scope.allocateBlock(target.chars)
  }));
}
function hasBlockKeyword(type) {
  return {
    assert: assertHasBlockKeyword(type),
    translate: translateHasBlockKeyword(type)
  };
}
function assertIfUnlessInlineKeyword(type) {
  return originalNode => {
    let inverted = "unless" === type,
      node = "AppendContent" === originalNode.type ? originalNode.value : originalNode,
      named = "Call" === node.type ? node.args.named : null,
      positional = "Call" === node.type ? node.args.positional : null;
    if (named && !named.isEmpty()) return Err(generateSyntaxError(`(${type}) cannot receive named parameters, received ${named.entries.map(e => e.name.chars).join(", ")}`, originalNode.loc));
    let condition = positional?.nth(0);
    if (!positional || !condition) return Err(generateSyntaxError(`When used inline, (${type}) requires at least two parameters 1. the condition that determines the state of the (${type}), and 2. the value to return if the condition is ${inverted ? "false" : "true"}. Did not receive any parameters`, originalNode.loc));
    let truthy = positional.nth(1),
      falsy = positional.nth(2);
    return null === truthy ? Err(generateSyntaxError(`When used inline, (${type}) requires at least two parameters 1. the condition that determines the state of the (${type}), and 2. the value to return if the condition is ${inverted ? "false" : "true"}. Received only one parameter, the condition`, originalNode.loc)) : positional.size > 3 ? Err(generateSyntaxError(`When used inline, (${type}) can receive a maximum of three positional parameters 1. the condition that determines the state of the (${type}), 2. the value to return if the condition is ${inverted ? "false" : "true"}, and 3. the value to return if the condition is ${inverted ? "true" : "false"}. Received ${positional.size} parameters`, originalNode.loc)) : Ok({
      condition: condition,
      truthy: truthy,
      falsy: falsy
    });
  };
}
function translateIfUnlessInlineKeyword(type) {
  let inverted = "unless" === type;
  return ({
    node: node,
    state: state
  }, {
    condition: condition,
    truthy: truthy,
    falsy: falsy
  }) => {
    let conditionResult = VISIT_EXPRS.visit(condition, state),
      truthyResult = VISIT_EXPRS.visit(truthy, state),
      falsyResult = falsy ? VISIT_EXPRS.visit(falsy, state) : Ok(null);
    return Result.all(conditionResult, truthyResult, falsyResult).mapOk(([condition, truthy, falsy]) => (inverted && (condition = new Not({
      value: condition,
      loc: node.loc
    })), new IfInline({
      loc: node.loc,
      condition: condition,
      truthy: truthy,
      falsy: falsy
    })));
  };
}
function ifUnlessInlineKeyword(type) {
  return {
    assert: assertIfUnlessInlineKeyword(type),
    translate: translateIfUnlessInlineKeyword(type)
  };
}
const logKeyword = {
    assert: function (node) {
      let {
        args: {
          named: named,
          positional: positional
        }
      } = node;
      return named.isEmpty() ? Ok(positional) : Err(generateSyntaxError("(log) does not take any named arguments", node.loc));
    },
    translate: function ({
      node: node,
      state: state
    }, positional) {
      return VISIT_EXPRS.Positional(positional, state).mapOk(positional => new Log({
        positional: positional,
        loc: node.loc
      }));
    }
  },
  APPEND_KEYWORDS = keywords("Append").kw("has-block", toAppend(hasBlockKeyword("has-block"))).kw("has-block-params", toAppend(hasBlockKeyword("has-block-params"))).kw("-get-dynamic-var", toAppend(getDynamicVarKeyword)).kw("log", toAppend(logKeyword)).kw("if", toAppend(ifUnlessInlineKeyword("if"))).kw("unless", toAppend(ifUnlessInlineKeyword("unless"))).kw("yield", {
    assert(node) {
      let {
        args: args
      } = node;
      if (args.named.isEmpty()) return Ok({
        target: api$1.SourceSpan.synthetic("default").toSlice(),
        positional: args.positional
      });
      {
        let target = args.named.get("to");
        return args.named.size > 1 || null === target ? Err(generateSyntaxError("yield only takes a single named argument: 'to'", args.named.loc)) : api.isLiteral(target, "string") ? Ok({
          target: target.toSlice(),
          positional: args.positional
        }) : Err(generateSyntaxError("you can only yield to a literal string value", target.loc));
      }
    },
    translate: ({
      node: node,
      state: state
    }, {
      target: target,
      positional: positional
    }) => VISIT_EXPRS.Positional(positional, state).mapOk(positional => new Yield({
      loc: node.loc,
      target: target,
      to: state.scope.allocateBlock(target.chars),
      positional: positional
    }))
  }).kw("debugger", {
    assert(node) {
      let {
          args: args
        } = node,
        {
          positional: positional
        } = args;
      return args.isEmpty() ? Ok(void 0) : positional.isEmpty() ? Err(generateSyntaxError("debugger does not take any named arguments", node.loc)) : Err(generateSyntaxError("debugger does not take any positional arguments", node.loc));
    },
    translate: ({
      node: node,
      state: {
        scope: scope
      }
    }) => Ok(new Debugger({
      loc: node.loc,
      scope: scope
    }))
  }).kw("component", {
    assert: assertCurryKeyword(0),
    translate({
      node: node,
      state: state
    }, {
      definition: definition,
      args: args
    }) {
      let definitionResult = VISIT_EXPRS.visit(definition, state),
        argsResult = VISIT_EXPRS.Args(args, state);
      return Result.all(definitionResult, argsResult).mapOk(([definition, args]) => new InvokeComponent({
        loc: node.loc,
        definition: definition,
        args: args,
        blocks: null
      }));
    }
  }).kw("helper", {
    assert: assertCurryKeyword(1),
    translate({
      node: node,
      state: state
    }, {
      definition: definition,
      args: args
    }) {
      let definitionResult = VISIT_EXPRS.visit(definition, state),
        argsResult = VISIT_EXPRS.Args(args, state);
      return Result.all(definitionResult, argsResult).mapOk(([definition, args]) => {
        let text = new CallExpression({
          callee: definition,
          args: args,
          loc: node.loc
        });
        return new AppendTextNode({
          loc: node.loc,
          text: text
        });
      });
    }
  }),
  BLOCK_KEYWORDS = keywords("Block").kw("in-element", {
    assert(node) {
      let {
          args: args
        } = node,
        guid = args.get("guid");
      if (guid) return Err(generateSyntaxError("Cannot pass `guid` to `{{#in-element}}`", guid.loc));
      let insertBefore = args.get("insertBefore"),
        destination = args.nth(0);
      return null === destination ? Err(generateSyntaxError("{{#in-element}} requires a target element as its first positional parameter", args.loc)) : Ok({
        insertBefore: insertBefore,
        destination: destination
      });
      // TODO Better syntax checks
    },
    translate({
      node: node,
      state: state
    }, {
      insertBefore: insertBefore,
      destination: destination
    }) {
      let named = node.blocks.get("default"),
        body = VISIT_STMTS.NamedBlock(named, state),
        destinationResult = VISIT_EXPRS.visit(destination, state);
      return Result.all(body, destinationResult).andThen(([body, destination]) => insertBefore ? VISIT_EXPRS.visit(insertBefore, state).mapOk(insertBefore => ({
        body: body,
        destination: destination,
        insertBefore: insertBefore
      })) : Ok({
        body: body,
        destination: destination,
        insertBefore: new Missing({
          loc: node.callee.loc.collapse("end")
        })
      })).mapOk(({
        body: body,
        destination: destination,
        insertBefore: insertBefore
      }) => new InElement({
        loc: node.loc,
        block: body,
        insertBefore: insertBefore,
        guid: state.generateUniqueCursor(),
        destination: destination
      }));
    }
  }).kw("if", {
    assert(node) {
      let {
        args: args
      } = node;
      if (!args.named.isEmpty()) return Err(generateSyntaxError(`{{#if}} cannot receive named parameters, received ${args.named.entries.map(e => e.name.chars).join(", ")}`, node.loc));
      if (args.positional.size > 1) return Err(generateSyntaxError(`{{#if}} can only receive one positional parameter in block form, the conditional value. Received ${args.positional.size} parameters`, node.loc));
      let condition = args.nth(0);
      return null === condition ? Err(generateSyntaxError("{{#if}} requires a condition as its first positional parameter, did not receive any parameters", node.loc)) : Ok({
        condition: condition
      });
    },
    translate({
      node: node,
      state: state
    }, {
      condition: condition
    }) {
      let block = node.blocks.get("default"),
        inverse = node.blocks.get("else"),
        conditionResult = VISIT_EXPRS.visit(condition, state),
        blockResult = VISIT_STMTS.NamedBlock(block, state),
        inverseResult = inverse ? VISIT_STMTS.NamedBlock(inverse, state) : Ok(null);
      return Result.all(conditionResult, blockResult, inverseResult).mapOk(([condition, block, inverse]) => new If({
        loc: node.loc,
        condition: condition,
        block: block,
        inverse: inverse
      }));
    }
  }).kw("unless", {
    assert(node) {
      let {
        args: args
      } = node;
      if (!args.named.isEmpty()) return Err(generateSyntaxError(`{{#unless}} cannot receive named parameters, received ${args.named.entries.map(e => e.name.chars).join(", ")}`, node.loc));
      if (args.positional.size > 1) return Err(generateSyntaxError(`{{#unless}} can only receive one positional parameter in block form, the conditional value. Received ${args.positional.size} parameters`, node.loc));
      let condition = args.nth(0);
      return null === condition ? Err(generateSyntaxError("{{#unless}} requires a condition as its first positional parameter, did not receive any parameters", node.loc)) : Ok({
        condition: condition
      });
    },
    translate({
      node: node,
      state: state
    }, {
      condition: condition
    }) {
      let block = node.blocks.get("default"),
        inverse = node.blocks.get("else"),
        conditionResult = VISIT_EXPRS.visit(condition, state),
        blockResult = VISIT_STMTS.NamedBlock(block, state),
        inverseResult = inverse ? VISIT_STMTS.NamedBlock(inverse, state) : Ok(null);
      return Result.all(conditionResult, blockResult, inverseResult).mapOk(([condition, block, inverse]) => new If({
        loc: node.loc,
        condition: new Not({
          value: condition,
          loc: node.loc
        }),
        block: block,
        inverse: inverse
      }));
    }
  }).kw("each", {
    assert(node) {
      let {
        args: args
      } = node;
      if (!args.named.entries.every(e => "key" === e.name.chars)) return Err(generateSyntaxError(`{{#each}} can only receive the 'key' named parameter, received ${args.named.entries.filter(e => "key" !== e.name.chars).map(e => e.name.chars).join(", ")}`, args.named.loc));
      if (args.positional.size > 1) return Err(generateSyntaxError(`{{#each}} can only receive one positional parameter, the collection being iterated. Received ${args.positional.size} parameters`, args.positional.loc));
      let value = args.nth(0),
        key = args.get("key");
      return null === value ? Err(generateSyntaxError("{{#each}} requires an iterable value to be passed as its first positional parameter, did not receive any parameters", args.loc)) : Ok({
        value: value,
        key: key
      });
    },
    translate({
      node: node,
      state: state
    }, {
      value: value,
      key: key
    }) {
      let block = node.blocks.get("default"),
        inverse = node.blocks.get("else"),
        valueResult = VISIT_EXPRS.visit(value, state),
        keyResult = key ? VISIT_EXPRS.visit(key, state) : Ok(null),
        blockResult = VISIT_STMTS.NamedBlock(block, state),
        inverseResult = inverse ? VISIT_STMTS.NamedBlock(inverse, state) : Ok(null);
      return Result.all(valueResult, keyResult, blockResult, inverseResult).mapOk(([value, key, block, inverse]) => new Each({
        loc: node.loc,
        value: value,
        key: key,
        block: block,
        inverse: inverse
      }));
    }
  }).kw("let", {
    assert(node) {
      let {
        args: args
      } = node;
      return args.named.isEmpty() ? 0 === args.positional.size ? Err(generateSyntaxError("{{#let}} requires at least one value as its first positional parameter, did not receive any parameters", args.positional.loc)) : node.blocks.get("else") ? Err(generateSyntaxError("{{#let}} cannot receive an {{else}} block", args.positional.loc)) : Ok({
        positional: args.positional
      }) : Err(generateSyntaxError(`{{#let}} cannot receive named parameters, received ${args.named.entries.map(e => e.name.chars).join(", ")}`, args.named.loc));
    },
    translate({
      node: node,
      state: state
    }, {
      positional: positional
    }) {
      let block = node.blocks.get("default"),
        positionalResult = VISIT_EXPRS.Positional(positional, state),
        blockResult = VISIT_STMTS.NamedBlock(block, state);
      return Result.all(positionalResult, blockResult).mapOk(([positional, block]) => new Let({
        loc: node.loc,
        positional: positional,
        block: block
      }));
    }
  }).kw("-with-dynamic-vars", {
    assert: node => Ok({
      named: node.args.named
    }),
    translate({
      node: node,
      state: state
    }, {
      named: named
    }) {
      let block = node.blocks.get("default"),
        namedResult = VISIT_EXPRS.NamedArguments(named, state),
        blockResult = VISIT_STMTS.NamedBlock(block, state);
      return Result.all(namedResult, blockResult).mapOk(([named, block]) => new WithDynamicVars({
        loc: node.loc,
        named: named,
        block: block
      }));
    }
  }).kw("component", {
    assert: assertCurryKeyword(0),
    translate({
      node: node,
      state: state
    }, {
      definition: definition,
      args: args
    }) {
      let definitionResult = VISIT_EXPRS.visit(definition, state),
        argsResult = VISIT_EXPRS.Args(args, state),
        blocksResult = VISIT_STMTS.NamedBlocks(node.blocks, state);
      return Result.all(definitionResult, argsResult, blocksResult).mapOk(([definition, args, blocks]) => new InvokeComponent({
        loc: node.loc,
        definition: definition,
        args: args,
        blocks: blocks
      }));
    }
  }),
  CALL_KEYWORDS = keywords("Call").kw("has-block", hasBlockKeyword("has-block")).kw("has-block-params", hasBlockKeyword("has-block-params")).kw("-get-dynamic-var", getDynamicVarKeyword).kw("log", logKeyword).kw("if", ifUnlessInlineKeyword("if")).kw("unless", ifUnlessInlineKeyword("unless")).kw("component", curryKeyword(0)).kw("helper", curryKeyword(1)).kw("modifier", curryKeyword(2)),
  MODIFIER_KEYWORDS = keywords("Modifier"),
  XLINK = "http://www.w3.org/1999/xlink",
  XML = "http://www.w3.org/XML/1998/namespace",
  XMLNS = "http://www.w3.org/2000/xmlns/",
  WHITELIST = {
    "xlink:actuate": XLINK,
    "xlink:arcrole": XLINK,
    "xlink:href": XLINK,
    "xlink:role": XLINK,
    "xlink:show": XLINK,
    "xlink:title": XLINK,
    "xlink:type": XLINK,
    "xml:base": XML,
    "xml:lang": XML,
    "xml:space": XML,
    xmlns: XMLNS,
    "xmlns:xlink": XMLNS
  },
  DEFLATE_TAG_TABLE = {
    div: WellKnownTagNames.div,
    span: WellKnownTagNames.span,
    p: WellKnownTagNames.p,
    a: WellKnownTagNames.a
  };
const DEFLATE_ATTR_TABLE = {
    class: WellKnownAttrNames.class,
    id: WellKnownAttrNames.id,
    value: WellKnownAttrNames.value,
    name: WellKnownAttrNames.name,
    type: WellKnownAttrNames.type,
    style: WellKnownAttrNames.style,
    href: WellKnownAttrNames.href
  };
function deflateAttrName(attrName) {
  return DEFLATE_ATTR_TABLE[attrName] ?? attrName;
}
class ClassifiedElement {
  constructor(element, delegate, state) {
    this.element = element, this.state = state, this.delegate = delegate;
  }
  toStatement() {
    return this.prepare().andThen(prepared => this.delegate.toStatement(this, prepared));
  }
  attr(attr) {
    let name = attr.name,
      rawValue = attr.value,
      namespace = (attrName = name.chars, WHITELIST[attrName] || void 0);
    var attrName;
    return api.isLiteral(rawValue, "string") ? Ok(new StaticAttr({
      loc: attr.loc,
      name: name,
      value: rawValue.toSlice(),
      namespace: namespace,
      kind: {
        component: this.delegate.dynamicFeatures
      }
    })) : VISIT_EXPRS.visit(convertPathToCallIfKeyword(rawValue), this.state).mapOk(value => {
      let isTrusting = attr.trusting;
      return new DynamicAttr({
        loc: attr.loc,
        name: name,
        value: value,
        namespace: namespace,
        kind: {
          trusting: isTrusting,
          component: this.delegate.dynamicFeatures
        }
      });
    });
  }
  modifier(modifier) {
    let translated = MODIFIER_KEYWORDS.translate(modifier, this.state);
    if (null !== translated) return translated;
    let head = VISIT_EXPRS.visit(modifier.callee, this.state),
      args = VISIT_EXPRS.Args(modifier.args, this.state);
    return Result.all(head, args).mapOk(([head, args]) => new Modifier({
      loc: modifier.loc,
      callee: head,
      args: args
    }));
  }
  attrs() {
    let attrs = new ResultArray(),
      args = new ResultArray(),
      typeAttr = null,
      simple = 0 === this.element.attrs.filter(attr => "SplatAttr" === attr.type).length;
    for (let attr of this.element.attrs) "SplatAttr" === attr.type ? attrs.add(Ok(new SplatAttr({
      loc: attr.loc,
      symbol: this.state.scope.allocateBlock("attrs")
    }))) : "type" === attr.name.chars && simple ? typeAttr = attr : attrs.add(this.attr(attr));
    for (let arg of this.element.componentArgs) args.add(this.delegate.arg(arg, this));
    return typeAttr && attrs.add(this.attr(typeAttr)), Result.all(args.toArray(), attrs.toArray()).mapOk(([args, attrs]) => ({
      attrs: attrs,
      args: new NamedArguments({
        loc: maybeLoc(args, api$1.SourceSpan.NON_EXISTENT),
        entries: OptionalList(args)
      })
    }));
  }
  prepare() {
    let attrs = this.attrs(),
      modifiers = new ResultArray(this.element.modifiers.map(m => this.modifier(m))).toArray();
    return Result.all(attrs, modifiers).mapOk(([result, modifiers]) => {
      let {
          attrs: attrs,
          args: args
        } = result,
        elementParams = [...attrs, ...modifiers];
      return {
        args: args,
        params: new ElementParameters({
          loc: maybeLoc(elementParams, api$1.SourceSpan.NON_EXISTENT),
          body: OptionalList(elementParams)
        })
      };
    });
  }
}
class ClassifiedComponent {
  constructor(tag, element) {
    this.tag = tag, this.element = element, this.dynamicFeatures = true;
  }
  arg(attr, {
    state: state
  }) {
    let name = attr.name;
    return VISIT_EXPRS.visit(convertPathToCallIfKeyword(attr.value), state).mapOk(value => new NamedArgument({
      loc: attr.loc,
      key: name,
      value: value
    }));
  }
  toStatement(component, {
    args: args,
    params: params
  }) {
    let {
      element: element,
      state: state
    } = component;
    return this.blocks(state).mapOk(blocks => new Component({
      loc: element.loc,
      tag: this.tag,
      params: params,
      args: args,
      blocks: blocks
    }));
  }
  blocks(state) {
    return VISIT_STMTS.NamedBlocks(this.element.blocks, state);
  }
}
class ClassifiedSimpleElement {
  constructor(tag, element, dynamicFeatures) {
    this.tag = tag, this.element = element, this.dynamicFeatures = dynamicFeatures, this.isComponent = false;
  }
  arg(attr) {
    return Err(generateSyntaxError(`${attr.name.chars} is not a valid attribute name. @arguments are only allowed on components, but the tag for this element (\`${this.tag.chars}\`) is a regular, non-component HTML element.`, attr.loc));
  }
  toStatement(classified, {
    params: params
  }) {
    let {
      state: state,
      element: element
    } = classified;
    return VISIT_STMTS.visitList(this.element.body, state).mapOk(body => new SimpleElement({
      loc: element.loc,
      tag: this.tag,
      params: params,
      body: body.toArray(),
      dynamicFeatures: this.dynamicFeatures
    }));
  }
}
const VISIT_STMTS = new class {
  visitList(nodes, state) {
    return new ResultArray(nodes.map(e => VISIT_STMTS.visit(e, state))).toOptionalList().mapOk(list => list.filter(s => null !== s));
  }
  visit(node, state) {
    switch (node.type) {
      case "GlimmerComment":
        return Ok(null);
      case "AppendContent":
        return this.AppendContent(node, state);
      case "HtmlText":
        return Ok(this.TextNode(node));
      case "HtmlComment":
        return Ok(this.HtmlComment(node));
      case "InvokeBlock":
        return this.InvokeBlock(node, state);
      case "InvokeComponent":
        return this.Component(node, state);
      case "SimpleElement":
        return this.SimpleElement(node, state);
    }
  }
  InvokeBlock(node, state) {
    let translated = BLOCK_KEYWORDS.translate(node, state);
    if (null !== translated) return translated;
    let head = VISIT_EXPRS.visit(node.callee, state),
      args = VISIT_EXPRS.Args(node.args, state);
    return Result.all(head, args).andThen(([head, args]) => this.NamedBlocks(node.blocks, state).mapOk(blocks => new InvokeBlock({
      loc: node.loc,
      head: head,
      args: args,
      blocks: blocks
    })));
  }
  NamedBlocks(blocks, state) {
    return new ResultArray(blocks.blocks.map(b => this.NamedBlock(b, state))).toArray().mapOk(list => new NamedBlocks({
      loc: blocks.loc,
      blocks: OptionalList(list)
    }));
  }
  NamedBlock(named, state) {
    return state.visitBlock(named.block).mapOk(body => new NamedBlock({
      loc: named.loc,
      name: named.name,
      body: body.toArray(),
      scope: named.block.scope
    }));
  }
  SimpleElement(element, state) {
    return new ClassifiedElement(element, new ClassifiedSimpleElement(element.tag, element, function ({
      attrs: attrs,
      modifiers: modifiers
    }) {
      // ElementModifier needs the special ComponentOperations
      return modifiers.length > 0 || !!attrs.filter(attr => "SplatAttr" === attr.type)[0];
      // Splattributes need the special ComponentOperations to merge into
    }(element)), state).toStatement();
  }
  Component(component, state) {
    return VISIT_EXPRS.visit(component.callee, state).andThen(callee => new ClassifiedElement(component, new ClassifiedComponent(callee, component), state).toStatement());
  }
  AppendContent(append, state) {
    let translated = APPEND_KEYWORDS.translate(append, state);
    return null !== translated ? translated : VISIT_EXPRS.visit(append.value, state).mapOk(value => append.trusting ? new AppendTrustedHTML({
      loc: append.loc,
      html: value
    }) : new AppendTextNode({
      loc: append.loc,
      text: value
    }));
  }
  TextNode(text) {
    return new AppendTextNode({
      loc: text.loc,
      text: new api.LiteralExpression({
        loc: text.loc,
        value: text.chars
      })
    });
  }
  HtmlComment(comment) {
    return new AppendComment({
      loc: comment.loc,
      value: comment.text
    });
  }
}();

/**
 * This is the mutable state for this compiler pass.
 */
class NormalizationState {
  constructor(block, isStrict) {
    this.isStrict = isStrict, this._cursorCount = 0, this._currentScope = block;
  }
  generateUniqueCursor() {
    return `%cursor:${this._cursorCount++}%`;
  }
  get scope() {
    return this._currentScope;
  }
  visitBlock(block) {
    let oldBlock = this._currentScope;
    this._currentScope = block.scope;
    try {
      return VISIT_STMTS.visitList(block.body, this);
    } finally {
      this._currentScope = oldBlock;
    }
  }
}

/// ResolutionType ///
class StrictModeValidationPass {
  // This is done at the end of all the keyword normalizations
  // At this point any free variables that isn't a valid keyword
  // in its context should be considered a syntax error. We
  // probably had various opportunities to do this inline in the
  // earlier passes, but this aims to produce a better syntax
  // error as we don't always have the right loc-context to do
  // so in the other spots.
  static validate(template) {
    return new this(template).validate();
  }
  constructor(template) {
    this.template = template;
  }
  validate() {
    return this.Statements(this.template.body).mapOk(() => this.template);
  }
  Statements(statements) {
    let result = Ok(null);
    for (let statement of statements) result = result.andThen(() => this.Statement(statement));
    return result;
  }
  NamedBlocks({
    blocks: blocks
  }) {
    let result = Ok(null);
    for (let block of blocks.toArray()) result = result.andThen(() => this.NamedBlock(block));
    return result;
  }
  NamedBlock(block) {
    return this.Statements(block.body);
  }
  Statement(statement) {
    switch (statement.type) {
      case "InElement":
        return this.InElement(statement);
      case "Debugger":
      case "AppendComment":
        return Ok(null);
      case "Yield":
        return this.Yield(statement);
      case "AppendTrustedHTML":
        return this.AppendTrustedHTML(statement);
      case "AppendTextNode":
        return this.AppendTextNode(statement);
      case "Component":
        return this.Component(statement);
      case "SimpleElement":
        return this.SimpleElement(statement);
      case "InvokeBlock":
        return this.InvokeBlock(statement);
      case "If":
        return this.If(statement);
      case "Each":
        return this.Each(statement);
      case "Let":
        return this.Let(statement);
      case "WithDynamicVars":
        return this.WithDynamicVars(statement);
      case "InvokeComponent":
        return this.InvokeComponent(statement);
    }
  }
  Expressions(expressions) {
    let result = Ok(null);
    for (let expression of expressions) result = result.andThen(() => this.Expression(expression));
    return result;
  }
  Expression(expression, span = expression, resolution) {
    switch (expression.type) {
      case "Literal":
      case "Keyword":
      case "Missing":
      case "This":
      case "Arg":
      case "Local":
      case "HasBlock":
      case "HasBlockParams":
      case "GetDynamicVar":
        return Ok(null);
      case "PathExpression":
        return this.Expression(expression.head, span, resolution);
      case "Free":
        return this.errorFor(expression.name, span, resolution);
      case "InterpolateExpression":
        return this.InterpolateExpression(expression, span, resolution);
      case "CallExpression":
        return this.CallExpression(expression, span, resolution ?? "helper");
      case "Not":
        return this.Expression(expression.value, span, resolution);
      case "IfInline":
        return this.IfInline(expression);
      case "Curry":
        return this.Curry(expression);
      case "Log":
        return this.Log(expression);
    }
  }
  Args(args) {
    return this.Positional(args.positional).andThen(() => this.NamedArguments(args.named));
  }
  Positional(positional, span) {
    let result = Ok(null),
      expressions = positional.list.toArray();
    // For cases like {{yield foo}}, when there is only a single argument, it
    // makes for a slightly better error to report that entire span. However,
    // when there are more than one, we need to be specific.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme PresentArray
    return result = 1 === expressions.length ? this.Expression(expressions[0], span) : this.Expressions(expressions), result;
  }
  NamedArguments({
    entries: entries
  }) {
    let result = Ok(null);
    for (let arg of entries.toArray()) result = result.andThen(() => this.NamedArgument(arg));
    return result;
  }
  NamedArgument(arg) {
    return "CallExpression" === arg.value.type ? this.Expression(arg.value, arg, "helper") : this.Expression(arg.value, arg);
  }
  ElementParameters({
    body: body
  }) {
    let result = Ok(null);
    for (let param of body.toArray()) result = result.andThen(() => this.ElementParameter(param));
    return result;
  }
  ElementParameter(param) {
    switch (param.type) {
      case "StaticAttr":
      case "SplatAttr":
        return Ok(null);
      case "DynamicAttr":
        return this.DynamicAttr(param);
      case "Modifier":
        return this.Modifier(param);
    }
  }
  DynamicAttr(attr) {
    return "CallExpression" === attr.value.type ? this.Expression(attr.value, attr, "helper") : this.Expression(attr.value, attr);
  }
  Modifier(modifier) {
    return this.Expression(modifier.callee, modifier, "modifier").andThen(() => this.Args(modifier.args));
  }
  InElement(inElement) {
    return this.Expression(inElement.destination).andThen(() => this.Expression(inElement.insertBefore)).andThen(() => this.NamedBlock(inElement.block));
  }
  Yield(statement) {
    return this.Positional(statement.positional, statement);
  }
  AppendTrustedHTML(statement) {
    return this.Expression(statement.html, statement);
  }
  AppendTextNode(statement) {
    return "CallExpression" === statement.text.type ? this.Expression(statement.text, statement, "component or helper") : this.Expression(statement.text, statement);
  }
  Component(statement) {
    return this.Expression(statement.tag, statement, "component").andThen(() => this.ElementParameters(statement.params)).andThen(() => this.NamedArguments(statement.args)).andThen(() => this.NamedBlocks(statement.blocks));
  }
  SimpleElement(statement) {
    return this.ElementParameters(statement.params).andThen(() => this.Statements(statement.body));
  }
  InvokeBlock(statement) {
    return this.Expression(statement.head, statement.head, "component").andThen(() => this.Args(statement.args)).andThen(() => this.NamedBlocks(statement.blocks));
  }
  If(statement) {
    return this.Expression(statement.condition, statement).andThen(() => this.NamedBlock(statement.block)).andThen(() => statement.inverse ? this.NamedBlock(statement.inverse) : Ok(null));
  }
  Each(statement) {
    return this.Expression(statement.value, statement).andThen(() => statement.key ? this.Expression(statement.key, statement) : Ok(null)).andThen(() => this.NamedBlock(statement.block)).andThen(() => statement.inverse ? this.NamedBlock(statement.inverse) : Ok(null));
  }
  Let(statement) {
    return this.Positional(statement.positional).andThen(() => this.NamedBlock(statement.block));
  }
  WithDynamicVars(statement) {
    return this.NamedArguments(statement.named).andThen(() => this.NamedBlock(statement.block));
  }
  InvokeComponent(statement) {
    return this.Expression(statement.definition, statement, "component").andThen(() => this.Args(statement.args)).andThen(() => statement.blocks ? this.NamedBlocks(statement.blocks) : Ok(null));
  }
  InterpolateExpression(expression, span, resolution) {
    let expressions = expression.parts.toArray();
    return 1 === expressions.length ? this.Expression(expressions[0], span, resolution) : this.Expressions(expressions);
  }
  CallExpression(expression, span, resolution) {
    return this.Expression(expression.callee, span, resolution).andThen(() => this.Args(expression.args));
  }
  IfInline(expression) {
    return this.Expression(expression.condition).andThen(() => this.Expression(expression.truthy)).andThen(() => expression.falsy ? this.Expression(expression.falsy) : Ok(null));
  }
  Curry(expression) {
    let resolution;
    return resolution = 0 === expression.curriedType ? "component" : 1 === expression.curriedType ? "helper" : "modifier", this.Expression(expression.definition, expression, resolution).andThen(() => this.Args(expression.args));
  }
  Log(expression) {
    return this.Positional(expression.positional, expression);
  }
  errorFor(name, span, type = "value") {
    return Err(generateSyntaxError(`Attempted to resolve a ${type} in a strict mode template, but that value was not in scope: ${name}`, loc(span)));
  }
}
const EXPR = new class {
  expr(expr) {
    switch (expr.type) {
      case "Missing":
        return;
      case "Literal":
        return this.Literal(expr);
      case "Keyword":
        return this.Keyword(expr);
      case "CallExpression":
        return this.CallExpression(expr);
      case "PathExpression":
        return this.PathExpression(expr);
      case "Arg":
        return [opcodes.GetSymbol, expr.symbol];
      case "Local":
        return this.Local(expr);
      case "This":
        return [opcodes.GetSymbol, 0];
      case "Free":
        return [expr.resolution.resolution(), expr.symbol];
      case "HasBlock":
        return this.HasBlock(expr);
      case "HasBlockParams":
        return this.HasBlockParams(expr);
      case "Curry":
        return this.Curry(expr);
      case "Not":
        return this.Not(expr);
      case "IfInline":
        return this.IfInline(expr);
      case "InterpolateExpression":
        return this.InterpolateExpression(expr);
      case "GetDynamicVar":
        return this.GetDynamicVar(expr);
      case "Log":
        return this.Log(expr);
    }
  }
  Literal({
    value: value
  }) {
    return void 0 === value ? [opcodes.Undefined] : value;
  }
  Missing() {}
  HasBlock({
    symbol: symbol
  }) {
    return [opcodes.HasBlock, [opcodes.GetSymbol, symbol]];
  }
  HasBlockParams({
    symbol: symbol
  }) {
    return [opcodes.HasBlockParams, [opcodes.GetSymbol, symbol]];
  }
  Curry({
    definition: definition,
    curriedType: curriedType,
    args: args
  }) {
    return [opcodes.Curry, EXPR.expr(definition), curriedType, EXPR.Positional(args.positional), EXPR.NamedArguments(args.named)];
  }
  Local({
    isTemplateLocal: isTemplateLocal,
    symbol: symbol
  }) {
    return [isTemplateLocal ? opcodes.GetLexicalSymbol : opcodes.GetSymbol, symbol];
  }
  Keyword({
    symbol: symbol
  }) {
    return [opcodes.GetStrictKeyword, symbol];
  }
  PathExpression({
    head: head,
    tail: tail
  }) {
    let getOp = EXPR.expr(head);
    return getOp[0], opcodes.GetStrictKeyword, [...getOp, EXPR.Tail(tail)];
  }
  InterpolateExpression({
    parts: parts
  }) {
    return [opcodes.Concat, parts.map(e => EXPR.expr(e)).toArray()];
  }
  CallExpression({
    callee: callee,
    args: args
  }) {
    return [opcodes.Call, EXPR.expr(callee), ...EXPR.Args(args)];
  }
  Tail({
    members: members
  }) {
    return mapPresentArray(members, member => member.chars);
  }
  Args({
    positional: positional,
    named: named
  }) {
    return [this.Positional(positional), this.NamedArguments(named)];
  }
  Positional({
    list: list
  }) {
    return list.map(l => EXPR.expr(l)).toPresentArray();
  }
  NamedArgument({
    key: key,
    value: value
  }) {
    return [key.chars, EXPR.expr(value)];
  }
  NamedArguments({
    entries: pairs
  }) {
    let list = pairs.toArray();
    if (isPresentArray(list)) {
      let names = [],
        values = [];
      for (let pair of list) {
        let [name, value] = EXPR.NamedArgument(pair);
        names.push(name), values.push(value);
      }
      return [names, values];
    }
    return null;
  }
  Not({
    value: value
  }) {
    return [opcodes.Not, EXPR.expr(value)];
  }
  IfInline({
    condition: condition,
    truthy: truthy,
    falsy: falsy
  }) {
    let expr = [opcodes.IfInline, EXPR.expr(condition), EXPR.expr(truthy)];
    return falsy && expr.push(EXPR.expr(falsy)), expr;
  }
  GetDynamicVar({
    name: name
  }) {
    return [opcodes.GetDynamicVar, EXPR.expr(name)];
  }
  Log({
    positional: positional
  }) {
    return [opcodes.Log, this.Positional(positional)];
  }
}();
class WireStatements {
  constructor(statements) {
    this.statements = statements;
  }
  toArray() {
    return this.statements;
  }
}
const CONTENT = new class {
  list(statements) {
    let out = [];
    for (let statement of statements) {
      let result = CONTENT.content(statement);
      result instanceof WireStatements ? out.push(...result.toArray()) : out.push(result);
    }
    return out;
  }
  content(stmt) {
    return this.visitContent(stmt);
  }
  visitContent(stmt) {
    switch (stmt.type) {
      case "Debugger":
        return [opcodes.Debugger, ...stmt.scope.getDebugInfo(), {}];
      case "AppendComment":
        return this.AppendComment(stmt);
      case "AppendTextNode":
        return this.AppendTextNode(stmt);
      case "AppendTrustedHTML":
        return this.AppendTrustedHTML(stmt);
      case "Yield":
        return this.Yield(stmt);
      case "Component":
        return this.Component(stmt);
      case "SimpleElement":
        return this.SimpleElement(stmt);
      case "InElement":
        return this.InElement(stmt);
      case "InvokeBlock":
        return this.InvokeBlock(stmt);
      case "If":
        return this.If(stmt);
      case "Each":
        return this.Each(stmt);
      case "Let":
        return this.Let(stmt);
      case "WithDynamicVars":
        return this.WithDynamicVars(stmt);
      case "InvokeComponent":
        return this.InvokeComponent(stmt);
      default:
        return;
    }
  }
  Yield({
    to: to,
    positional: positional
  }) {
    return [opcodes.Yield, to, EXPR.Positional(positional)];
  }
  InElement({
    guid: guid,
    insertBefore: insertBefore,
    destination: destination,
    block: block
  }) {
    let wireBlock = CONTENT.NamedBlock(block)[1],
      wireDestination = EXPR.expr(destination),
      wireInsertBefore = EXPR.expr(insertBefore);
    // let guid = args.guid;
    return void 0 === wireInsertBefore ? [opcodes.InElement, wireBlock, guid, wireDestination] : [opcodes.InElement, wireBlock, guid, wireDestination, wireInsertBefore];
  }
  InvokeBlock({
    head: head,
    args: args,
    blocks: blocks
  }) {
    return [opcodes.Block, EXPR.expr(head), ...EXPR.Args(args), CONTENT.NamedBlocks(blocks)];
  }
  AppendTrustedHTML({
    html: html
  }) {
    return [opcodes.TrustingAppend, EXPR.expr(html)];
  }
  AppendTextNode({
    text: text
  }) {
    return [opcodes.Append, EXPR.expr(text)];
  }
  AppendComment({
    value: value
  }) {
    return [opcodes.Comment, value.chars];
  }
  SimpleElement({
    tag: tag,
    params: params,
    body: body,
    dynamicFeatures: dynamicFeatures
  }) {
    let op = dynamicFeatures ? opcodes.OpenElementWithSplat : opcodes.OpenElement;
    return new WireStatements([[op, (tagName = tag.chars, DEFLATE_TAG_TABLE[tagName] ?? tagName)], ...CONTENT.ElementParameters(params).toArray(), [opcodes.FlushElement], ...CONTENT.list(body), [opcodes.CloseElement]]);
    var tagName;
  }
  Component({
    tag: tag,
    params: params,
    args: args,
    blocks: blocks
  }) {
    let wireTag = EXPR.expr(tag),
      wirePositional = CONTENT.ElementParameters(params),
      wireNamed = EXPR.NamedArguments(args),
      wireNamedBlocks = CONTENT.NamedBlocks(blocks);
    return [opcodes.Component, wireTag, wirePositional.toPresentArray(), wireNamed, wireNamedBlocks];
  }
  ElementParameters({
    body: body
  }) {
    return body.map(p => CONTENT.ElementParameter(p));
  }
  ElementParameter(param) {
    switch (param.type) {
      case "SplatAttr":
        return [opcodes.AttrSplat, param.symbol];
      case "DynamicAttr":
        return [(kind = param.kind, kind.component ? kind.trusting ? opcodes.TrustingComponentAttr : opcodes.ComponentAttr : kind.trusting ? opcodes.TrustingDynamicAttr : opcodes.DynamicAttr), ...dynamicAttr(param)];
      case "StaticAttr":
        return [staticAttrOp(param.kind), ...staticAttr(param)];
      case "Modifier":
        return [opcodes.Modifier, EXPR.expr(param.callee), ...EXPR.Args(param.args)];
    }
    var kind;
  }
  NamedBlocks({
    blocks: blocks
  }) {
    let names = [],
      serializedBlocks = [];
    for (let block of blocks.toArray()) {
      let [name, serializedBlock] = CONTENT.NamedBlock(block);
      names.push(name), serializedBlocks.push(serializedBlock);
    }
    return names.length > 0 ? [names, serializedBlocks] : null;
  }
  NamedBlock({
    name: name,
    body: body,
    scope: scope
  }) {
    let nameChars = name.chars;
    return "inverse" === nameChars && (nameChars = "else"), [nameChars, [CONTENT.list(body), scope.slots]];
  }
  If({
    condition: condition,
    block: block,
    inverse: inverse
  }) {
    return [opcodes.If, EXPR.expr(condition), CONTENT.NamedBlock(block)[1], inverse ? CONTENT.NamedBlock(inverse)[1] : null];
  }
  Each({
    value: value,
    key: key,
    block: block,
    inverse: inverse
  }) {
    return [opcodes.Each, EXPR.expr(value), key ? EXPR.expr(key) : null, CONTENT.NamedBlock(block)[1], inverse ? CONTENT.NamedBlock(inverse)[1] : null];
  }
  Let({
    positional: positional,
    block: block
  }) {
    return [opcodes.Let, EXPR.Positional(positional), CONTENT.NamedBlock(block)[1]];
  }
  WithDynamicVars({
    named: named,
    block: block
  }) {
    return [opcodes.WithDynamicVars, EXPR.NamedArguments(named), CONTENT.NamedBlock(block)[1]];
  }
  InvokeComponent({
    definition: definition,
    args: args,
    blocks: blocks
  }) {
    return [opcodes.InvokeComponent, EXPR.expr(definition), EXPR.Positional(args.positional), EXPR.NamedArguments(args.named), blocks ? CONTENT.NamedBlocks(blocks) : null];
  }
}();
function staticAttr({
  name: name,
  value: value,
  namespace: namespace
}) {
  let out = [deflateAttrName(name.chars), value.chars];
  return namespace && out.push(namespace), out;
}
function dynamicAttr({
  name: name,
  value: value,
  namespace: namespace
}) {
  let out = [deflateAttrName(name.chars), EXPR.expr(value)];
  return namespace && out.push(namespace), out;
}
function staticAttrOp(kind) {
  return kind.component ? opcodes.StaticComponentAttr : opcodes.StaticAttr;
}
const defaultId = (() => {
    const req = "object" == typeof module && "function" == typeof module.require ? module.require : globalThis.require;
    if (req) try {
      const crypto = req("crypto"),
        idFn = src => {
          const hash = crypto.createHash("sha1");
          // trim to 6 bytes of data (2^48 - 1)
          return hash.update(src, "utf8"), hash.digest("base64").substring(0, 8);
        };
      return idFn("test"), idFn;
    } catch {
      // do nothing
    }
    return function () {
      return null;
    };
  })(),
  defaultOptions = {
    id: defaultId
  };

/*
 * Compile a string into a template javascript string.
 *
 * Example usage:
 *     import { precompile } from '@glimmer/compiler';
 *     import { templateFactory } from 'glimmer-runtime';
 *     let templateJs = precompile("Howdy {{name}}");
 *     let factory = templateFactory(new Function("return " + templateJs)());
 *     let template = factory.create(env);
 *
 * @method precompile
 * @param {string} string a Glimmer template string
 * @return {string} a template javascript string
 */
function precompileJSON(string, options = defaultOptions) {
  const source = new api$1.Source(string ?? "", options.meta?.moduleName),
    [ast, locals] = normalize(source, {
      lexicalScope: () => false,
      ...options
    }),
    block = function (source, root, isStrict) {
      // create a new context for the normalization pass
      let state = new NormalizationState(root.table, isStrict),
        template = VISIT_STMTS.visitList(root.body, state).mapOk(body => new Template({
          loc: root.loc,
          scope: root.table,
          body: body.toArray()
        }));
      return isStrict && (template = template.andThen(template => StrictModeValidationPass.validate(template))), template;
    }(0, ast, options.strictMode ?? false).mapOk(pass2In => function (template) {
      let statements = CONTENT.list(template.body),
        scope = template.scope;
      return [statements, scope.symbols, scope.upvars];
    }(pass2In));
  if (block.isOk) return [block.value, locals];
  throw block.reason;
}

// UUID used as a unique placeholder for placing a snippet of JS code into
// the otherwise JSON stringified value below.
/*
 * Compile a string into a template javascript string.
 *
 * Example usage:
 *     import { precompile } from '@glimmer/compiler';
 *     import { templateFactory } from 'glimmer-runtime';
 *     let templateJs = precompile("Howdy {{name}}");
 *     let factory = templateFactory(new Function("return " + templateJs)());
 *     let template = factory.create(env);
 *
 * @method precompile
 * @param {string} string a Glimmer template string
 * @return {string} a template javascript string
 */
function precompile(source, options = defaultOptions) {
  const [block, usedLocals] = precompileJSON(source, options);
  "emit" in options && options.emit?.debugSymbols && usedLocals.length > 0 && block.push(usedLocals);
  const moduleName = options.meta?.moduleName,
    idFn = options.id || defaultId,
    blockJSON = JSON.stringify(block),
    templateJSONObject = {
      id: idFn(JSON.stringify(options.meta) + blockJSON),
      block: blockJSON,
      moduleName: moduleName ?? "(unknown template module)",
      // lying to the type checker here because we're going to
      // replace it just below, after stringification
      scope: "796d24e6-2450-4fb0-8cdf-b65638b5ef70",
      isStrictMode: options.strictMode ?? false
    };
  0 === usedLocals.length && delete templateJSONObject.scope;
  // JSON is javascript
  let stringified = JSON.stringify(templateJSONObject);
  if (usedLocals.length > 0) {
    const scopeFn = `()=>[${usedLocals.join(",")}]`;
    stringified = stringified.replace('"796d24e6-2450-4fb0-8cdf-b65638b5ef70"', scopeFn);
  }
  return stringified;
}

/**
 * All possible options passed to `template()` may specify a `moduleName`.
 */

/**
 * When using `template` in a class, you call it in a `static` block and pass
 * the class as the `component` option.
 *
 * ```ts
 * class MyComponent extends Component {
 *   static {
 *     template('{{this.greeting}}, {{@place}}!',
 *       { component: this },
 *       // explicit or implicit option goes here
 *     );
 *   }
 * }
 * ```
 *
 * For the full explicit form, see {@linkcode ExplicitClassOptions}. For the
 * full implicit form, see {@linkcode ImplicitClassOptions}.
 */

/**
 * When using `template` outside of a class (i.e. a "template-only component"), you can pass
 * a `scope` option that explicitly provides the lexical scope for the template.
 *
 * This is called the "explicit form".
 *
 * ```ts
 * const greeting = 'Hello';
 * const HelloWorld = template('{{greeting}} World!', { scope: () => ({ greeting }) });
 * ```
 */

/**
 * When using `template` *inside* a class (see
 * {@linkcode BaseClassTemplateOptions}), you can pass a `scope` option that
 * explicitly provides the lexical scope for the template, just like a template-only
 * component (see {@linkcode ExplicitTemplateOnlyOptions}).
 *
 * ```ts
 * class MyComponent extends Component {
 *   static {
 *     template('{{this.greeting}}, {{@place}}!',
 *       { component: this },
 *       // explicit or implicit option goes here
 *     );
 *   }
 * }
 * ```
 *
 * ## The Scope Function's `instance` Parameter
 *
 * However, the explicit `scope` function in a *class* also takes an `instance` option
 * that provides access to the component's instance.
 *
 * Once it's supported in Handlebars, this will make it possible to represent private
 * fields when using the explicit form.
 *
 * ```ts
 * class MyComponent extends Component {
 *   static {
 *     template('{{this.#greeting}}, {{@place}}!',
 *       { component: this },
 *       scope: (instance) => ({ '#greeting': instance.#greeting }),
 *     );
 *   }
 * }
 * ```
 */

/**
 * The *implicit* form of the `template` function takes an `eval` option that
 * allows the runtime compiler to evaluate local template variables without
 * needing to maintain an explicit list of the local variables used in the
 * template scope.
 *
 * The eval options *must* be passed in the following form:
 *
 * ```ts
 * {
 *   eval() { return eval(arguments[0]) }
 * }
 * ```
 *
 * ## Requirements of the `eval` Option
 *
 * **The syntactic form presented above is the only form you should use when
 * passing an `eval` option.**
 *
 * This is _required_ if you want your code to be compatible with the
 * compile-time implementation of `@ember/template-compiler`. While the runtime
 * compiler offers a tiny bit of additional wiggle room, you still need to follow
 * very strict rules.
 *
 * We don't recommend trying to memorize the rules. Instead, we recommend using
 * the snippet presented above and supported by the compile-time implementation.
 *
 * ### The Technical Requirements of the `eval` Option
 *
 * The `eval` function is passed a single parameter that is a JavaScript
 * identifier. This will be extended in the future to support private fields.
 *
 * Since keywords in JavaScript are contextual (e.g. `await` and `yield`), the
 * parameter might be a keyword. The `@ember/template-compiler/runtime` expects
 * the function to throw a `SyntaxError` if the identifier name is not valid in
 * the current scope. (The direct `eval` function takes care of this out of the
 * box.)
 *
 * Requirements:
 *
 * 1. The `eval` method must receive its parameter as `arguments[0]`, which
 *    ensures that the variable name passed to `eval()` is not shadowed by the
 *    function's parameter name.
 * 2. The `eval` option must be a function or concise method, and not an arrow.
 *    This is because arrows do not have their own `arguments`, which breaks
 *    (1).
 * 3. The `eval` method must call "*direct* `eval`", and not an alias of `eval`.
 *    Direct `eval` evaluates the code in the scope it was called from, while
 *    aliased versions of `eval` (including `new Function`) evaluate the code in
 *    the global scope.
 * 4. The `eval` method must return the result of calling "direct `eval`".
 *
 * The easiest way to achieve these requirements is to use the exact syntax
 * presented above. This is *also* the only way to be compatible
 *
 * ## Rationale
 *
 * This is useful for two reasons:
 *
 * 1. This form is a useful _intermediate_ form for the compile-time toolchain.
 *    It allows the content-tag preprocessor to convert the `<template>` syntax
 *    into valid JavaScript without needing to involve full-fledged lexical
 *    analysis.
 * 2. This form is a convenient form for manual prototyping when using the
 *    runtime compiler directly. While it requires some extra typing relative to
 *    `<template>`, it's a mechanical 1:1 transformation of the syntax.
 *
 * In practice, implementations that use a runtime compiler (for example, a
 * playground running completely in the browser) should probably use the
 * `content-tag` preprocessor to convert the template into the implicit form,
 * and then rely on `@ember/template-compiler/runtime` to evaluate the template.
 */

/**
 * When using `template` outside of a class (i.e. a "template-only component"), you can pass
 * an `eval` option that _implicitly_ provides the lexical scope for the template.
 *
 * This is called the "implicit form".
 *
 * ```ts
 * const greeting = 'Hello';
 * const HelloWorld = template('{{greeting}} World!', {
 *   eval() { return arguments[0] }
 * });
 * ```
 *
 * For more details on the requirements of the `eval` option, see {@linkcode ImplicitEvalOption}.
 */

/**
 * When using `template` inside of a class, you can pass an `eval` option that
 * _implicitly_ provides the lexical scope for the template, just as you can
 * with a {@linkcode ImplicitTemplateOnlyOptions | template-only component}.
 *
 * This is called the "implicit form".
 *
 * ```ts
 * class MyComponent extends Component {
 *   static {
 *     template('{{this.greeting}}, {{@place}}!',
 *       { component: this },
 *       eval() { return arguments[0] }
 *     );
 *   }
 * }
 * ```
 *
 * ## Note  on Private Fields
 *
 * The current implementation of `@ember/template-compiler` does not support
 * private fields, but once the Handlebars parser adds support for private field
 * syntax and it's implemented in the Glimmer compiler, the implicit form should
 * be able to support them.
 */

function template(templateString, providedOptions) {
  const options = {
    strictMode: true,
    ...providedOptions
  };
  const evaluate = buildEvaluator(options);
  const normalizedOptions = compileOptions(options);
  const component = normalizedOptions.component ?? templateOnly();
  const source = precompile(templateString, normalizedOptions);
  const template = templateFactory(evaluate(`(${source})`));
  setComponentTemplate(template, component);
  return component;
}
const evaluator = source => {
  return new Function(`return  ${source}`)();
};
function buildEvaluator(options) {
  if (options === undefined) {
    return evaluator;
  }
  if (options.eval) {
    return options.eval;
  } else {
    const scope = options.scope?.();
    if (!scope) {
      return evaluator;
    }
    return source => {
      const argNames = Object.keys(scope);
      const argValues = Object.values(scope);
      return new Function(...argNames, `return (${source})`)(...argValues);
    };
  }
}

export { template };
