# MetaLore: Dynamic On-Chain RPG Powered by GenLayer

MetaLore is a decentralized, text-based RPG where player characters (NFTs) evolve stats and gain unique on-chain traits based on AI-evaluated narrative lore. By leveraging GenLayer's Intelligent Contracts, MetaLore bridges creative storytelling with deterministic, verifiable gameplay mechanics.

## Architecture Overview

1. **Minting**: Players mint an adventurer NFT. Each character is initialized with base stats of 10 in Strength, Wisdom, Agility, and Vitality, starting at Level 1.
2. **Lore Submissions**: Players write a story chapter about their character's quest (e.g. on Gist, Medium, or raw TXT) and submit the URL to the smart contract.
3. **Intelligent Oracle Engine**: 
   - **`gl.nondet.web.render`** fetches and scrapes the raw text content of the lore URL.
   - **`gl.nondet.exec_prompt`** passes the text to the AI Dungeon Master (DM) with a specific prompt focusing on *Survival Logic*, *Creativity*, and *Moral Choices*.
4. **Consensus & Validation**: 
   - The AI DM evaluates the choices made in the text, awarding up to 8 stat points to Strength, Wisdom, Agility, or Vitality, and potentially a new title trait (e.g., "Sage", "Dragon Slayer").
   - Validator nodes run the same evaluation. The custom `validator_fn` compares the leader's proposal with its own findings.
   - To accommodate LLM variance while avoiding game-breaking exploits, the contract accepts the leader's evaluation if total stat points differ by $\le 3$ and individual stats differ by $\le 2$.
5. **State Updates**: Once consensus is achieved, the character's on-chain stats are updated, and they level up (every 2 stories).

---

## File Structure

```
MetaLore/
├── contracts/
│   └── MetaLore.py       # GenLayer Intelligent Contract (v0.2.16)
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # RPG Dashboard & Views
│   │   ├── index.css     # Custom Glassmorphism UI
│   │   └── useMetaLore.js# genlayer-js contract hooks
│   └── package.json
├── tests/
│   └── test_metalore.py  # Mock test suite
└── README.md             # Documentation
```

---

## How to Deploy the Contract (GenLayer Studio)

1. Open [GenLayer Studio](https://studio.genlayer.com/).
2. Create a new contract file and paste the contents of `contracts/MetaLore.py`.
3. Compile the contract using the compiler panel.
4. Deploy the contract using a StudioNet wallet account.
5. Copy the deployed contract address.

---

## Running the Frontend

1. Navigate to the `frontend/` directory.
2. Create a `.env` file from the example:
   ```bash
   VITE_CONTRACT_ADDRESS="your_deployed_contract_address_here"
   ```
3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser. Ensure your GenLayer Wallet is connected to StudioNet.
