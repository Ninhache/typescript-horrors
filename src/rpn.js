"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const operations_1 = require("./operations");
const node_readline_1 = __importDefault(require("node:readline"));
class OperatorFactory {
    static getOperation(operator) {
        const operation = this.operators[operator];
        if (!operation) {
            throw new Error(`Unsupported operator: ${operator}`);
        }
        return operation;
    }
}
OperatorFactory.operators = {
    "+": new operations_1.Addition(),
    "-": new operations_1.Subtraction(),
    "*": new operations_1.Multiplication(),
    "/": new operations_1.Division(),
};
class RPNCalculator {
    constructor() {
        this.stack = [];
    }
    evaluate(expression) {
        const tokens = expression.split(" ");
        tokens.forEach((token) => {
            if (this.isNumber(token)) {
                this.stack.push(parseFloat(token));
            }
            else if (this.isOperator(token)) {
                const b = this.stack.pop();
                const a = this.stack.pop();
                if (a === undefined || b === undefined) {
                    throw new Error("insufficient operands");
                }
                const operation = OperatorFactory.getOperation(token);
                this.stack.push(operation.execute(a, b));
            }
            else {
                throw new Error(`invalid token: ${token}`);
            }
        });
        if (this.stack.length !== 1) {
            throw new Error("too many operands");
        }
        return this.stack.pop();
    }
    isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
    }
    isOperator(value) {
        return ["+", "-", "*", "/"].includes(value);
    }
}
class InfixToPostfixConverter {
    constructor() {
        this.precedence = {
            "+": 1,
            "-": 1,
            "*": 2,
            "/": 2,
        };
    }
    isOperator(value) {
        return ["+", "-", "*", "/"].includes(value);
    }
    hasHigherPrecedence(op1, op2) {
        return this.precedence[op1] >= this.precedence[op2];
    }
    convert(expression) {
        const tokens = expression.match(/\d+|\+|\-|\*|\/|\(|\)/g);
        if (!tokens) {
            throw new Error("invalid postfix");
        }
        const output = [];
        const operators = [];
        tokens.forEach((token) => {
            if (!isNaN(Number(token))) {
                output.push(token);
            }
            else if (this.isOperator(token)) {
                while (operators.length &&
                    operators[operators.length - 1] !== "(" &&
                    this.hasHigherPrecedence(operators[operators.length - 1], token)) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
            else if (token === "(") {
                operators.push(token);
            }
            else if (token === ")") {
                while (operators.length && operators[operators.length - 1] !== "(") {
                    output.push(operators.pop());
                }
                if (operators[operators.length - 1] === "(") {
                    operators.pop();
                }
                else {
                    throw new Error("mismatched parentheses");
                }
            }
        });
        while (operators.length) {
            output.push(operators.pop());
        }
        return output.join(" ");
    }
}
const calculator = new RPNCalculator();
const converter = new InfixToPostfixConverter();
try {
    const rl = node_readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question(`Entre ton calcul connard: `, (input) => {
        try {
            const postfixExpression = converter.convert(input);
            console.log("postfix", postfixExpression);
            const result = calculator.evaluate(postfixExpression);
            console.log("res", result);
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Error:", error.message);
            }
            else {
                console.error("bordel de merde");
            }
        }
        rl.close();
    });
}
catch (error) {
    if (error instanceof Error) {
        console.error(error.message);
    }
    else {
        console.error("418 I'm a teapot");
    }
}
