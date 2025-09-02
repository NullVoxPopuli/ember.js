// STATE within a module is frowned upon, this exists
// to support Ember.TEMPLATES but shield ember internals from this legacy
// global API.

let TEMPLATES = {};
function setTemplates(templates) {
  TEMPLATES = templates;
}
function getTemplates() {
  return TEMPLATES;
}
function getTemplate(name) {
  if (Object.prototype.hasOwnProperty.call(TEMPLATES, name)) {
    return TEMPLATES[name];
  }
}
function hasTemplate(name) {
  return Object.prototype.hasOwnProperty.call(TEMPLATES, name);
}
function setTemplate(name, template) {
  return TEMPLATES[name] = template;
}

export { getTemplate, getTemplates, hasTemplate, setTemplate, setTemplates };
