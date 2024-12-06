import { TypedLeafsVocabData } from "../types";

const _: "" = "";

const fr = {
  welcome: {
    prompt: "Bienvenue sur la calculatrice la moins performante de la semaine.",
  },
  question: {
    compute:
      "Pose moi un calcul connard!! (pas trop grand où je quitte le programme..): ",
  },
  errors: {
    divisionByZero: "La division par 0 n'existe pas",
    mismatchedParentheses: "Problèmes de parenthèses",
    invalidPostfix: "Postfix invalide",
    tooManyOperands: "TROP d'opérandes",
    invalidToken: "Token invalide",
    insufficientOperands: "Pas assez d'operands",
    unsupportedOperator: "Connait po l'opérator",
    unknownError: "Bon euh, il est tard.. allons dormir..",
  },
} as const satisfies TypedLeafsVocabData<"__SCANNED__">;

export default fr;
