import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const addresses = [
    '0x84569107EbEcAC6f22a20313C21Cd0A3B8284629', // Latest (Boundary & Structural verification)
    '0x057357F1A875150844B96A0CdD30750C950131b8', // Previous (Consensus structural validation)
    '0x3BE7482a37E578274b4Dd99bb59B22816A121Aa7', // Previous (Corrected sender_address)
  ];
  
  for (const addr of addresses) {
    try {
      const res = await client.readContract({
        address: addr,
        functionName: 'get_character_count',
        args: [],
      });
      console.log(`Address ${addr} count:`, res);
    } catch (err) {
      console.log(`Address ${addr} error:`, err.message || err);
    }
  }
}
main();
