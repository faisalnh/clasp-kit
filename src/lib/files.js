import fs from 'node:fs';
import path from 'node:path';
import { CliError } from './errors.js';

export const GITIGNORE_LINES = [
  '.clasp.json',
  '.clasp-kit.json',
  '.clasprc.json',
  '.env',
  'node_modules/',
  '*.log'
];

export const CLASPIGNORE_CONTENT = `**/**
!appsscript.json
!*.js
!*.gs
!*.html
!*.json
.git/**
.github/**
node_modules/**
.clasp.json
.clasp-kit.json
.clasprc.json
.claspignore
.gitignore
.env
*.log
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
README.md
`;

export function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new CliError(`Could not read valid JSON from ${filePath}: ${err.message}`);
  }
}

export function readClaspConfig(projectDir = process.cwd()) {
  const filePath = path.join(projectDir, '.clasp.json');

  if (!fs.existsSync(filePath)) {
    throw new CliError('Missing .clasp.json. Run clasp-kit init <script-url-or-id> first.');
  }

  const config = readJsonFile(filePath);

  if (!config.scriptId || typeof config.scriptId !== 'string') {
    throw new CliError('.clasp.json does not contain a valid scriptId.');
  }

  return config;
}

export function writeClaspConfig(projectDir, scriptId, options = {}) {
  const filePath = path.join(projectDir, '.clasp.json');
  const result = { action: 'created', path: filePath };

  if (fs.existsSync(filePath)) {
    const existing = readJsonFile(filePath);

    if (existing.scriptId === scriptId) {
      return { action: 'unchanged', path: filePath };
    }

    if (!options.force) {
      throw new CliError(
        `.clasp.json already points to a different scriptId (${existing.scriptId}). Re-run with --force to replace it.`
      );
    }

    result.action = 'updated';
  }

  const content = `${JSON.stringify({ scriptId, rootDir: '.' }, null, 2)}\n`;

  if (!options.dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return result;
}

export function ensureGitignore(projectDir, options = {}) {
  const filePath = path.join(projectDir, '.gitignore');
  const exists = fs.existsSync(filePath);
  const original = exists ? fs.readFileSync(filePath, 'utf8') : '';
  const lines = original.split(/\r?\n/);
  const existing = new Set(lines.map((line) => line.trim()).filter(Boolean));
  const missing = GITIGNORE_LINES.filter((line) => !existing.has(line));

  if (missing.length === 0) {
    return { action: 'unchanged', path: filePath, added: [] };
  }

  const needsLeadingNewline = original.length > 0 && !original.endsWith('\n');
  const addition = `${needsLeadingNewline ? '\n' : ''}${missing.join('\n')}\n`;

  if (!options.dryRun) {
    fs.writeFileSync(filePath, `${original}${addition}`, 'utf8');
  }

  return { action: exists ? 'updated' : 'created', path: filePath, added: missing };
}

export function ensureClaspignore(projectDir, options = {}) {
  const filePath = path.join(projectDir, '.claspignore');
  const exists = fs.existsSync(filePath);

  if (exists && !options.force) {
    return { action: 'unchanged', path: filePath };
  }

  if (!options.dryRun) {
    fs.writeFileSync(filePath, CLASPIGNORE_CONTENT, 'utf8');
  }

  return { action: exists ? 'updated' : 'created', path: filePath };
}
