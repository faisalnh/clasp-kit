import { runClasp, requireCommand } from '../lib/clasp.js';
import { readClaspConfig } from '../lib/files.js';
import { devUrl } from '../lib/script-id.js';
import { log, success, warn } from '../lib/logger.js';
import { resolveHeadDeployment } from '../lib/deployments.js';
import { CliError } from '../lib/errors.js';

export function pushDevCommand(args, options = {}) {
  const projectDir = options.cwd || process.cwd();
  readClaspConfig(projectDir);

  const requireExecutable = options.requireCommand || requireCommand;
  const run = options.runClasp || runClasp;

  requireExecutable('clasp', 'Install it with: npm install -g @google/clasp');

  run(['push'], { cwd: projectDir, dryRun: options.dryRun });

  success('Pushed latest local code to Apps Script HEAD.');
  log('');

  try {
    const resolved = resolveHeadDeployment(projectDir, {
      deploymentId: args[0] || options.deploymentId,
      runClaspCapture: options.runClaspCapture
    });

    log(`Development URL: ${devUrl(resolved.deploymentId)}`);
    log(`Using ${resolved.source}.`);
  } catch (err) {
    if (!(err instanceof CliError)) {
      throw err;
    }
    warn(err.message);
  }
  log('');

  log('The /dev URL uses the latest HEAD code.');
  log('Production /exec deployments usually require a versioned redeploy with clasp-kit release.');
}
