import fs from 'node:fs';
import path from 'node:path';
import { runCommand } from './clasp.js';
import { warn } from './logger.js';
import { CliError } from './errors.js';

const HOOK_COMMAND = 'clasp-kit push-dev';
const HOOK_BLOCK = `# clasp-kit pre-push start
${HOOK_COMMAND}
# clasp-kit pre-push end
`;

export function ensureGitRepository(projectDir, options = {}) {
  const gitDir = path.join(projectDir, '.git');

  if (fs.existsSync(gitDir)) {
    return { action: 'unchanged', path: gitDir };
  }

  runCommand('git', ['init'], { cwd: projectDir, dryRun: options.dryRun });

  return { action: 'created', path: gitDir };
}

export function ensurePrePushHook(projectDir, options = {}) {
  const hookPath = path.join(projectDir, '.git', 'hooks', 'pre-push');
  const hooksDir = path.dirname(hookPath);

  if (!options.dryRun) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  if (fs.existsSync(hookPath)) {
    const current = fs.readFileSync(hookPath, 'utf8');

    if (current.includes(HOOK_COMMAND)) {
      return { action: 'unchanged', path: hookPath };
    }

    if (!options.force) {
      warn('Existing .git/hooks/pre-push does not contain clasp-kit push-dev. Skipping hook update. Re-run with --force-hook to append it.');
      return { action: 'skipped', path: hookPath };
    }

    const needsNewline = current.length > 0 && !current.endsWith('\n');
    const next = `${current}${needsNewline ? '\n' : ''}${HOOK_BLOCK}`;

    if (!options.dryRun) {
      fs.writeFileSync(hookPath, next, 'utf8');
      fs.chmodSync(hookPath, 0o755);
    }

    return { action: 'updated', path: hookPath };
  }

  const content = `#!/bin/sh
${HOOK_BLOCK}`;

  if (!options.dryRun) {
    fs.writeFileSync(hookPath, content, 'utf8');
    fs.chmodSync(hookPath, 0o755);
  }

  return { action: 'created', path: hookPath };
}

export function hasGitRepository(projectDir) {
  return fs.existsSync(path.join(projectDir, '.git'));
}

export function ensureGitRepositoryExists(projectDir) {
  if (!hasGitRepository(projectDir)) {
    throw new CliError('This directory is not a git repository. Run clasp-kit init first, or run git init.');
  }
}

export function getRemoteUrl(projectDir, remoteName = 'origin') {
  const result = runCommand('git', ['remote', 'get-url', remoteName], {
    cwd: projectDir,
    capture: true,
    allowFailure: true
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}

export function setRemoteUrl(projectDir, remoteUrl, options = {}) {
  const remoteName = options.remoteName || 'origin';
  const existingRemote = getRemoteUrl(projectDir, remoteName);

  if (existingRemote && !options.force) {
    throw new CliError(
      `Git remote "${remoteName}" already exists: ${existingRemote}. Re-run with --force-remote to replace it.`
    );
  }

  if (existingRemote) {
    runCommand('git', ['remote', 'set-url', remoteName, remoteUrl], {
      cwd: projectDir,
      dryRun: options.dryRun
    });
    return { action: 'updated', remoteName };
  }

  runCommand('git', ['remote', 'add', remoteName, remoteUrl], {
    cwd: projectDir,
    dryRun: options.dryRun
  });

  return { action: 'created', remoteName };
}

export function pushCurrentBranch(projectDir, options = {}) {
  const remoteName = options.remoteName || 'origin';
  const branch = currentBranch(projectDir, { dryRun: options.dryRun });

  runCommand('git', ['push', '-u', remoteName, branch], {
    cwd: projectDir,
    dryRun: options.dryRun
  });

  return { remoteName, branch };
}

export function currentBranch(projectDir, options = {}) {
  const result = runCommand('git', ['branch', '--show-current'], {
    cwd: projectDir,
    capture: true,
    dryRun: options.dryRun,
    allowFailure: true
  });

  const branch = result.stdout?.trim();
  return branch || 'main';
}

export function ensureInitialCommit(projectDir, options = {}) {
  const result = runCommand('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: projectDir,
    capture: true,
    dryRun: options.dryRun,
    allowFailure: true
  });

  if (result.status === 0) {
    return { action: 'unchanged' };
  }

  runCommand('git', ['add', '.'], { cwd: projectDir, dryRun: options.dryRun });
  runCommand('git', ['commit', '-m', 'Initial commit'], {
    cwd: projectDir,
    dryRun: options.dryRun
  });

  return { action: 'created' };
}
