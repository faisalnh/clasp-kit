import { runClasp, requireCommand } from '../lib/clasp.js';
import { readClaspConfig } from '../lib/files.js';
import { devUrl } from '../lib/script-id.js';
import { log, warn } from '../lib/logger.js';
import { CliError } from '../lib/errors.js';
import { resolveHeadDeployment } from '../lib/deployments.js';

function runStatusStep(args, message, options) {
  log('');
  log(message);
  const run = options.runClasp || runClasp;
  const result = run(args, {
    cwd: options.cwd,
    dryRun: options.dryRun,
    allowFailure: true
  });

  if (result.status !== 0) {
    warn(`${args.join(' ')} failed.`);
    return false;
  }

  return true;
}

export function statusCommand(args, options = {}) {
  const projectDir = options.cwd || process.cwd();
  readClaspConfig(projectDir);

  const requireExecutable = options.requireCommand || requireCommand;
  requireExecutable('clasp', 'Install it with: npm install -g @google/clasp');

  let ok = true;
  const authOk = runStatusStep(['show-authorized-user'], 'Authorized user:', {
    ...options,
    cwd: projectDir
  });

  if (!authOk) {
    warn('You may need to run: clasp login');
    ok = false;
  }

  ok = runStatusStep(['status'], 'Clasp file status:', { ...options, cwd: projectDir }) && ok;
  ok = runStatusStep(['deployments'], 'Deployments:', { ...options, cwd: projectDir }) && ok;

  log('');
  try {
    const resolved = resolveHeadDeployment(projectDir, {
      deploymentId: args[0] || options.deploymentId,
      runClaspCapture: options.runClaspCapture
    });
    log(`Development URL: ${devUrl(resolved.deploymentId)}`);
  } catch (err) {
    if (!(err instanceof CliError)) {
      throw err;
    }
    warn(err.message);
  }

  if (!ok) {
    throw new CliError('One or more clasp status checks failed.');
  }
}
