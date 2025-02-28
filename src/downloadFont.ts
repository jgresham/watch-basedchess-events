import fs from 'node:fs';
import { buffer } from 'node:stream/consumers';

// Function to download the font using fetch
export async function downloadFont(url: string, dest: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Convert ReadableStream to Buffer
    const fontBuffer = await buffer(response.body as any);

    // Write the buffer to the file
    fs.writeFileSync(dest, fontBuffer);
    console.log('Font downloaded successfully');
  } catch (error) {
    console.error('Error downloading font:', error);
    throw error;
  }
}
