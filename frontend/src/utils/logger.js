// Tiny namespaced logger.
// debug/info: silent in production unless `localStorage.debug === 'true'`.
// warn/error: always on.

const isDev = process.env.NODE_ENV !== "production";

const debugFlag = () => {
  try {
    return (
      typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem("debug") === "true"
    );
  } catch {
    return false;
  }
};

const verbose = () => isDev || debugFlag();

const make = (ns) => {
  const prefix = `[${ns}]`;
  return {
    debug: (...args) => {
      if (verbose()) console.debug(prefix, ...args);
    },
    info: (...args) => {
      if (verbose()) console.info(prefix, ...args);
    },
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
};

export const uiLog = make("ui");
export const txLog = make("tx");
export const netLog = make("net");
export const walletLog = make("wallet");
