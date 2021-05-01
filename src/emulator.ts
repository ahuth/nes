/**
 * Assembly instructions for the NES's 2A03 chip (which is a modified version of the 6502).
 * @see http://www.obelisk.me.uk/6502/reference.html
 */
export enum Instruction {
  /** Force interrupt @see http://www.obelisk.me.uk/6502/reference.html#BRK */
  BRK = 0x00,
  /** Load accumulator @see http://www.obelisk.me.uk/6502/reference.html#LDA */
  LDA = 0xA9,
  /** Transfer accumulator to X @see http://www.obelisk.me.uk/6502/reference.html#TAX */
  TAX = 0xAA,
}

export class CPU {
  register_acc: number;
  register_x: number;
  status: number;
  program_counter: number;

  constructor() {
    this.register_acc = 0;
    this.register_x = 0;
    this.status = 0;
    this.program_counter = 0;
  }

  // Should interpret take single instruction? Let something else manage where it's at in the
  // program?
  interpret(program: number[]) {
    this.program_counter = 0;

    while (this.program_counter < program.length) {
      const opCode = program[this.program_counter];
      this.program_counter += 1;

      switch (opCode) {
        case Instruction.BRK:
          return;
        case Instruction.LDA: {
          // Load a byte of memory into the accumulator and set the zero and negative flags as
          // appropriate.
          const param = program[this.program_counter];
          this.program_counter += 1;
          this.register_acc = param;
          this.updateZeroAndNegativeFlags(this.register_acc);
          break;
        }
        case Instruction.TAX: {
          // Copy the current contents of the accumulator into the X register and set the zero
          // and negative flags as appropriate.
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
