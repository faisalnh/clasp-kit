# clasp-kit

Zero-config project bootstrapper and workflow helper for Google Apps Script projects using clasp.

`clasp-kit` is a small CLI that wraps Google’s official [`@google/clasp`](https://github.com/google/clasp) workflow. It does not replace clasp. It creates safe local project defaults, wires up a development push hook, and makes the common `/dev` and versioned release flow easier to remember.

## Why

Google Apps Script local development works well with clasp, but the first setup has several sharp edges:

- `.clasp.json` and `.clasprc.json` should not be committed.
- `.claspignore` should prevent accidental uploads of local project files.
- `clasp push` updates HEAD code, while production `/exec` deployments usually require a new version and redeploy.
- The `/dev` test URL is useful, but not obvious.

`clasp-kit` handles those project-level defaults and leaves all Google API behavior to clasp.

## Requirements

- Node.js 18 or newer
- npm
- Google clasp installed and available on your `PATH`
- Logged in with clasp
- Apps Script API enabled for your Google account if clasp requires it

Install and log in to clasp:

```sh
npm install -g @google/clasp
clasp login
```

## Installation

```sh
npm install -g clasp-kit
```

Or use it without installing globally:

```sh
npx clasp-kit init <script-url-or-id>
```

## Workflow

```sh
clasp-kit init <script-url-or-id>
clasp-kit status
clasp-kit deploy "Initial web app deployment"
clasp-kit use-deployment <deployment-id>
clasp-kit push-dev
clasp-kit dev-url
clasp-kit release <deployment-id> "Production release"
```

Remote setup is explicit and optional:

```sh
clasp-kit github <repo-name>
clasp-kit remote <git-remote-url>
```

You can also use the init alias:

```sh
clasp-init <script-url-or-id>
```

That is equivalent to:

```sh
clasp-kit init <script-url-or-id>
```

## Example

```sh
clasp-kit init "https://script.google.com/home/projects/1ZwDA5ETC8DJwUnnZm3OOI-0MyTMVVF4_SIQQ-oRxjB59K2K8_Stlzs_k/edit"
```

This creates or updates local project files, runs `clasp pull`, initializes git if needed, and prints the next setup commands.

## Commands

### `clasp-kit init <script-url-or-id>`

Bootstraps a local Apps Script project.

It will:

- Validate that `clasp` is installed.
- Accept a full Apps Script URL or raw script ID.
- Create `.clasp.json` with `scriptId` and `rootDir`.
- Add missing safe entries to `.gitignore`.
- Create `.claspignore` with safe defaults if missing.
- Run `clasp pull`.
- Initialize git if `.git` is missing.
- Create `.git/hooks/pre-push` to run `clasp-kit push-dev`.
- Print the `/dev` test URL and next steps.

Safe behavior:

- Existing `.clasp.json` is not replaced if it points to a different script ID unless `--force` is provided.
- Existing `.claspignore` is not overwritten unless `--force-claspignore` is provided.
- Existing pre-push hooks are not overwritten. If a hook exists and does not include `clasp-kit push-dev`, it is skipped unless `--force-hook` is provided.

Useful flags:

```sh
clasp-kit init <script-url-or-id> --no-git
clasp-kit init <script-url-or-id> --no-hook
clasp-kit init <script-url-or-id> --force
clasp-kit init <script-url-or-id> --force-claspignore
clasp-kit init <script-url-or-id> --force-hook
```

### `clasp-kit push-dev`

Runs:

```sh
clasp push
```

Then prints the `/dev` test URL:

```txt
https://script.google.com/macros/s/<deployment-id>/dev
```

The web app URL uses a deployment ID, not the Apps Script script ID.

The `/dev` URL uses latest HEAD code. Production `/exec` deployments generally require a versioned redeploy.

Important: if the Apps Script project has no web app deployment yet, the `/dev` URL may not work. Create the first deployment once:

```sh
clasp-kit deploy "Initial web app deployment"
```

After that first deployment exists, `clasp-kit push-dev` is enough for testing latest HEAD code through `/dev`.

### `clasp-kit deploy [description]`

Creates the first Apps Script deployment for a project.

Use this when the Apps Script deployment page says there are no deployments yet, or when the `/dev` URL does not work because no web app deployment exists.

It runs:

```sh
clasp push
clasp version "<description>"
clasp deploy -V <version-number> -d "<description>"
```

Then it prints the deployment ID and `/dev` URL.

`clasp-kit` saves the deployment ID in `.clasp-kit.json` so later `push-dev` and `dev-url` commands can print the correct URL.

This is usually a one-time bootstrap step. For later production updates, use:

```sh
clasp-kit release <deployment-id> "Production release"
```

### `clasp-kit use-deployment <deployment-id>`

Saves an existing deployment ID in `.clasp-kit.json`.

Use this if you already created a deployment from the Apps Script web UI or with `clasp deploy`.

```sh
clasp-kit use-deployment AKfyc...
clasp-kit dev-url
clasp-kit push-dev
```

### `clasp-kit dev-url`

Reads `.clasp.json` and prints the `/dev` URL.

If `.clasp-kit.json` has a saved default deployment ID, that value is used. You can also pass a deployment ID explicitly:

```sh
clasp-kit dev-url <deployment-id>
```

For scripting, print only the URL:

```sh
clasp-kit dev-url --plain
```

### `clasp-kit status`

Runs and displays:

```sh
clasp show-authorized-user
clasp status
clasp deployments
```

Then prints the `/dev` URL.

### `clasp-kit release <deployment-id> [description]`

Updates a versioned production deployment after you have tested `/dev`.

It runs:

```sh
clasp push
clasp version "<description>"
clasp redeploy <deployment-id> -V <version-number> -d "<description>"
```

If `clasp-kit` cannot parse the version number from clasp output, it prints the raw output and the manual redeploy command to run.

### `clasp-kit github <repo-name>`

Creates a GitHub repository with the GitHub CLI and configures it as a git remote.

Requirements:

- `git`
- GitHub CLI `gh`
- Logged in with `gh auth login`

By default this creates a public GitHub repository and configures `origin`. It does not push unless `--push` is provided.

```sh
clasp-kit github my-apps-script-project
clasp-kit github my-apps-script-project --private
clasp-kit github my-apps-script-project --private --push
```

Useful flags:

```sh
clasp-kit github my-project --remote upstream
clasp-kit github my-project --init-git
clasp-kit github my-project --force-remote
```

Safe behavior:

- It is not part of `clasp-kit init`; remote creation is always explicit.
- It fails if `.git` is missing unless `--init-git` is provided.
- It fails if the selected remote already exists unless `--force-remote` is provided.
- It does not install or configure GitHub credentials.

### `clasp-kit remote <git-remote-url>`

Configures an already-created remote repository. This works with GitHub, GitLab, Bitbucket, self-hosted Git, or any normal git remote URL.

```sh
clasp-kit remote git@github.com:you/my-apps-script-project.git
clasp-kit remote https://github.com/you/my-apps-script-project.git --push
clasp-kit remote git@gitlab.com:you/my-apps-script-project.git --name origin
```

Useful flags:

```sh
clasp-kit remote <url> --name upstream
clasp-kit remote <url> --init-git
clasp-kit remote <url> --force-remote
clasp-kit remote <url> --push
```

## `/dev` vs `/exec`

Apps Script web apps commonly have two important URLs:

- `/dev` uses the latest HEAD code. This is ideal for testing local changes after `clasp push`.
- `/exec` usually points to a versioned deployment. To update it, create a version and redeploy production.

`clasp push` updates HEAD only. It does not automatically update a versioned production `/exec` deployment.

Use this flow:

```sh
clasp-kit deploy "Initial web app deployment"
clasp-kit push-dev
clasp-kit dev-url
clasp-kit release <deployment-id> "Production release"
```

## Safety Notes

Do not commit local credentials or machine-specific clasp files.

`clasp-kit init` adds these entries to `.gitignore`:

```gitignore
.clasp.json
.clasp-kit.json
.clasprc.json
.env
node_modules/
*.log
```

It also creates a `.claspignore` designed to push only Apps Script source files and avoid uploading local tooling files.

## Troubleshooting

### `clasp: command not found`

Install clasp:

```sh
npm install -g @google/clasp
```

Then verify:

```sh
clasp --version
```

### `gh: command not found`

The `clasp-kit github` command requires the GitHub CLI.

Install it from:

```txt
https://cli.github.com/
```

Then log in:

```sh
gh auth login
```

If you already created a repository manually or use another Git provider, use:

```sh
clasp-kit remote <git-remote-url>
```

### Not logged in

Run:

```sh
clasp login
```

You can verify the active account:

```sh
clasp show-authorized-user
```

### Apps Script API disabled

If clasp reports that the Apps Script API is disabled, enable it for your Google account and retry the clasp command.

### Duplicate local files

Apps Script can reject pushes if local files map to the same Apps Script filename. For example, having both `code.gs` and `code.js` may cause:

```txt
A file with this name already exists in the current project: code
```

Remove or rename one of the duplicates, then run:

```sh
clasp-kit push-dev
```

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md) for release notes.

