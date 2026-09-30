import { requireClaspVersion, runClasp, runClaspCapture } from '../lib/clasp.js';
import { deploymentCandidates, listVersionedDeployments, looksLikeDeploymentId } from '../lib/deployments.js';
import { readClaspConfig } from '../lib/files.js';
import { prepareWebappManifest, writePreparedManifest } from '../lib/manifest.js';
import { promptForDeployment, promptForDeploymentName } from '../lib/prompt.js';
import { devUrl, execUrl } from '../lib/script-id.js';
import { writeDefaultDeploymentId } from '../lib/kit-config.js';
import { CliError } from '../lib/errors.js';
import { log, success } from '../lib/logger.js';

const DEFAULT_DEPLOYMENT_NAME = 'Web app';

export function parseDeploymentResult(output) {
  try {
    const parsed = JSON.parse(String(output || '').trim());
    if (!parsed || typeof parsed.deploymentId !== 'string') {
      throw new Error('deploymentId is missing');
    }
    return parsed;
  } catch (err) {
    throw new CliError(`Deployment succeeded, but clasp returned unexpected JSON: ${err.message}`);
  }
}

export async function chooseDeployment(deployments, target, options) {
  if (options.deploymentId && !deployments.some((deployment) => deployment.deploymentId === options.deploymentId)) {
    throw new CliError(`Versioned deployment ID not found: ${options.deploymentId}. The automatic @HEAD deployment cannot be updated.`);
  }

  const candidates = deploymentCandidates(deployments, target);

  if (target) {
    if (candidates.length === 1) {
      return { action: 'update', deployment: candidates[0] };
    }

    if (candidates.length > 1) {
      return options.promptForDeployment(candidates, { allowCreate: false });
    }

    if (options.deploymentId || looksLikeDeploymentId(target)) {
      throw new CliError(`Versioned deployment ID not found: ${target}. The automatic @HEAD deployment cannot be updated.`);
    }

    return { action: 'create', name: target };
  }

  if (deployments.length === 0) {
    return { action: 'create', name: DEFAULT_DEPLOYMENT_NAME };
  }

  if (deployments.length === 1) {
    return { action: 'update', deployment: deployments[0] };
  }

  return options.promptForDeployment(deployments);
}

export async function deployCommand(args, options = {}) {
  const projectDir = options.cwd || process.cwd();
  const claspConfig = readClaspConfig(projectDir);
  const positionalTarget = args.join(' ').trim();
  const target = options.deploymentId || positionalTarget || null;
  const capture = options.runClaspCapture || runClaspCapture;
  const run = options.runClasp || runClasp;
  const promptDeployment = options.promptForDeployment || promptForDeployment;
  const promptName = options.promptForDeploymentName || promptForDeploymentName;

  requireClaspVersion(3, { runClaspCapture: capture });

  const deployments = listVersionedDeployments(projectDir, { runClaspCapture: capture });
  let selection = await chooseDeployment(deployments, target, {
    deploymentId: options.deploymentId,
    promptForDeployment: promptDeployment
  });

  if (selection.action === 'create' && !selection.name) {
    selection = { ...selection, name: await promptName(DEFAULT_DEPLOYMENT_NAME) };
  }

  const preparedManifest = prepareWebappManifest(projectDir, claspConfig);
  const name = selection.action === 'update'
    ? selection.deployment.description
    : selection.name;

  if (preparedManifest.changed) {
    log(`Adding private web app defaults to ${preparedManifest.path}...`);
  }
  writePreparedManifest(preparedManifest, { dryRun: options.dryRun });
  log(`Web app access: ${preparedManifest.webapp.access}; executes as: ${preparedManifest.webapp.executeAs}`);

  log('Pushing latest local code and validated manifest...');
  run(['push', '--force'], { cwd: projectDir, dryRun: options.dryRun });

  const deploymentArgs = selection.action === 'update'
    ? ['--json', 'redeploy', selection.deployment.deploymentId, '-d', name]
    : ['--json', 'deploy', '-d', name];

  const displayName = name || '(no description)';
  log(selection.action === 'update'
    ? `Updating deployment "${displayName}"...`
    : `Creating deployment "${displayName}"...`);

  const result = capture(deploymentArgs, {
    cwd: projectDir,
    dryRun: options.dryRun,
    allowFailure: true
  });

  if (!options.dryRun && result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim();
    throw new CliError(
      `Deployment failed with exit code ${result.status ?? 'unknown'}.${detail ? ` ${detail}` : ''}`,
      result.status || 1
    );
  }

  if (options.dryRun) {
    success(`Dry run complete: deployment would be ${selection.action === 'update' ? 'updated' : 'created'}.`);
    return;
  }

  const deployment = parseDeploymentResult(result.stdout);
  writeDefaultDeploymentId(projectDir, deployment.deploymentId);

  success(selection.action === 'update'
    ? `Deployment updated to version ${deployment.versionNumber}.`
    : `Deployment created at version ${deployment.versionNumber}.`);
  log(`Deployment name: ${deployment.description || displayName}`);
  log(`Deployment ID: ${deployment.deploymentId}`);
  log('Saved default deployment ID in .clasp-kit.json');
  log('');
  log(`Development URL: ${devUrl(deployment.deploymentId)}`);
  log(`Production URL: ${execUrl(deployment.deploymentId)}`);
}
