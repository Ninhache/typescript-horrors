import { TypedLeafsVocabData } from "../types";

const _: "" = "";

const en = {
  welcome: {
    prompt: "Welcome to the worst compute machine you'll find that week",
  },
  question: {
    compute:
      "ask for a calculus coward.. don't be too hard with me or I'll leave..",
  },
  info: {
    fallback:
      "ok it blew up the stack.. fine, I'll do it the boring way that actually works..",
    giveUp: "no clue how to do that, but hey, the CPU got nice and warm",
  },
  errors: {
    divisionByZero: "division by zero doesnt exist",
    mismatchedParentheses: "Mismatched Parentheses",
    invalidPostfix: "Invalid post fix",
    tooManyOperands: "Too many operands",
    invalidToken: "Invalid token",
    insufficientOperands: "Operand isnt supported",
    unsupportedOperator: "Operator isnt supported",
    unknownError: "I think i'll leave",
  },
} as const satisfies TypedLeafsVocabData<"__SCANNED__">;

export default en;
