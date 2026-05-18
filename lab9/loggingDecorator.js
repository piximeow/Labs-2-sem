const LogLevel = Object.freeze({ DEBUG: "DEBUG", INFO: "INFO", ERROR: "ERROR" });

class PlainFormatter {
  format(record) {
    const { timestamp, level, fn, args, kwargs, result, error, elapsedMs } = record;
    const lines = [
      `[${timestamp}] [${level}] ${fn}`,
      `  args=${JSON.stringify(args)}  kwargs=${JSON.stringify(kwargs)}`,
      error ? `  !! ERROR: ${error}` : `  => ${JSON.stringify(result)}`,
    ];
    if (elapsedMs !== undefined) lines.push(`  ⏱  ${elapsedMs.toFixed(2)} ms`);
    return lines.join("\n");
  }
}
 
class JSONFormatter {
  format(record) {
    return JSON.stringify(record, null, 0);
  }
}

class ConsoleHandler {
  constructor(formatter = new PlainFormatter()) {
    this._fmt = formatter;
    this._levelMap = {
      [LogLevel.DEBUG]: "debug",
      [LogLevel.INFO]:  "info",
      [LogLevel.ERROR]: "error",
    };
  }
  emit(record) {
    const method = this._levelMap[record.level] || "log";
    console[method](this._fmt.format(record));
  }
}
 
class FileHandler {
  constructor(filepath, formatter = new PlainFormatter()) {
    this._filepath = filepath;
    this._fmt = formatter;
    try { this._fs = require("fs"); } catch { this._fs = null; }
  }
  emit(record) {
    const line = this._fmt.format(record) + "\n" + "-".repeat(60) + "\n";
    if (this._fs) {
      this._fs.appendFileSync(this._filepath, line, "utf8");
    } else {
      console.log(`[FileHandler → ${this._filepath}]`, line);
    }
  }
}

function buildRecord({ level, fn, args, kwargs, result, error, elapsedMs }) {
  return {
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 23),
    level,
    fn,
    args,
    kwargs,
    result:    result  ?? undefined,
    error:     error   ? String(error) : null,
    elapsedMs: elapsedMs ?? undefined,
  };
}
 
function emitAll(handlers, record) {
  for (const h of handlers) h.emit(record);
}

function log({
  level     = "INFO",
  handlers  = [new ConsoleHandler()],
  profile   = true,
  condition = null,
} = {}) {
  const lvl = level.toUpperCase();
 
  return function decorator(fn) {
    const isAsync = fn.constructor.name === "AsyncFunction";
    const name = fn.name || "anonymous";
 
    function shouldLog(...args) {
      return condition ? condition(...args) : true;
    }
 

    function syncWrapper(...args) {
      const kwargs = {}; 
      const t0 = profile ? performance.now() : null;
 
      if (lvl === LogLevel.ERROR) {
        try {
          const result = fn(...args);
          return result;
        } catch (err) {
          const elapsedMs = profile ? performance.now() - t0 : undefined;
          if (shouldLog(...args)) {
            emitAll(handlers, buildRecord({ level: lvl, fn: name, args, kwargs, error: err, elapsedMs }));
          }
          throw err;
        }
      } else {
        try {
          const result = fn(...args);
          const elapsedMs = profile ? performance.now() - t0 : undefined;
          if (shouldLog(...args)) {
            emitAll(handlers, buildRecord({ level: lvl, fn: name, args, kwargs, result, elapsedMs }));
          }
          return result;
        } catch (err) {
          const elapsedMs = profile ? performance.now() - t0 : undefined;
          if (shouldLog(...args)) {
            emitAll(handlers, buildRecord({ level: lvl, fn: name, args, kwargs, error: err, elapsedMs }));
          }
          throw err;
        }
      }
    }
 
    async function asyncWrapper(...args) {
      const kwargs = {};
      const t0 = profile ? performance.now() : null;
 
      if (lvl === LogLevel.ERROR) {
        try {
          const result = await fn(...args);
          return result;
        } catch (err) {
          const elapsedMs = profile ? performance.now() - t0 : undefined;
          if (shouldLog(...args)) {
            emitAll(handlers, buildRecord({ level: lvl, fn: name, args, kwargs, error: err, elapsedMs }));
          }
          throw err;
        }
      } else {
        try {
          const result = await fn(...args);
          const elapsedMs = profile ? performance.now() - t0 : undefined;
          if (shouldLog(...args)) {
            emitAll(handlers, buildRecord({ level: lvl, fn: name, args, kwargs, result, elapsedMs }));
          }
          return result;
        } catch (err) {
          const elapsedMs = profile ? performance.now() - t0 : undefined;
          if (shouldLog(...args)) {
            emitAll(handlers, buildRecord({ level: lvl, fn: name, args, kwargs, error: err, elapsedMs }));
          }
          throw err;
        }
      }
    }
 
    const wrapper = isAsync ? asyncWrapper : syncWrapper;
    Object.defineProperty(wrapper, "name", { value: name });
    return wrapper;
  };
}

const add = log({ level: "INFO" })(
  function add(a, b) { return a + b; }
);
 r
const multiply = log({
  level: "DEBUG",
  handlers: [new ConsoleHandler(new JSONFormatter())],
})(
  function multiply(x, y) { return x * y; }
);
 
const divide = log({ level: "ERROR" })(
  function divide(a, b) {
    if (b === 0) throw new Error("Cannot divide by zero");
    return a / b;
  }
);
 
const fetchData = log({ level: "INFO", profile: true })(
  async function fetchData(url) {
    await new Promise(r => setTimeout(r, 50));
    return `<response from ${url}>`;
  }
);
 
const maybeLog = log({
  level: "DEBUG",
  condition: (x, threshold = 0) => x > threshold,
})(
  function maybeLog(x, threshold = 0) { return `value=${x}`; }
);
 
const process_ = log({
  level: "INFO",
  handlers: [new ConsoleHandler(), new FileHandler("/tmp/app.log")],
})(
  function process_(data) {
    return `processed ${Object.keys(data).length} keys`;
  }
);
 
const structuredExample = log({
  level: "INFO",
  handlers: [new ConsoleHandler(new JSONFormatter())],
})(
  function structuredExample(name, value) {
    return { name, doubled: value * 2 };
  }
);