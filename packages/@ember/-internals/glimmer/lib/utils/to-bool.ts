import { isHTMLSafe } from './string';
import { tagForProperty } from '@ember/-internals/metal';
import { isProxy } from '@ember/-internals/utils';
import { consumeTag } from '@glimmer/validator';

export default function toBool(predicate: unknown): boolean {
  if (isProxy(predicate)) {
    consumeTag(tagForProperty(predicate, 'content'));

    return Boolean(predicate.isTruthy);
  } else if (Array.isArray(predicate)) {
    consumeTag(tagForProperty(predicate as object, '[]'));

    return (predicate as { length: number }).length !== 0;
  } else if (isHTMLSafe(predicate)) {
    return Boolean(predicate.toString());
  } else {
    return Boolean(predicate);
  }
}
