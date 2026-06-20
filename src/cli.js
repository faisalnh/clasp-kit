#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initCommand } from './commands/init.js';
import { pushDevCommand } from './commands/push-dev.js';
import { devUrlCommand } from './commands/dev-url.js';
import { statusCommand } from './commands/status.js';
import { releaseCommand } from './commands/release.js';
import { deployCommand } from './commands/deploy.js';
import { useDeploymentCommand } from './commands/use-deployment.js';
import { githubCommand } from './commands/github.js';
import { remoteCommand } from './commands/remote.js';
import { CliError } from './lib/errors.js';
import { error, log, setVerbose } from './lib/logger.js';

const COMMANDS = new Map([
  ['init', initCommand],
  ['push-dev', pushDevCommand],
  ['dev-url', devUrlCommand],
  ['status', statusCommand],
  ['deploy', deployCommand],
  ['use-deployment', useDeploymentCommand],
  ['release', releaseCommand],
  ['github', githubCommand],
  ['remote', remoteCommand]
]);

function packageVersion() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packagePath = path.join(here, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return pkg.version;
}

function helpText() {
  return `clasp-kit ${packageVersion()}

Zero-config project bootstrapper and workflow helper for Google Apps Script projects using clasp.

Usage:
  clasp-kit init <script-url-or-id> [--force] [--force-claspignore] [--no-git] [--no-hook] [--force-hook]
  clasp-kit push-dev [deployment-id]
  clasp-kit dev-url [deployment-id] [--plain]
  clasp-kit status
  clasp-kit deploy [description]
  clasp-kit use-deployment <deployment-id>
  clasp-kit release <deployment-id> [description]
  clasp-kit github <repo-name> [--private] [--push] [--init-git]
  clasp-kit remote <git-remote-url> [--name origin] [--push] [--init-git]
  clasp-init <script-url-or-id>

Global flags:
  --help                 Show help
  --version              Show version
  --verbose              Print command details
  --dry-run              Print external commands and skip file writes where supported
  --force                Replace an existing .clasp.json with a different scriptId
  --force-claspignore    Replace an existing .claspignore during init
  --force-hook           Append clasp-kit to an existing pre-push hook
  --force-remote         Replace an existing git remote URL
  --no-git               Skip git init during init
  --no-hook              Skip pre-push hook setup during init
  --init-git             Initialize git for github/remote if .git is missing
  --private              Create a private GitHub repository
  --public               Create a public GitHub repository
  --push                 Push the current branch after configuring the remote
  --name <remote-name>   Remote name for clasp-kit remote, default: origin
  --remote <name>        Remote name for clasp-kit github, default: origin
  --deployment-id <id>   Deployment ID for /dev and /exec URL generation
`;
}

function parseArgv(argv, executableName = path.basename(process.argv[1] || 'clasp-kit')) {
  const options = {
    verbose: false,
    dryRun: false,
    force: false,
    forceClaspignore: false,
    forceHook: false,
    forceRemote: false,
    git: true,
    hook: true,
    initGit: false,
    private: false,
    push: false,
    remoteName: 'origin',
    deploymentId: null,
    plain: false,
    help: false,
    version: false
  };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--force-claspignore') {
      options.forceClaspignore = true;
    } else if (arg === '--force-hook') {
      options.forceHook = true;
    } else if (arg === '--force-remote') {
      options.forceRemote = true;
    } else if (arg === '--no-git') {
      options.git = false;
    } else if (arg === '--no-hook') {
      options.hook = false;
    } else if (arg === '--init-git') {
      options.initGit = true;
    } else if (arg === '--private') {
      options.private = true;
    } else if (arg === '--public') {
      options.private = false;
    } else if (arg === '--push') {
      options.push = true;
    } else if (arg === '--name' || arg === '--remote' || arg === '--remote-name') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new CliError(`${arg} requires a value.`);
      }
      options.remoteName = value;
      index += 1;
    } else if (arg === '--deployment-id') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new CliError(`${arg} requires a value.`);
      }
      options.deploymentId = value;
      index += 1;
    } else if (arg === '--plain') {
      options.plain = true;
    } else {
      positionals.push(arg);
    }
  }

  if (executableName === 'clasp-init') {
    return { command: 'init', args: positionals, options };
  }

  const [command, ...args] = positionals;
  return { command, args, options };
}

export function main(argv = process.argv.slice(2), executableName) {
  const parsed = parseArgv(argv, executableName);
  setVerbose(parsed.options.verbose);

  if (parsed.options.version) {
    log(packageVersion());
    return 0;
  }

  if (parsed.options.help || !parsed.command) {
    log(helpText());
    return 0;
  }

  const handler = COMMANDS.get(parsed.command);

  if (!handler) {
    throw new CliError(`Unknown command: ${parsed.command}\n\n${helpText()}`);
  }

  handler(parsed.args, parsed.options);
  return 0;
}

function isDirectRun() {
  if (!process.argv[1]) {
    return false;
  }

  const currentFile = fileURLToPath(import.meta.url);
  const invokedFile = fs.realpathSync(process.argv[1]);
  return currentFile === invokedFile;
}

if (isDirectRun()) {
  try {
    process.exitCode = main();
  } catch (err) {
    if (err instanceof CliError) {
      error(err.message);
      process.exitCode = err.exitCode;
    } else {
      error(err.stack || err.message || String(err));
      process.exitCode = 1;
    }
  }
}
