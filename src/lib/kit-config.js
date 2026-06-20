import fs from 'node:fs';
import path from 'node:path';

export const KIT_CONFIG_FILE = '.clasp-kit.json';

export function readKitConfig(projectDir = process.cwd()) {
  const filePath = path.join(projectDir, KIT_CONFIG_FILE);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function readDefaultDeploymentId(projectDir = process.cwd()) {
  const config = readKitConfig(projectDir);
  return typeof config.defaultDeploymentId === 'string' ? config.defaultDeploymentId : null;
}

export function writeDefaultDeploymentId(projectDir, deploymentId, options = {}) {
  const filePath = path.join(projectDir, KIT_CONFIG_FILE);
  const current = readKitConfig(projectDir);
  const next = {
    ...current,
    defaultDeploymentId: deploymentId
  };

  if (!options.dryRun) {
    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }

  return { action: current.defaultDeploymentId ? 'updated' : 'created', path: filePath };
}
