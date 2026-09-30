import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deploymentCandidates,
  headDeployment,
  listDeployments,
  looksLikeDeploymentId,
  parseDeploymentsJson,
  resolveHeadDeployment,
  versionedDeployments
} from '../src/lib/deployments.js';

const HEAD_ID = 'AKfycbxHEAD1234567890_abcdefghijklmnopqrstuvwxyz';
const VERSIONED_ID = 'AKfycbxPROD1234567890_abcdefghijklmnopqrstuvwxyz';

const HEAD = { deploymentId: HEAD_ID, versionNumber: null, description: 'Head' };
const DEPLOYMENTS = [
  { deploymentId: VERSIONED_ID, versionNumber: 12, description: 'Production' },
  { deploymentId: 'AKfycbxSTAGE1234567890_abcdefghijklmnopqrstuvwxyz', versionNumber: 9, description: 'Staging' }
];


test('parses clasp deployment JSON', () => {
  assert.deepEqual(parseDeploymentsJson(JSON.stringify(DEPLOYMENTS)), DEPLOYMENTS);
  assert.throws(() => parseDeploymentsJson('not json'), /Could not parse deployment data/);
});

test('separates automatic HEAD from versioned deployments', () => {
  const all = [HEAD, ...DEPLOYMENTS];
  assert.equal(headDeployment(all), HEAD);
  assert.deepEqual(versionedDeployments(all), DEPLOYMENTS);
});

test('resolves only the automatic HEAD deployment for development URLs', () => {
  const runClaspCapture = () => ({
    status: 0,
    stdout: JSON.stringify([HEAD, ...DEPLOYMENTS]),
    stderr: ''
  });

  assert.deepEqual(resolveHeadDeployment('/project', { runClaspCapture }), {
    deploymentId: HEAD_ID,
    source: 'automatic @HEAD deployment'
  });
  assert.throws(() => resolveHeadDeployment('/project', {
    deploymentId: VERSIONED_ID,
    runClaspCapture
  }), /require the automatic @HEAD deployment ID/);
});

test('strict listing returns HEAD and versioned deployments', () => {
  const result = listDeployments('/project', {
    runClaspCapture(args) {
      assert.deepEqual(args, ['--json', 'deployments']);
      return {
        status: 0,
        stdout: JSON.stringify([
          HEAD,
          ...DEPLOYMENTS
        ]),
        stderr: ''
      };
    }
  });
  assert.deepEqual(result, [HEAD, ...DEPLOYMENTS]);
});

test('strict listing fails instead of treating lookup errors as empty results', () => {
  assert.throws(() => listDeployments('/project', {
    runClaspCapture() {
      return { status: 1, stdout: '', stderr: 'Not logged in' };
    }
  }), /Not logged in/);
});

test('matches exact IDs before case-insensitive deployment names', () => {
  assert.deepEqual(deploymentCandidates(DEPLOYMENTS, VERSIONED_ID), [DEPLOYMENTS[0]]);
  assert.deepEqual(deploymentCandidates(DEPLOYMENTS, ' production '), [DEPLOYMENTS[0]]);
  assert.deepEqual(deploymentCandidates(DEPLOYMENTS, 'missing'), []);
});

test('recognizes clasp deployment IDs', () => {
  assert.equal(looksLikeDeploymentId(VERSIONED_ID), true);
  assert.equal(looksLikeDeploymentId('production'), false);
});
