import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pushDevCommand } from '../src/commands/push-dev.js';
import { statusCommand } from '../src/commands/status.js';

function tempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clasp-kit-head-url-'));
  fs.writeFileSync(path.join(dir, '.clasp.json'), JSON.stringify({ scriptId: 'script-id', rootDir: '.' }), 'utf8');
  return dir;
}

function withoutHead() {
  return {
    status: 0,
    stdout: JSON.stringify([{
      deploymentId: 'AKfycbxPROD1234567890_abcdefghijklmnopqrstuvwxyz',
      versionNumber: 12,
      description: 'Production'
    }]),
    stderr: ''
  };
}

test('push-dev stays successful when HEAD URL discovery lags after a successful push', () => {
  const dir = tempProject();
  const calls = [];

  assert.doesNotThrow(() => pushDevCommand([], {
    cwd: dir,
    requireCommand() {},
    runClasp(args) {
      calls.push(args);
      return { status: 0, stdout: '', stderr: '' };
    },
    runClaspCapture: withoutHead
  }));

  assert.deepEqual(calls, [['push']]);
});

test('status stays successful when clasp checks pass but HEAD is absent', () => {
  const dir = tempProject();
  const calls = [];

  assert.doesNotThrow(() => statusCommand([], {
    cwd: dir,
    requireCommand() {},
    runClasp(args) {
      calls.push(args);
      return { status: 0, stdout: '', stderr: '' };
    },
    runClaspCapture: withoutHead
  }));

  assert.deepEqual(calls, [
    ['show-authorized-user'],
    ['status'],
    ['deployments']
  ]);
});
