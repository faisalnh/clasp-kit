import { outputHasDeployments, parseDeploymentIds, runClaspCapture } from './clasp.js';
import { readDefaultDeploymentId } from './kit-config.js';
import { CliError } from './errors.js';
import { warn } from './logger.js';

export function preferredDeploymentIds(output) {
  const allIds = parseDeploymentIds(output);
  const versionedIds = parseDeploymentIds(output, { excludeHead: true });
  return versionedIds.length > 0 ? versionedIds : allIds;
}

export function parseDeploymentsJson(output) {
  let parsed;

  try {
    parsed = JSON.parse(String(output || '').trim());
  } catch (err) {
    throw new CliError(`Could not parse deployment data from clasp: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new CliError('Could not parse deployment data from clasp: expected a JSON array.');
  }

  return parsed.map((deployment) => {
    if (!deployment || typeof deployment.deploymentId !== 'string') {
      throw new CliError('Could not parse deployment data from clasp: a deployment ID is missing.');
    }

    return {
      deploymentId: deployment.deploymentId,
      versionNumber: deployment.versionNumber ?? null,
      description: typeof deployment.description === 'string' ? deployment.description : ''
    };
  });
}

export function listVersionedDeployments(projectDir, options = {}) {
  const capture = options.runClaspCapture || runClaspCapture;
  const result = capture(['--json', 'deployments'], {
    cwd: projectDir,
    allowFailure: true
  });

  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim();
    throw new CliError(`Could not list Apps Script deployments.${detail ? ` ${detail}` : ''}`);
  }

  return parseDeploymentsJson(result.stdout).filter((deployment) => deployment.versionNumber !== null);
}

export function looksLikeDeploymentId(value) {
  return /^AKfycb[A-Za-z0-9_-]+$/.test(value);
}

export function deploymentCandidates(deployments, target) {
  if (!target) {
    return deployments;
  }

  const idMatch = deployments.find((deployment) => deployment.deploymentId === target);
  if (idMatch) {
    return [idMatch];
  }

  const normalized = target.trim().toLocaleLowerCase();
  return deployments.filter((deployment) => deployment.description.trim().toLocaleLowerCase() === normalized);
}

export function resolveDeploymentId(projectDir, options = {}) {
  if (options.deploymentId) {
    return {
      deploymentId: options.deploymentId,
      source: 'argument',
      deploymentCount: 1
    };
  }

  const configured = readDefaultDeploymentId(projectDir);
  if (configured) {
    return {
      deploymentId: configured,
      source: '.clasp-kit.json',
      deploymentCount: 1
    };
  }

  const deployments = runClaspCapture(['deployments'], {
    cwd: projectDir,
    dryRun: options.dryRun,
    allowFailure: true
  });

  if (deployments.status !== 0) {
    warn('Could not read deployments with clasp deployments.');
    return { deploymentId: null, source: null, deploymentCount: 0 };
  }

  const output = `${deployments.stdout || ''}\n${deployments.stderr || ''}`.trim();

  if (!outputHasDeployments(output)) {
    return { deploymentId: null, source: 'clasp deployments', deploymentCount: 0 };
  }

  const ids = preferredDeploymentIds(output);

  return {
    deploymentId: ids.length === 1 ? ids[0] : null,
    source: 'clasp deployments',
    deploymentCount: ids.length,
    deploymentIds: ids
  };
}
