import { outputHasDeployments, parseDeploymentIds, runClaspCapture } from './clasp.js';
import { readDefaultDeploymentId } from './kit-config.js';
import { warn } from './logger.js';

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

  const ids = parseDeploymentIds(output);

  return {
    deploymentId: ids.length === 1 ? ids[0] : null,
    source: 'clasp deployments',
    deploymentCount: ids.length,
    deploymentIds: ids
  };
}
