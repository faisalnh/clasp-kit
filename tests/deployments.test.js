import test from 'node:test';
import assert from 'node:assert/strict';
import { preferredDeploymentIds } from '../src/lib/deployments.js';

const HEAD_ID = 'AKfycbxHEAD1234567890_abcdefghijklmnopqrstuvwxyz';
const VERSIONED_ID = 'AKfycbxPROD1234567890_abcdefghijklmnopqrstuvwxyz';

test('prefers versioned deployments when HEAD is also present', () => {
  const output = `Found 2 deployments.\n- ${HEAD_ID} @HEAD\n- ${VERSIONED_ID} @12 - Production`;

  assert.deepEqual(preferredDeploymentIds(output), [VERSIONED_ID]);
});

test('keeps HEAD when it is the only deployment', () => {
  const output = `Found 1 deployment.\n- ${HEAD_ID} @HEAD`;

  assert.deepEqual(preferredDeploymentIds(output), [HEAD_ID]);
});
