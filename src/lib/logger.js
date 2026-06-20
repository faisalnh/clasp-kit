let verboseEnabled = false;

export function setVerbose(value) {
  verboseEnabled = Boolean(value);
}

export function log(message = '') {
  console.log(message);
}

export function info(message) {
  console.log(message);
}

export function success(message) {
  console.log(`Success: ${message}`);
}

export function warn(message) {
  console.warn(`Warning: ${message}`);
}

export function error(message) {
  console.error(`Error: ${message}`);
}

export function verbose(message) {
  if (verboseEnabled) {
    console.log(`Verbose: ${message}`);
  }
}
