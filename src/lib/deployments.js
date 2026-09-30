import { runClaspCapture } from './clasp.js';
import { CliError } from './errors.js';


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

export function listDeployments(projectDir, options = {}) {
  const capture = options.runClaspCapture || runClaspCapture;
  const result = capture(['--json', 'deployments'], {
    cwd: projectDir,
    allowFailure: true
  });

  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim();
    throw new CliError(`Could not list Apps Script deployments.${detail ? ` ${detail}` : ''}`);
  }

  return parseDeploymentsJson(result.stdout);
}

export function versionedDeployments(deployments) {
  return deployments.filter((deployment) => deployment.versionNumber !== null);
}

export function headDeployment(deployments) {
  return deployments.find((deployment) => deployment.versionNumber === null) || null;
}


export function resolveHeadDeployment(projectDir, options = {}) {
  const deployment = headDeployment(listDeployments(projectDir, options));

  if (!deployment) {
    throw new CliError('The automatic @HEAD deployment was not found. Run clasp deployments and verify the project has a HEAD deployment.');
  }

  if (options.deploymentId && options.deploymentId !== deployment.deploymentId) {
    throw new CliError(`Development URLs require the automatic @HEAD deployment ID (${deployment.deploymentId}), not ${options.deploymentId}.`);
  }

  return {
    deploymentId: deployment.deploymentId,
    source: 'automatic @HEAD deployment'
  };
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
