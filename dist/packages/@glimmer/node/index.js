import { DOMTreeConstruction, ConcreteBounds, NewTreeBuilder } from '../runtime/index.js';
import createHTMLDocument from '../../@simple-dom/document/index.js';

class NodeDOMTreeConstruction extends DOMTreeConstruction {
  constructor(doc) {
    super(doc || createHTMLDocument());
  }
  // override to prevent usage of `this.document` until after the constructor
  setupUselessElement() {}
  insertHTMLBefore(parent, reference, html) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated, @typescript-eslint/no-non-null-assertion
    let raw = this.document.createRawHTMLSection(html);
    return parent.insertBefore(raw, reference), new ConcreteBounds(parent, raw, raw);
  }
  // override to avoid SVG detection/work when in node (this is not needed in SSR)
  createElement(tag) {
    return this.document.createElement(tag);
  }
  // override to avoid namespace shenanigans when in node (this is not needed in SSR)
  setAttribute(element, name, value) {
    element.setAttribute(name, value);
  }
}
const NEEDS_EXTRA_CLOSE = new WeakMap();
class SerializeBuilder extends NewTreeBuilder {
  __openBlock() {
    let {
      tagName: tagName
    } = this.element;
    if ("TITLE" !== tagName && "SCRIPT" !== tagName && "STYLE" !== tagName) {
      let depth = this.serializeBlockDepth++;
      this.__appendComment(`%+b:${depth}%`);
    }
    super.__openBlock();
  }
  __closeBlock() {
    let {
      tagName: tagName
    } = this.element;
    if (super.__closeBlock(), "TITLE" !== tagName && "SCRIPT" !== tagName && "STYLE" !== tagName) {
      let depth = --this.serializeBlockDepth;
      this.__appendComment(`%-b:${depth}%`);
    }
  }
  __appendHTML(html) {
    let {
      tagName: tagName
    } = this.element;
    if ("TITLE" === tagName || "SCRIPT" === tagName || "STYLE" === tagName) return super.__appendHTML(html);
    // Do we need to run the html tokenizer here?
    let first = this.__appendComment("%glmr%");
    if ("TABLE" === tagName) {
      let openIndex = html.indexOf("<");
      openIndex > -1 && "tr" === html.slice(openIndex + 1, openIndex + 3) && (html = `<tbody>${html}</tbody>`);
    }
    "" === html ? this.__appendComment("% %") : super.__appendHTML(html);
    let last = this.__appendComment("%glmr%");
    return new ConcreteBounds(this.element, first, last);
  }
  __appendText(string) {
    let {
        tagName: tagName
      } = this.element,
      current = function (cursor) {
        let {
          element: element,
          nextSibling: nextSibling
        } = cursor;
        return null === nextSibling ? element.lastChild : nextSibling.previousSibling;
      }(this);
    return "TITLE" === tagName || "SCRIPT" === tagName || "STYLE" === tagName ? super.__appendText(string) : "" === string ? this.__appendComment("% %") : (current && 3 === current.nodeType && this.__appendComment("%|%"), super.__appendText(string));
  }
  closeElement() {
    return NEEDS_EXTRA_CLOSE.has(this.element) && (NEEDS_EXTRA_CLOSE.delete(this.element), super.closeElement()), super.closeElement();
  }
  openElement(tag) {
    return "tr" === tag && "TBODY" !== this.element.tagName && "THEAD" !== this.element.tagName && "TFOOT" !== this.element.tagName && (this.openElement("tbody"),
    // This prevents the closeBlock comment from being re-parented
    // under the auto inserted tbody. Rehydration builder needs to
    // account for the insertion since it is injected here and not
    // really in the template.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- @fixme
    NEEDS_EXTRA_CLOSE.set(this.constructing, true), this.flushElement(null)), super.openElement(tag);
  }
  pushRemoteElement(element, cursorId, insertBefore = null) {
    let {
        dom: dom
      } = this,
      script = dom.createElement("script");
    return script.setAttribute("glmr", cursorId), dom.insertBefore(element, script, insertBefore), super.pushRemoteElement(element, cursorId, insertBefore);
  }
  constructor(...args) {
    super(...args), this.serializeBlockDepth = 0;
  }
}
function serializeBuilder(env, cursor) {
  return SerializeBuilder.forInitialRender(env, cursor);
}

export { NodeDOMTreeConstruction, serializeBuilder };
