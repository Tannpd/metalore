import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const addresses = [
    '0xA3b5EC5F11220b1f685427844d96bA40EedfEac3', // Newest
    '0xE9724DFab091AC3E6981Bbf495aa207EfA369B25', // Previous
    '0x7dE4ccef0515CB4c7eDa60b9eE0226a21c7F6e83'  // Initial
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
