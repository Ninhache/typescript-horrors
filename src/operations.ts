import { assert } from "node:console";
import { useTranslation } from "./i18n/i18n";

export const OPERATORS = ["+", "-", "*", "/"] as const;
const ONE = 1 as const;
const ZERO = 0 as const;
export type Operator = (typeof OPERATORS)[number];

/**
 * Deux façons de faire de l'arithmétique :
 * - "recurse" : l'horreur récursive d'origine (incrément unaire, O(n) de profondeur)
 * - "bitwise" : version itérative O(log n), incrashable mais coincée en 32 bits
 * Le superviseur (rpn.ts) bascule de l'une à l'autre via le worker.
 */
export type Method = "recurse" | "bitwise";

let METHOD: Method = "recurse";
export function setMethod(m: Method): void {
  METHOD = m;
}
export function getMethod(): Method {
  return METHOD;
}

const memo = new Map<string, number>();

function makeKey(op: string, a: number, b: number) {
  return `${op}:${a},${b}`;
}

function isStackOverflow(e: unknown): e is RangeError {
  return e instanceof RangeError && /maximum call stack/i.test(e.message);
}
export { isStackOverflow };

/* ------------------------------------------------------------------ *
 * Méthode bitwise : on réimplémente toujours l'arithmétique à la main,
 * mais sans toucher la pile. ~32 itérations max, jamais plus => fast af.
 * Tout est ramené en int32, donc au-delà de 2^31 ça wrap et ça te rend une
 * réponse fièrement fausse. fast af AND falsy. c'est une feature, pas un bug.
 * ------------------------------------------------------------------ */
function addBits(a: number, b: number): number {
  let x: number = a | 0;
  let y: number = b | 0;
  while (y !== 0) {
    const carry: number = (x & y) << 1; // les retenues
    x = (x ^ y) | 0; // la somme sans retenue
    y = carry | 0;
  }
  return x | 0;
}

function negBits(a: number): number {
  return addBits(~(a | 0), 1); // complément à deux : -a = ~a + 1
}

function subBits(a: number, b: number): number {
  return addBits(a | 0, negBits(b));
}

function mulBits(a: number, b: number): number {
  let A: number = a | 0;
  let B: number = b | 0;
  let result: number = 0;
  let negative: boolean = false;
  if (B < 0) {
    B = negBits(B);
    negative = !negative;
  }
  if (A < 0) {
    A = negBits(A);
    negative = !negative;
  }
  while (B !== 0) {
    if (B & 1) {
      result = addBits(result, A);
    }
    A = (A << 1) | 0; // paysan russe : on double a
    B = B >>> 1; //                et on halve b
  }
  return negative ? negBits(result) : result;
}

function divBits(a: number, b: number): number {
  if ((b | 0) === 0) {
    throw new Error(useTranslation().errors.divisionByZero);
  }
  let A: number = a | 0;
  let B: number = b | 0;
  let negative: boolean = false;
  if (A < 0) {
    A = negBits(A);
    negative = !negative;
  }
  if (B < 0) {
    B = negBits(B);
    negative = !negative;
  }
  let quotient: number = 0;
  let remainder: number = 0;
  for (let i: number = 31; i >= 0; i--) {
    remainder = (remainder << 1) | ((A >>> i) & 1); // division longue, bit à bit
    if (remainder >>> 0 >= B >>> 0) {
      remainder = subBits(remainder, B);
      quotient = quotient | (1 << i);
    }
  }
  return negative ? negBits(quotient) : quotient;
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

/**
 * Tronc commun : mémoïse, puis aiguille vers la récursion débile ou le bitwise
 * selon la méthode active. La récursion peut jeter un RangeError : on le laisse
 * remonter jusqu'au worker, c'est lui qui décide de relancer autrement.
 */
abstract class BaseOp implements Operation {
  protected abstract tag: string;
  protected abstract recurse(a: number, b: number, acc?: number): number;
  protected abstract bitwise(a: number, b: number): number;

  execute(a: number, b: number): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    const key = makeKey(this.tag, a, b);
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    const result =
      METHOD === "bitwise" ? this.bitwise(a, b) : this.recurse(a, b);

    memo.set(key, result);
    return result;
  }
}

export class Addition extends BaseOp {
  protected tag = "add";

  protected recurse(a: unknown, b: unknown, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    if (OperationUtils.isZero(b)) {
      return acc + a;
    }
    return this.recurse(
      OperationUtils.addOne(a) as number,
      OperationUtils.subOne(b) as number,
      acc
    );
  }

  protected bitwise(a: number, b: number): number {
    return addBits(a, b);
  }
}

export class Subtraction extends BaseOp {
  protected tag = "sub";

  protected recurse(a: unknown, b: unknown, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    if (OperationUtils.isZero(b)) {
      return acc + a;
    }
    return this.recurse(
      OperationUtils.subOne(a) as number,
      OperationUtils.subOne(b) as number,
      acc
    );
  }

  protected bitwise(a: number, b: number): number {
    return subBits(a, b);
  }
}

export class Multiplication extends BaseOp {
  protected tag = "mul";

  protected recurse(a: unknown, b: unknown, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    if (OperationUtils.isZero(b)) {
      return acc;
    } else if ((b as number) < 0) {
      return -this.recurse(a, -(b as number), acc);
    }
    return this.recurse(
      a,
      OperationUtils.subOne(b) as number,
      new Addition().execute(acc as number, a as number)
    );
  }

  protected bitwise(a: number, b: number): number {
    return mulBits(a, b);
  }
}

export class Division extends BaseOp {
  protected tag = "div";

  protected recurse(a: number, b: number, acc: number = 0): number {
    OperationUtils.isNumber(a);
    OperationUtils.isNumber(b);

    if (OperationUtils.isZero(b)) {
      throw new Error(useTranslation().errors.divisionByZero);
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
      result = this.recurse(
        new Subtraction().execute(dividend, divisor),
        divisor,
        OperationUtils.addOne(acc) as number
      );
    }

    return negativeResult ? -result : result;
  }

  protected bitwise(a: number, b: number): number {
    return divBits(a, b);
  }
}
