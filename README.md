## ultra rpn calculator using ultimate recursion for ultime performances

all is in the title, i can't explain more..
main features are :

- reverse polish notation
- infix notation to the current reverse polish notation we're using
- inclusive i18n
- usefull & custom utility types
- crashes
- self healing crashes (it crashes UP now)
- fast af AND falsy
- approved by pairs

## how to run it

real simple, dont overthink :

```bash
yarn install
yarn dev
```

then type a calculus, the program ask you nicely..

### when it crashes (it will), it crashes UP

it used to just die. now its smarter about being dumb : the program is a
supervisor that run the calcul in a child process and climb a ladder each time
the stack blow up :

1. pure recursion, default stack
2. pure recursion, stack at 80% of the os limit
3. bitwise, default stack
4. bitwise, stack at 80% of the os limit
5. gives up politely ("the cpu got nice and warm")

each rung is its own process, so even a segfault dont kill the supervisor : it
just notice the child died and climb higher. we stay UNDER the os stack limit
(80%) on purpose, thats how we dodge node's lovely uncatchable segfault.

### why is it fast now ??

cause once the recursion give up, the bitwise method is O(log n) (like ~32
little operations) instead of recursing one by one a million time. so it finish
instantly.

the catch : bitwise works in 32 bits, so anything bigger than 2^31 wrap around
and give you a confidently wrong answer. fast af AND falsy. its a feature not a
bug.

### ⚠️ run in winter only

this thing brute force arithmetic by respawning node and reheating the whole
stack on every rung. translation : it make your cpu sweat. running it in summer
is a fire hazard and a war crime. recommanded ambiant temperature : below 5°C,
window open, mug of something hot nearby. basically a space heater that also do
maths, sometimes correctly.
