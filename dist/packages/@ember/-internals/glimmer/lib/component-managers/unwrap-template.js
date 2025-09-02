/**
 * @deprecated
 */
function unwrapTemplate(template) {
  if (template.result === 'error') {
    throw new Error(`Compile Error: ${template.problem} @ ${template.span.start}..${template.span.end}`);
  }
  return template;
}

export { unwrapTemplate };
