/**
 * Logger Service
 * A lightweight, structured logger built on top of console.
 * Outputs colored, prefixed log lines with timestamps and log levels.
 */

const ENV = process.env.NODE_ENV || "development";
const isDev = ENV !== "production";

// ─── ANSI Color Codes ─────────────────────────────────────────────────────────
const COLORS = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

// ─── Log Level Config ─────────────────────────────────────────────────────────
const LEVELS = {
    error: { label: "ERROR", color: COLORS.red, emoji: "❌" },
    warn: { label: "WARN", color: COLORS.yellow, emoji: "⚠️ " },
    info: { label: "INFO", color: COLORS.cyan, emoji: "ℹ️ " },
    debug: { label: "DEBUG", color: COLORS.magenta, emoji: "🔍" },
    http: { label: "HTTP", color: COLORS.green, emoji: "🌐" },
};

// ─── Formatter ────────────────────────────────────────────────────────────────
const format = (level, namespace, message) => {
    const now = new Date().toISOString();
    const { label, color, emoji } = LEVELS[level];
    const ns = namespace ? `${COLORS.dim}[${namespace}]${COLORS.reset} ` : "";
    return `${COLORS.dim}${now}${COLORS.reset} ${emoji} ${color}${COLORS.bold}${label}${COLORS.reset} ${ns}${message}`;
};

// ─── Logger Factory ───────────────────────────────────────────────────────────
/**
 * Creates a namespaced logger instance.
 * @param {string} [namespace=""]
 */
const createLogger = (namespace = "") => ({
    info(message, ...meta) {
        console.log(format("info", namespace, message));
        if (isDev && meta.length) console.log(...meta);
    },
    warn(message, ...meta) {
        console.warn(format("warn", namespace, message));
        if (isDev && meta.length) console.warn(...meta);
    },
    error(message, ...meta) {
        console.error(format("error", namespace, message));
        if (meta.length) {
            meta.forEach((m) => {
                if (isDev && m instanceof Error) console.error(m.stack);
                else console.error(m);
            });
        }
    },
    debug(message, ...meta) {
        if (!isDev) return;
        console.log(format("debug", namespace, message));
        if (meta.length) console.log(...meta);
    },
    http(message, ...meta) {
        console.log(format("http", namespace, message));
        if (isDev && meta.length) console.log(...meta);
    },
});

// ─── Root Logger (no namespace) ───────────────────────────────────────────────
const logger = createLogger();

module.exports = logger;
module.exports.createLogger = createLogger;
