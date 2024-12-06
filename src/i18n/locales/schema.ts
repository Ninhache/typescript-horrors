import { TypedLeafsVocabData } from "../types";

const _: NotScanned = "";

export default {
  welcome: {
    prompt: _,
  },
  question: {
    compute: _,
  },
  errors: {
    divisionByZero: _,
    mismatchedParentheses: _,
    invalidPostfix: _,
    tooManyOperands: _,
    invalidToken: _,
    insufficientOperands: _,
    unsupportedOperator: _,
    unknownError: _,
  },
} as const satisfies TypedLeafsVocabData<MaybeScanned>;

type NotScanned = "";
type Scanned = "__SCANNED__";
type MaybeScanned = NotScanned | Scanned;
