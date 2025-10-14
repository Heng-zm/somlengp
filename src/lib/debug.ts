const DEBUG = process.env.NODE_ENV === 'development';

export const debug = {
  log: (...args: unknown[]) => DEBUG && ,
  warn: (...args: unknown[]) => DEBUG && console.warn(...args),
  error: (...args: unknown[]) => console.error(...args), // Always show errors
  info: (...args: unknown[]) => DEBUG && ,
};
