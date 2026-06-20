import { requireCommand, runCommand } from '../lib/clasp.js';
import {
  currentBranch,
  ensureGitRepository,
  ensureGitRepositoryExists,
  ensureInitialCommit,
  getRemoteUrl,
  pushCurrentBranch
} from '../lib/git.js';
import { CliError } from '../lib/errors.js';
import { log, success, warn } from '../lib/logger.js';

function repoArgs(repoName, options) {
  const visibility = options.private ? '--private' : '--public';
  return ['repo', 'create', repoName, visibility, '--source', '.', '--remote', options.remoteName];
}

export function githubCommand(args, options = {}) {
  const repoName = args[0];

  if (!repoName) {
    throw new CliError('Usage: clasp-kit github <repo-name> [--private] [--push] [--init-git]');
  }

  const projectDir = options.cwd || process.cwd();

  requireCommand('git', 'Install git before creating a remote repository.');
  requireCommand('gh', 'Install GitHub CLI from https://cli.github.com/ and run: gh auth login');

  if (options.initGit) {
    ensureGitRepository(projectDir, { dryRun: options.dryRun });
  } else {
    ensureGitRepositoryExists(projectDir);
  }

  const existingRemote = getRemoteUrl(projectDir, options.remoteName);
  if (existingRemote && !options.forceRemote) {
    throw new CliError(
      `Git remote "${options.remoteName}" already exists: ${existingRemote}. Re-run with --force-remote to replace it.`
    );
  }

  if (existingRemote && options.forceRemote) {
    warn(`Removing existing git remote "${options.remoteName}" before creating the GitHub remote.`);
    runCommand('git', ['remote', 'remove', options.remoteName], {
      cwd: projectDir,
      dryRun: options.dryRun
    });
  }

  const visibilityLabel = options.private ? 'private' : 'public';
  log(`Creating ${visibilityLabel} GitHub repository: ${repoName}`);
  runCommand('gh', repoArgs(repoName, options), {
    cwd: projectDir,
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
  } else {
    const branch = currentBranch(projectDir, { dryRun: options.dryRun });
    warn('Repository remote was created, but local commits were not pushed.');
    log(`Push when ready with: git push -u ${options.remoteName} ${branch}`);
  }

  success(`GitHub remote "${options.remoteName}" is configured for ${repoName}.`);
}
