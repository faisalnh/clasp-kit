import { readClaspConfig } from '../lib/files.js';
import { devUrl } from '../lib/script-id.js';
import { log } from '../lib/logger.js';
import { resolveHeadDeployment } from '../lib/deployments.js';


export function devUrlCommand(args, options = {}) {
  const projectDir = options.cwd || process.cwd();
  readClaspConfig(projectDir);
  const resolved = resolveHeadDeployment(projectDir, {
    deploymentId: args[0] || options.deploymentId,
    runClaspCapture: options.runClaspCapture
  });

  const url = devUrl(resolved.deploymentId);

  if (options.plain) {
    log(url);
    return;
  }

  log(`Development URL: ${url}`);
}
