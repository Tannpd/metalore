import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const contract = '0x84569107EbEcAC6f22a20313C21Cd0A3B8284629';
  
  try {
    const count = await client.readContract({
      address: contract,
      functionName: 'get_character_count',
      args: [],
    });
    console.log('Newest contract character count:', count);
  } catch (err) {
    console.error('Error querying newest contract:', err.message || err);
  }
}
main();
