class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  info(message) {
    console.log(`[INFO][${this.prefix}] ${message}`);
  }

  warn(message) {
    console.warn(`[WARN][${this.prefix}] ${message}`);
  }

  error(message, error) {
    console.error(`[ERROR][${this.prefix}] ${message}`, error || '');
  }

  debug(message) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG][${this.prefix}] ${message}`);
    }
  }
}

module.exports = Logger;