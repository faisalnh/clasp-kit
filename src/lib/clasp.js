import { spawnSync } from 'node:child_process';
import { CliError } from './errors.js';
import { verbose } from './logger.js';

function formatCommand(command, args = []) {
  return [command, ...args].join(' ');
}

export function commandExists(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return !result.error && result.status === 0;
}

export function requireCommand(command, installHint) {
  if (!commandExists(command)) {
    throw new CliError(`${command} was not found. ${installHint}`);
  }
}

export function requireClaspVersion(minimumMajor = 3, options = {}) {
  const capture = options.runClaspCapture || runClaspCapture;
  let result;

  try {
    result = capture(['--version'], { capture: true, allowFailure: true });
  } catch {
    throw new CliError('clasp was not found. Install it with: npm install -g @google/clasp@^3');
  }

  const output = String(result.stdout || result.stderr || '').trim();
  const match = output.match(/(\d+)\.(\d+)\.(\d+)/);

  if (result.status !== 0 || !match) {
    throw new CliError('Could not determine the installed clasp version.');
  }

  if (Number(match[1]) < minimumMajor) {
    throw new CliError(`clasp ${minimumMajor} or newer is required. Installed version: ${match[0]}`);
  }

  return match[0];
}

export function runCommand(command, args = [], options = {}) {
  const display = formatCommand(command, args);

  if (options.dryRun) {
    console.log(`[dry-run] ${display}`);
    return { status: 0, stdout: '', stderr: '' };
  }

  verbose(`Running ${display}`);

  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });

  if (result.error) {
    throw new CliError(`Failed to run ${display}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    if (options.allowFailure) {
      return result;
    }

    throw new CliError(`${display} failed with exit code ${result.status}.`, result.status || 1);
  }

  return result;
}

export function runClasp(args = [], options = {}) {
  return runCommand('clasp', args, options);
}

export function runClaspCapture(args = [], options = {}) {
  return runClasp(args, { ...options, capture: true });
}

export function parseVersionNumber(output) {
  const patterns = [
    /Created version\s+(\d+)/i,
    /Version\s+(\d+)\s+created/i,
    /\bversion\s+(\d+)\b/i
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
