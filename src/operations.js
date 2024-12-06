"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Division = exports.Multiplication = exports.Subtraction = exports.Addition = void 0;
const node_console_1 = require("node:console");
const operators = ["+", "-", "*", "/"];
const ONE = 1;
class OperationUtils {
    one() {
        return ONE;
    }
    static isNumber(value) {
        (0, node_console_1.assert)(typeof value == "number");
    }
    static addOne(toInc) {
        OperationUtils.isNumber(toInc);
        return toInc + new OperationUtils().one();
    }
    static subOne(toSub) {
        return -this.addOne(-toSub);
    }
    static isZero(value) {
        this.isNumber(value);
        return value === 0;
    }
}
class Addition {
    execute(a, b) {
        OperationUtils.isNumber(a);
        OperationUtils.isNumber(b);
        if (OperationUtils.isZero(b)) {
            return a;
        }
        else {
            return this.execute(OperationUtils.addOne(a), OperationUtils.subOne(b));
        }
    }
}
exports.Addition = Addition;
class Subtraction {
    execute(a, b) {
        OperationUtils.isNumber(a);
        OperationUtils.isNumber(b);
        if (OperationUtils.isZero(b)) {
            return a;
        }
        else {
            return this.execute(OperationUtils.subOne(a), OperationUtils.subOne(b));
        }
    }
}
exports.Subtraction = Subtraction;
class Multiplication {
    execute(a, b) {
        OperationUtils.isNumber(a);
        OperationUtils.isNumber(b);
        if (OperationUtils.isZero(b))
            return 0;
        if (b < 0) {
            return -this.execute(a, -b);
        }
        return new Addition().execute(a, this.execute(a, OperationUtils.subOne(b)));
    }
}
exports.Multiplication = Multiplication;
class Division {
    execute(a, b) {
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
        const recurse = (x, y) => {
            if (x < y)
                return x / y;
            return OperationUtils.addOne(recurse(new Subtraction().execute(x, y), y));
        };
        const result = recurse(dividend, divisor);
        return negativeResult ? -result : result;
    }
}
exports.Division = Division;
// export class Division implements Operation {
//   execute(a: number, b: number): number {
//     OperationUtils.isNumber(a);
//     OperationUtils.isNumber(b);
//     if (OperationUtils.isZero(b)) {
//       throw new Error("division by zero isnt possible");
//     }
//     let negativeResult = false;
//     let dividend = a;
//     let divisor = b;
//     if (dividend < 0) {
//       dividend = -dividend;
//       negativeResult = !negativeResult;
//     }
//     if (divisor < 0) {
//       divisor = -divisor;
//       negativeResult = !negativeResult;
//     }
//     function divideRecursively(x: number, y: number): number {
//       if (x < y) return x / y;
//       return OperationUtils.addOne(
//         divideRecursively(new Subtraction().execute(x, y), y)
//       ) as number;
//     }
//     const result = divideRecursively(dividend, divisor);
//     return negativeResult ? -result : result;
//   }
// }
