import {CPU} from './emulator';

describe('LDA - 0xA9', () => {
  test('loading a positive byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      // LDA 0x05
      0xA9, 0x05,
      // BRK
      0x00,
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
      // LDA 0x00
      0xA9, 0x00,
      // BRK
      0x00,
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
      // LDA 0x88. 0x88 has the 0b1000_0000 bit set, so it is negative.
      0xA9, 0x88,
      // BRK
      0x00,
    ]);

    // 0x88 is in the accumulator.
    expect(cpu.register_acc).toEqual(0x88);

    // Zero flag is not set?
    expect(cpu.status & 0b0000_0010).toEqual(0b00);

    // Negative flag is set?
    expect(cpu.status & 0b1000_0000).not.toEqual(0);
  });
});