## Development

Install dependencies from the lockfile:

```sh
npm ci
```

Run tests:

```sh
npm test
```

Run the full local CI check, including an npm package dry run:

```sh
npm run check
```

Show CLI help:

```sh
node src/cli.js --help
```

Check URL behavior in a project that has `.clasp.json`:

```sh
node src/cli.js dev-url
```

## Publishing to npm

This package is configured for public npm publishing with npm provenance.

One-time setup:

1. Create an npm account and make sure you can publish public packages.
2. Create an npm automation token.
3. Add the token to the GitHub repository as an Actions secret named `NPM_TOKEN`.
4. Push the repository to GitHub so the workflows in `.github/workflows/` can run.

Release flow:

```sh
npm version patch
# or: npm version minor / npm version major
git push --follow-tags
```

Pushing a version tag such as `v0.1.1` starts the `Release` workflow. It verifies that the tag matches `package.json`, runs tests, verifies package contents with `npm pack --dry-run`, creates a GitHub Release with generated notes, and publishes to npm with:

```sh
npm publish --access public --provenance
```

You can also start the `Release` workflow manually from the GitHub Actions tab by providing an existing tag.

The separate `Publish to npm` workflow is kept as a manual fallback and can also publish when you manually create a GitHub Release.

Before publishing locally, verify the package contents:

```sh
npm run pack:dry-run
```

As of the latest setup check, the `clasp-kit` name was not published on the public npm registry. If npm reports a name conflict later, rename the package in `package.json` before publishing.
