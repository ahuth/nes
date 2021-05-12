/**
 * Addressing mode which determines how the CPU interprets an instruction and their parameters.
 * @see http://www.obelisk.me.uk/6502/addressing.html
 */
export enum AddressingMode {
  /** Parameters are values, not memory addresses. */
  Immediate,
  /** Parameters are a 8 bits (1 byte), so only the first 256 bytes can be used. */
  ZeroPage,
  /**
   * Parameters are a 8 bits (1 byte). The value in the X register is added to them to
   * get the final memory address that's used.
   */
  ZeroPage_X,
  /**
   * Parameters are a 8 bits (1 byte). The value in the Y register is added to them to
   * get the final memory address that's used. Can only be used with the LDX and STX instructions.
   */
  ZeroPage_Y,
  /** Parameters are a full 16-bit (2 byte) memory address. */
  Absolute,
  /**
   * Parameters are a 16 bits (2 bytes). The value in the X register is added to them to
   * get the final memory address that's used.
   */
  Absolute_X,
  /**
   * Parameters are a 16 bits (2 bytes). The value in the Y register is added to them to
   * get the final memory address that's used.
   */
  Absolute_Y,
  /**
   * Also known as Indexed Indirect.
   *
   * Normally used in conjunction with a table of address held on zero page. The address of the
   * table is taken from the instruction and the X register added to it (with zero page wrap
   * around) to give the location of the least significant byte of the target address.
   */
  Indirect_X,
  /**
   * Also known as Indirect Indexed.
   *
   * The most common indirection mode used on the 6502. An instruction contains the zero page
   * location of the least significant byte of 16 bit address. The Y register is dynamically added
   * to this value to generated the actual target address for operation.
   */
  Indirect_Y,
}

/**
 * Assembly instructions for the NES's 2A03 chip (which is a modified version of the 6502).
 * @see http://www.obelisk.me.uk/6502/reference.html
 */
export enum Instruction {
  /** Force interrupt @see http://www.obelisk.me.uk/6502/reference.html#BRK */
  BRK = 0x00,
  /** Load accumulator @see http://www.obelisk.me.uk/6502/reference.html#LDA */
  LDA_Immediate = 0xA9,
  /** Increment X register @see http://www.obelisk.me.uk/6502/reference.html#INX  */
  INX = 0xE8,
  /** Transfer accumulator to X @see http://www.obelisk.me.uk/6502/reference.html#TAX */
  TAX = 0xAA,
}
