import { isDevelopingApp } from '@embroider/macros';

let debugRenderMessage;
if (isDevelopingApp()) {
  debugRenderMessage = renderingStack => {
    return `While rendering:\n----------------\n${renderingStack.replace(/^/gm, '  ')}`;
  };
}
const debugRenderMessage$1 = debugRenderMessage;

export { debugRenderMessage$1 as default };
