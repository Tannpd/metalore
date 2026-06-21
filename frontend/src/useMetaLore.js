import { useState, useCallback, useEffect } from 'react';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

let _readClient = null;

function getReadClient() {
  if (!_readClient) {
    _readClient = createClient({ chain: studionet });
  }
  return _readClient;
}

function getWriteClient(account) {
  return createClient({ chain: studionet, account });
}

export function useMetaLore() {
  const [address, setAddress] = useState('');
  const [glAccount, setGlAccount] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Connect Wallet
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const addr = accounts[0].toLowerCase(); // Convert to lowercase to match str(gl.message.sender_account)
        setAddress(addr);
        setGlAccount(addr);
      } else {
        // Ephemeral local account fallback
        const acct = createAccount();
        const addr = acct.address.toLowerCase();
        setAddress(addr);
        setGlAccount(acct);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError('Wallet connection failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch owned characters
  const fetchCharacters = useCallback(async () => {
    if (!address || !CONTRACT_ADDRESS) return;
    setLoading(true);
    try {
      const client = getReadClient();
      const rawIds = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_owner_characters',
        args: [address],
      });
      
      const charIds = JSON.parse(rawIds || '[]');
      const list = [];
      for (const id of charIds) {
        const rawDetails = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: 'get_character',
          args: [id],
        });
        list.push(JSON.parse(rawDetails));
      }
      setCharacters(list);
      setError('');
    } catch (err) {
      console.error('Error fetching owned characters:', err);
      setError('Fetch characters failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Fetch all characters globally for Hall of Fame
  const fetchAllCharacters = useCallback(async () => {
    if (!CONTRACT_ADDRESS) return [];
    try {
      const client = getReadClient();
      const countStr = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_character_count',
        args: [],
      });
      const count = parseInt(countStr || '0', 10);
      
      const list = [];
      for (let i = 0; i < count; i++) {
        const rawDetails = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: 'get_character',
          args: [i],
        });
        list.push(JSON.parse(rawDetails));
      }
      return list;
    } catch (err) {
      console.error('Error fetching all characters:', err);
      return [];
    }
  }, []);

  // Mint Character Transaction
  const mintCharacter = async (name) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus('Submitting mint transaction...');

    try {
      const client = getWriteClient(glAccount);
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'mint_character',
        args: [name],
      });
      setTxHash(hash);
      setTxStatus('Transaction broadcasted. Awaiting block inclusion...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Contract execution error';
        throw new Error(errorMsg);
      }

      setTxStatus(`Success! Character minted.`);
      await fetchCharacters();
      return receipt;
    } catch (err) {
      console.error('Mint character failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Submit Lore URL Transaction
  const submitLore = async (characterId, loreUrl) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus('Summoning AI Dungeon Master to render and analyze story...');

    try {
      const client = getWriteClient(glAccount);
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'submit_lore',
        args: [parseInt(characterId, 10), loreUrl],
      });
      setTxHash(hash);
      setTxStatus('DM is reading and deciding character growth. Awaiting validators consensus...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Contract execution error';
        throw new Error(errorMsg);
      }

      setTxStatus(`Consensus reached! Character attributes upgraded.`);
      await fetchCharacters();
      return receipt;
    } catch (err) {
      console.error('Lore submission failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address && CONTRACT_ADDRESS) {
      fetchCharacters();
    }
  }, [address, fetchCharacters]);

  return {
    address,
    characters,
    loading,
    error,
    txHash,
    txStatus,
    connectWallet,
    fetchCharacters,
    fetchAllCharacters,
    mintCharacter,
    submitLore,
    contractAddress: CONTRACT_ADDRESS,
  };
}
