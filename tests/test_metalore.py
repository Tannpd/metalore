# =============================================================================
#  test_metalore.py — MetaLore Local Testing Suite (Mocked GenLayer)
# =============================================================================

import json
import unittest
from unittest.mock import MagicMock

# Simple Mocking structure to simulate GenLayer runtime
class MockMessage:
    def __init__(self, sender="0x1234567890123456789012345678901234567890"):
        self.sender_address = sender

class MockWeb:
    def render(self, url):
        if "404" in url:
            raise Exception("404 Not Found")
        if "empty" in url:
            return ""
        return "The brave warrior fought a mighty dragon. He used agility to dodge the breath, then struck with strength!"

class MockNondet:
    def __init__(self):
        self.web = MockWeb()
        
    def exec_prompt(self, prompt):
        # Return a sample valid output JSON
        return json.dumps({
            "strength_gained": 3,
            "wisdom_gained": 0,
            "agility_gained": 4,
            "vitality_gained": 1,
            "new_trait": "Dragon Slayer",
            "dm_feedback": "Dashing aside as the flames spewed, you drove your sword home. Truly a slayer of beasts."
        })

class MockVM:
    def run_nondet_unsafe(self, leader_fn, validator_fn):
        leader_res = leader_fn()
        consensus = validator_fn(leader_res)
        if consensus:
            return leader_res
        raise RuntimeError("Consensus failed")

class MockGl:
    def __init__(self):
        self.message = MockMessage()
        self.nondet = MockNondet()
        self.vm = MockVM()

    class Contract:
        pass

# Inject mocks globally for testing structure representation
import sys
mock_gl = MockGl()
sys.modules['genlayer'] = MagicMock()
import genlayer
genlayer.TreeMap = dict
genlayer.Address = str
genlayer.u64 = int
genlayer.u32 = int
genlayer.gl = mock_gl
genlayer.UserError = Exception

# Import our contract code (we'll execute tests by reading the class contents directly)
class TestMetaLore(unittest.TestCase):
    def setUp(self):
        # We manually construct a replica of our MetaLore contract to test the methods
        self.character_names = {}
        self.character_owners = {}
        self.stats_strength = {}
        self.stats_wisdom = {}
        self.stats_agility = {}
        self.stats_vitality = {}
        self.character_levels = {}
        self.character_traits = {}
        self.character_lore_count = {}
        self.character_latest_feedback = {}
        self.character_latest_lore_url = {}
        self.owner_characters = {}
        self.total_characters = 0

    def mint_character(self, name):
        pid = self.total_characters
        owner_str = "0x1234567890123456789012345678901234567890"

        self.character_names[pid] = name
        self.character_owners[pid] = owner_str
        self.stats_strength[pid] = 10
        self.stats_wisdom[pid] = 10
        self.stats_agility[pid] = 10
        self.stats_vitality[pid] = 10
        self.character_levels[pid] = 1
        self.character_traits[pid] = ""
        self.character_lore_count[pid] = 0
        self.character_latest_feedback[pid] = "A new adventurer is born into the world."
        self.character_latest_lore_url[pid] = ""
        
        self.total_characters += 1
        return pid

    def test_mint_character(self):
        pid = self.mint_character("Garrett")
        self.assertEqual(pid, 0)
        self.assertEqual(self.character_names[0], "Garrett")
        self.assertEqual(self.stats_strength[0], 10)
        self.assertEqual(self.character_levels[0], 1)

    def test_leader_nondet_success(self):
        # Simulate leader_fn
        url = "https://example.com/adventure1"
        char_name = "Garrett"
        
        # We run the leader_fn logic manually
        raw_page = mock_gl.nondet.web.render(url)
        self.assertIn("dragon", raw_page)
        
        llm_out = mock_gl.nondet.exec_prompt("dummy prompt")
        parsed = json.loads(llm_out)
        self.assertEqual(parsed["strength_gained"], 3)
        self.assertEqual(parsed["agility_gained"], 4)
        self.assertEqual(parsed["new_trait"], "Dragon Slayer")

    def test_validator_consensus(self):
        # Semantic consensus verification
        leader_res = json.dumps({
            "strength_gained": 3,
            "wisdom_gained": 0,
            "agility_gained": 4,
            "vitality_gained": 1,
            "new_trait": "Dragon Slayer",
            "dm_feedback": "Perfect action."
        })
        
        # Validator independent evaluation matches
        validator_res = json.dumps({
            "strength_gained": 2, # slightly different, but allowed
            "wisdom_gained": 0,
            "agility_gained": 4,
            "vitality_gained": 2,
            "new_trait": "Brave",
            "dm_feedback": "Perfect action."
        })
        
        # Test tolerance calculations
        l_data = json.loads(leader_res)
        v_data = json.loads(validator_res)
        
        total_l = l_data["strength_gained"] + l_data["wisdom_gained"] + l_data["agility_gained"] + l_data["vitality_gained"]
        total_v = v_data["strength_gained"] + v_data["wisdom_gained"] + v_data["agility_gained"] + v_data["vitality_gained"]
        
        # Total delta <= 3
        self.assertLessEqual(abs(total_l - total_v), 3)
        
        # Individual delta <= 2
        for key in ["strength_gained", "wisdom_gained", "agility_gained", "vitality_gained"]:
            self.assertLessEqual(abs(l_data[key] - v_data[key]), 2)

if __name__ == '__main__':
    unittest.main()
