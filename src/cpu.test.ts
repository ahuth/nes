import {CPU, Instruction} from './cpu';

describe('LDA', () => {
  test('loading a positive byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x05,
      Instruction.BRK,
    ]);

    expect(cpu).toHaveRegisterValueInAcc(0x05);
    expect(cpu).not.toHaveFlagZero();
    expect(cpu).not.toHaveFlagNegative();
  });

  test('loading zero', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x00,
      Instruction.BRK,
    ]);

    expect(cpu).toHaveRegisterValueInAcc(0x00);
    expect(cpu).toHaveFlagZero();
    expect(cpu).not.toHaveFlagNegative();
  });

  test('loading a negative byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      // 0x88 has the 0b1000_0000 bit set, so it is negative.
      Instruction.LDA, 0x88,
      Instruction.BRK,
    ]);

    expect(cpu).toHaveRegisterValueInAcc(0x88);
    expect(cpu).not.toHaveFlagZero();
    expect(cpu).toHaveFlagNegative();
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

    expect(cpu).toHaveRegisterValueInX(0x06);
    expect(cpu).not.toHaveFlagZero();
    expect(cpu).not.toHaveFlagNegative();
  });

  test('overflow', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0xFF,
      Instruction.TAX,
      Instruction.INX,
      Instruction.BRK,
    ]);

    expect(cpu).toHaveRegisterValueInX(0x01);
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

    expect(cpu).toHaveRegisterValueInAcc(0x05);
    expect(cpu).toHaveRegisterValueInX(0x05);
    expect(cpu).not.toHaveFlagZero();
    expect(cpu).not.toHaveFlagNegative();
  });

  test('transferring zero', () => {
    const cpu = new CPU();
    cpu.interpret([
      Instruction.LDA, 0x00,
      Instruction.TAX,
      Instruction.TAX,
    ]);

    expect(cpu).toHaveRegisterValueInAcc(0x00);
    expect(cpu).toHaveRegisterValueInX(0x00);
    expect(cpu).toHaveFlagZero();
    expect(cpu).not.toHaveFlagNegative();
  });

  test('transferring a negative byte', () => {
    const cpu = new CPU();
    cpu.interpret([
      // 0x88 has the 0b1000_0000 bit set, so it is negative.
      Instruction.LDA, 0x88,
      Instruction.TAX,
      Instruction.BRK,
    ]);

    expect(cpu).toHaveRegisterValueInAcc(0x88);
    expect(cpu).toHaveRegisterValueInX(0x88);
    expect(cpu).not.toHaveFlagZero();
    expect(cpu).toHaveFlagNegative();
  });
});

declare global {
  namespace jest {
    interface Matchers<R> {
      /** Check that the CPU's negative flag is set */
      toHaveFlagNegative(): R,
      /** Check that the CPU's zero flag is set */
      toHaveFlagZero(): R,
      /** Check that a CPU has a specific value in its accumulator register. */
      toHaveRegisterValueInAcc(expectedValue: number): R,
      /** Check that a CPU has a specific value in its X register. */
      toHaveRegisterValueInX(expectedValue: number): R,
    }
  }
}

expect.extend({
  toHaveFlagNegative(received: CPU) {
    return (received.status & 0b1000_0000) === 0b1000_0000
      ? { message: () => 'Expected negative flag to not be set, but it was', pass: true }
      : { message: () => 'Expected negative flag to be set, but it was not', pass: false };
  },
  toHaveFlagZero(received: CPU) {
    return (received.status & 0b0000_0010) === 0b10
      ? { message: () => 'Expected zero flag to not be set, but it was', pass: true }
      : { message: () => 'Expected zero flag to be set, but it was not', pass: false };
  },
  toHaveRegisterValueInAcc(received: CPU, expectedValue: number) {
    const actualValue = received.register_acc;
    return actualValue === expectedValue
      ? { message: () => `Expected the accumulator register to not have the value ${expectedValue}, but it did`, pass: true }
      : { message: () => `Expected the accumulator register to have the value ${expectedValue}, but it was ${actualValue}`, pass: false };
  },
  toHaveRegisterValueInX(received: CPU, expectedValue: number) {
    const actualValue = received.register_x;
    return actualValue === expectedValue
      ? { message: () => `Expected the X register to not have the value ${expectedValue}, but it did`, pass: true }
      : { message: () => `Expected the X register to have the value ${expectedValue}, but it was ${actualValue}`, pass: false };
  },
});
