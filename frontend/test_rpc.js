import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  try {
    const res = await client.readContract({
      address: '0xA3b5EC5F11220b1f685427844d96bA40EedfEac3',
      functionName: 'get_owner_characters',
      args: ['0x7dE4ccef0515CB4c7eDa60b9eE0226a21c7F6e83'],
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
