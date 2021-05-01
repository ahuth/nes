import {CPU, Instruction} from './emulator';

describe('LDA', () => {
  test('loading a positive byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x05,
      Instruction.BRK,
    ]);

    // 0x05 is in the accumulator.
    expect(cpu.register_acc).toEqual(0x05);

    // Zero flag is not set?
    expect(cpu.status & 0b0000_0010).toEqual(0b00);

    // Negative flag is not set?
    expect(cpu.status & 0b1000_0000).toEqual(0);
  });

  test('loading zero', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x00,
      Instruction.BRK,
    ]);

    // 0x00 is in the accumulator.
    expect(cpu.register_acc).toEqual(0x00);

    // Zero flag is set?
    expect(cpu.status & 0b0000_0010).toEqual(0b10);

    // Negative flag is not set?
    expect(cpu.status & 0b1000_0000).toEqual(0);
  });

  test('loading a negative byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      // 0x88 has the 0b1000_0000 bit set, so it is negative.
      Instruction.LDA, 0x88,
      Instruction.BRK,
    ]);

    // 0x88 is in the accumulator.
    expect(cpu.register_acc).toEqual(0x88);

    // Zero flag is not set?
    expect(cpu.status & 0b0000_0010).toEqual(0b00);

    // Negative flag is set?
    expect(cpu.status & 0b1000_0000).not.toEqual(0);
  });
});

describe('INX', () => {
  test('incrementing a positive byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x05,
      Instruction.TAX,
      Instruction.INX,
      Instruction.BRK,
    ]);

    // 0x06 is in the X register.
    expect(cpu.register_x).toEqual(0x06);

    // Zero flag is not set.
    expect(cpu.status & 0b0000_0010).toEqual(0b00);

    // Negative flag is not set.
    expect(cpu.status & 0b1000_0000).toEqual(0);
  });

  test('overflow', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0xFF,
      Instruction.TAX,
      Instruction.INX,
      Instruction.BRK,
    ]);

    // 1 is in the X register.
    expect(cpu.register_x).toEqual(0x01);
  });
});

describe('TAX', () => {
  test('transferring a positive byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x05,
      Instruction.TAX,
      Instruction.BRK,
    ]);

    // 0x05 is in the accumulator.
    expect(cpu.register_acc).toEqual(0x05);

    // 0x05 is in the X register.
    expect(cpu.register_x).toEqual(0x05);

    // Zero flag is not set.
    expect(cpu.status & 0b0000_0010).toEqual(0b00);

    // Negative flag is not set.
    expect(cpu.status & 0b1000_0000).toEqual(0);
  });

  test('transferring zero', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x00,
      Instruction.TAX,
      Instruction.TAX,
    ]);

    // 0x00 is in the accumulator.
    expect(cpu.register_acc).toEqual(0x00);

    // 0x00 is in the X register.
    expect(cpu.register_x).toEqual(0x00);

    // Zero flag is set.
    expect(cpu.status & 0b0000_0010).toEqual(0b10);

    // Negative flag is not set.
    expect(cpu.status & 0b1000_0000).toEqual(0);
  });

  test('transferring a negative byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      // 0x88 has the 0b1000_0000 bit set, so it is negative.
      Instruction.LDA, 0x88,
      Instruction.TAX,
      Instruction.BRK,
    ]);

    // 0x88 is in the accumulator.
    expect(cpu.register_acc).toEqual(0x88);

    // 0x88 is in the X register.
    expect(cpu.register_x).toEqual(0x88);

    // Zero flag is not set.
    expect(cpu.status & 0b0000_0010).toEqual(0b00);

    // Negative flag is set.
    expect(cpu.status & 0b1000_0000).not.toEqual(0);
  });
});
