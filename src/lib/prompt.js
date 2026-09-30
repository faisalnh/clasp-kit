import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { CliError } from './errors.js';

function displayDescription(deployment) {
  return deployment.description || '(no description)';
}

export async function promptForDeployment(deployments, options = {}) {
  const promptInput = options.input || input;
  const promptOutput = options.output || output;
  const allowCreate = options.allowCreate !== false;

  if (!promptInput.isTTY || !promptOutput.isTTY) {
    const choices = deployments
      .map((deployment) => `${deployment.deploymentId} (${displayDescription(deployment)})`)
      .join(', ');
    throw new CliError(`Multiple deployments match. Re-run with a deployment name or ID. Available deployments: ${choices}`);
  }

  const rl = readline.createInterface({ input: promptInput, output: promptOutput });

  try {
    promptOutput.write('Choose a deployment to update:\n');
    deployments.forEach((deployment, index) => {
      const version = deployment.versionNumber ? `@${deployment.versionNumber}` : '@HEAD';
      promptOutput.write(`  ${index + 1}) ${displayDescription(deployment)} ${version} (${deployment.deploymentId})\n`);
    });
    if (allowCreate) {
      promptOutput.write('  n) Create a new deployment\n');
    }

    const answer = (await rl.question('Selection: ')).trim().toLowerCase();

    if (allowCreate && (answer === 'n' || answer === 'new')) {
      return { action: 'create' };
    }

    const index = Number(answer) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= deployments.length) {
      throw new CliError('Invalid deployment selection. No changes were made.');
    }

    return { action: 'update', deployment: deployments[index] };
  } catch (err) {
    if (err instanceof CliError) {
      throw err;
    }
    throw new CliError('Deployment selection was cancelled. No changes were made.');
  } finally {
    rl.close();
  }
}

export async function promptForDeploymentName(defaultName = 'Web app', options = {}) {
  const promptInput = options.input || input;
  const promptOutput = options.output || output;

  if (!promptInput.isTTY || !promptOutput.isTTY) {
    throw new CliError('A deployment name is required when creating a new deployment noninteractively.');
  }

  const rl = readline.createInterface({ input: promptInput, output: promptOutput });

  try {
    const answer = (await rl.question(`Deployment name [${defaultName}]: `)).trim();
    return answer || defaultName;
  } catch {
    throw new CliError('Deployment naming was cancelled. No changes were made.');
  } finally {
    rl.close();
  }
}
