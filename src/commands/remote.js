import { requireCommand } from '../lib/clasp.js';
import {
  ensureGitRepository,
  ensureGitRepositoryExists,
  ensureInitialCommit,
  pushCurrentBranch,
  setRemoteUrl
} from '../lib/git.js';
import { CliError } from '../lib/errors.js';
import { log, success } from '../lib/logger.js';

export function remoteCommand(args, options = {}) {
  const remoteUrl = args[0];

  if (!remoteUrl) {
    throw new CliError('Usage: clasp-kit remote <git-remote-url> [--name origin] [--push] [--init-git]');
  }

  const projectDir = options.cwd || process.cwd();

  requireCommand('git', 'Install git before configuring a remote repository.');

  if (options.initGit) {
    ensureGitRepository(projectDir, { dryRun: options.dryRun });
  } else {
    ensureGitRepositoryExists(projectDir);
  }

  const result = setRemoteUrl(projectDir, remoteUrl, {
    remoteName: options.remoteName,
    force: options.forceRemote,
    dryRun: options.dryRun
  });

  if (options.push) {
    log('Ensuring an initial commit exists before pushing...');
    ensureInitialCommit(projectDir, { dryRun: options.dryRun });
    const push = pushCurrentBranch(projectDir, {
      remoteName: options.remoteName,
      dryRun: options.dryRun
    });
    success(`Pushed ${push.branch} to ${push.remoteName}.`);
    return;
  }

  success(`Git remote "${result.remoteName}" ${result.action}: ${remoteUrl}`);
}
