import { readClaspConfig } from '../lib/files.js';
import { devUrl } from '../lib/script-id.js';
import { log } from '../lib/logger.js';
import { resolveDeploymentId } from '../lib/deployments.js';
import { CliError } from '../lib/errors.js';

export function devUrlCommand(args, options = {}) {
  const projectDir = options.cwd || process.cwd();
  readClaspConfig(projectDir);
  const resolved = resolveDeploymentId(projectDir, {
    deploymentId: args[0] || options.deploymentId,
    dryRun: options.dryRun
  });

  if (!resolved.deploymentId) {
    if (resolved.deploymentCount > 1) {
      throw new CliError('Multiple deployments found. Run clasp-kit dev-url <deployment-id>.');
    }

    throw new CliError('No deployment ID found. Run clasp-kit deploy "Initial web app deployment" first.');
  }

  const url = devUrl(resolved.deploymentId);

  if (options.plain) {
    log(url);
    return;
  }

  log(`Development URL: ${url}`);
}
