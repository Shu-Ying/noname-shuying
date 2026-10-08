const secretKey = /password|passwd|secret|token|cookie|authorization|api[_-]?key|credential/i;

export function cleanText(value, limit = 8192) {
  let text;
  try { text = String(value); } catch { return "[unreadable]"; }
  const truncated = text.length > limit;
  text = text.slice(0, limit);
  text = text.replace(/([?&](?:token|key|api[_-]?key|access_token|password|secret|auth)[a-z0-9_-]*=)[^&#\s]*/gi,
    "$1[redacted]");
  text = text.replace(/((?:Bearer|Basic)\s+)[\w.+\/=-]+/gi, "$1[redacted]");
  text = text.replace(/\b(?:https?|ftp):\/\/[^\s/?#]*/gi, (url, offset, source) => {
    const schemeEnd = url.indexOf("://") + 3;
    const at = url.lastIndexOf("@");
    if (at >= schemeEnd) return url.slice(0, schemeEnd) + "[redacted]@" + url.slice(at + 1);
    if (truncated && offset + url.length === source.length
        && url.slice(schemeEnd).includes(":")) return url.slice(0, schemeEnd) + "[redacted]";
    return url;
  });
  return !truncated && text.length <= limit ? text : text.slice(0, limit) + "[truncated]";
}

function read(object, key) {
  try { return object[key]; } catch { return "[unreadable]"; }
}

export function snapshot(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "string") return cleanText(value, 2048);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value !== "object") return cleanText(value, 256);
  if (seen.has(value)) return "[circular]";
  if (depth >= 5) return "[depth limit]";
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.slice(0, 32).map(item => snapshot(item, depth + 1, seen));
    if (value.length > 32) result.push(`[${value.length - 32} more items]`);
    return result;
  }
  let keys;
  try { keys = Object.keys(value); } catch { return "[unreadable]"; }
  const result = {};
  for (const key of keys.slice(0, 40)) {
    if (key === "__proto__" || key === "constructor") continue;
    result[key] = secretKey.test(key) ? "[redacted]"
      : snapshot(read(value, key), depth + 1, seen);
  }
  if (keys.length > 40) result.truncatedKeys = keys.length - 40;
  return result;
}

export function serializeError(error, depth = 0, seen = new WeakSet(),
  budget = { nodes: 0, characters: 32768 }) {
  if (++budget.nodes > 32 || budget.characters <= 0) {
    return { name: "TruncatedError", message: "[error size limit]" };
  }
  const text = (value, limit = 8192) => {
    const result = cleanText(value, Math.max(0, Math.min(limit, budget.characters)));
    budget.characters -= result.length;
    return result;
  };
  if (!error || typeof error !== "object") {
    return { name: "ThrownValue", message: text(error) };
  }
  if (seen.has(error)) return { name: "CircularError", message: "[circular]" };
  if (depth >= 5) return { name: "TruncatedError", message: "[depth limit]" };
  seen.add(error);
  const result = {
    name: text(read(error, "name") || "Error", 128),
    message: text(read(error, "message") || error),
    stack: text(read(error, "stack") || "", 16384),
  };
  for (const key of ["code", "operationUncertain"]) {
    const value = read(error, key);
    if (value !== undefined) result[key] = snapshot(value);
  }
  const cause = read(error, "cause");
  if (cause !== undefined) result.cause = serializeError(cause, depth + 1, seen, budget);
  const errors = read(error, "errors");
  if (Array.isArray(errors)) {
    result.errors = errors.slice(0, 16).map(item =>
      serializeError(item, depth + 1, seen, budget));
    if (errors.length > 16) result.truncatedErrors = errors.length - 16;
  }
  return result;
}

function decode(value) {
  let text = cleanText(value, 32768).replace(/\\/g, "/");
  for (let count = 0; count < 2; count++) {
    try { text = decodeURIComponent(text); } catch { break; }
  }
  return text;
}

export function extensionSource(value, roots = []) {
  if (typeof value !== "string" || !value) return false;
  const source = cleanText(value, 32768).replace(/\\/g, "/").trim();
  const url = source.match(/(?:file|https?):\/\/[^\n]+/i)?.[0];
  const native = source.match(/[a-z]:\/[^\n]+/i)?.[0];
  const candidate = decode((url || native || source)
    .replace(/\)\s*$/, "").split(/[?#]/, 1)[0]);
  if (roots.some(root => {
    const base = decode(root).split(/[?#]/, 1)[0];
    return base && (candidate.startsWith(base)
      || (base.startsWith("file:") && candidate.startsWith(base.replace(/^file:\/+/, ""))));
  })) return true;
  if (/^(?:\.?\/)?extension\/术樱包\//.test(candidate)) return true;
  return !roots.length && /\/extension\/术樱包\//.test(candidate);
}

export function extensionError(error, roots = [], depth = 0) {
  if (!error || typeof error !== "object" || depth >= 5) return false;
  const stack = read(error, "stack");
  if (typeof stack === "string" && stack.split("\n").slice(1).some(line =>
    /(?:\bat\s|@)/.test(line) && extensionSource(line, roots))) return true;
  if (extensionSource(read(error, "fileName"), roots)) return true;
  if (extensionError(read(error, "cause"), roots, depth + 1)) return true;
  const errors = read(error, "errors");
  return Array.isArray(errors) && errors.slice(0, 16).some(item =>
    extensionError(item, roots, depth + 1));
}

export function byteLength(text) {
  if (typeof TextEncoder === "function") return new TextEncoder().encode(text).length;
  return new Blob([text]).size;
}
