export class CPU {
  register_acc: number;
  status: number;
  program_counter: number;

  constructor() {
    this.register_acc = 0;
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
        case /* BRK */ 0x00:
          // Force interrupt
          // http://www.obelisk.me.uk/6502/reference.html#BRK
          return;
        case /* LDA */ 0xA9: {
          // Load accumulator
          // http://www.obelisk.me.uk/6502/reference.html#LDA
          // Loads a byte of memory into the accumulator setting the zero and negative flags as appropriate.

          const param = program[this.program_counter];
          this.program_counter += 1;
          this.register_acc = param;

          // Set zero flag?
          if (this.register_acc === 0) {
            this.status = this.status | 0b0000_0010;
          } else {
            this.status = this.status & 0b1111_1101;
          }

          // Set negative flag?
          if ((this.register_acc & 0b1000_0000) !== 0) {
            this.status = this.status | 0b1000_0000;
          } else {
            this.status = this.status & 0b1111_1111;
          }

          break;
        }
        default:
          throw new Error('todo!');
      }
    }
  }
}
