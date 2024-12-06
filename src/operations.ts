import { assert } from "node:console";

const operators = ["+", "-", "*", "/"] as const;
const ONE = 1 as const;
const ZERO = 0 as const;
export type Operator = (typeof operators)[number];

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
  execute(a: unknown, b: unknown): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);
    if (OperationUtils.isZero(b)) {
      return a;
    } else {
      return this.execute(
        OperationUtils.addOne(a) as number,
        OperationUtils.subOne(b) as number
      );
    }
  }
}

export class Subtraction implements Operation {
  execute(a: unknown, b: unknown): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);
    if (OperationUtils.isZero(b)) {
      return a;
    } else {
      return this.execute(
        OperationUtils.subOne(a) as number,
        OperationUtils.subOne(b) as number
      );
    }
  }
}

export class Multiplication implements Operation {
  execute(a: unknown, b: unknown): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    if (OperationUtils.isZero(b)) return 0;

    if (b < 0) {
      return -this.execute(a, -b);
    }

    return new Addition().execute(
      a,
      this.execute(a, OperationUtils.subOne(b) as number)
    );
  }
}

export class Division implements Operation {
  execute(a: number, b: number): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    if (OperationUtils.isZero(b)) {
      throw new Error("division by zero isnt possible");
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

    const recurse = (x: unknown, y: unknown): number => {
      if ((x as number) < (y as number)) return (x as number) / (y as number);
      return OperationUtils.addOne(
        recurse(new Subtraction().execute(x, y), y)
      ) as number;
    };

    const result = recurse(dividend, divisor);
    return negativeResult ? -result : result;
  }
}
