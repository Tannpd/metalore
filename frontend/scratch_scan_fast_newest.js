import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({ chain: studionet });
  const contract = '0x84569107EbEcAC6f22a20313C21Cd0A3B8284629'.toLowerCase();
  
  try {
    const start = 1783766400n;
    const end = 1783768000n;
    
    console.log(`Scanning blocks from ${start} to ${end} in batches of 40...`);
    
    for (let batchStart = start; batchStart <= end; batchStart += 40n) {
      const promises = [];
      for (let offset = 0n; offset < 40n && (batchStart + offset) <= end; offset++) {
        const num = batchStart + offset;
        promises.push(
          (async () => {
            try {
              const block = await client.getBlock({ blockNumber: num, includeTransactions: true });
              if (block.transactions && block.transactions.length > 0) {
                for (const tx of block.transactions) {
                  const toAddress = (typeof tx === 'object' ? tx.to : null);
                  const hash = (typeof tx === 'object' ? tx.hash : tx);
                  if (toAddress && toAddress.toLowerCase() === contract) {
                    console.log(`FOUND transaction ${hash} in block ${num}!`);
                    const receipt = await client.getTransactionReceipt({ hash });
                    console.log('Receipt details:', JSON.stringify(receipt, null, 2));
                  }
                }
              }
            } catch (e) {
              // ignore
            }
          })()
        );
      }
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    console.log('Scan completed.');
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
