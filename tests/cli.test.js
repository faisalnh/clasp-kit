import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/cli.js';

function captureOutput(fn) {
  const originalLog = console.log;
  const lines = [];

  console.log = (value = '') => {
    lines.push(String(value));
  };

  try {
    const result = fn();
    return { result, output: lines.join('\n') };
  } finally {
    console.log = originalLog;
  }
}

test('help includes remote setup commands', () => {
  const { result, output } = captureOutput(() => main(['--help'], 'clasp-kit'));

  assert.equal(result, 0);
  assert.match(output, /clasp-kit deploy \[description\]/);
  assert.match(output, /clasp-kit use-deployment <deployment-id>/);
  assert.match(output, /clasp-kit github <repo-name>/);
  assert.match(output, /clasp-kit remote <git-remote-url>/);
  assert.match(output, /--force-remote/);
});

test('clasp-init alias still routes to init usage validation', () => {
  assert.throws(() => main([], 'clasp-init'), /Usage: clasp-kit init <script-url-or-id>/);
});
