const ContentType = {
    Component: 0,
    Helper: 1,
    String: 2,
    Empty: 3,
    SafeString: 4,
    Fragment: 5,
    Node: 6,
    Other: 8
  },
  InternalComponentCapabilities = {
    Empty: 0,
    dynamicLayout: 1,
    dynamicTag: 2,
    prepareArgs: 4,
    createArgs: 8,
    attributeHook: 16,
    elementHook: 32,
    dynamicScope: 64,
    createCaller: 128,
    updateHook: 256,
    createInstance: 512,
    wrapped: 1024,
    willDestroy: 2048,
    hasSubOwner: 4096
  },
  ARG_SHIFT = 8,
  MAX_SIZE = 2147483647,
  TYPE_SIZE = 255,
  TYPE_MASK = 255,
  OPERAND_LEN_MASK = 768,
  MACHINE_MASK = 1024,
  $pc = 0,
  $ra = 1,
  $fp = 2,
  $sp = 3,
  $s0 = 4,
  $s1 = 5,
  $t0 = 6,
  $t1 = 7,
  $v0 = 8;
function isLowLevelRegister(register) {
  return register <= 3;
}

export { $fp, $pc, $ra, $s0, $s1, $sp, $t0, $t1, $v0, ARG_SHIFT, ContentType, InternalComponentCapabilities, InternalComponentCapabilities as InternalComponentCapability, MACHINE_MASK, MAX_SIZE, OPERAND_LEN_MASK, TYPE_MASK, TYPE_SIZE, isLowLevelRegister };
