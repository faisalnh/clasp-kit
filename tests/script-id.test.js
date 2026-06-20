import test from 'node:test';
import assert from 'node:assert/strict';
import { outputHasDeployments, parseDeploymentId, parseVersionNumber } from '../src/lib/clasp.js';
import { extractScriptId, devUrl } from '../src/lib/script-id.js';

const SCRIPT_ID = '1ZwDA5ETC8DJwUnnZm3OOI-0MyTMVVF4_SIQQ-oRxjB59K2K8_Stlzs_k';

test('accepts a raw script ID unchanged', () => {
  assert.equal(extractScriptId(SCRIPT_ID), SCRIPT_ID);
});

test('extracts ID from /home/projects/<id>/edit URL', () => {
  const url = `https://script.google.com/home/projects/${SCRIPT_ID}/edit`;

  assert.equal(extractScriptId(url), SCRIPT_ID);
});

test('extracts ID from /d/<id>/edit URL', () => {
  const url = `https://script.google.com/d/${SCRIPT_ID}/edit`;

  assert.equal(extractScriptId(url), SCRIPT_ID);
});

test('extracts ID from URL with query string', () => {
  const url = `https://script.google.com/home/projects/${SCRIPT_ID}/edit?resourcekey=abc`;

  assert.equal(extractScriptId(url), SCRIPT_ID);
});

test('builds the development URL', () => {
  assert.equal(devUrl(SCRIPT_ID), `https://script.google.com/macros/s/${SCRIPT_ID}/dev`);
});

test('rejects empty input', () => {
  assert.throws(() => extractScriptId(''), /Missing Apps Script URL or script ID/);
});

test('parses version numbers from clasp output', () => {
  assert.equal(parseVersionNumber('Created version 12'), '12');
  assert.equal(parseVersionNumber('Version 13 created.'), '13');
});

test('parses deployment IDs from clasp output', () => {
  assert.equal(
    parseDeploymentId('Created deployment AKfycbx1234567890_abcdefghijklmnopqrstuvwxyz'),
    'AKfycbx1234567890_abcdefghijklmnopqrstuvwxyz'
  );
  assert.equal(
    parseDeploymentId('Deployment ID: AKfycbx1234567890-abcdefghijklmnopqrstuvwxyz'),
    'AKfycbx1234567890-abcdefghijklmnopqrstuvwxyz'
  );
});

test('detects whether clasp deployments output contains deployments', () => {
  assert.equal(outputHasDeployments('No deployments.'), false);
  assert.equal(outputHasDeployments(''), false);
  assert.equal(outputHasDeployments('- AKfycbx1234567890_abcdefghijklmnopqrstuvwxyz @12'), true);
});
