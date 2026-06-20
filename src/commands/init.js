import { runClasp, requireCommand } from '../lib/clasp.js';
import { writeClaspConfig, ensureGitignore, ensureClaspignore } from '../lib/files.js';
import { ensureGitRepository, ensurePrePushHook } from '../lib/git.js';
import { extractScriptId } from '../lib/script-id.js';
import { CliError } from '../lib/errors.js';
import { info, log, success, warn } from '../lib/logger.js';

function summarizeFile(result) {
  if (!result) {
    return null;
  }

  if (result.added?.length) {
    return `${result.action}: ${result.path} (added ${result.added.join(', ')})`;
  }

  return `${result.action}: ${result.path}`;
}

export function initCommand(args, options = {}) {
  const input = args[0];

  if (!input) {
    throw new CliError('Usage: clasp-kit init <script-url-or-id>');
  }

  requireCommand('clasp', 'Install it with: npm install -g @google/clasp');

  if (options.git) {
    requireCommand('git', 'Install git or re-run with --no-git.');
  }

  const projectDir = options.cwd || process.cwd();
  const scriptId = extractScriptId(input);
  const changes = [];

  info(`Initializing clasp-kit for script: ${scriptId}`);

  changes.push(writeClaspConfig(projectDir, scriptId, {
    force: options.force,
    dryRun: options.dryRun
  }));

  changes.push(ensureGitignore(projectDir, { dryRun: options.dryRun }));
  changes.push(ensureClaspignore(projectDir, {
    force: options.forceClaspignore,
    dryRun: options.dryRun
  }));

  info('Running clasp pull...');
  runClasp(['pull'], { cwd: projectDir, dryRun: options.dryRun });

  if (options.git) {
    changes.push(ensureGitRepository(projectDir, { dryRun: options.dryRun }));

    if (options.hook) {
      changes.push(ensurePrePushHook(projectDir, {
        force: options.forceHook,
        dryRun: options.dryRun
      }));
    } else {
      warn('Skipping pre-push hook because --no-hook was provided.');
    }
  } else {
    warn('Skipping git setup because --no-git was provided.');
  }

  success('Project initialized.');
  log('');
  log('Files:');
  for (const change of changes) {
    const summary = summarizeFile(change);
    if (summary) {
      log(`- ${summary}`);
    }
  }

  log('');
  log('Development URL: available after the first web app deployment is created.');
  log('');
  log('Next steps:');
  log('- clasp-kit deploy "Initial web app deployment"');
  log('- clasp-kit push-dev');
  log('- clasp-kit dev-url');
  log('- clasp-kit release <deployment-id> "Production release"');
}
