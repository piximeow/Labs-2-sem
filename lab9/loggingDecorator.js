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