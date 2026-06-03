## Ultra RPN Calculator using ultimate recursion for ultime performances

All is in the title, I can't explain more..
Main features are :

- Reverse Polish Notation
- Infix Notation to the current Reverse Polish Notation we're using
- Inclusive i18n
- Usefull & custom utility types
- Crashes
- Approved by pairs

## How to run it

Real simple, don't overthink :

```bash
yarn install
yarn dev
```

Then type a calculus, the program asks you nicely..

### When it crashes (it will)

`Maximum call stack size exceeded` ? That's the recursion being recursion.
Node's stack is 984 kB by default, so just give it more room :

```bash
node --stack-size=8000 dist/rpn.js
```

Bigger numbers = bigger `--stack-size`. At some point it segfaults instead of
crashing politely, that's the spirit of the project..
