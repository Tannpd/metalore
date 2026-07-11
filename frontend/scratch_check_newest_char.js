import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const contract = '0x84569107EbEcAC6f22a20313C21Cd0A3B8284629';
  
  try {
    const details = await client.readContract({
      address: contract,
      functionName: 'get_character',
      args: [0],
    });
    console.log('Character 0 details:', details);
  } catch (err) {
    console.error('Error:', err.message || err);
  }
}
main();
