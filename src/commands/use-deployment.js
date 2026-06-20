import { writeDefaultDeploymentId } from '../lib/kit-config.js';
import { readClaspConfig } from '../lib/files.js';
import { devUrl, execUrl } from '../lib/script-id.js';
import { CliError } from '../lib/errors.js';
import { log, success } from '../lib/logger.js';

export function useDeploymentCommand(args, options = {}) {
  const deploymentId = args[0] || options.deploymentId;

  if (!deploymentId) {
    throw new CliError('Usage: clasp-kit use-deployment <deployment-id>');
  }

  const projectDir = options.cwd || process.cwd();
  readClaspConfig(projectDir);

  const result = writeDefaultDeploymentId(projectDir, deploymentId, {
    dryRun: options.dryRun
  });

  success(`Default deployment ID ${result.action}: ${deploymentId}`);
  log(`Development URL: ${devUrl(deploymentId)}`);
  log(`Production URL: ${execUrl(deploymentId)}`);
}
