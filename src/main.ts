import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { contracts, SupportedChainId } from './contracts.js';
import { Command } from 'commander';
import {
  generateGameOverImage,
  // generateGameOverImage,
  processGameOver
} from './gameOver.js';

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

// USDC contract address on Ethereum Mainnet
const contractAddress = contracts.gamesContract[chainId].address;
const abi = contracts.gamesContract[chainId].abi;

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(options.rpcUrl),
});

// Function to process event logs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processEvent(log: any): Promise<void> {
  const { gameId, message, signature, signer, updateIndex } = log.args;
  const rawGameId = gameId;
  const bigIntGameId = BigInt(rawGameId as string);
  const contractGameId = Number(bigIntGameId);   // As number: 291 (if within safe range)
  console.log(`GameUpdateSynced detected:`);
  console.log(`  Game ID: ${contractGameId}`);
  console.log(`  Message: ${message}`);
  console.log(`  Signature: ${signature}`);
  console.log(`  Signer: ${signer}`);
  console.log(`  Update Index: ${updateIndex}`);
  console.log('---');



  // Notify the verifier
  const response = await fetch(options.verifierUrl + '/verifyGameUpdate', {
    method: 'POST',
    body: JSON.stringify({ contractGameId, message, signature, signer, updateIndex }),
    headers: {
      'X-API-Key': options.verifierKey,
    },
  });
  // response contains "OK" if successful
  try {
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    // not json response
    console.log(e);
    const data = await response.text();
    console.log(data);
  }

}

// Main function to watch events
function watchContractEvents(): void {
  console.log('Starting to watch for GameUpdateSynced events... Press Ctrl+C to stop.');

  const unwatchGameUpdateSynced = publicClient.watchContractEvent({
    address: contractAddress,
    abi: abi,
    eventName: 'GameUpdateSynced',
    onLogs: (logs) => {
      logs.forEach((log) => processEvent(log));
    },
    onError: (error) => {
      console.error('Error watching GameUpdateSynced events:', error);
    },
  });

  const unwatchGameOver = publicClient.watchContractEvent({
    address: contractAddress,
    abi: abi,
    eventName: 'GameOver',
    onLogs: (logs) => {
      logs.forEach((log) => processGameOver({ log, chainId, verifierUrl: options.verifierUrl, verifierKey: options.verifierKey }));
    },
    onError: (error) => {
      console.error('Error watching GameOver events:', error);
    },
  });

  // Handle process termination gracefully
  process.on('SIGINT', () => {
    console.log('\nStopping event watcher...');
    unwatchGameUpdateSynced();
    unwatchGameOver();
    process.exit(0);
  });
}

// Start watching
if (options.test === 'gennft') {
  generateGameOverImage({
    contractAddress: contractAddress,
    contractGameId: 1,
    gameResult: 1,
    winnerIfNotDraw: '0x2a99ec82d658f7a77ddebfd83d0f8f591769cb64',
    loserIfNotDraw: '0x187c7b0393ebe86378128f2653d0930e33218899',
    creator: '0x2a99ec82d658f7a77ddebfd83d0f8f591769cb64',
  });
} else {
  watchContractEvents();
}
