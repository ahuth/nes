import {AddressingMode, Instruction} from './instructions';

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
   * Load a program (from a cartridge) into 0x8000-0x10000 in memory, and set the start location of
   * the program to 0xFFFC.
   */
  load(program: number[]) {
    this.memory.set(program, 0x8000);
    this.memoryWriteUint16(0xFFFC, 0x8000);
    this.reset();
  }

  /**
   * Run a program made up of instructions and any arguments to them.
   */
  run() {
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
          // Increment. Wrap around 255, since we're storing 8-bit numbers.
          this.registerSet('register_x', wrapAroundUint8(this.register_x + 1));
          break;
        }
        // Copy the current contents of the accumulator into the X register and set the zero
        // and negative flags as appropriate.
        case Instruction.TAX: {
          this.registerSet('register_x', this.register_acc);
          break;
        }
        default:
          throw new Error('todo!');
      }
    }
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
   * Set a register value. Use this instead of directly assigning so that status flags get set
   * automatically.
   */
  private registerSet(register: 'register_acc' | 'register_x' | 'register_y', value: number): void {
    this[register] = value;
    this.updateZeroAndNegativeFlags(value);
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
      this.status = this.status & ~0b0000_0010;
    }

    // Set negative flag.
    if ((result & 0b1000_0000) !== 0) {
      this.status = this.status | 0b1000_0000;
    } else {
      this.status = this.status & ~0b1000_0000;
    }
  }

  /**
   * Execute the LDA instruction. The address of its parameter depends on addressing mode.
   */
  private lda(addressingMode: AddressingMode) {
    const address = this.getOperandAddress(addressingMode);
    const param = this.memoryRead(address);
    this.registerSet('register_acc', param);
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
