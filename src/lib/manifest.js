import fs from 'node:fs';
import path from 'node:path';
import { CliError } from './errors.js';
import { readJsonFile } from './files.js';

const VALID_ACCESS = new Set(['MYSELF', 'DOMAIN', 'ANYONE', 'ANYONE_ANONYMOUS']);
const VALID_EXECUTE_AS = new Set(['USER_ACCESSING', 'USER_DEPLOYING']);

export const DEFAULT_WEBAPP_CONFIG = {
  access: 'MYSELF',
  executeAs: 'USER_DEPLOYING'
};

export function prepareWebappManifest(projectDir, claspConfig) {
  const rootDir = typeof claspConfig.rootDir === 'string' ? claspConfig.rootDir : '.';
  const manifestPath = path.resolve(projectDir, rootDir, 'appsscript.json');

  if (!fs.existsSync(manifestPath)) {
    throw new CliError(`Missing Apps Script manifest: ${manifestPath}`);
  }

  const manifest = readJsonFile(manifestPath);
  const current = manifest.webapp;

  if (current !== undefined && (current === null || typeof current !== 'object' || Array.isArray(current))) {
    throw new CliError('appsscript.json contains an invalid webapp configuration.');
  }

  const webapp = {
    ...DEFAULT_WEBAPP_CONFIG,
    ...(current || {})
  };

  if (!VALID_ACCESS.has(webapp.access)) {
    throw new CliError(`appsscript.json contains an invalid webapp.access value: ${webapp.access}`);
  }

  if (!VALID_EXECUTE_AS.has(webapp.executeAs)) {
    throw new CliError(`appsscript.json contains an invalid webapp.executeAs value: ${webapp.executeAs}`);
  }

  const changed = !current || current.access === undefined || current.executeAs === undefined;
  const nextManifest = changed ? { ...manifest, webapp } : manifest;

  return {
    path: manifestPath,
    manifest: nextManifest,
    webapp,
    changed
  };
}

export function writePreparedManifest(prepared, options = {}) {
  if (prepared.changed && !options.dryRun) {
    fs.writeFileSync(prepared.path, `${JSON.stringify(prepared.manifest, null, 2)}\n`, 'utf8');
  }

  return {
    action: prepared.changed ? 'updated' : 'unchanged',
    path: prepared.path,
    webapp: prepared.webapp
  };
}
