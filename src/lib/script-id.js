import { CliError } from './errors.js';

const SCRIPT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function validateScriptId(scriptId) {
  if (!scriptId || !SCRIPT_ID_PATTERN.test(scriptId)) {
    throw new CliError(`Invalid Apps Script ID: ${scriptId || '(empty)'}`);
  }

  return scriptId;
}

export function extractScriptId(input) {
  const value = String(input || '').trim();

  if (!value) {
    throw new CliError('Missing Apps Script URL or script ID.');
  }

  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);

    const projectsIndex = parts.indexOf('projects');
    if (projectsIndex !== -1 && parts[projectsIndex + 1]) {
      return validateScriptId(parts[projectsIndex + 1]);
    }

    const dIndex = parts.indexOf('d');
    if (dIndex !== -1 && parts[dIndex + 1]) {
      return validateScriptId(parts[dIndex + 1]);
    }

    throw new CliError(`Could not find an Apps Script ID in URL: ${value}`);
  } catch (err) {
    if (err instanceof CliError) {
      throw err;
    }

    return validateScriptId(value);
  }
}

export function devUrl(deploymentId) {
  return `https://script.google.com/macros/s/${deploymentId}/dev`;
}

export function execUrl(deploymentId) {
  return `https://script.google.com/macros/s/${deploymentId}/exec`;
}
