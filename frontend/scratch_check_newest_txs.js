import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const contract = '0x84569107EbEcAC6f22a20313C21Cd0A3B8284629';
  
  try {
    const blockNumber = await client.getBlockNumber();
    console.log('Current block:', blockNumber);
    
    // Scan last 50 blocks
    for (let i = 0n; i < 50n; i++) {
      const num = blockNumber - i;
      const block = await client.getBlock({ blockNumber: num, includeTransactions: true });
      if (block.transactions && block.transactions.length > 0) {
        for (const tx of block.transactions) {
          const toAddress = (typeof tx === 'object' ? tx.to : null);
          const hash = (typeof tx === 'object' ? tx.hash : tx);
          if (toAddress && toAddress.toLowerCase() === contract.toLowerCase()) {
            console.log(`Found transaction ${hash} in block ${num}`);
            const receipt = await client.getTransactionReceipt({ hash });
            console.log('Receipt details:', JSON.stringify(receipt, null, 2));
          }
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
