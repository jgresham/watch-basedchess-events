// used to retroactively process game over events
// in the event that the live watch event fails

import { Command } from 'commander';
import { GameOverLog, processGameOver } from './gameOver.js';
import { SupportedChainId } from './contracts.js';

// Default values
const DEFAULT_ENVIRONMENT = process.env.BC_ENVIRONMENT || 'staging';
const DEFAULT_RPC_URL = process.env.RPC_URL;
const DEFAULT_VERIFIER_URL = process.env.VERIFIER_URL;
const DEFAULT_VERIFIER_KEY = process.env.VERIFIER_KEY;
// Setup CLI with Commander
const program = new Command();
program
  .version('1.0.0')
  .description('Watch contract events and notify the verifier with customizable options')
  .option('-r, --rpc-url <url> (or $RPC_URL)', 'RPC URL for the blockchain (required)', DEFAULT_RPC_URL)
  .option('-u, --verifier-url <url> (or $VERIFIER_URL)', 'URL of the verifier (required)', DEFAULT_VERIFIER_URL)
  .option('-k, --verifier-key <key> (or $VERIFIER_KEY)', 'Key of the verifier (required)', DEFAULT_VERIFIER_KEY)
  .option('-e, --environment <url> (or $BC_ENVIRONMENT)', 'RPC URL for the blockchain', DEFAULT_ENVIRONMENT)
  .option('-t, --test <test>', 'Run in test mode', false)
  .option('-v, --verbose', 'Enable verbose logging', false) // Boolean flag, no value needed
  .parse(process.argv);

// Get parsed options
const options = program.opts<{
  rpcUrl: string;
  verifierUrl: string;
  verifierKey: string;
  environment: string;
  verbose: boolean;
  test: string;
}>();

if (!options.rpcUrl) {
  console.error('RPC URL is required');
  program.help();
  process.exit(1);
}

if (!options.verifierUrl) {
  console.error('Verifier URL is required');
  program.help();
  process.exit(1);
}

if (!options.verifierKey) {
  console.error('Verifier key is required');
  program.help();
  process.exit(1);
}

let chainId: SupportedChainId = 84532;
if (options.environment === 'production') {
  chainId = 8453;
}

export async function processOldGameOverEvent() {
  //   Game ID: 1
  //   0|main     |   Result: 1
  //   0|main     |   Winner: 0x7e510E865a7E4077C3cfD6776bC46b93405252A0
  //   Loser: 0x9399072C67d1b99e8bB02E55b64B38DE397B9F61
  //   Creator: 0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e
  const log: GameOverLog = {
    args: {
      gameId: 1,
      result: 1,
      winnerIfNotDraw: '0x7e510E865a7E4077C3cfD6776bC46b93405252A0',
      loserIfNotDraw: '0x9399072C67d1b99e8bB02E55b64B38DE397B9F61',
      creator: '0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e',
    }
  }
  try {
    await processGameOver({
      log,
      chainId: chainId,
      verifierUrl: options.verifierUrl,
      verifierKey: options.verifierKey,
    });
  } catch (error) {
    console.error(error);
  }

}

processOldGameOverEvent();
