/**
 * Logger utility for the Ref Finance agent
 */

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Logger interface
 */
export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

/**
 * Console implementation of the Logger interface
 */
export class ConsoleLogger implements Logger {
  private readonly prefix: string;
  private readonly debugEnabled: boolean;

  constructor(prefix: string = 'RefAgent', debugEnabled: boolean = false) {
    this.prefix = prefix;
    this.debugEnabled = debugEnabled;
  }

  /**
   * Log an informational message
   */
  public info(message: string): void {
    console.log(`${COLORS.blue}[${this.prefix}] INFO:${COLORS.reset} ${message}`);
  }

  /**
   * Log a success message
   */
  public success(message: string): void {
    console.log(`${COLORS.green}[${this.prefix}] SUCCESS:${COLORS.reset} ${message}`);
  }

  /**
   * Log a warning message
   */
  public warn(message: string): void {
    console.log(`${COLORS.yellow}[${this.prefix}] WARNING:${COLORS.reset} ${message}`);
  }

  /**
   * Log an error message
   */
  public error(message: string): void {
    console.error(`${COLORS.red}[${this.prefix}] ERROR:${COLORS.reset} ${message}`);
  }

  /**
   * Log a debug message (only when debug is enabled)
   */
  public debug(message: string): void {
    if (this.debugEnabled) {
      console.log(`${COLORS.dim}[${this.prefix}] DEBUG:${COLORS.reset} ${message}`);
    }
  }
}

/**
 * Create a new logger instance
 */
export function createLogger(prefix: string = 'RefAgent', debugEnabled: boolean = false): Logger {
  return new ConsoleLogger(prefix, debugEnabled);
}

/**
 * Default logger instance
 */
export const logger = createLogger(); 