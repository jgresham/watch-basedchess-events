import { createCanvas, loadImage, registerFont } from "canvas";
import { getFarcasterUserByAddress } from "./neynar.js";
// import fs from 'node:fs';
import path from "node:path";
import { fileURLToPath } from "node:url";
import { truncateAddress } from "./util.js";
import { PinataSDK } from "pinata-web3";
import { contracts, SupportedChainId } from "./contracts.js";

export const processGameOver = async (
  { log, chainId, verifierUrl, verifierKey }:
    { log: any, chainId: SupportedChainId, verifierUrl: string, verifierKey: string }
) => {
  const { gameId, result, winnerIfNotDraw, loserIfNotDraw, creator } = log.args;
  const bigIntGameId = BigInt(gameId as string);
  const contractGameId = Number(bigIntGameId);   // As number: 291 (if within safe range)
  console.log(`GameOver detected:`);
  console.log(`  Game ID: ${contractGameId}`);
  console.log(`  Result: ${result}`);
  console.log(`  Winner: ${winnerIfNotDraw}`);
  console.log(`  Loser: ${loserIfNotDraw}`);
  console.log(`  Creator: ${creator}`);
  console.log('---');

  const farcasterUserWinner = await getFarcasterUserByAddress(winnerIfNotDraw);
  const farcasterUserLoser = await getFarcasterUserByAddress(loserIfNotDraw);

  console.log(`  Winner (if not draw): ${farcasterUserWinner?.username}`);
  console.log(`  Loser (if not draw): ${farcasterUserLoser?.username}`);
  const contractAddress = contracts.gamesContract[chainId].address;

  const metadataUrl = await generateGameOverImage({
    contractAddress: contractAddress,
    contractGameId: contractGameId,
    gameResult: result,
    winnerIfNotDraw: winnerIfNotDraw,
    loserIfNotDraw: loserIfNotDraw,
    creator: creator,
  });

  // Notify the verifier
  console.log(`Notifying verifier with metadata URL: ${metadataUrl}`);
  const response = await fetch(verifierUrl + '/gameOverNft', {
    method: 'POST',
    body: JSON.stringify({ contractAddress, contractGameId, metadataUrl }),
    headers: {
      'X-API-Key': verifierKey,
    },
  });
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

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_WIDTH = 1024;  // Adjusted for clarity when scaled
const IMAGE_HEIGHT = 768;
const BACKGROUND_IMAGE_PATH = path.join(__dirname, 'assets', 'King.jpg'); // Replace with your chessboard image path


export const generateGameOverImage = async ({
  contractAddress,
  contractGameId,
  gameResult,
  winnerIfNotDraw,
  loserIfNotDraw,
  creator,
}: {
  contractAddress: `0x${string}`;
  contractGameId: number;
  gameResult: number;
  winnerIfNotDraw: `0x${string}`;
  loserIfNotDraw: `0x${string}`;
  creator: `0x${string}`;
}) => {
  // const winnerIfNotDraw = '0x2a99ec82d658f7a77ddebfd83d0f8f591769cb64'; // johns
  // const loserIfNotDraw = '0x187c7b0393ebe86378128f2653d0930e33218899'; // dwr
  const [farcasterUserWinner, farcasterUserLoser] = await Promise.all([
    getFarcasterUserByAddress(winnerIfNotDraw),
    getFarcasterUserByAddress(loserIfNotDraw),
  ]);

  console.log(`  Winner (if not draw): ${farcasterUserWinner?.username}`);
  console.log(`  Loser (if not draw): ${farcasterUserLoser?.username}`);

  // const loserUsername = 'dwr';
  // // const loserUsername = 'varuanrankashan';
  // const winnerUsername = 'johns';
  const loserUsername = farcasterUserLoser?.username || truncateAddress(loserIfNotDraw);
  // const winnerUsername = farcasterUserWinner?.username || truncateAddress(winnerIfNotDraw);
  // const loserUsername = 'johns';
  // || farcasterUserWinner?.username || winnerIfNotDraw;
  const loserProfilePic = farcasterUserLoser?.pfp_url;
  // const winnerProfilePic = farcasterUserWinner?.pfp_url;

  const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background color
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  // Load chessboard image
  const boardImage = await loadImage(BACKGROUND_IMAGE_PATH);
  ctx.drawImage(boardImage, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT); // Adjust size as needed

  // Load the Orbitron font
  // const fontUrl = "https://fonts.gstatic.com/s/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy1biN15.woff2) format('woff2')";

  // if (!fs.existsSync(fontPath)) {
  //   console.log('Downloading Orbitron font...');
  //   await downloadFont(fontUrl, fontPath);
  // }

  // Register the font with node-canvas
  // const fontPath = path.join(__dirname, 'fonts', 'Orbitron-Regular.ttf');
  // registerFont(fontPath, { family: 'Orbitron', weight: 'normal' });
  // const fontPathBold = path.join(__dirname, 'fonts', 'Orbitron-Bold.ttf');
  // registerFont(fontPathBold, { family: 'Orbitron-bold', weight: 'bold' });
  // const fontPathExtraBold = path.join(__dirname, 'fonts', 'Orbitron-ExtraBold.ttf');
  // registerFont(fontPathExtraBold, { family: 'Orbitron-extrabold', weight: 'extrabold' });
  const fontPathBlack = path.join(__dirname, 'assets', 'fonts', 'Orbitron-Black.ttf');
  registerFont(fontPathBlack, { family: 'Orbitron-black', weight: 'black' });
  // const fontPathSemiBold = path.join(__dirname, 'fonts', 'Orbitron-SemiBold.ttf');
  // registerFont(fontPathSemiBold, { family: 'Orbitron-semibold', weight: 'semibold' });
  // const fontPathMedium = path.join(__dirname, 'fonts', 'Orbitron-Medium.ttf');
  // registerFont(fontPathMedium, { family: 'Orbitron-medium', weight: 'medium' });

  // Text styling
  // ctx.fillStyle = 'white';
  // ctx.font = '16px Arial';

  // // Player names (larger text)
  // ctx.font = '36px Arial';
  // const loserNameWidth = ctx.measureText(loserUsername).width
  // // ctx.fillText(farcasterUserWinner?.username, 630, 150);
  // ctx.fillText(`DEFEATED ${loserUsername}`, (IMAGE_WIDTH / 2) - (loserNameWidth / 2), 350);

  // Text properties
  const text = 'Checkmated';
  const fontSize = Math.floor(canvas.height * 0.135); // 10% of height
  ctx.font = `${fontSize}px Orbitron-black`; // Use a futuristic font if available
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Center coordinates
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  const checkmateY = y - fontSize * 0.5;

  // Emboss effect with shadow and color contrast
  ctx.shadowColor = 'rgba(5, 120, 120, 0.8)'; // Neon cyan shadow
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = -3; // Left-top shadow for raised effect
  ctx.shadowOffsetY = -3;

  // Draw the "highlight" (lighter shadow) for embossing
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Light overlay
  ctx.fillText(text, x, checkmateY);

  // Draw the "shadow" (darker shadow) for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; // Dark shadow
  ctx.shadowOffsetX = 4; // Bottom-right shadow
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 8;
  // ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Main text in neon cyan
  ctx.fillStyle = 'hsl(198.6 88.7% 48.4%)'; // Main text in neon cyan
  ctx.fillText(text, x, checkmateY);

  // Reset shadow to avoid affecting other drawings
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Optional: Add a subtle glow around the text
  ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
  ctx.fillText(text, x, checkmateY);

  // // Draw player names and moves
  // ctx.fillText(`White: ${gameData.playerWhite}`, 200, 50);
  // ctx.fillText(`Black: ${gameData.playerBlack}`, 200, 80);
  // ctx.fillText(`Moves: ${gameData.moves}`, 200, 110);



  // Load the loser's profile picture
  const profilePic = await loadImage(loserProfilePic); // Example avatar
  // const profilePic = new Image();
  // profilePic.crossOrigin = 'Anonymous';
  // profilePic.src = profilePicUrl;
  // await new Promise(resolve => {
  //   profilePic.onload = resolve;
  // });
  const smallerFontSize = Math.floor(fontSize * 0.9); // Smaller text
  ctx.font = `${smallerFontSize}px Orbitron-black`; // Use a futuristic font if available

  // ctx.measureText(loserUsername).width
  // ctx.drawImage(profilePic, 100, 100, 100, 100);
  const profilePicSize = smallerFontSize * 1.5; // Profile pic size relative to text

  // Position below "Checkmate"
  const loserY = checkmateY + fontSize * 1.5; // Space below "Checkmate"

  // Calculate dimensions for the dark background
  // const textWidth = ctx.measureText(loserUsername).width;
  // const backgroundPadding = 10; // Padding around text and image
  // const backgroundWidth = textWidth + profilePicSize + backgroundPadding * 3; // Extra padding for spacing
  // const backgroundHeight = profilePicSize + backgroundPadding * 2;
  // const backgroundX = x - backgroundWidth / 2;
  // const backgroundY = loserY - backgroundHeight / 2;

  // // Draw dark transparent background
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Dark with 50% transparency
  // ctx.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);

  // Draw profile picture
  const maxUserNameWidth = IMAGE_WIDTH - profilePicSize - 30;
  let profilePicX = x -
    (ctx.measureText(loserUsername).width / 2 + profilePicSize / 2 + 10); // Left of text
  const MIN_PROFILE_PIC_X = 10;
  profilePicX = Math.max(profilePicX, MIN_PROFILE_PIC_X);

  // Draw circular profile picture with border
  const profilePicY = loserY - profilePicSize / 2;
  const radius = profilePicSize / 2;

  // Clip to circle
  ctx.save(); // Save state to isolate clipping
  ctx.beginPath();
  ctx.arc(profilePicX + radius, profilePicY + radius, radius, 0, Math.PI * 2, false);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(profilePic, profilePicX, loserY - profilePicSize / 2, profilePicSize, profilePicSize);

  // Add a border
  ctx.restore(); // Restore to draw the border outside the clip
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // Black border
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(profilePicX + radius, profilePicY + radius, radius, 0, Math.PI * 2, false);
  ctx.stroke();

  // Draw username with slight emboss
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // White text for contrast
  ctx.fillText(
    loserUsername, x + profilePicSize / 2,
    loserY,
    maxUserNameWidth); // max width

  // Save image
  const buffer = canvas.toBuffer('image/jpeg', { quality: 1 });

  // save file to local fs for testing
  // fs.writeFileSync('gameOver.jpeg', buffer);
  // console.log(`Generated image saved as gameOver.jpeg`);

  // Upload image and metadata to IPFS in ERC1155 metadata format
  // Get image url uploading to pinata IPFS first
  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY_URL
  })
  const imagePinResponse = await pinata.upload.base64(buffer.toString('base64'));
  console.log("imagePinResponse", imagePinResponse);
  const imageUrl = imagePinResponse.IpfsHash;
  console.log(`Image URL: ipfs://${imageUrl}`);

  const loserUsernameUntruncated = farcasterUserLoser?.username || loserIfNotDraw;
  const winnerUsernameUntruncated = farcasterUserWinner?.username || winnerIfNotDraw;

  // public url https://pub-51e4ca6e7840416cbf655221568d5c6f.r2.dev

  const metadata = {
    name: `BasedChess victory`,
    description: `${winnerUsernameUntruncated} defeated ${loserUsernameUntruncated}`,
    image: `ipfs://${imageUrl}`,
    // external_link: "https://basedchess.xyz",
    properties: {
      contractAddress: contractAddress,
      contractGameId: contractGameId,
      gameResult: gameResult,
      winner: winnerIfNotDraw,
      loser: loserIfNotDraw,
      gameCreator: creator,
      ipfsImageUrl: `ipfs://${imageUrl}`,
    }
  };

  const metadataPinResponse = await pinata.upload.json(metadata);
  console.log("metadataPinResponse", metadataPinResponse);
  return `ipfs://${metadataPinResponse.IpfsHash}`;
}
// generateGameOverImage({
//   contractAddress: '0x1234567890123456789012345678901234567890',
//   contractGameId: 1,
//   gameResult: 1,
//   winnerIfNotDraw: '0x2a99ec82d658f7a77ddebfd83d0f8f591769cb64',
//   loserIfNotDraw: '0x187c7b0393ebe86378128f2653d0930e33218899',
//   creator: '0x1234567890123456789012345678901234567890',
// });
