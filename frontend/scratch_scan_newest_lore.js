import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const contract = '0x84569107EbEcAC6f22a20313C21Cd0A3B8284629'.toLowerCase();
  
  try {
    const blockNumber = await client.getBlockNumber();
    console.log('Current block:', blockNumber);
    
    // Scan last 300 blocks with concurrency limit
    const start = blockNumber - 300n;
    const end = blockNumber;
    console.log(`Scanning blocks from ${start} to ${end}...`);
    
    for (let num = start; num <= end; num++) {
      try {
        const block = await client.getBlock({ blockNumber: num, includeTransactions: true });
        if (block.transactions && block.transactions.length > 0) {
          for (const tx of block.transactions) {
            const toAddress = (typeof tx === 'object' ? tx.to : null);
            const hash = (typeof tx === 'object' ? tx.hash : tx);
            if (toAddress && toAddress.toLowerCase() === contract) {
              const receipt = await client.getTransactionReceipt({ hash });
              console.log(`Found Tx ${hash} in block ${num}:`);
              console.log(`Method: ${typeof tx === 'object' ? tx.input : 'unknown'}`);
              console.log(`Receipt:`, JSON.stringify(receipt, null, 2));
            }
          }
        }
      } catch (err) {
        // ignore errors
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
