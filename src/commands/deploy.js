import { parseDeploymentId, parseVersionNumber, runClasp, runClaspCapture, requireCommand } from '../lib/clasp.js';
import { readClaspConfig } from '../lib/files.js';
import { devUrl } from '../lib/script-id.js';
import { writeDefaultDeploymentId } from '../lib/kit-config.js';
import { CliError } from '../lib/errors.js';
import { log, success, warn } from '../lib/logger.js';

export function deployCommand(args, options = {}) {
  const description = args.join(' ') || 'Initial deployment';
  const projectDir = options.cwd || process.cwd();
  readClaspConfig(projectDir);

  requireCommand('clasp', 'Install it with: npm install -g @google/clasp');

  log('Pushing latest local code...');
  runClasp(['push'], { cwd: projectDir, dryRun: options.dryRun });

  log(`Creating Apps Script version: ${description}`);
  const versionResult = runClaspCapture(['version', description], {
    cwd: projectDir,
    dryRun: options.dryRun
  });
  const versionOutput = `${versionResult.stdout || ''}\n${versionResult.stderr || ''}`.trim();
  const versionNumber = options.dryRun ? '0' : parseVersionNumber(versionOutput);

  if (!versionNumber) {
    log('');
    log('Could not parse the version number from clasp output:');
    log(versionOutput || '(no output)');
    throw new CliError('Version parsing failed. Create the deployment manually with clasp version and clasp deploy.');
  }

  log(`Creating deployment for version ${versionNumber}...`);
  const deployResult = runClaspCapture(['deploy', '-V', versionNumber, '-d', description], {
    cwd: projectDir,
    dryRun: options.dryRun
  });
  const deployOutput = `${deployResult.stdout || ''}\n${deployResult.stderr || ''}`.trim();
  const deploymentId = options.dryRun ? '<deployment-id>' : parseDeploymentId(deployOutput);

  success('Deployment created.');

  if (deploymentId) {
    writeDefaultDeploymentId(projectDir, deploymentId, { dryRun: options.dryRun });
    log(`Deployment ID: ${deploymentId}`);
    log(`Saved default deployment ID in .clasp-kit.json`);
  } else {
    warn('Could not parse the deployment ID from clasp output. Run clasp deployments to list it.');
    if (deployOutput) {
      log('');
      log(deployOutput);
    }
  }

  log('');
  log(`Development URL: ${deploymentId ? devUrl(deploymentId) : '(run clasp deployments to find the deployment ID)'}`);
  log('After the first web app deployment exists, the /dev URL can test latest HEAD code.');
  log('For later production updates, run: clasp-kit release <deployment-id> "description"');
}
