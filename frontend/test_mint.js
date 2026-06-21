import { createClient, createAccount, generatePrivateKey } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const pkey = generatePrivateKey();
  const account = createAccount(pkey);
  const client = createClient({ chain: studionet, account });
  
  console.log('Using address:', account.address);
  
  try {
    console.log('Sending mint transaction...');
    const hash = await client.writeContract({
      address: '0xA3b5EC5F11220b1f685427844d96bA40EedfEac3',
      functionName: 'mint_character',
      args: ['HeroTest'],
    });
    console.log('Transaction hash:', hash);
    
    console.log('Waiting for receipt...');
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log('Receipt status:', receipt.status);
    if (receipt.status !== 'success') {
      console.log('Full Receipt details:', JSON.stringify(receipt, null, 2));
    }
  } catch (err) {
    if (err.cause) {
      console.log('Error Cause:', JSON.stringify(err.cause.data, null, 2));
    } else {
      console.error('Error details:', err);
    }
  }
}
main();
