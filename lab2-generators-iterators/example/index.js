import {
  fibonacciGenerator,
  counterGenerator,
  roundRobinGenerator,
  consumeWithTimeout
} from "lab2-generators-iterators";

console.log("\nFibonacci");
await consumeWithTimeout(fibonacciGenerator(), 5);

console.log("\nCounter");
await consumeWithTimeout(counterGenerator(10), 5);

console.log("\nRound Robin");
await consumeWithTimeout(
  roundRobinGenerator(["A", "B", "C"]),
  5
);