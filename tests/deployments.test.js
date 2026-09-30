import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deploymentCandidates,
  listVersionedDeployments,
  looksLikeDeploymentId,
  parseDeploymentsJson,
  preferredDeploymentIds
} from '../src/lib/deployments.js';

const HEAD_ID = 'AKfycbxHEAD1234567890_abcdefghijklmnopqrstuvwxyz';
const VERSIONED_ID = 'AKfycbxPROD1234567890_abcdefghijklmnopqrstuvwxyz';

const DEPLOYMENTS = [
  { deploymentId: VERSIONED_ID, versionNumber: 12, description: 'Production' },
  { deploymentId: 'AKfycbxSTAGE1234567890_abcdefghijklmnopqrstuvwxyz', versionNumber: 9, description: 'Staging' }
];

test('prefers versioned deployments when HEAD is also present', () => {
  const output = `Found 2 deployments.\n- ${HEAD_ID} @HEAD\n- ${VERSIONED_ID} @12 - Production`;
  assert.deepEqual(preferredDeploymentIds(output), [VERSIONED_ID]);
});

test('keeps HEAD when it is the only deployment for legacy URL resolution', () => {
  const output = `Found 1 deployment.\n- ${HEAD_ID} @HEAD`;
  assert.deepEqual(preferredDeploymentIds(output), [HEAD_ID]);
});

test('parses clasp deployment JSON', () => {
  assert.deepEqual(parseDeploymentsJson(JSON.stringify(DEPLOYMENTS)), DEPLOYMENTS);
  assert.throws(() => parseDeploymentsJson('not json'), /Could not parse deployment data/);
});

test('strict listing excludes the automatic HEAD deployment', () => {
  const result = listVersionedDeployments('/project', {
    runClaspCapture(args) {
      assert.deepEqual(args, ['--json', 'deployments']);
      return {
        status: 0,
        stdout: JSON.stringify([
          { deploymentId: HEAD_ID, description: 'Head' },
          ...DEPLOYMENTS
        ]),
        stderr: ''
      };
    }
  });
  assert.deepEqual(result, DEPLOYMENTS);
});

test('strict listing fails instead of treating lookup errors as empty results', () => {
  assert.throws(() => listVersionedDeployments('/project', {
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
