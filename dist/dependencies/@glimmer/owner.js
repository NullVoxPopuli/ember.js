function getOwner(object){return object[OWNER]}function setOwner(object,owner){object[OWNER]=owner;}const OWNER=Symbol("OWNER");

export { OWNER, getOwner, setOwner };
