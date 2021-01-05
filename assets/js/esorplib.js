const SEX_MALE = 0;
const SEX_FEMALE = 1;

const SKILL_DIFF_EASY = 0;
const SKILL_DIFF_MODERATE = 1;
const SKILL_DIFF_HARD = 2;
const SKILL_DIFF_ESOTERIC = 3;

const skillDifficultyNames = [ "SKILL_EASY", "SKILL_MODERATE", "SKILL_HARD", "SKILL_ESOTERIC" ];

/// Base class for attributes or skills.
class QualityTemplate {
	constructor(prefix ="", myName, myMin, myMax) {
		this.name = prefix + myName.replace(/\s/g, "_").replace(/\W/g, "").toUpperCase();
		this.key = myName.replace(/[\s\W]/g, "");
		this.min = myMin;
		this.max = myMax;
	}
}

class Attribute extends QualityTemplate {
	constructor(myName) {
		super("ATTRIBUTE_", myName, -2, 5);
	}
}

class Skill extends QualityTemplate {
	constructor(myName, myAttr) {
		super("SKILL_", myName, 0, 10);
		this.governing = myAttr;
	}
}

class ExtraSkill extends QualityTemplate {
	constructor(myName, myDiff) {
		super("SKILL_", myName, 0, 10);
		this.governing = "Intelligence";
		this.difficulty = myDiff;
	}
}

/// Used by races, supernatural types, and transformations.
class CharacterTemplate {
	constructor(prefix = "", myName, maleAttr, femaleAttr, skillMods, myResist = [], myWeakness = []) {
		this.name = prefix + myName.replace(/\s/g, "_").replace(/\W/g, "").toUpperCase();
		this.plainName = myName;
		this.key = myName.replace(/[\s\W]/g, "");

		this.attributes = [];
		this.attributes[SEX_MALE] = maleAttr;
		this.attributes[SEX_FEMALE] = femaleAttr;

		this.skills = skillMods;
		this.resist = myResist;
		this.weakness = myWeakness;
	}
}

class NPCTemplate {
	constructor(myName, myAttackBonus, myAttackType, myDamageBonus, myDefenseBonus, myToughnessBonus, myResist = [], myWeakness = [], mySkill = "") {
		this.name = "NPC_" + myName.replace(/\s/g, "_").replace(/\W/g, "").toUpperCase();
		this.key = myName.replace(/[\s\W]/g, "");
		this.attackBonus = myAttackBonus;
		this.attackType = myAttackType;
		this.damageBonus = myDamageBonus;
		this.defenseBonus = myDefenseBonus;
		this.toughnessBonus = myToughnessBonus;
		this.resist = myResist;
		this.weakness = myWeakness;
		this.summonSkill = mySkill;
	}

	makeRoll(key, event = null) {
		var roll = { key, comment: "" };

		switch(key) {
			case "Attack":
				roll.modifier = this.attackBonus;
				break;
			case "Damage":
				roll.modifier = this.damageBonus;
				roll.attackType = this.attackType;
				break;
			case "Defense":
				roll.modifier = this.defenseBonus;
				if (event) {
					roll.npc = event.name;
				}
				break;
			case "Toughness":
				roll.modifier = this.toughnessBonus;
				roll.armor = -1;
				roll.armorMod = -1;
				break;
			default:
				roll.modifier = 0;
		}

		if (event) {
			roll.parent = event.id || event.parent;
		}

		if ((key == "Toughness") && (event)) {
			roll.attackType = event.attackType;

			if (this.resist.indexOf(SPECIAL_ATTACK_TYPES[event.attackType]) > -1) {
				roll.result = Math.max(internalDieRoll(), internalDieRoll());
				roll.resist = true;
			} else if (this.weakness.indexOf(SPECIAL_ATTACK_TYPES[event.attackType]) > -1) {
				roll.result = Math.min(internalDieRoll(), internalDieRoll());
				roll.weak = true;
			} else {
				roll.result = internalDieRoll();
			}
		} else {
			roll.result = internalDieRoll();
		}

		return roll;
	}
}

