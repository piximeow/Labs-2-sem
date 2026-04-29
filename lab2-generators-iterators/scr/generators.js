export function* fibonacciGenerator() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

export function* counterGenerator(start = 0) {
  let i = start;
  while (true) {
    yield i++;
  }
}

export function* roundRobinGenerator(items) {
  let index = 0;
  while (true) {
    yield items[index % items.length];
    index++;
  }
}