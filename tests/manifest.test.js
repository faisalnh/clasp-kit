import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareWebappManifest, writePreparedManifest } from '../src/lib/manifest.js';

function tempProject(manifest, rootDir = '.') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clasp-kit-manifest-'));
  const sourceDir = path.join(dir, rootDir);
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(path.join(sourceDir, 'appsscript.json'), JSON.stringify(manifest), 'utf8');
  return dir;
}

test('adds private web app defaults in the configured root directory', () => {
  const dir = tempProject({ timeZone: 'UTC' }, 'src');
  const prepared = prepareWebappManifest(dir, { scriptId: 'id', rootDir: 'src' });
  writePreparedManifest(prepared);
  const written = JSON.parse(fs.readFileSync(path.join(dir, 'src', 'appsscript.json'), 'utf8'));

  assert.equal(prepared.changed, true);
  assert.deepEqual(written.webapp, { access: 'MYSELF', executeAs: 'USER_DEPLOYING' });
  assert.equal(written.timeZone, 'UTC');
});

test('fills incomplete web app settings without replacing existing values', () => {
  const dir = tempProject({ webapp: { access: 'DOMAIN' } });
  const prepared = prepareWebappManifest(dir, { scriptId: 'id', rootDir: '.' });

  assert.deepEqual(prepared.webapp, { access: 'DOMAIN', executeAs: 'USER_DEPLOYING' });
});

test('preserves complete existing web app settings', () => {
  const dir = tempProject({ webapp: { access: 'ANYONE', executeAs: 'USER_ACCESSING' } });
  const prepared = prepareWebappManifest(dir, { scriptId: 'id', rootDir: '.' });

  assert.equal(prepared.changed, false);
  assert.deepEqual(prepared.webapp, { access: 'ANYONE', executeAs: 'USER_ACCESSING' });
});

test('rejects invalid web app settings before writing', () => {
  const dir = tempProject({ webapp: { access: 'PUBLIC', executeAs: 'USER_DEPLOYING' } });
  assert.throws(() => prepareWebappManifest(dir, { scriptId: 'id', rootDir: '.' }), /invalid webapp.access/);
});

test('dry run does not write manifest defaults', () => {
  const dir = tempProject({ timeZone: 'UTC' });
  const prepared = prepareWebappManifest(dir, { scriptId: 'id', rootDir: '.' });
  writePreparedManifest(prepared, { dryRun: true });
  const written = JSON.parse(fs.readFileSync(path.join(dir, 'appsscript.json'), 'utf8'));

  assert.equal(written.webapp, undefined);
});
