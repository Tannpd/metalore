import { useState, useEffect, useCallback } from 'react';
import { createClient, createAccount, generatePrivateKey } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export function useMetaLore() {
  const [client, setClient] = useState(null);
  const [account, setAccount] = useState(null);
  const [address, setAddress] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Initialize Client and Account
  useEffect(() => {
    try {
      const cl = createClient({
        chain: studionet,
        endpoint: 'https://studio.genlayer.com/api',
      });
      setClient(cl);

      // Load/Create local developer wallet key for testing
      let pkey = localStorage.getItem('metalore_pkey');
      if (!pkey || pkey === 'undefined') {
        pkey = generatePrivateKey();
        localStorage.setItem('metalore_pkey', pkey);
      }
      const acc = createAccount(pkey);
      setAccount(acc);
      setAddress(acc.address);
    } catch (err) {
      console.error('Failed to init GenLayer client:', err);
      setError('GenLayer Client Init Failed: ' + err.message);
    }
  }, []);

  // Fetch characters owned by address
  const fetchCharacters = useCallback(async () => {
    if (!client || !address || !CONTRACT_ADDRESS) return;
    setLoading(true);
    try {
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
  }, [client, address]);

  // Fetch all characters globally for Hall of Fame
  const fetchAllCharacters = useCallback(async () => {
    if (!client || !CONTRACT_ADDRESS) return [];
    try {
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
  }, [client]);

  // Mint Character Transaction
  const mintCharacter = async (name) => {
    if (!client || !account || !CONTRACT_ADDRESS) {
      throw new Error('Client or Contract Address not configured');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus('Submitting mint transaction...');

    try {
      const hash = await client.writeContract({
        account,
        address: CONTRACT_ADDRESS,
        functionName: 'mint_character',
        args: [name],
      });
      setTxHash(hash);
      setTxStatus('Transaction broadcasted. Awaiting block inclusion...');

      const receipt = await client.waitForTransactionReceipt({ hash });
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
    if (!client || !account || !CONTRACT_ADDRESS) {
      throw new Error('Client or Contract Address not configured');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus('Summoning AI Dungeon Master to render and analyze story...');

    try {
      const hash = await client.writeContract({
        account,
        address: CONTRACT_ADDRESS,
        functionName: 'submit_lore',
        args: [parseInt(characterId, 10), loreUrl],
      });
      setTxHash(hash);
      setTxStatus('DM is reading and deciding character growth. Awaiting validators consensus...');

      const receipt = await client.waitForTransactionReceipt({ hash });
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
    if (client && address && CONTRACT_ADDRESS) {
      fetchCharacters();
    }
  }, [client, address, fetchCharacters]);

  return {
    address,
    characters,
    loading,
    error,
    txHash,
    txStatus,
    fetchCharacters,
    fetchAllCharacters,
    mintCharacter,
    submitLore,
    contractAddress: CONTRACT_ADDRESS,
  };
}
