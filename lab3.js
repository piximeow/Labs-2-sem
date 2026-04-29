function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  };
}

function memoize(fn, options = {}) {
  const { maxSize = Infinity } = options;
  const cache = new Map();

  function evictIfNeeded() {
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
  }

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);

    evictIfNeeded();
    cache.set(key, result);

    return result;
  };
}

function memoize(fn, options = {}) {
  const { maxSize = Infinity } = options;
  const cache = new Map();

  function evictIfNeeded() {
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
  }

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key).value;
    }

    const result = fn(...args);

    evictIfNeeded();

    cache.set(key, {
      value: result,
      time: Date.now(),
      freq: 1
    });

    return result;
  };
}

function memoize(fn, options = {}) {
  const { maxSize = Infinity, policy = "lru" } = options;
  const cache = new Map();

  function evict() {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      const entry = cache.get(key);

      entry.freq++;
      entry.time = Date.now();

      if (policy === "lru") {
        cache.delete(key);
        cache.set(key, entry);
      }

      return entry.value;
    }

    if (cache.size >= maxSize) evict();

    const result = fn(...args);

    cache.set(key, {
      value: result,
      time: Date.now(),
      freq: 1
    });

    return result;
  };
}