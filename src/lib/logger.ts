type Level = "info" | "warn" | "error";

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, err?: unknown, meta?: Record<string, unknown>) => {
    const errMeta =
      err instanceof Error
        ? { error: err.message, stack: err.stack, name: err.name }
        : err !== undefined
        ? { error: String(err) }
        : {};
    emit("error", msg, { ...errMeta, ...(meta ?? {}) });
  },
};
