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
    /\bversion\s+(\d+)\b/i,
    /\b(\d+)\b/
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function parseDeploymentId(output) {
  return parseDeploymentIds(output)[0] || null;
}

export function parseDeploymentIds(output) {
  const ids = new Set();
  const value = String(output || '');
  const patterns = [
    /Deployment\s+ID:\s*([A-Za-z0-9_-]+)/gi,
    /Created\s+deployment\s+([A-Za-z0-9_-]+)/gi,
    /\bdeployment\s+([A-Za-z0-9_-]{20,})\b/gi,
    /^-\s*([A-Za-z0-9_-]{20,})\b/gm,
    /\b(AKfycb[A-Za-z0-9_-]+)\b/g
  ];

  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) {
      ids.add(match[1]);
    }
  }

  return [...ids];
}

export function outputHasDeployments(output) {
  const value = String(output || '').trim();

  if (!value) {
    return false;
  }

  if (/no deployments/i.test(value)) {
    return false;
  }

  return parseDeploymentIds(value).length > 0 || /deployment/i.test(value) || /@[0-9]+/.test(value);
}
