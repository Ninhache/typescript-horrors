import { assert } from "node:console";

export const OPERATORS = ["+", "-", "*", "/"] as const;
const ONE = 1 as const;
const ZERO = 0 as const;
export type Operator = (typeof OPERATORS)[number];

const memo = new Map<string, number>();

function makeKey(op: string, a: number, b: number) {
  return `${op}:${a},${b}`;
}

export interface Operation {
  execute(a: number, b: number): number;
}

class OperationUtils {
  public one(): typeof ONE {
    return ONE;
  }

  public zero(): typeof ZERO {
    return ZERO;
  }

  public static isNumber(value: unknown): asserts value is number {
    assert(typeof value == "number");
  }

  public static addOne(toInc: unknown): unknown {
    OperationUtils.isNumber(toInc);
    return toInc + new OperationUtils().one();
  }

  public static subOne(toSub: unknown): unknown {
    return -(this.addOne(-(toSub as number)) as number);
  }

  public static isZero(value: unknown): boolean {
    this.isNumber(value);
    return value === 0;
  }
}

export class Addition implements Operation {
  execute(a: unknown, b: unknown, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    const key = makeKey("add", a, b);
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    let result: number;
    if (OperationUtils.isZero(b)) {
      result = acc + a;
    } else {
      result = this.execute(
        OperationUtils.addOne(a) as number,
        OperationUtils.subOne(b) as number,
        acc
      );
    }

    memo.set(key, result);
    return result;
  }
}

export class Subtraction implements Operation {
  execute(a: unknown, b: unknown, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    const key = makeKey("sub", a, b);
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    let result: number;
    if (OperationUtils.isZero(b)) {
      result = acc + a;
    } else {
      result = this.execute(
        OperationUtils.subOne(a) as number,
        OperationUtils.subOne(b) as number,
        acc
      );
    }

    memo.set(key, result);
    return result;
  }
}

export class Multiplication implements Operation {
  execute(a: unknown, b: unknown, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    const key = makeKey("mul", a, b);
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    let result: number;
    if (OperationUtils.isZero(b)) {
      result = acc;
    } else if ((b as number) < 0) {
      result = -this.execute(a, -(b as number), acc);
    } else {
      result = this.execute(
        a,
        OperationUtils.subOne(b) as number,
        new Addition().execute(acc, a)
      );
    }

    memo.set(key, result);
    return result;
  }
}

export class Division implements Operation {
  execute(a: number, b: number, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    const key = makeKey("div", a, b);
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    if (OperationUtils.isZero(b)) {
      throw new Error("division by zero isn't possible");
    }

    let negativeResult = false;
    let dividend = a;
    let divisor = b;

    if (dividend < 0) {
      dividend = -dividend;
      negativeResult = !negativeResult;
    }

    if (divisor < 0) {
      divisor = -divisor;
      negativeResult = !negativeResult;
    }

    let result: number;
    if (dividend < divisor) {
      result = acc;
    } else {
      result = this.execute(
        new Subtraction().execute(dividend, divisor),
        divisor,
        OperationUtils.addOne(acc) as number
      );
    }

    const final = negativeResult ? -result : result;
    memo.set(key, final);
    return final;
  }
}
