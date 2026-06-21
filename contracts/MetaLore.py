# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

# =============================================================================
#  MetaLore.py — Dynamic On-Chain RPG
#  GenLayer Intelligent Contract (v0.2.16)
# =============================================================================

from genlayer import *
import json

class Contract(gl.Contract):
    """
    MetaLore — Dynamic AI-Driven RPG Smart Contract
    ===============================================
    A text-based RPG contract where player characters (NFTs) evolve stats
    and traits on-chain based on AI-evaluated lore.
    """

    # ── Character Storage TreeMaps (Rule 5: No lists/dicts in state) ────
    character_names:           TreeMap[u64, str]
    character_owners:          TreeMap[u64, str]  # string representation of address
    stats_strength:            TreeMap[u64, u32]
    stats_wisdom:              TreeMap[u64, u32]
    stats_agility:             TreeMap[u64, u32]
    stats_vitality:            TreeMap[u64, u32]
    character_levels:          TreeMap[u64, u32]
    character_traits:          TreeMap[u64, str]  # comma-separated traits, e.g., "Brave, Sage"
    character_lore_count:      TreeMap[u64, u32]
    character_latest_feedback: TreeMap[u64, str]  # AI DM's story resolution
    character_latest_lore_url: TreeMap[u64, str]  # URL of the submitted lore chapter
    
    # Mapping of owner_address_str -> JSON list of character IDs, e.g. "[0, 1]"
    owner_characters:          TreeMap[str, str]

    # Monotonic counter for total characters minted
    total_characters:          u64

    # ═══════════════════════════════════════════════════════════════════
    # CONSTRUCTOR
    # ═══════════════════════════════════════════════════════════════════
    def __init__(self) -> None:
        """
        Minimal constructor — GenLayer auto-initialises all TreeMap fields
        declared above (Rule 2). We only set primitive defaults here.
        """
        self.total_characters = 0

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC METHOD: MINT CHARACTER
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def mint_character(self, name: str) -> int:
        """
        Mint a new RPG character with default base stats.
        Returns the assigned character ID (pid).
        """
        if len(name.strip()) == 0:
            raise UserError("Character name cannot be empty.")

        pid = self.total_characters
        owner_str = str(gl.message.sender_address)

        # Store default attributes
        self.character_names[pid]           = name.strip()
        self.character_owners[pid]          = owner_str
        self.stats_strength[pid]            = 10
        self.stats_wisdom[pid]              = 10
        self.stats_agility[pid]             = 10
        self.stats_vitality[pid]            = 10
        self.character_levels[pid]          = 1
        self.character_traits[pid]          = ""
        self.character_lore_count[pid]      = 0
        self.character_latest_feedback[pid] = "A new adventurer is born into the world."
        self.character_latest_lore_url[pid] = ""

        # Update owner character list using the safe .get() pattern
        owner_chars_str = self.owner_characters.get(owner_str, "[]")
        try:
            owner_chars = json.loads(owner_chars_str)
        except Exception:
            owner_chars = []

        owner_chars.append(int(pid))
        self.owner_characters[owner_str] = json.dumps(owner_chars)

        # Increment counter
        self.total_characters = int(pid) + 1
        return int(pid)

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC METHOD: SUBMIT LORE (AI DM NON-DETERMINISTIC EVALUATION)
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def submit_lore(self, character_id: int, lore_url: str) -> None:
        """
        Submit a new story chapter for a character via a URL.
        GenLayer validators:
          1. Scrape the story with web.render().
          2. Evaluate survival logic, creativity, and moral choices via exec_prompt().
          3. Agree on stat boosts and traits using semantic consensus rules.
          4. Update character stats and level up if consensus is reached.
        """
        # Pre-flight checks using the safe .get() pattern
        if character_id < 0 or character_id >= int(self.total_characters):
            raise UserError("Character does not exist.")

        owner_str = self.character_owners.get(character_id, "")
        if str(gl.message.sender_address) != owner_str:
            raise UserError("You are not the owner of this character.")

        if len(lore_url.strip()) == 0:
            raise UserError("Lore URL cannot be empty.")

        char_name = self.character_names.get(character_id, "")

        # ── Non-Deterministic Core Logic (Rule 7) ─────────────────────
        def leader_fn() -> str:
            """
            Executes on the Leader node. Scrapes page and prompts the AI Dungeon Master.
            """
            # Step A: Scrape the story text
            try:
                raw_page: str = gl.nondet.web.render(lore_url)
            except Exception as fetch_err:
                return json.dumps({
                    "error": f"URL_FETCH_FAILED: {str(fetch_err)}",
                    "strength_gained": 1,
                    "wisdom_gained": 0,
                    "agility_gained": 0,
                    "vitality_gained": 0,
                    "new_trait": "",
                    "dm_feedback": "The DM could not read your lore scrolls due to a translation block. You rested and gained +1 Strength from physical training."
                })

            story_content = raw_page[:10000] if len(raw_page) > 10000 else raw_page

            if len(story_content.strip()) < 30:
                return json.dumps({
                    "error": "STORY_CONTENT_TOO_SHORT",
                    "strength_gained": 0,
                    "wisdom_gained": 1,
                    "agility_gained": 0,
                    "vitality_gained": 0,
                    "new_trait": "",
                    "dm_feedback": "Your journal was empty. Reflection on your journey brought you wisdom. +1 Wisdom."
                })

            # Step B: AI DM Prompt
            dm_prompt = f"""You are the legendary AI Dungeon Master for MetaLore, a text-based RPG.
You are evaluating a new story chapter submitted by the player for their character: "{char_name}".

--- STORY CONTENT ---
{story_content}
--- END STORY CONTENT ---

Analyze the story based on:
1. Survival Logic: Did the character make sensible decisions to survive obstacles?
2. Creativity: Is the narrative creative, well-written, and descriptive?
3. Moral Choices: Did the character face a moral dilemma and make a significant choice?

Based on their choices and actions, award stat boosts. You have a budget of up to 8 points total to distribute among:
- strength_gained: physically demanding tasks, combat, lifting.
- wisdom_gained: puzzle solving, magic, reading, strategic decisions.
- agility_gained: escaping, dodging, stealth, speed.
- vitality_gained: enduring pain, poison resistance, survival in harsh cold/heat.

RULES:
- The SUM of all gained stats (strength_gained + wisdom_gained + agility_gained + vitality_gained) MUST be between 0 and 8.
- Each individual stat gained must be an integer between 0 and 5.
- If the story is completely irrelevant to an RPG adventure or junk text, award 0 points to all stats, no new trait, and give feedback asking them to write a proper adventure.
- You can optionally award a single short, evocative trait name (e.g. "Brave", "Shadow Walker", "Sage", "Pyromancer") in `new_trait` if the character performed an extraordinary feat matching that trait. If no specific trait is earned, leave `new_trait` as empty string "".
- Provide a brief, immersive feedback from the Dungeon Master (2-3 sentences) in `dm_feedback` summarizing the consequences of their action.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema. No explanation, no markdown formatting.
{{
  "strength_gained": <int>,
  "wisdom_gained": <int>,
  "agility_gained": <int>,
  "vitality_gained": <int>,
  "new_trait": "<str>",
  "dm_feedback": "<str>"
}}"""

            # Run LLM
            raw_output: str = gl.nondet.exec_prompt(dm_prompt)

            # Clean markdown JSON formatting if any
            cleaned = raw_output.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                inner_lines = []
                for line in lines[1:]:
                    if line.strip() == "```":
                        break
                    inner_lines.append(line)
                cleaned = "\n".join(inner_lines).strip()

            try:
                parsed = json.loads(cleaned)
                str_g = max(0, min(5, int(parsed.get("strength_gained", 0))))
                wis_g = max(0, min(5, int(parsed.get("wisdom_gained", 0))))
                agi_g = max(0, min(5, int(parsed.get("agility_gained", 0))))
                vit_g = max(0, min(5, int(parsed.get("vitality_gained", 0))))

                # Total cap enforcement
                total = str_g + wis_g + agi_g + vit_g
                if total > 8:
                    scale = 8.0 / total
                    str_g = int(str_g * scale)
                    wis_g = int(wis_g * scale)
                    agi_g = int(agi_g * scale)
                    vit_g = int(vit_g * scale)
                    # Adjust if scaling doesn't bring it under 8 due to rounding
                    while str_g + wis_g + agi_g + vit_g > 8:
                        if str_g > 0: str_g -= 1
                        elif wis_g > 0: wis_g -= 1
                        elif agi_g > 0: agi_g -= 1
                        elif vit_g > 0: vit_g -= 1

                # Make sure it's at least 1 unless explicitly flagged as junk/irrelevant
                if str_g + wis_g + agi_g + vit_g == 0:
                    fb_lower = str(parsed.get("dm_feedback", "")).lower()
                    if not ("irrelevant" in fb_lower or "junk" in fb_lower or "proper adventure" in fb_lower):
                        str_g = 1  # Default fallback

                return json.dumps({
                    "strength_gained": str_g,
                    "wisdom_gained": wis_g,
                    "agility_gained": agi_g,
                    "vitality_gained": vit_g,
                    "new_trait": str(parsed.get("new_trait", ""))[:30].strip(),
                    "dm_feedback": str(parsed.get("dm_feedback", "The DM records your adventure."))[:400]
                })

            except Exception as parse_err:
                return json.dumps({
                    "error": f"JSON_PARSE_FAILED: {str(parse_err)}",
                    "strength_gained": 1,
                    "wisdom_gained": 0,
                    "agility_gained": 0,
                    "vitality_gained": 0,
                    "new_trait": "",
                    "dm_feedback": "The DM found your chronicles confusing, but you gained +1 Strength from traversing the rough terrain."
                })

        def validator_fn(leader_result: str) -> bool:
            """
            Consensus rules:
              - Parse leader's output
              - Ensure bounds are met (total gained <= 10, non-negative)
              - Run validator's independent evaluation
              - Compare results: Accept if total stats score delta <= 3, and individual stat deltas <= 2
            """
            try:
                leader_data = json.loads(leader_result)
            except Exception:
                return False

            if "error" in leader_data:
                # If leader returned a handled scraper/parser error, validators accept it
                allowed_errors = {"URL_FETCH_FAILED", "STORY_CONTENT_TOO_SHORT", "JSON_PARSE_FAILED"}
                return any(err in str(leader_data.get("error", "")) for err in allowed_errors)

            try:
                l_str = int(leader_data.get("strength_gained", 0))
                l_wis = int(leader_data.get("wisdom_gained", 0))
                l_agi = int(leader_data.get("agility_gained", 0))
                l_vit = int(leader_data.get("vitality_gained", 0))
            except Exception:
                return False

            # Verify ranges
            if l_str < 0 or l_wis < 0 or l_agi < 0 or l_vit < 0:
                return False
            if (l_str + l_wis + l_agi + l_vit) > 10:  # Leader shouldn't exceed 10
                return False

            # Run validator independent eval
            validator_raw = leader_fn()
            try:
                val_data = json.loads(validator_raw)
            except Exception:
                return True  # Abstain (agree) if validator has parse/internal error

            if "error" in val_data:
                return True  # Abstain if validator gets network error

            try:
                v_str = int(val_data.get("strength_gained", 0))
                v_wis = int(val_data.get("wisdom_gained", 0))
                v_agi = int(val_data.get("agility_gained", 0))
                v_vit = int(val_data.get("vitality_gained", 0))
            except Exception:
                return True

            total_l = l_str + l_wis + l_agi + l_vit
            total_v = v_str + v_wis + v_agi + v_vit

            # Semantic matching tolerance:
            # 1. Total score must be within 3 points
            # 2. No single stat must differ by more than 2 points
            if abs(total_l - total_v) > 3:
                return False
            if abs(l_str - v_str) > 2:
                return False
            if abs(l_wis - v_wis) > 2:
                return False
            if abs(l_agi - v_agi) > 2:
                return False
            if abs(l_vit - v_vit) > 2:
                return False

            return True

        # Run nondet logic
        result_json: str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        try:
            eval_data = json.loads(result_json)
        except Exception:
            raise UserError("Consensus generated invalid JSON state.")

        # Extract consensus values
        str_g = int(eval_data.get("strength_gained", 0))
        wis_g = int(eval_data.get("wisdom_gained", 0))
        agi_g = int(eval_data.get("agility_gained", 0))
        vit_g = int(eval_data.get("vitality_gained", 0))
        new_trait = str(eval_data.get("new_trait", "")).strip()
        dm_feedback = str(eval_data.get("dm_feedback", "The DM records your adventure."))

        # Apply stat boosts with a hard cap of 100 per stat
        self.stats_strength[character_id] = min(100, int(self.stats_strength.get(character_id, 10)) + str_g)
        self.stats_wisdom[character_id]   = min(100, int(self.stats_wisdom.get(character_id, 10)) + wis_g)
        self.stats_agility[character_id]  = min(100, int(self.stats_agility.get(character_id, 10)) + agi_g)
        self.stats_vitality[character_id] = min(100, int(self.stats_vitality.get(character_id, 10)) + vit_g)

        # Append trait if new and valid
        if len(new_trait) > 0:
            current_traits = self.character_traits.get(character_id, "")
            if len(current_traits) > 0:
                # Only append if not already in list
                traits_list = [t.strip() for t in current_traits.split(",")]
                if new_trait not in traits_list:
                    self.character_traits[character_id] = current_traits + ", " + new_trait
            else:
                self.character_traits[character_id] = new_trait

        # Update logs & level
        new_count = int(self.character_lore_count.get(character_id, 0)) + 1
        self.character_lore_count[character_id]      = new_count
        self.character_levels[character_id]          = 1 + (new_count // 2)  # Level up every 2 lore chapters
        self.character_latest_feedback[character_id] = dm_feedback
        self.character_latest_lore_url[character_id] = lore_url

    # ═══════════════════════════════════════════════════════════════════
    # READ-ONLY VIEW METHODS
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.view
    def get_character(self, character_id: int) -> str:
        """
        Retrieve JSON representation of a character.
        """
        if character_id < 0 or character_id >= int(self.total_characters):
            raise UserError("Character does not exist.")

        return json.dumps({
            "id": character_id,
            "name": self.character_names.get(character_id, ""),
            "owner": self.character_owners.get(character_id, ""),
            "strength": int(self.stats_strength.get(character_id, 0)),
            "wisdom": int(self.stats_wisdom.get(character_id, 0)),
            "agility": int(self.stats_agility.get(character_id, 0)),
            "vitality": int(self.stats_vitality.get(character_id, 0)),
            "level": int(self.character_levels.get(character_id, 1)),
            "traits": self.character_traits.get(character_id, ""),
            "lore_count": int(self.character_lore_count.get(character_id, 0)),
            "latest_feedback": self.character_latest_feedback.get(character_id, ""),
            "latest_lore_url": self.character_latest_lore_url.get(character_id, "")
        })

    @gl.public.view
    def get_character_count(self) -> int:
        """
        Returns the total number of characters minted.
        """
        return int(self.total_characters)

    @gl.public.view
    def get_owner_characters(self, owner: str) -> str:
        """
        Returns a JSON list of character IDs owned by the specified owner string.
        """
        return self.owner_characters.get(owner, "[]")
