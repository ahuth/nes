import {CPU} from './emulator';

describe('LDA - 0xA9', () => {
  test('loading a byte into memory', () => {
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

  test('zero flag', () => {
    const cpu = new CPU();
    cpu.interpret([
      // LDA 0x00
      0xA9, 0x00,
      // BRK
      0x00,
    ]);

    // Zero flag is set?
    expect(cpu.status & 0b0000_0010).toEqual(0b10);
  });
});
