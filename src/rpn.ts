import readline from "node:readline";
import { spawnSync, SpawnSyncReturns } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { InfixToPostfixConverter } from "./calculator";
import { useTranslation } from "./i18n/i18n";
import { Method } from "./operations";

/**
 * Fraction de la pile OS qu'on s'autorise à demander à V8. On reste SOUS la
 * limite OS : au-dessus, V8 ne déclenche pas son garde-fou avant la vraie pile
 * et Node segfault (non catchable). À 80% on garde une marge => RangeError
 * propre, rattrapable, et surtout pas de segfault de merde.
 */
const STACK_BUDGET_RATIO: 0.8 = 0.8 as const;
const DEFAULT_STACK_KB: 8192 = 8192 as const; // si on n'arrive pas à lire la pile OS
const BYTES_PER_KB: 1024 = 1024 as const;

/** Code de sortie convenu avec le worker : "j'ai dépassé la pile, réessaie". */
const EXIT_STACK_OVERFLOW: 42 = 42 as const;
const EXIT_OK: 0 = 0 as const;

/** Lit la taille de pile OS (soft limit) en KB. Linux d'abord, puis ulimit. */
function osStackKB(): number {
  try {
    const limits: string = readFileSync("/proc/self/limits", "utf8");
    const line: string | undefined = limits
      .split("\n")
      .find((l: string): boolean => l.toLowerCase().startsWith("max stack size"));
    if (line) {
      const soft: string = line
        .replace(/max stack size/i, "")
        .trim()
        .split(/\s+/)[0];
      if (soft && soft !== "unlimited") {
        const bytes: number = parseInt(soft, 10);
        return Math.floor(bytes / BYTES_PER_KB);
      }
    }
  } catch {
    /* pas de /proc, on tente ulimit */
  }

  try {
    const probe: SpawnSyncReturns<string> = spawnSync("sh", ["-c", "ulimit -s"], {
      encoding: "utf8",
    });
    const out: string = (probe.stdout ?? "").trim();
    const kb: number = parseInt(out, 10);
    if (!isNaN(kb)) {
      return kb;
    }
  } catch {
    /* tant pis */
  }

  return DEFAULT_STACK_KB;
}

type Rung = {
  readonly method: Method;
  readonly bigStack: boolean;
  readonly label: string;
};

/**
 * L'échelle. On commence par l'horreur récursive sur la pile par défaut, et on
 * monte en puissance à chaque échec : plus de pile, puis le bitwise, puis le
 * bitwise avec plus de pile. Si même ça pète : on admet qu'on sait pas faire.
 */
const RUNGS: readonly Rung[] = [
  { method: "recurse", bigStack: false, label: "récursion pure, pile par défaut" },
  { method: "recurse", bigStack: true, label: "récursion pure, pile à 80% de l'OS" },
  { method: "bitwise", bigStack: false, label: "bitwise, pile par défaut" },
  { method: "bitwise", bigStack: true, label: "bitwise, pile à 80% de l'OS" },
] as const;

type Attempt =
  | { readonly kind: "ok"; readonly value: number }
  | { readonly kind: "overflow" } // pile dépassée (RangeError ou segfault) => on monte d'un cran
  | { readonly kind: "fatal"; readonly message: string }; // vraie erreur de calcul => inutile d'insister

/** Lance un barreau dans un process enfant et interprète sa mort. */
function runRung(postfix: string, rung: Rung, stackKB: number): Attempt {
  const flags: readonly string[] = rung.bigStack
    ? ([`--stack-size=${stackKB}`] as const)
    : ([] as const);
  const worker: string = join(__dirname, "worker.js");

  const res: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    [...flags, worker],
    {
      env: { ...process.env, RPN_POSTFIX: postfix, RPN_METHOD: rung.method },
      encoding: "utf8",
    }
  );

  if (res.status === EXIT_OK) {
    const match: RegExpMatchArray | null = (res.stdout ?? "").match(
      /RESULT:(-?\d+(?:\.\d+)?)/
    );
    if (match) {
      const value: number = Number(match[1]);
      return { kind: "ok", value };
    }
  }

  // Tué par un signal (SIGSEGV...) ou code 42 => la pile a explosé, on escalade.
  if (res.signal !== null || res.status === EXIT_STACK_OVERFLOW) {
    return { kind: "overflow" };
  }

  // Sinon c'est une vraie erreur de calcul (div par 0, token invalide...).
  const message: string = (res.stderr ?? res.stdout ?? "").trim();
  return { kind: "fatal", message };
}

const converter: InfixToPostfixConverter = new InfixToPostfixConverter();
const stackKB: number = Math.floor(osStackKB() * STACK_BUDGET_RATIO);

try {
  const rl: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(useTranslation().question.compute, (input: string): void => {
    try {
      const postfix: string = converter.convert(input);

      let solved: boolean = false;
      for (let i: number = 0; i < RUNGS.length; i++) {
        const rung: Rung = RUNGS[i];
        const stackInfo: string = rung.bigStack ? ` (${stackKB} KB)` : "";
        console.log(
          `-> tentative ${i + 1}/${RUNGS.length} : ${rung.label}${stackInfo}`
        );

        const attempt: Attempt = runRung(postfix, rung, stackKB);

        if (attempt.kind === "ok") {
          console.log("result:", attempt.value);
          solved = true;
          break;
        }
        if (attempt.kind === "fatal") {
          console.error("Error:", attempt.message);
          solved = true;
          break;
        }
        // overflow : on souffle un coup et on monte d'un barreau
        console.warn(useTranslation().info.fallback);
      }

      if (!solved) {
        console.error(useTranslation().info.giveUp);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      } else {
        console.error(useTranslation().errors.unknownError);
      }
    }
    rl.close();
  });
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("418 I'm a teapot");
  }
}
