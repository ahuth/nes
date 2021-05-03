/**
 * Assembly instructions for the NES's 2A03 chip (which is a modified version of the 6502).
 * @see http://www.obelisk.me.uk/6502/reference.html
 */
export enum Instruction {
  /** Force interrupt @see http://www.obelisk.me.uk/6502/reference.html#BRK */
  BRK = 0x00,
  /** Load accumulator @see http://www.obelisk.me.uk/6502/reference.html#LDA */
  LDA = 0xA9,
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
  memory = new Array(0xFFFF).fill(0);

  /**
   * Run a program made up of instructions and any arguments to them.
   */
  interpret(program: number[]) {
    this.load(program);
    this.run();
  }

  /**
   * Load a program (from a cartridge) into the right place in memory.
   */
  private load(program: number[]) {
    this.memory.splice(0x8000, program.length, ...program);
    this.program_counter = 0x8000;
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
        case Instruction.LDA: {
          const param = this.memoryRead(this.program_counter);
          this.program_counter += 1;
          this.register_acc = param;
          this.updateZeroAndNegativeFlags(this.register_acc);
          break;
        }
        // Add one to the X register and set the zero and negative flags as appropriate.
        case Instruction.INX: {
          // Increment and wrap around 255, since we're storing 8-bit numbers.
          this.register_x = (this.register_x + 1) % 0xFF;
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
   * Set data in memory.
   * @param address 16-bit memory address
   * @param data 8-bit data
   */
  private memorySet(address: number, data: number): void {
    this.memory[address] = data;
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
}
