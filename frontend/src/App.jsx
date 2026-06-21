import React, { useState, useEffect } from 'react';
import { useMetaLore } from './useMetaLore';
import { 
  Swords, 
  BookOpen, 
  Compass, 
  Trophy, 
  UserPlus, 
  Loader2, 
  Sparkles, 
  ShieldAlert, 
  Map, 
  Award,
  Link as LinkIcon,
  HelpCircle
} from 'lucide-react';

// Ready-made public sample lore URLs for testing
const SAMPLE_LORES = [
  {
    title: "⚔️ Chapter 1: The Dragon's Cave (Combat/Strength)",
    url: "https://raw.githubusercontent.com/Tannpd/hackachain/main/README.md", // Use existing file as valid scraper target
    description: "A story about confronting a dragon with raw physical power and shield defenses."
  },
  {
    title: "🧩 Chapter 2: The Sphinx's Enigma (Wisdom/Riddles)",
    url: "https://raw.githubusercontent.com/Tannpd/metalore/main/README.md", // Will deploy MetaLore soon
    description: "An intellectual challenge solving ancient magical inscriptions and riddle seals."
  },
  {
    title: "💨 Chapter 3: Escape from the Dungeon (Agility/Stealth)",
    url: "https://raw.githubusercontent.com/Tannpd/hackachain/main/frontend/index.html",
    description: "A fast-paced escape navigating dart traps and slipping past sleeping guards."
  }
];

