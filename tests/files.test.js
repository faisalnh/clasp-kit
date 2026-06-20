import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CLASPIGNORE_CONTENT,
  GITIGNORE_LINES,
  ensureClaspignore,
  ensureGitignore,
  readClaspConfig,
  writeClaspConfig
} from '../src/lib/files.js';

const SCRIPT_ID = 'abc123_DEF-456';

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'clasp-kit-test-'));
}

test('.gitignore preserves existing content and appends missing defaults', () => {
  const dir = tempProject();
  const gitignorePath = path.join(dir, '.gitignore');

  fs.writeFileSync(gitignorePath, 'dist/\n.env\n', 'utf8');

  const result = ensureGitignore(dir);
  const content = fs.readFileSync(gitignorePath, 'utf8');

  assert.equal(result.action, 'updated');
  assert.match(content, /^dist\//);
  assert.equal((content.match(/\.env/g) || []).length, 1);

  for (const line of GITIGNORE_LINES) {
    assert.ok(content.includes(line), `expected .gitignore to include ${line}`);
  }
});

test('.gitignore is unchanged when all defaults already exist', () => {
  const dir = tempProject();
  const gitignorePath = path.join(dir, '.gitignore');

  fs.writeFileSync(gitignorePath, `${GITIGNORE_LINES.join('\n')}\n`, 'utf8');

  const result = ensureGitignore(dir);

  assert.equal(result.action, 'unchanged');
  assert.deepEqual(result.added, []);
});

test('creates .clasp.json with scriptId and rootDir', () => {
  const dir = tempProject();

  const result = writeClaspConfig(dir, SCRIPT_ID);
  const config = readClaspConfig(dir);

  assert.equal(result.action, 'created');
  assert.equal(config.scriptId, SCRIPT_ID);
  assert.equal(config.rootDir, '.');
});

test('.clasp.json with matching scriptId is left unchanged', () => {
  const dir = tempProject();

  writeClaspConfig(dir, SCRIPT_ID);
  const result = writeClaspConfig(dir, SCRIPT_ID);

  assert.equal(result.action, 'unchanged');
});

test('.clasp.json with different scriptId fails unless forced', () => {
  const dir = tempProject();

  writeClaspConfig(dir, SCRIPT_ID);

  assert.throws(() => writeClaspConfig(dir, 'different-id'), /different scriptId/);

  const result = writeClaspConfig(dir, 'different-id', { force: true });
  const config = readClaspConfig(dir);

  assert.equal(result.action, 'updated');
  assert.equal(config.scriptId, 'different-id');
});

test('creates .claspignore with safe defaults', () => {
  const dir = tempProject();
  const claspignorePath = path.join(dir, '.claspignore');

  const result = ensureClaspignore(dir);
  const content = fs.readFileSync(claspignorePath, 'utf8');

  assert.equal(result.action, 'created');
  assert.equal(content, CLASPIGNORE_CONTENT);
});

test('does not overwrite existing .claspignore unless forced', () => {
  const dir = tempProject();
  const claspignorePath = path.join(dir, '.claspignore');

  fs.writeFileSync(claspignorePath, 'custom\n', 'utf8');

  const unchanged = ensureClaspignore(dir);
  assert.equal(unchanged.action, 'unchanged');
  assert.equal(fs.readFileSync(claspignorePath, 'utf8'), 'custom\n');

  const updated = ensureClaspignore(dir, { force: true });
  assert.equal(updated.action, 'updated');
  assert.equal(fs.readFileSync(claspignorePath, 'utf8'), CLASPIGNORE_CONTENT);
});