/// Playable race definitions.
const races = [
	new CharacterTemplate("RACE_", "Altmer",
		{ Strength: -2, Intelligence: 2, Speed: -2 },
		{ Strength: -2, Intelligence: 2, Endurance: -2 },
		{ Alteration: 1, AltmerLore: 4, Destruction: 1, Mysticism: 1 }
	),
	new CharacterTemplate("RACE_", "Argonian",
		{ Willpower: -2, Agility: 2, Speed: 2, Endurance: -2, Personality: -2 },
		{ Intelligence: 2, Endurance: -2, Personality: -2 },
		{ Athletics: 1, HistLore: 4, Restoration: 1, Unarmed: 1 },
		[ "DAMAGE_DISEASE" ]
	),
	new CharacterTemplate("RACE_", "Bosmer",
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ BosmerLore: 4, Bow: 1, HandleAnimal: 1, MediumArmor: 1, Sneak: 1 },
		[ "DAMAGE_POISON" ]
	),
	new CharacterTemplate("RACE_", "Breton",
		{ Intelligence: 2, Willpower: 2, Agility: -2, Speed: -2, Endurance: -2 },
		{ Strength: -2, Intelligence: 2, Willpower: 2, Agility: -2, Endurance: -2 },
		{ BretonLore: 4, Conjuration: 1, LightArmor: 1, Mysticism: 1 }
	),
	new CharacterTemplate("RACE_", "Dunmer",
		{ Willpower: -2, Speed: 2, Personality: -2 },
		{ Willpower: -2, Speed: 2, Endurance: -2 },
		{ Destruction: 1, DualWield: 1, DunmerLore: 4, Mysticism: 1 },
		[ "DAMAGE_FLAME" ]
	),
	new CharacterTemplate("RACE_", "Imperial",
		{ Willpower: -2, Agility: -2, Personality: 2},
		{ Agility: -2, Speed: -2, Personality: 2 },
		{ Block: 1, ImperialLore: 4, Mercantile: 1, OneHanded: 1, Speechcraft: 1 }
	),
	new CharacterTemplate("RACE_", "Khajiit",
		{ Willpower: -2, Agility: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2 },
		{ Acrobatics: 1, KhajiitLore: 4, MediumArmor: 1, Unarmed: 1 }
	),
	new CharacterTemplate("RACE_", "Nord",
		{ Strength: 2, Intelligence: -2, Agility: -2, Endurance: 2, Personality: -2 },
		{ Strength: 2, Intelligence: -2, Willpower: 2, Agility: -2, Personality: -2 },
		{ HeavyArmor: 1, MediumArmor: 1, NordLore: 4, TwoHanded: 1 },
		[ "DAMAGE_FROST" ]
	),
	new CharacterTemplate("RACE_", "Orc",
		{ Strength: 1, Intelligence: -2, Willpower: 2, Agility: -1, Speed: -2, Endurance: 2, Personality: -2 },
		{ Strength: 1, Willpower: 1, Agility: -1, Speed: -2, Endurance: 2, Personality: -3 },
		{ Blacksmithing: 1, Block: 1, HeavyArmor: 1, OrcishLore: 4 }
	),
	new CharacterTemplate("RACE_", "Redguard",
		{ Strength: 2, Intelligence: -2, Willpower: -2, Endurance: 2, Personality: -2 },
		{ Intelligence: -2, Willpower: -2, Endurance: 2},
		{ Athletics: 1, DualWield: 1, OneHanded: 1, RedguardLore: 4 }
	),
	new CharacterTemplate("RACE_", "Khajiit (Ohmes)",
		{ Willpower: -2, Agility: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2 },
		{ Acrobatics: 1, KhajiitLore: 4, MediumArmor: 1, Speechcraft: 1 }
	),
	new CharacterTemplate("RACE_", "Maormer",
		{ Strength: -2, Willpower: 2, Speed: -2 },
		{ Strength: -2, Willpower: 2, Endurance: -2 },
		{ Athletics: 1, Destruction: 1, MaormerLore: 4, Sneak: 1 }
	),
	new CharacterTemplate("RACE_", "Reachman",
		{ Strength: 2, Speed: -2, Personality: -2 },
		{ Willpower: 2, Speed: -2, Personality: -2 },
		{ MediumArmor: 1, Mysticism: 1, ReachLore: 4, Survival: 1 }
	),
];