export default function App() {
  const {
    address,
    characters,
    loading,
    error,
    txHash,
    txStatus,
    connectWallet,
    mintCharacter,
    submitLore,
    fetchAllCharacters,
    contractAddress
  } = useMetaLore();

  const [activeTab, setActiveTab] = useState('tavern'); // tavern, journey, leaderboard
  const [mintName, setMintName] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [loreUrl, setLoreUrl] = useState('');
  const [globalCharacters, setGlobalCharacters] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedCharacterDetails, setSelectedCharacterDetails] = useState(null);

  // Sync selected character details
  useEffect(() => {
    if (selectedCharId !== '') {
      const char = characters.find(c => c.id.toString() === selectedCharId.toString());
      setSelectedCharacterDetails(char || null);
    } else {
      setSelectedCharacterDetails(null);
    }
  }, [selectedCharId, characters]);

  // Load leaderboard details
  const loadLeaderboard = async () => {
    setGlobalLoading(true);
    try {
      const list = await fetchAllCharacters();
      // Sort by level then total stats
      const sorted = list.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        const totalA = a.strength + a.wisdom + a.agility + a.vitality;
        const totalB = b.strength + b.wisdom + b.agility + b.vitality;
        return totalB - totalA;
      });
      setGlobalCharacters(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab]);

  const handleMint = async (e) => {
    e.preventDefault();
    if (!mintName.trim()) return;
    try {
      await mintCharacter(mintName);
      setMintName('');
      setActiveTab('journey'); // Redirect to write lore
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoreSubmit = async (e) => {
    e.preventDefault();
    if (selectedCharId === '' || !loreUrl.trim()) return;
    try {
      await submitLore(selectedCharId, loreUrl);
      setLoreUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  const selectCharacterDirectly = (id) => {
    setSelectedCharId(id.toString());
    setActiveTab('journey');
  };

  return (
    <div className="container">
      {/* Header section */}
      <header className="header">
        <h1 style={{ fontSize: '3rem', marginBottom: '8px' }}>⚔️ MetaLore ⚔️</h1>
        <p className="subtitle">The On-Chain AI RPG Where Storytelling Evolves Your Character</p>
        
        {/* Connection status */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="glass-panel" style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
            <strong>Network:</strong> GenLayer StudioNet
          </span>
          <span className="glass-panel" style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
            <strong>Contract:</strong> {contractAddress ? `${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}` : 'Not Configured'}
          </span>
          {address ? (
            <span className="glass-panel" style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
              <strong>Wallet:</strong> {`${address.slice(0, 8)}...${address.slice(-6)}`}
            </span>
          ) : (
            <button 
              onClick={connectWallet} 
              className="gold-btn"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Contract Warning Banner if VITE_CONTRACT_ADDRESS not configured */}
      {!contractAddress && (
        <div className="glass-panel" style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={28} color="#ef4444" />
          <div>
            <h3 style={{ textShadow: 'none', color: '#ef4444' }}>Contract Address Missing</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Please compile, deploy your contract in the <strong>GenLayer Studio</strong>, and specify the address in your `.env` file as `VITE_CONTRACT_ADDRESS`.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'tavern' ? 'active' : ''}`}
          onClick={() => setActiveTab('tavern')}
        >
          <UserPlus size={18} /> Tavern
        </button>
        <button 
          className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
          onClick={() => setActiveTab('journey')}
        >
          <Compass size={18} /> Journey
        </button>
        <button 
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={18} /> Hall of Fame
        </button>
      </div>

      {/* Main RPG Panels */}
      <div className="rpg-grid">
        
        {/* Left side: Character selection / details preview */}
        <div>
          <div className="glass-panel" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Swords size={20} color="#8b5cf6" /> Your Characters
            </h3>
            
            {!address ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                <p>Connect wallet to view characters.</p>
              </div>
            ) : characters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                <p>No characters minted yet.</p>
                <button 
                  onClick={() => setActiveTab('tavern')} 
                  style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Visit Tavern to Mint
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {characters.map((char) => (
                  <div 
                    key={char.id} 
                    onClick={() => setSelectedCharId(char.id.toString())}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: selectedCharId.toString() === char.id.toString() ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedCharId.toString() === char.id.toString() ? '#8b5cf6' : 'rgba(255, 255, 255, 0.05)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{char.name}</strong>
                      <span style={{ fontSize: '0.8rem', background: '#8b5cf6', padding: '2px 8px', borderRadius: '12px' }}>
                        Lvl {char.level}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.8rem', color: '#9ca3af' }}>
                      <span>STR: {char.strength}</span>
                      <span>WIS: {char.wisdom}</span>
                      <span>AGI: {char.agility}</span>
                      <span>VIT: {char.vitality}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {address && selectedCharacterDetails && (
            <div className="glass-panel pulse-glow">
              <h3 style={{ fontFamily: 'Cinzel', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} /> Character Card
              </h3>
              <div style={{ marginTop: '15px' }}>
                <h2 style={{ fontSize: '1.6rem' }}>{selectedCharacterDetails.name}</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Level {selectedCharacterDetails.level} Adventurer</p>
                <p style={{ color: '#8b5cf6', fontSize: '0.85rem', marginBottom: '15px' }}>
                  Chapters Logged: {selectedCharacterDetails.lore_count}
                </p>

                {/* Attributes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="stat-bar-container">
                    <div className="stat-header">
                      <span>Strength</span>
                      <span>{selectedCharacterDetails.strength} / 100</span>
                    </div>
                    <div className="stat-bar-outer">
                      <div className="stat-bar-inner strength-bar" style={{ width: `${selectedCharacterDetails.strength}%` }}></div>
                    </div>
                  </div>

                  <div className="stat-bar-container">
                    <div className="stat-header">
                      <span>Wisdom</span>
                      <span>{selectedCharacterDetails.wisdom} / 100</span>
                    </div>
                    <div className="stat-bar-outer">
                      <div className="stat-bar-inner wisdom-bar" style={{ width: `${selectedCharacterDetails.wisdom}%` }}></div>
                    </div>
                  </div>

                  <div className="stat-bar-container">
                    <div className="stat-header">
                      <span>Agility</span>
                      <span>{selectedCharacterDetails.agility} / 100</span>
                    </div>
                    <div className="stat-bar-outer">
                      <div className="stat-bar-inner agility-bar" style={{ width: `${selectedCharacterDetails.agility}%` }}></div>
                    </div>
                  </div>

                  <div className="stat-bar-container">
                    <div className="stat-header">
                      <span>Vitality</span>
                      <span>{selectedCharacterDetails.vitality} / 100</span>
                    </div>
                    <div className="stat-bar-outer">
                      <div className="stat-bar-inner vitality-bar" style={{ width: `${selectedCharacterDetails.vitality}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Traits list */}
                <div style={{ marginTop: '20px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: '500' }}>Character Traits:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {selectedCharacterDetails.traits ? (
                      selectedCharacterDetails.traits.split(',').map((t, idx) => (
                        <span 
                          key={idx} 
                          style={{
                            fontSize: '0.8rem',
                            padding: '3px 8px',
                            background: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: '4px',
                            color: '#fbbf24'
                          }}
                        >
                          ✨ {t.trim()}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>No traits acquired yet. Write lore!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Active Panel View */}
        <div>
          {/* Tab 1: Tavern (Minting) */}
          {activeTab === 'tavern' && (
            <div className="glass-panel" style={{ minHeight: '400px' }}>
              <h2 style={{ marginBottom: '12px' }}>🍻 The Adventurers' Tavern</h2>
              <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
                Every epic saga starts in a smoky, crowded tavern. Gather your courage and write your name into the realm.
              </p>

              {!address ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Connect your browser wallet extension to start minting character NFTs.</p>
                  <button onClick={connectWallet} className="gold-btn">
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMint} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500' }}>
                      What is your character's name?
                    </label>
                    <input 
                      type="text" 
                      placeholder="Enter name, e.g. Elric the Brave..."
                      value={mintName}
                      onChange={(e) => setMintName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                    Mint Adventurer NFT
                  </button>
                </form>
              )}

              {/* Status/Logs */}
              {loading && txStatus && (
                <div className="glass-panel" style={{ marginTop: '30px', borderColor: 'var(--accent-cyan)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)' }}>
                    <Loader2 className="animate-spin" size={20} />
                    <strong>Transaction Progress:</strong>
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '0.95rem' }}>{txStatus}</p>
                  {txHash && (
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '6px', fontFamily: 'monospace' }}>
                      Hash: {txHash}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="glass-panel" style={{ marginTop: '30px', borderColor: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
                  <strong style={{ color: '#ef4444' }}>Transaction Error:</strong>
                  <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Journey (Lore submission) */}
          {activeTab === 'journey' && (
            <div className="glass-panel" style={{ minHeight: '400px' }}>
              <h2 style={{ marginBottom: '12px' }}>🗺️ Submit Journey Chronicles</h2>
              <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
                Write your character's next chapter in a public document (e.g. Medium post, GitHub Gist, or raw txt url) and submit. GenLayer's AI Dungeon Master will scrape the page and reward your decisions.
              </p>

              {!address ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Connect your browser wallet extension to submit your story lore.</p>
                  <button onClick={connectWallet} className="gold-btn">
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem' }}>
                        Select Adventurer
                      </label>
                      <select 
                        value={selectedCharId}
                        onChange={(e) => setSelectedCharId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Character --</option>
                        {characters.map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name} (Lvl {char.level})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem' }}>
                        Lore URL (Raw Page/Story text)
                      </label>
                      <input 
                        type="url" 
                        placeholder="https://gist.githubusercontent.com/.../story.txt"
                        value={loreUrl}
                        onChange={(e) => setLoreUrl(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
                      Quick Auto-Fill Test Stories:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {SAMPLE_LORES.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="gold-btn"
                          style={{
                            fontSize: '0.85rem',
                            padding: '8px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            background: 'rgba(251, 191, 36, 0.05)',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24',
                            textAlign: 'left'
                          }}
                          onClick={() => setLoreUrl(sample.url)}
                        >
                          <strong>{sample.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 'normal' }}>
                            {sample.description} ({sample.url.slice(0, 50)}...)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || selectedCharId === ''} 
                    style={{ alignSelf: 'flex-start', marginTop: '10px' }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    Consult Dungeon Master
                  </button>
                </form>
              )}

              {/* Status/Logs */}
              {loading && txStatus && (
                <div className="glass-panel" style={{ marginTop: '30px', borderColor: 'var(--accent-cyan)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)' }}>
                    <Loader2 className="animate-spin" size={20} />
                    <strong>AI Judge Action:</strong>
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '0.95rem' }}>{txStatus}</p>
                  {txHash && (
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '6px', fontFamily: 'monospace' }}>
                      Hash: {txHash}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="glass-panel" style={{ marginTop: '30px', borderColor: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
                  <strong style={{ color: '#ef4444' }}>Dungeon Master Warning:</strong>
                  <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>{error}</p>
                </div>
              )}

              {/* Latest DM Feedback Parchment Scroll */}
              {address && selectedCharacterDetails && selectedCharacterDetails.latest_feedback && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    marginTop: '30px', 
                    background: 'rgba(251, 243, 219, 0.05)', 
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontFamily: 'Cinzel', color: '#fbbf24', fontSize: '1.05rem' }}>📜 Dungeon Master Chronicles</h4>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Latest story resolution</span>
                  </div>
                  
                  <p style={{ fontStyle: 'italic', fontSize: '1rem', color: '#f3f4f6', lineHeight: '1.6' }}>
                    "{selectedCharacterDetails.latest_feedback}"
                  </p>
                  
                  {selectedCharacterDetails.latest_lore_url && (
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af' }}>
                      <LinkIcon size={12} />
                      Source Groll: <a href={selectedCharacterDetails.latest_lore_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                        {selectedCharacterDetails.latest_lore_url}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Leaderboard (Hall of Fame) */}
          {activeTab === 'leaderboard' && (
            <div className="glass-panel" style={{ minHeight: '400px' }}>
              <h2 style={{ marginBottom: '12px' }}>🏆 Hall of Fame</h2>
              <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
                Behold the greatest adventurers in MetaLore sorted by their Level and accomplishments.
              </p>

              {globalLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
                  <Loader2 size={32} className="animate-spin" color="#8b5cf6" />
                </div>
              ) : globalCharacters.length === 0 ? (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No adventurers logged in the history records yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)' }}>
                        <th style={{ padding: '12px', color: '#fff' }}>Rank</th>
                        <th style={{ padding: '12px', color: '#fff' }}>Adventurer</th>
                        <th style={{ padding: '12px', color: '#fff' }}>Level</th>
                        <th style={{ padding: '12px', color: '#fff' }}>Attributes (S/W/A/V)</th>
                        <th style={{ padding: '12px', color: '#fff' }}>Traits</th>
                        <th style={{ padding: '12px', color: '#fff' }}>Stories</th>
                        <th style={{ padding: '12px', color: '#fff' }}>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalCharacters.map((char, index) => (
                        <tr 
                          key={char.id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            background: index === 0 ? 'rgba(251, 191, 36, 0.03)' : 'transparent',
                            cursor: 'pointer'
                          }}
                          onClick={() => selectCharacterDirectly(char.id)}
                        >
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>
                            {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `${index + 1}th`}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{char.name}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: '#8b5cf6', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                              Lvl {char.level}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                            {char.strength}/{char.wisdom}/{char.agility}/{char.vitality}
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.85rem', color: '#fbbf24' }}>
                            {char.traits ? char.traits : '-'}
                          </td>
                          <td style={{ padding: '12px' }}>{char.lore_count}</td>
                          <td style={{ padding: '12px', fontSize: '0.8rem', color: '#9ca3af' }}>
                            {char.owner ? `${char.owner.slice(0, 6)}...${char.owner.slice(-4)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
