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

export class CPU {
  /** 8-bit accumulator register */
  register_acc = 0b0000_0000;
  /** 8-bit X register */
  register_x = 0b0000_0000;
  /** 8-bit Y register */
  register_y = 0b0000_0000;
  /** 8-bit processor status */
  status = 0b0000_0000;
  /** 16-bit program counter */
  program_counter = 0b0000_0000_0000_0000;
  /**
   * Memory.
   *
   * - 0x0000 to 0x2000 is RAM (the NES has 2KiB of RAM. By my math 0-0x2000 is only 1KiB. Not sure where the disconnect is)
   * - 0x2000 to 0x4020 is redirected to other hardware modules (PPU, APU, GamePads, etc)
   * - 0x4020 to 0x6000 is used by different generations of cartridges differently. May be mapped to RAM, ROM, or nothing at all. Maybe this is where the extra 1KiB of RAM comes from?
   * - 0x6000 to 0x8000 is for RAM provided by the cartridge, if any.
   * - 0x8000 to 0x10000 is mapped to program ROM on the cartridge.
   *
   * @see https://bugzmanov.github.io/nes_ebook/chapter_3.html
   */
  memory = new Uint8Array(0xFFFF);

  /**
   * Run a program made up of instructions and any arguments to them.
   */
  interpret(program: number[]) {
    this.load(program);
    this.reset();
    this.run();
  }

  /**
   * Load a program (from a cartridge) into 0x8000-0x10000 in memory, and set the start location of
   * the program to 0xFFFC.
   */
  private load(program: number[]) {
    this.memory.set(program, 0x8000);
    this.memoryWriteUint16(0xFFFC, 0x8000);
  }

  /**
   * Reset the CPU state and set the program counter to the address at 0xFFFC. This happens when a
   * cartridge is loaded.
   */
  private reset() {
    this.register_acc = 0;
    this.register_x = 0;
    this.register_y = 0;
    this.status = 0;
    this.program_counter = this.memoryReadUint16(0xFFFC);
  }

  /**
   * Run a program made up of instructions and any arguments to them.
   */
  private run() {
    while (true) {
      const opCode = this.memoryRead(this.program_counter);
      this.program_counter += 1;

      switch (opCode) {
        case Instruction.BRK:
          return;
        // Load a byte of memory into the accumulator and set the zero and negative flags as
        // appropriate.
        case Instruction.LDA_Immediate: {
          this.lda(AddressingMode.Immediate);
          this.program_counter += 1;
          break;
        }
        // Add one to the X register and set the zero and negative flags as appropriate.
        case Instruction.INX: {
          // Increment and wrap around 255, since we're storing 8-bit numbers.
          this.register_x = wrapAroundUint8(this.register_x + 1);
          this.updateZeroAndNegativeFlags(this.register_x);
          break;
        }
        // Copy the current contents of the accumulator into the X register and set the zero
        // and negative flags as appropriate.
        case Instruction.TAX: {
          this.register_x = this.register_acc;
          this.updateZeroAndNegativeFlags(this.register_x);
          break;
        }
        default:
          throw new Error('todo!');
      }
    }
  }

  /**
   * Get data from memory.
   * @param address 16-bit memory address
   * @returns 8-bit data
   */
  private memoryRead(address: number): number {
    return this.memory[address];
  }

  /**
   * Get 2 bytes from memory.
   * @param address 16-bit memory address
   * @returns 16-bit data
   */
  private memoryReadUint16(address: number): number {
    // The NES uses little-endian memory addressing, so the least significant digit is first, and
    // the most significant digit is last. Read them and put them back together in the correct order.
    const lo = this.memoryRead(address);
    const hi = this.memoryRead(address + 1);
    return (hi << 8) | lo;
  }

  /**
   * Set data in memory.
   * @param address 16-bit memory address
   * @param data 8-bit data
   */
  private memoryWrite(address: number, data: number): void {
    this.memory[address] = data;
  }

  /**
   * Set 2 bytes in memory.
   * @param address 16-bit memory address
   * @param data 16-bit data
   */
  private memoryWriteUint16(address: number, data: number): void {
    // The NES uses little-endian memory addressing, so split apart the most and least significant
    // digits. Then we'll store them in reverse order.
    const hi = data >> 8;
    const lo = data & 0xFF;
    this.memoryWrite(address, lo);
    this.memoryWrite(address + 1, hi);
  }

  /**
   * Get the address of an instruction's parameter, which depends on its addressing mode.
   * @returns 16-bit memory address
   */
  private getOperandAddress(mode: AddressingMode): number {
    switch (mode) {
      case AddressingMode.Immediate:
        return this.program_counter;
      case AddressingMode.ZeroPage:
        return this.memoryRead(this.program_counter);
      case AddressingMode.Absolute:
        return this.memoryReadUint16(this.program_counter);
      case AddressingMode.ZeroPage_X: {
        const specifiedAddress = this.memoryRead(this.program_counter);
        const offset = this.register_x;
        return wrapAroundUint16(specifiedAddress + offset);
      }
      case AddressingMode.ZeroPage_Y: {
        const specifiedAddress = this.memoryRead(this.program_counter);
        const offset = this.register_y;
        return wrapAroundUint16(specifiedAddress + offset);
      }
      case AddressingMode.Absolute_X: {
        const specifiedAddress = this.memoryReadUint16(this.program_counter);
        const offset = this.register_x;
        return wrapAroundUint16(specifiedAddress + offset);
      }
      case AddressingMode.Absolute_Y: {
        const specifiedAddress = this.memoryReadUint16(this.program_counter);
        const offset = this.register_y;
        return wrapAroundUint16(specifiedAddress + offset);
      }
      case AddressingMode.Indirect_X: {
        const base = this.memoryRead(this.program_counter);
        const ptr = wrapAroundUint8(base + this.register_x);
        const lo = this.memoryRead(ptr);
        const hi = this.memoryRead(wrapAroundUint16(ptr + 1));
        return (hi << 8) | lo;
      }
      case AddressingMode.Indirect_Y: {
        const base = this.memoryRead(this.program_counter);
        const lo = this.memoryRead(base);
        const hi = this.memoryRead(wrapAroundUint16(base + 1));
        const deref_base = (hi << 8) | lo;
        return wrapAroundUint16(deref_base + this.register_y);
      }
      default:
        throw new Error(`Mode ${mode} not supported!`);
    }
  }

  private updateZeroAndNegativeFlags(result: number): void {
    // Set zero flag.
    if (result === 0) {
      this.status = this.status | 0b0000_0010;
    } else {
      this.status = this.status & 0b1111_1101;
    }

    // Set negative flag.
    if ((result & 0b1000_0000) !== 0) {
      this.status = this.status | 0b1000_0000;
    } else {
      this.status = this.status & 0b0111_1111;
    }
  }

  /**
   * Execute the LDA instruction. The address of its parameter depends on addressing mode.
   */
  private lda(addressingMode: AddressingMode) {
    const address = this.getOperandAddress(addressingMode);
    const param = this.memoryRead(address);
    this.register_acc = param;
    this.updateZeroAndNegativeFlags(this.register_acc);
  }
}

/**
 * Clamp a number to 8 bits (1 byte).
 */
function wrapAroundUint8(num: number): number {
  return num % 0xFF;
}

/**
 * Clamp a number to 16 bits (2 bytes).
 */
function wrapAroundUint16(num: number): number {
  return num % 0xFFFF;
}
