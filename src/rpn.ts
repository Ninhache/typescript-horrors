import { useTranslation } from "./i18n/i18n";
import {
  Addition,
  Division,
  Multiplication,
  Operation,
  Operator,
  OPERATORS,
  Subtraction,
} from "./operations";

import readline from "node:readline";

class OperatorFactory {
  private static operators: Record<Operator, Operation> = {
    "+": new Addition(),
    "-": new Subtraction(),
    "*": new Multiplication(),
    "/": new Division(),
  };

  static getOperation(operator: Operator): Operation {
    const operation = this.operators[operator];
    if (!operation) {
      throw new Error(
        `${useTranslation().errors.unsupportedOperator}: ${operator}`
      );
    }
    return operation;
  }
}

class RPNCalculator {
  private stack: number[] = [];

  evaluate(expression: string): number {
    const tokens = expression.split(" ");

    tokens.forEach((token) => {
      if (this.isNumber(token)) {
        this.stack.push(parseFloat(token));
      } else if (this.isOperator(token)) {
        const b = this.stack.pop();
        const a = this.stack.pop();

        if (a === undefined || b === undefined) {
          throw new Error(useTranslation().errors.insufficientOperands);
        }

        const operation = OperatorFactory.getOperation(token as Operator);
        this.stack.push(operation.execute(a, b));
      } else {
        throw new Error(`${useTranslation().errors.invalidToken}: ${token}`);
      }
    });

    if (this.stack.length !== 1) {
      throw new Error(useTranslation().errors.tooManyOperands);
    }

    return this.stack.pop()!;
  }

  private isNumber(value: string): boolean {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  }

  private isOperator(value: string): boolean {
    return OPERATORS.includes(value as Operator);
  }
}

class InfixToPostfixConverter {
  private precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
  };

  private isOperator(value: string): boolean {
    return ["+", "-", "*", "/"].includes(value);
  }

  private hasHigherPrecedence(op1: string, op2: string): boolean {
    return this.precedence[op1] >= this.precedence[op2];
  }

  convert(expression: string): string {
    const tokens = expression.match(/\d+|\+|\-|\*|\/|\(|\)/g);
    if (!tokens) {
      throw new Error(useTranslation().errors.invalidPostfix);
    }

    const output: string[] = [];
    const operators: string[] = [];

    tokens.forEach((token) => {
      if (!isNaN(Number(token))) {
        output.push(token);
      } else if (this.isOperator(token)) {
        while (
          operators.length &&
          operators[operators.length - 1] !== "(" &&
          this.hasHigherPrecedence(operators[operators.length - 1], token)
        ) {
          output.push(operators.pop()!);
        }
        operators.push(token);
      } else if (token === "(") {
        operators.push(token);
      } else if (token === ")") {
        while (operators.length && operators[operators.length - 1] !== "(") {
          output.push(operators.pop()!);
        }
        if (operators[operators.length - 1] === "(") {
          operators.pop();
        } else {
          throw new Error(useTranslation().errors.mismatchedParentheses);
        }
      }
    });

    while (operators.length) {
      output.push(operators.pop()!);
    }

    return output.join(" ");
  }
}

const calculator = new RPNCalculator();
const converter = new InfixToPostfixConverter();

try {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(useTranslation().question.compute, (input) => {
    try {
      const postfixExpression = converter.convert(input);
      const result = calculator.evaluate(postfixExpression);

      console.log("result:", result);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      } else {
        console.error(useTranslation().errors.unknownError);
      }
    }
    rl.close();
  });
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("418 I'm a teapot");
  }
}
