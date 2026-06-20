import { runClasp, requireCommand } from '../lib/clasp.js';
import { readClaspConfig } from '../lib/files.js';
import { devUrl } from '../lib/script-id.js';
import { log, success, warn } from '../lib/logger.js';
import { resolveDeploymentId } from '../lib/deployments.js';

export function pushDevCommand(args, options = {}) {
  const projectDir = options.cwd || process.cwd();
  readClaspConfig(projectDir);

  requireCommand('clasp', 'Install it with: npm install -g @google/clasp');

  runClasp(['push'], { cwd: projectDir, dryRun: options.dryRun });

  success('Pushed latest local code to Apps Script HEAD.');
  log('');

  const resolved = resolveDeploymentId(projectDir, {
    deploymentId: args[0] || options.deploymentId,
    dryRun: options.dryRun
  });

  if (resolved.deploymentId) {
    log(`Development URL: ${devUrl(resolved.deploymentId)}`);
    log(`Using deployment ID from ${resolved.source}.`);
    log('');
  } else if (resolved.deploymentCount > 1) {
    warn('Multiple deployments were found. Pass one explicitly: clasp-kit push-dev <deployment-id>');
    log('');
  } else {
    warn('No Apps Script deployments were found. The /dev URL may not work until you create the first deployment.');
    log('Create it with: clasp-kit deploy "Initial web app deployment"');
    log('');
  }

  log('The /dev URL uses the latest HEAD code.');
  log('Production /exec deployments usually require a versioned redeploy with clasp-kit release.');
}
