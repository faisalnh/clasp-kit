import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensurePrePushHook } from '../src/lib/git.js';

function tempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clasp-kit-git-test-'));
  fs.mkdirSync(path.join(dir, '.git', 'hooks'), { recursive: true });
  return dir;
}

test('pre-push hook does not block git push when clasp-kit is unavailable or fails', (t) => {
  const dir = tempProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = ensurePrePushHook(dir);
  const hook = fs.readFileSync(result.path, 'utf8');

  assert.equal(result.action, 'created');
  assert.match(hook, /command -v clasp-kit/);
  assert.match(hook, /clasp-kit push-dev \|\| echo/);
  assert.match(hook, /skipping Apps Script push/);
});

test('upgrades an existing clasp-kit managed hook to the non-blocking block', (t) => {
  const dir = tempProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const hookPath = path.join(dir, '.git', 'hooks', 'pre-push');
  const oldHook = `#!/bin/sh
# custom command before clasp-kit
# clasp-kit pre-push start
clasp-kit push-dev
# clasp-kit pre-push end
# custom command after clasp-kit
`;
  fs.writeFileSync(hookPath, oldHook, { mode: 0o755 });

  const result = ensurePrePushHook(dir);
  const hook = fs.readFileSync(hookPath, 'utf8');

  assert.equal(result.action, 'updated');
  assert.match(hook, /# custom command before clasp-kit/);
  assert.match(hook, /command -v clasp-kit/);
  assert.match(hook, /# custom command after clasp-kit/);
  assert.equal((hook.match(/# clasp-kit pre-push start/g) || []).length, 1);
});

test('leaves a marker-less hook containing clasp-kit push-dev unchanged', (t) => {
  const dir = tempProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const hookPath = path.join(dir, '.git', 'hooks', 'pre-push');
  const existingHook = `#!/bin/sh
npm test
clasp-kit push-dev
`;
  fs.writeFileSync(hookPath, existingHook, { mode: 0o755 });

  const result = ensurePrePushHook(dir, { force: true });
  const hook = fs.readFileSync(hookPath, 'utf8');

  assert.equal(result.action, 'unchanged');
  assert.equal(hook, existingHook);
  assert.equal((hook.match(/clasp-kit push-dev/g) || []).length, 1);
  assert.doesNotMatch(hook, /# clasp-kit pre-push start/);
});
