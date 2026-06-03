import { RPNCalculator } from "./calculator";
import { isStackOverflow, Method, setMethod } from "./operations";

/**
 * Le worker, c'est UN barreau de l'échelle. Le superviseur (rpn.ts) le relance
 * en process séparé avec une méthode + une taille de pile données, via deux
 * variables d'env. Codes de sortie convenus avec le superviseur :
 *   0   -> calcul réussi, le résultat est sur stdout ("RESULT:<n>")
 *   42  -> on a dépassé la pile (RangeError) => le superviseur peut réessayer
 *   1   -> vraie erreur de calcul (div par 0, token foireux...) => terminal
 *   SIGSEGV (signal) -> la pile OS a explosé => le parent survit et réessaie
 */
const EXIT_OK: 0 = 0 as const;
const EXIT_STACK_OVERFLOW: 42 = 42 as const;
const EXIT_FATAL: 1 = 1 as const;
const DEFAULT_METHOD: Method = "recurse" as const;

const postfix: string = process.env.RPN_POSTFIX ?? "";
const method: Method = (process.env.RPN_METHOD as Method) ?? DEFAULT_METHOD;

setMethod(method);

try {
  const calculator: RPNCalculator = new RPNCalculator();
  const result: number = calculator.evaluate(postfix);
  process.stdout.write(`RESULT:${result}\n`);
  process.exit(EXIT_OK);
} catch (error: unknown) {
  if (isStackOverflow(error)) {
    process.exit(EXIT_STACK_OVERFLOW); // ça a pété la pile, le superviseur prend le relais
  }
  const message: string = error instanceof Error ? error.message : "??";
  process.stderr.write(message + "\n");
  process.exit(EXIT_FATAL);
}
