import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readKitConfig } from '../src/lib/kit-config.js';

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'clasp-kit-config-test-'));
}

test('reports malformed .clasp-kit.json as a CLI error', (t) => {
  const dir = tempProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, '.clasp-kit.json'), '{broken', 'utf8');

  assert.throws(
    () => readKitConfig(dir),
    /Could not read valid JSON from .*\.clasp-kit\.json/
  );
});
