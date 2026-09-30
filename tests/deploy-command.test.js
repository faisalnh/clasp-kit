import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chooseDeployment, deployCommand, parseDeploymentResult } from '../src/commands/deploy.js';
import { requireClaspVersion } from '../src/lib/clasp.js';

const HEAD = {
  deploymentId: 'AKfycbxHEAD1234567890_abcdefghijklmnopqrstuvwxyz',
  versionNumber: null,
  description: 'Head'
};
const PRODUCTION = {
  deploymentId: 'AKfycbxPROD1234567890_abcdefghijklmnopqrstuvwxyz',
  versionNumber: 12,
  description: 'Production'
};
const STAGING = {
  deploymentId: 'AKfycbxSTAGE1234567890_abcdefghijklmnopqrstuvwxyz',
  versionNumber: 8,
  description: 'Staging'
};

const options = {
  deploymentId: null,
  promptForDeployment: async (deployments) => ({ action: 'update', deployment: deployments[0] })
};

function tempDeployProject(prefix = 'clasp-kit-deploy-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.writeFileSync(path.join(dir, '.clasp.json'), JSON.stringify({ scriptId: 'script-id', rootDir: '.' }), 'utf8');
  fs.writeFileSync(path.join(dir, 'appsscript.json'), JSON.stringify({ webapp: { access: 'MYSELF', executeAs: 'USER_DEPLOYING' } }), 'utf8');
  return dir;
}

test('creates a default deployment when none exist', async () => {
  assert.deepEqual(await chooseDeployment([], null, options), { action: 'create', name: 'Web app' });
});

test('updates the only deployment when no target is supplied', async () => {
  assert.deepEqual(await chooseDeployment([PRODUCTION], null, options), {
    action: 'update',
    deployment: PRODUCTION
  });
});

test('creates an unmatched deployment name', async () => {
  assert.deepEqual(await chooseDeployment([PRODUCTION], 'Preview', options), {
    action: 'create',
    name: 'Preview'
  });
});

test('updates a matching name or deployment ID', async () => {
  assert.equal((await chooseDeployment([PRODUCTION], 'production', options)).deployment, PRODUCTION);
  assert.equal((await chooseDeployment([PRODUCTION], PRODUCTION.deploymentId, options)).deployment, PRODUCTION);
});

test('prompts for multiple deployments and duplicate names', async () => {
  assert.equal((await chooseDeployment([PRODUCTION, STAGING], null, options)).deployment, PRODUCTION);
  assert.equal((await chooseDeployment([PRODUCTION, { ...STAGING, description: 'Production' }], 'production', options)).deployment, PRODUCTION);
});

test('does not create a deployment from a missing explicit ID', async () => {
  await assert.rejects(
    chooseDeployment([PRODUCTION], 'AKfycbxMISSING1234567890_abcdefghijklmnopqrstuvwxyz', options),
    /Versioned deployment ID not found.*@HEAD/
  );
});

test('parses JSON deployment results strictly', () => {
  assert.deepEqual(parseDeploymentResult(JSON.stringify(PRODUCTION)), PRODUCTION);
  assert.throws(() => parseDeploymentResult('{}'), /unexpected JSON/);
});

test('missing clasp reports an actionable install command', () => {
  assert.throws(() => requireClaspVersion(3, {
    runClaspCapture() {
      throw new Error('spawnSync clasp ENOENT');
    }
  }), /clasp was not found.*npm install -g @google\/clasp@\^3/);
});

test('deploy command discovers before mutation and preserves the selected description', async () => {
  const dir = tempDeployProject();
  const calls = [];

  const logs = [];
  const originalLog = console.log;
  console.log = (value = '') => logs.push(String(value));

  try {
    await deployCommand([], {
      cwd: dir,
      runClasp(args) {
        calls.push(args);
        return { status: 0, stdout: '', stderr: '' };
      },
      runClaspCapture(args, captureOptions) {
        calls.push(args);
        if (args[0] === '--version') {
          return { status: 0, stdout: '3.1.3', stderr: '' };
        }
        if (args[0] === '--json' && args[1] === 'deployments') {
          return { status: 0, stdout: JSON.stringify([HEAD, PRODUCTION]), stderr: '' };
        }
        assert.equal(captureOptions.allowFailure, true);
        return {
          status: 0,
          stdout: JSON.stringify({ ...PRODUCTION, versionNumber: 13 }),
          stderr: ''
        };
      }
    });
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(calls, [
    ['--version'],
    ['--json', 'deployments'],
    ['push', '--force'],
    ['--json', 'redeploy', PRODUCTION.deploymentId, '-d', 'Production']
  ]);
  assert.ok(logs.some((line) => line.includes(`/s/${HEAD.deploymentId}/dev`)));
  assert.ok(logs.some((line) => line.includes(`/s/${PRODUCTION.deploymentId}/exec`)));
  assert.ok(!logs.some((line) => line.includes(`/s/${PRODUCTION.deploymentId}/dev`)));
});

test('deploy command includes clasp error detail and exit code', async () => {
  const dir = tempDeployProject('clasp-kit-deploy-error-');

  await assert.rejects(
    deployCommand([], {
      cwd: dir,
      runClasp() {
        return { status: 0, stdout: '', stderr: '' };
      },
      runClaspCapture(args, captureOptions) {
        if (args[0] === '--version') {
          return { status: 0, stdout: '3.1.3', stderr: '' };
        }
        if (args[0] === '--json' && args[1] === 'deployments') {
          return { status: 0, stdout: JSON.stringify([PRODUCTION]), stderr: '' };
        }
        assert.equal(captureOptions.allowFailure, true);
        return { status: 7, stdout: '', stderr: 'Apps Script API is disabled' };
      }
    }),
    (err) => {
      assert.equal(err.exitCode, 7);
      assert.match(err.message, /Deployment failed with exit code 7.*Apps Script API is disabled/);
      return true;
    }
  );
});

test('signal-terminated deployment reports an unknown exit code', async () => {
  const dir = tempDeployProject('clasp-kit-deploy-signal-');

  await assert.rejects(
    deployCommand([], {
      cwd: dir,
      runClasp() {
        return { status: 0, stdout: '', stderr: '' };
      },
      runClaspCapture(args) {
        if (args[0] === '--version') {
          return { status: 0, stdout: '3.1.3', stderr: '' };
        }
        if (args[0] === '--json' && args[1] === 'deployments') {
          return { status: 0, stdout: JSON.stringify([PRODUCTION]), stderr: '' };
        }
        return { status: null, signal: 'SIGTERM', stdout: '', stderr: '' };
      }
    }),
    (err) => {
      assert.equal(err.exitCode, 1);
      assert.match(err.message, /Deployment failed with exit code unknown/);
      return true;
    }
  );
});
