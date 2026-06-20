import { runClasp, runClaspCapture, parseVersionNumber, requireCommand } from '../lib/clasp.js';
import { readClaspConfig } from '../lib/files.js';
import { devUrl, execUrl } from '../lib/script-id.js';
import { CliError } from '../lib/errors.js';
import { log, success } from '../lib/logger.js';

export function releaseCommand(args, options = {}) {
  const deploymentId = args[0];
  const description = args.slice(1).join(' ') || 'Production release';

  if (!deploymentId) {
    throw new CliError('Usage: clasp-kit release <deployment-id> [description]');
  }

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
    log('');
    log('Run the redeploy manually after finding the version number:');
    log(`clasp redeploy ${deploymentId} -V <version-number> -d "${description}"`);
    throw new CliError('Version parsing failed.');
  }

  log(`Redeploying ${deploymentId} to version ${versionNumber}...`);
  runClasp(['redeploy', deploymentId, '-V', versionNumber, '-d', description], {
    cwd: projectDir,
    dryRun: options.dryRun
  });

  success(`Production deployment ${deploymentId} updated to version ${versionNumber}.`);
  log(`Development URL: ${devUrl(deploymentId)}`);
  log(`Production URL: ${execUrl(deploymentId)}`);
  log('The production /exec deployment now points to the new version.');
}
