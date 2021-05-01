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
  register_acc: number;
  /** 8-bit X register */
  register_x: number;
  /** 8-bit processor status */
  status: number;
  /** 16-bit program counter */
  program_counter: number;

  constructor() {
    this.register_acc = 0;
    this.register_x = 0;
    this.status = 0;
    this.program_counter = 0;
  }

  /**
   * Run a program made up of instructions and any arguments to them.
   */
  interpret(program: number[]) {
    this.program_counter = 0;

    while (this.program_counter < program.length) {
      const opCode = program[this.program_counter];
      this.program_counter += 1;

      switch (opCode) {
        case Instruction.BRK:
          return;
        // Load a byte of memory into the accumulator and set the zero and negative flags as
        // appropriate.
        case Instruction.LDA: {
          const param = program[this.program_counter];
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
