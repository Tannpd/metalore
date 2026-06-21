import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  try {
    const res = await client.readContract({
      address: '0xE9724DFab091AC3E6981Bbf495aa207EfA369B25',
      functionName: 'get_character',
      args: [0], // check character ID 0
    });
    console.log('Success:', res);
  } catch (err) {
    if (err.cause) {
      console.log('Error Cause Data:', JSON.stringify(err.cause.data, null, 2));
    } else {
      console.error('Error details:', err);
    }
  }
}
main();
