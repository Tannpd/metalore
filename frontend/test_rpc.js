import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const addresses = [
    '0x3BE7482a37E578274b4Dd99bb59B22816A121Aa7', // Newest (Corrected sender_address)
    '0xA3b5EC5F11220b1f685427844d96bA40EedfEac3', // Previous (Broken sender_account)
    '0xE9724DFab091AC3E6981Bbf495aa207EfA369B25', // Previous
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
