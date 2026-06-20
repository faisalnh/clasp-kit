# Changelog

All notable changes to `clasp-kit` will be documented in this file.

## v0.1.0 - 2026-06-20

Initial public release of `clasp-kit`.

### Added

- Added the `clasp-kit` CLI for bootstrapping Google Apps Script projects that use `@google/clasp`.
- Added the `clasp-init` alias for quick project initialization.
- Added project initialization with safe local defaults:
  - Creates `.clasp.json` from an Apps Script URL or script ID.
  - Adds safe `.gitignore` entries for local clasp credentials and generated files.
  - Creates a safe `.claspignore` for Apps Script uploads.
  - Initializes git when needed.
  - Installs a pre-push hook for development pushes.
- Added development workflow commands:
  - `clasp-kit push-dev`
  - `clasp-kit dev-url`
  - `clasp-kit status`
- Added deployment workflow commands:
  - `clasp-kit deploy`
  - `clasp-kit use-deployment`
  - `clasp-kit release`
- Added remote setup helpers:
  - `clasp-kit github`
  - `clasp-kit remote`
- Added support for reading and saving default Apps Script deployment IDs in `.clasp-kit.json`.
- Added npm package configuration for public CLI usage.
- Added GitHub Actions CI for Node.js 18, 20, and 22.
- Added GitHub Actions release automation for creating GitHub Releases and publishing to npm with provenance.
- Added tests for CLI help, file generation, script ID parsing, deployment parsing, and URL generation.

### Notes

- `@google/clasp` is an optional peer dependency. Users should install and authenticate clasp separately before using commands that call Google Apps Script APIs.
- Production `/exec` Apps Script deployments still require versioned redeploys; `clasp-kit push-dev` is intended for latest-code `/dev` testing.