/// Supernatural type definitions.
const supernaturals = [
	new CharacterTemplate("", "", {}, {}, {}),
	new CharacterTemplate("SUPERNATURAL_", "Werewolf",
		{ Strength: 1, Agility: 1, Endurance: 1 },
		{ Strength: 1, Agility: 1, Endurance: 1 },
		{ Perception: 3, Survival: 2 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_SILVER" ]
	),
	new CharacterTemplate("SUPERNATURAL_", "Vampire",
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, Perception: 2, Sneak: 1 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_FLAME", "DAMAGE_SILVER" ]
	),
	new CharacterTemplate("SUPERNATURAL_", "Vampire (Daggerfall)",
		{ Strength: 2, Intelligence: 2, Willpower: 2, Speed: 2 },
		{ Strength: 2, Intelligence: 2, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, Perception: 2 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_FLAME", "DAMAGE_SILVER" ]
	),
	new CharacterTemplate("SUPERNATURAL_", "Vampire (Aundae)",
		{ Strength: 2, Willpower: 4, Speed: 2 },
		{ Strength: 2, Willpower: 4, Speed: 2 },
		{ BloodMagic: 2, Destruction: 1, Illusion: 1, Perception: 2 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_FLAME", "DAMAGE_SILVER" ]
	),
	new CharacterTemplate("SUPERNATURAL_", "Vampire (Berne)",
		{ Strength: 2, Willpower: 2, Agility: 2, Speed: 2 },
		{ Strength: 2, Willpower: 2, Agility: 2, Speed: 2 },
		{ BloodMagic: 2, LightArmor: 1, Perception: 2, Sneak: 1 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_FLAME", "DAMAGE_SILVER" ]
	),
	new CharacterTemplate("SUPERNATURAL_", "Vampire (Quarra)",
		{ Strength: 4, Willpower: 2, Speed: 2 },
		{ Strength: 4, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, HeavyArmor: 1, Perception: 2, Unarmed: 1 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_FLAME", "DAMAGE_SILVER" ]
	),
	new CharacterTemplate("SUPERNATURAL_", "Vampire (Cyrodiil)",
		{ Strength: 2, Willpower: 2, Speed: 2, Personality: 2 },
		{ Strength: 2, Willpower: 2, Speed: 2, Personality: 2 },
		{ BloodMagic: 2, Illusion: 1, Perception: 2, Speechcraft: 1 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_FLAME", "DAMAGE_SILVER" ]
	),
	new CharacterTemplate("SUPERNATURAL_", "Vampire (Volkihar)",
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, Perception: 2 },
		[ "DAMAGE_DISEASE" ],
		[ "DAMAGE_FLAME", "DAMAGE_SILVER" ]
	)
];

/// Tranformation definitions.
const supernaturalTransformations = [
	{
		parent: "Werewolf",
		template: new CharacterTemplate("TRANSFORM_", "Werewolf",
			{ Strength: 2, Speed: 2, Endurance: 2 },
			{ Strength: 2, Speed: 2, Endurance: 2 },
			{ Perception: 1, Unarmed: 3 },
			[],
			[ "DAMAGE_POISON" ]
		)
	},
	{
		parent: "Vampire",
		template: new CharacterTemplate("TRANSFORM_", "Blood Scion",
			{ Endurance: 1 },
			{ Endurance: 1 },
			{ BloodMagic: 1, Unarmed: 1}
		)
	},
	{
		parent: "Vampire (Volkihar)",
		template: new CharacterTemplate("TRANSFORM_", "Vampire Lord",
			{ Speed: 2, Endurance: 2 },
			{ Speed: 2, Endurance: 2 },
			{ BloodMagic: 2, Destruction: 2, Illusion: 2, Mysticism: 2, Unarmed: 2}
		)
	},
	// SPECIAL - Werewwolf Behmoth, having the same parent as Werewolf, will only appear on GM Screen!
	{
		parent: "Werewolf",
		template: new CharacterTemplate("TRANSFORM_", "Werewolf Behemoth",
			{ Strength: 8, Speed: 2, Endurance: 4 },
			{ Strength: 8, Speed: 2, Endurance: 4 },
			{ Perception: 1, Unarmed: 3 },
			[],
			[ "DAMAGE_POISON" ]
		)
	}
];

// const SPECIAL_ATTACK_TYPES = [ "None", "Physical", "Disease", "Flame", "Frost", "Poison", "Shock", "Silver" ];
const npcTemplates = [
// name, attack bonus, attack type, damage bonus, defense bonus, toughness bonus, resists, weaknesses, summon skill (leave blank for unsummonable)
	new NPCTemplate("Zombie",			0, 1, 0, -4, 0, [], [], "Conjuration"),
	new NPCTemplate("Skeleton",			0, 1, 2, 0, 2, [], [], "Conjuration"),
	new NPCTemplate("Ghost",			3, 4, 0, 0, 0, [ "DAMAGE_PHYSICAL" ], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Wraith",			5, 4, 2, 0, 4, [ "DAMAGE_PHYSICAL" ], [ "DAMAGE_SILVER"], "Conjuration"),
	new NPCTemplate("Vampire",			4, 1, 3, 3, 0, [], [ "DAMAGE_FLAME" ]),
	new NPCTemplate("Bloodfiend",		2, 1, 2, 0, 0, [], [ "DAMAGE_FLAME" ]),
	new NPCTemplate("Shambles",			2, 1, 4, 0, 4, [], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Scamp",			0, 1, 0, 2, 2, [], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Clannfear",		2, 1, 3, 0, 4, [], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Flame Atronach",	3, 3, 4, 1, 0, [ "DAMAGE_FLAME" ], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Frost Atronach",	2, 4, 3, 0, 4, [ "DAMAGE_FROST" ], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Storm Atronach",	2, 6, 3, 0, 2, [ "DAMAGE_SHOCK" ], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Winged Twilight",	2, 1, 2, 3, 0, [], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Dremora",			6, 1, 2, 2, 2, [ "DAMAGE_FLAME" ], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Daedroth",			4, 1, 3, 0, 4, [], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Hunger",			4, 1, 3, 0, 2, [], [ "DAMAGE_SILVER" ], "Conjuration"),
	new NPCTemplate("Familiar",			2, 1, 0, 2, -2, [], [], "Conjuration"),
	new NPCTemplate("Wolf",				2, 1, 0, 2, -2, [], [], "HandleAnimal"),
	new NPCTemplate("Bear",				2, 1, 4, 0, 3, [], [], "HandleAnimal"),
	new NPCTemplate("Small Animal",		0, 1, -2, 4, -2, [], [], "HandleAnimal"),
	new NPCTemplate("Medium Animal",	2, 1, 0, 0, 0, [], [], "HandleAnimal"),
	new NPCTemplate("Large Animal",		2, 1, 3, 0, 4, [], [], "HandleAnimal"),
	new NPCTemplate("Werewolf",			3, 1, 4, 1, 4, [], [ "DAMAGE_SILVER" ]),
];

/// Gets a character template by name.
function getTemplate(name, list) {
	if (name) {
		name = name.replace(/[\s\W]/g, "");
		return list.find(element => element.key === name);
	}
}

/// CHARACTER FIELD DEFINITION SECTION
const classes = [ "", "Dragonknight", "Necromancer", "Nightblade", "Sorcerer", "Templar", "Warden" ];

const attributes = [
	new Attribute("Strength"),
	new Attribute("Intelligence"),
	new Attribute("Willpower"),
	new Attribute("Agility"),
	new Attribute("Speed"),
	new Attribute("Endurance"),
	new Attribute("Personality"),
	new Attribute("Luck")
];

const skillsCombat = [
	new Skill("Two Handed", "Strength"),
	new Skill("One Handed", "Strength"),
	new Skill("Block", "Endurance"),
	new Skill("Dual Wield", "Agility"),
	new Skill("Bow", "Agility"),
	new Skill("Unarmed", "Strength"),
	new Skill("Light Armor", "Speed"),
	new Skill("Medium Armor", "Agility"),
	new Skill("Heavy Armor", "Endurance")
];

const skillsMagic = [
	new Skill("Alteration", "Willpower"),
	new Skill("Conjuration", "Intelligence"),
	new Skill("Destruction", "Willpower"),
	new Skill("Illusion", "Personality"),
	new Skill("Mysticism", "Intelligence"),
	new Skill("Restoration", "Willpower")
];

const skillsGeneral = [
	new Skill("Acrobatics", "Agility"),
	new Skill("Athletics", "Speed"),
	new Skill("Legerdemain", "Intelligence"),
	new Skill("Mercantile", "Personality"),
	new Skill("Perception", "Willpower"),
	new Skill("Sneak", "Agility"),
	new Skill("Speechcraft", "Personality")
];

const skillsCrafting = [
	new Skill("Alchemy", "Intelligence"),
	new Skill("Blacksmithing", "Endurance"),
	new Skill("Clothing", "Agility"),
	new Skill("Enchanting", "Intelligence"),
	new Skill("Jewelry", "Agility"),
	new Skill("Provisioning", "Willpower"),
	new Skill("Woodworking", "Agility")
];

/// These skills represent specialized knowledge.  There is no governing attribute associated!
const skillsKnowledge = [
	new ExtraSkill("Altmer Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Akaviri Lore", SKILL_DIFF_HARD),
	new ExtraSkill("Ayleid Lore", SKILL_DIFF_HARD),
	new ExtraSkill("Blood Magic", SKILL_DIFF_HARD),
	new ExtraSkill("Bosmer Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Breton Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Daedric Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Dragon Lore", SKILL_DIFF_HARD),
	new ExtraSkill("Dunmer Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Dwemerology", SKILL_DIFF_HARD),
	new ExtraSkill("Falmer Lore", SKILL_DIFF_ESOTERIC),
	new ExtraSkill("First Aid", SKILL_DIFF_MODERATE),
	new ExtraSkill("Handle Animal", SKILL_DIFF_EASY),
	new ExtraSkill("Hist Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Imperial Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Khajiit Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Kothringi Lore", SKILL_DIFF_HARD),
	new ExtraSkill("Maormer Lore", SKILL_DIFF_HARD),
	new ExtraSkill("Merethic Lore", SKILL_DIFF_ESOTERIC),
	new ExtraSkill("Nature Magic", SKILL_DIFF_MODERATE),
	new ExtraSkill("Necromancy", SKILL_DIFF_MODERATE),
	new ExtraSkill("Nedic Lore", SKILL_DIFF_HARD),
	new ExtraSkill("Nord Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Orcish Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Reach Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Redguard Lore", SKILL_DIFF_MODERATE),
	new ExtraSkill("Shadow Magic", SKILL_DIFF_ESOTERIC),
	new ExtraSkill("Sload Lore", SKILL_DIFF_HARD),
	new ExtraSkill("Survival", SKILL_DIFF_EASY)
];

/// Master list that contains all the other attribute and skill lists.
const masterQualityList = [ attributes, skillsCombat, skillsMagic, skillsGeneral, skillsCrafting, skillsKnowledge ];

/// Gets a quality by its key.
function getQuality(key) {
	for (var i = 0; i < masterQualityList.length; i++) {
		var tryMe = masterQualityList[i].find(element => element.key == key);

		if (tryMe) {
			return tryMe;
		}
	}

	return undefined;
}

/// Rolls a d20.
function internalDieRoll() {
	return (1 + Math.floor(20 * Math.random()));
}

function formatPositiveNegative(value) {
	if (value >= 0) {
		return "+" + value.toString();
	} else {
		return value.toString();
	}
}

/// Object for holding a charcter's information.
class CharacterSheet {
	constructor() {
		this.sex = SEX_MALE;
		this.race = "";
		this.supernatural = "";
		this.class = "";
		this.attributes = {};
		this.skills = {};
	}

	/// Gets either an attribute or skill by key.
	getItem(getMe, noSlider=false) {
		if (attributes.find(element => element.key == getMe)) {
			return this.getAttribute(getMe, noSlider);
		} else {
			return this.getSkill(getMe, noSlider);
		}
	}

	/// Gets an attribute by key. (noSlider means only the template modifiers)
	getAttribute(getMe, noSlider=false) {
		var result = 10;
		var tryMe = getTemplate(this.race, races);

		if ((tryMe) && (getMe in tryMe.attributes[this.sex])) {
			result += tryMe.attributes[this.sex][getMe];
		}

		tryMe = getTemplate(this.supernatural, supernaturals);

		if ((tryMe) && (getMe in tryMe.attributes[this.sex])) {
			result += tryMe.attributes[this.sex][getMe];
		}

		if (this.transformation) {
			tryMe = supernaturalTransformations.find(element => element.template.name === this.transformation);

			if ((tryMe) && (getMe in tryMe.template.attributes[this.sex])) {
				result += tryMe.template.attributes[this.sex][getMe];
			}
		}

		if ((!noSlider) && (this.attributes) && (getMe in this.attributes)) {
			result += this.attributes[getMe];
		}

		return result;
	}

	/// Gets the attribute modifier that is applied for buying skills.
	getAttributeSkillModifier(key) {
		var attrVal = this.getAttribute(key);
		var result = attrVal - 10;
	
		if (result > 0) {
			result = Math.floor(result / 2.0);
		}
	
		return result;
	}

	/// Gets the attribute modifier.
	getAttributeModifier(key) {
		return this.getAttribute(key) - 10;
	}

	/// Gets a skill by key. (noSlider means only the template modifiers)
	getSkill(getMe, noSlider=false) {
		var result = 0;
		var tryMe = getTemplate(this.race, races);

		if ((tryMe) && (tryMe.skills) && (getMe in tryMe.skills)) {
			result += tryMe.skills[getMe];
		}

		tryMe = getTemplate(this.supernatural, supernaturals);

		if ((tryMe) && (tryMe.skills) && (getMe in tryMe.skills)) {
			result += tryMe.skills[getMe];
		}

		if (this.transformation) {
			tryMe = supernaturalTransformations.find(element => element.template.name === this.transformation);

			if ((tryMe) && (tryMe.template.skills) && (getMe in tryMe.template.skills)) {
				result += tryMe.template.skills[getMe];
			}
		}

		if ((!noSlider) && (this.skills) && (getMe in this.skills)) {
			result += this.skills[getMe];
		}

		return result;
	}

	/// Gets the types of damage the character is resistant to (minus those canceled out by weaknesses; internal parameter prevents this check)
	getResists(internal=false) {
		var result = [];
		var tryMe = getTemplate(this.race, races);

		if (tryMe) {
			Array.prototype.push.apply(result, tryMe.resist);
		}

		tryMe = getTemplate(this.supernatural, supernaturals);

		if (tryMe) {
			Array.prototype.push.apply(result, tryMe.resist);
		}

		if (this.transformation) {
			tryMe = supernaturalTransformations.find(element => element.template.name === this.transformation);

			if (tryMe) {
				Array.prototype.push.apply(result, tryMe.template.resist);
			}
		}

		if (!internal) {
			var checkWeaknesses = this.getWeaknesses(true);

			// Unique results only!
			result = result.filter(function(value, index, self) {
				return ((self.indexOf(value) === index) && (checkWeaknesses.indexOf(value) < 0));
			});
			result.sort();
		}

		return result;
	}

	/// Gets the types of damage the character is weak to (minus those canceled out by resistances; internal parameter prevents this check)
	getWeaknesses(internal=false) {
		var result = [];
		var tryMe = getTemplate(this.race, races);

		if (tryMe) {
			Array.prototype.push.apply(result, tryMe.weakness);
		}

		tryMe = getTemplate(this.supernatural, supernaturals);

		if (tryMe) {
			Array.prototype.push.apply(result, tryMe.weakness);
		}

		if (this.transformation) {
			tryMe = supernaturalTransformations.find(element => element.template.name === this.transformation);

			if (tryMe) {
				Array.prototype.push.apply(result, tryMe.template.weakness);
			}
		}

		if (!internal) {
			var checkResists = this.getResists(true);

			result = result.filter(function(value, index, self) {
				return ((self.indexOf(value) === index) && (checkResists.indexOf(value) < 0));
			});
			result.sort();
		}

		return result;
	}

	/// Helper function for checking damage resistance.
	resistsDamage(attackType) {
		return (this.getResists().indexOf(attackType) > -1);
	}

	/// Helper function for checking damage weakness.
	weakToDamage(attackType) {
		return (this.getWeaknesses().indexOf(attackType) > -1);
	}

	/// Figures out how to modify a roll based on a key.
	getRollModifier(getMe) {
		if (getMe == "Defense") {
			return this.getAttributeModifier("Agility");
		} else if (getMe == "Toughness") {
			return this.getAttributeModifier("Endurance");
		} else if (attributes.find(element => element.key == getMe)) {
			return this.getAttributeModifier(getMe);
		} else {
			return this.getSkill(getMe);
		}
	}

	/// Calculates benefit from armor.
	getArmorModifier(armor) {
		return Math.floor(this.getSkill(WORN_ARMOR[armor]) / 2);
	}

	/// Calculates defensive benefit from using a shield.
	getBlockModifier() {
		return Math.floor(this.getSkill("Block") / 2);
	}

	/// All of a character's rolling logic in one handy function.
	makeRoll(rollData) {
		var result;
		var rollCount = 0;
		var modifier = this.getRollModifier(rollData.key);
		var luckMod = this.getAttributeModifier("Luck");
		rollData.modifier = modifier;

		if (rollData.key == "Toughness") {
			if (this.resistsDamage(SPECIAL_ATTACK_TYPES[rollData.attackType])) {
				rollData.resist = true;
				rollCount++;
			} else if (this.weakToDamage(SPECIAL_ATTACK_TYPES[rollData.attackType])) {
				rollData.weak = true;
				rollCount--;
			}
		}

		if (luckMod > 0) {
			if (internalDieRoll() <= luckMod) {
				rollData.lucky = true;
				rollCount++;
			}
		} else if (luckMod < 0) {
			luckMod = Math.abs(luckMod);

			if (internalDieRoll() <= luckMod) {
				rollData.unlucky = true;
				rollCount--;
			}
		}

		rollData.rolls = [];

		for (var i = 0; i < 1 + Math.abs(rollCount); i++) {
			let curRoll = internalDieRoll();
			rollData.rolls.push(curRoll);

			if (!result) {
				result = curRoll;
			} else if (rollCount > 0) {
				result = Math.max(result, curRoll);
			} else if (rollCount < 0) {
				result = Math.min(result, curRoll);
			}
		}

		rollData.result = result;

		return result + modifier;
	}

	makePrintoutHeader(category) {
		if (category) {
			const catOutput = localize(category).toUpperCase();
			const fillerCount = (31 - catOutput.length - 2) / 2;

			return "<strong>" + "=".repeat(Math.floor(fillerCount)) + " " + catOutput + " " + "=".repeat(Math.ceil(fillerCount)) + "</strong><br />";
		} else {
			return "=".repeat(31) + "<br />";
		}
	}

	/// Prints character sheet, optionally with a link to profile page.
	print(id, profileLink=false) {
		var i;
		var printArr = [];
		var printout = $("#" + id);
		printout.empty();

		if (this.name) {
			printout.append(this.makePrintoutHeader())
			printout.append("<h3>" + nameDecode(this.name).toUpperCase() + "</h3>");
		}

		printout.append(this.makePrintoutHeader())

		if (this.player) {
			printout.append(((this.player[0] == "@") ? "" : "@") + nameDecode(this.player) + "<br />");
		}

		if (this.race) {
			printArr.push(localize(races.find(item => item.key === this.race.replace(/[\s\W]/g, "")).name));
		}

		if (this.supernatural) {
			printArr.push(localize(supernaturals.find(item => item.key === this.supernatural.replace(/[\s\W]/g, "")).name));
		}

		printArr.push(localize((this.sex) ? "SEX_FEMALE" : "SEX_MALE"));

		if (this.class) {
			printArr.push(localize("CLASS_" + this.class.toUpperCase()));
		}

		printout.append(printArr.join(" - ") + "<br />");

		if (this.transformation) {
			printout.append("<b class='transformation'>" + localize(this.transformation) + "!</b><br />");
		}

		printArr = [];

		for (i = 0; i < attributes.length; i++) {
			printArr.push(
				"<span data-key='" + attributes[i].key + "'>" + localize(attributes[i].name + "_ABBR") + ": " + this.getAttribute(attributes[i].key) + "</span>"
			);
		}

		printout.append(this.makePrintoutHeader("ATTRIBUTES"));
		printout.append(printArr.join("<br />") + "<br />");

		printArr = this.loadSkillArray(skillsCombat);

		if (printArr.length) {
			printout.append(this.makePrintoutHeader("COMBAT_SKILLS"));
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsMagic);

		if (printArr.length) {
			printout.append(this.makePrintoutHeader("MAGICKA_SKILLS"));
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsGeneral);

		if (printArr.length) {
			printout.append(this.makePrintoutHeader("GENERAL_SKILLS"));
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsCrafting);

		if (printArr.length) {
			printout.append(this.makePrintoutHeader("CRAFTING_SKILLS"));
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsKnowledge);

		if (printArr.length) {
			printout.append(this.makePrintoutHeader("KNOWLEDGE_SKILLS"));
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.getResists();

		if (printArr.length) {
			printout.append(this.makePrintoutHeader("RESISTANCES"));
			printout.append(printArr.map(item => localize(item)).join(", ") + "<br />");
		}

		printArr = this.getWeaknesses();

		if (printArr.length) {
			printout.append(this.makePrintoutHeader("WEAKNESSES"));
			printout.append(printArr.map(item => localize(item)).join(", ") + "<br />");
		}

		if (profileLink) {
			printout.append("<a href='profile.html?character=" + this.name + "&minimal=true' target='_blank'>" + localize("VIEW_DESCRIPTION") + "</a>");
		}
	}

	/// Helper function for printing character sheet.
	loadSkillArray(list) {
		var result = [];

		for (var i = 0; i < list.length; i++) {
			if (this.getSkill(list[i].key)) {
				result.push(
					"<span data-key='" + list[i].key + "'>" + localize(list[i].name) + ": " + this.getSkill(list[i].key) + "</span>"
				);
			}
		}

		return result;
	}
}

/// Used for displaying character descriptions properly.
function formatDescription(description) {
	return description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
}

const SPECIAL_ATTACK_TYPES = [ "DAMAGE_NONE", "DAMAGE_PHYSICAL", "DAMAGE_DISEASE", "DAMAGE_FLAME", "DAMAGE_FROST", "DAMAGE_POISON", "DAMAGE_SHOCK", "DAMAGE_SILVER" ];
const INJURY_LEVEL_DISPLAY = [ "STATUS_UNHURT", "STATUS_INJURED", "STATUS_CRITICAL", "STATUS_INCAPACITATED", "STATUS_HIDDEN" ];

/// NPC data to be used by game sessions.
class NPC {
	constructor(myName) {
		this.name = myName;
		this.attackBonus = 0;
		this.damageBonus = 0;
		this.attackType = 1;
		this.defenseBonus = 0;
		this.toughnessBonus = 0;
		this.resist = 0;
		this.weakness = 0;
		this.status = INJURY_LEVEL_DISPLAY.length - 1;
	}
}

/// Weapon definitions - skill data is for automatic selection of equipped weapon.
const EQUIPPED_WEAPON = [
	{
		weapon: "WEAPON_TWO_HANDED",
		skills: [ "TwoHanded" ]
	},
	{
		weapon: "WEAPON_ONE_HANDED_SHIELD",
		skills: [ "OneHanded", "Block" ],
		useBlock: true
	},
	{
		weapon: "WEAPON_DUAL_WIELD",
		skills: [ "DualWield" ]
	},
	{
		weapon: "WEAPON_BOW",
		skills: [ "Bow" ]
	},
	{
		weapon: "WEAPON_STAFF",
		skills: [ "Alteration", "Conjuration", "Destruction", "Illusion", "Mysticism", "Restoration", "BloodMagic", "NatureMagic", "Necromancy", "ShadowMagic" ]
	},
	{
		weapon: "WEAPON_UNARMED",
		skills: [ "Unarmed" ]
	},
	{
		weapon: "WEAPON_ONE_HANDED_ONLY",
		skills: [ "OneHanded" ]
	},
	{
		weapon: "WEAPON_SHIELD_ONLY",
		skills: [ "Unarmed", "Block" ],
		useBlock: true
	}
];
const WORN_ARMOR = [ "LightArmor", "MediumArmor", "HeavyArmor" ];

/// Temporary character info used by game sessions.
class CharacterStatus {
	constructor(character) {
		if (typeof character === 'string') {
			this.name = character;
			this.equippedWeapon = 0;
			this.wornArmor = 0;
		} else {
			this.name = character.name;

			const weaponLevels = EQUIPPED_WEAPON.map(element => Math.max(...element.skills.map(item => character.getSkill(item))));
			this.equippedWeapon = weaponLevels.indexOf(Math.max(...weaponLevels));
			
			const armorLevels = WORN_ARMOR.map(element => character.getSkill(element));
			this.wornArmor = armorLevels.indexOf(Math.max(...armorLevels));
		}

		this.injuryLevel = 0;
	}

	addSummon(template, name) {
		this.summon = {
			name,
			template,
			injuryLevel: 0
		};
	}

	removeSummon() {
		delete this.summon;
	}
}

/// Game session object.
class RoleplaySession {
	constructor(ownMe) {
		this.owner = ownMe;
		this.characters = []; // CharacterSheets.
		this.statuses = []; // CharacterStatuses.
		this.npcs = []; // NPCs.
	}
}