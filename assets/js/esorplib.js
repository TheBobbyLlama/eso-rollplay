const SEX_MALE = 0;
const SEX_FEMALE = 1;

const SKILL_DIFF_EASY = 0;
const SKILL_DIFF_MODERATE = 1;
const SKILL_DIFF_HARD = 2;
const SKILL_DIFF_ESOTERIC = 3;

const skillDifficultyNames = [ "Easy", "Moderate", "Hard", "Esoteric!" ];

/// Base class for attributes or skills.
class QualityTemplate {
	constructor(myName, myDesc, myMin, myMax) {
		this.name = myName;
		this.description = myDesc,
		this.key = myName.replace(/[\s\W]/g, "");
		this.min = myMin;
		this.max = myMax;
	}
}

class Attribute extends QualityTemplate {
	constructor(myName, myDesc) {
		super(myName, myDesc, -2, 5);
	}
}

class Skill extends QualityTemplate {
	constructor(myName, myAttr, myDesc) {
		super(myName, myDesc, 0, 10);
		this.governing = myAttr;
	}
}

class ExtraSkill extends QualityTemplate {
	constructor(myName, myDiff, myDesc) {
		super(myName, myDesc, 0, 10);
		this.governing = "Intelligence";
		this.difficulty = myDiff;
	}
}

/// Used by races, supernatural types, and transformations.
class CharacterTemplate {
	constructor(myName, maleAttr, femaleAttr, skillMods, myResist = [], myWeakness = []) {
		this.name = myName;

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
		this.name = myName;
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
	new CharacterTemplate("Altmer",
		{ Strength: -2, Intelligence: 2, Speed: -2 },
		{ Strength: -2, Intelligence: 2, Endurance: -2 },
		{ Alteration: 1, AltmerLore: 4, Destruction: 1, Mysticism: 1 }
	),
	new CharacterTemplate("Argonian",
		{ Willpower: -2, Agility: 2, Speed: 2, Endurance: -2, Personality: -2 },
		{ Intelligence: 2, Endurance: -2, Personality: -2 },
		{ Athletics: 1, HistLore: 4, Restoration: 1, Unarmed: 1 },
		[ "Disease" ]
	),
	new CharacterTemplate("Bosmer",
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ BosmerLore: 4, Bow: 1, HandleAnimal: 1, MediumArmor: 1, Sneak: 1 },
		[ "Poison" ]
	),
	new CharacterTemplate("Breton",
		{ Intelligence: 2, Willpower: 2, Agility: -2, Speed: -2, Endurance: -2 },
		{ Strength: -2, Intelligence: 2, Willpower: 2, Agility: -2, Endurance: -2 },
		{ BretonLore: 4, Conjuration: 1, LightArmor: 1, Mysticism: 1 }
	),
	new CharacterTemplate("Dunmer",
		{ Willpower: -2, Speed: 2, Personality: -2 },
		{ Willpower: -2, Speed: 2, Endurance: -2 },
		{ Destruction: 1, DualWield: 1, DunmerLore: 4, Mysticism: 1 },
		[ "Flame" ]
	),
	new CharacterTemplate("Imperial",
		{ Willpower: -2, Agility: -2, Personality: 2},
		{ Agility: -2, Speed: -2, Personality: 2 },
		{ Block: 1, ImperialLore: 4, Mercantile: 1, OneHanded: 1, Speechcraft: 1 }
	),
	new CharacterTemplate("Khajiit",
		{ Willpower: -2, Agility: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2 },
		{ Acrobatics: 1, KhajiitLore: 4, MediumArmor: 1, Unarmed: 1 }
	),
	new CharacterTemplate("Nord",
		{ Strength: 2, Intelligence: -2, Agility: -2, Endurance: 2, Personality: -2 },
		{ Strength: 2, Intelligence: -2, Willpower: 2, Agility: -2, Personality: -2 },
		{ HeavyArmor: 1, MediumArmor: 1, NordLore: 4, TwoHanded: 1 },
		[ "Frost" ]
	),
	new CharacterTemplate("Orc",
		{ Strength: 1, Intelligence: -2, Willpower: 2, Agility: -1, Speed: -2, Endurance: 2, Personality: -2 },
		{ Strength: 1, Willpower: 1, Agility: -1, Speed: -2, Endurance: 2, Personality: -3 },
		{ Blacksmithing: 1, Block: 1, HeavyArmor: 1, OrcishLore: 4 }
	),
	new CharacterTemplate("Redguard",
		{ Strength: 2, Intelligence: -2, Willpower: -2, Endurance: 2, Personality: -2 },
		{ Intelligence: -2, Willpower: -2, Endurance: 2},
		{ Athletics: 1, DualWield: 1, OneHanded: 1, RedguardLore: 4 }
	),
	new CharacterTemplate("Khajiit (Ohmes)",
		{ Willpower: -2, Agility: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2 },
		{ Acrobatics: 1, KhajiitLore: 4, MediumArmor: 1, Speechcraft: 1 }
	),
	new CharacterTemplate("Maormer",
		{ Strength: -2, Willpower: 2, Speed: -2 },
		{ Strength: -2, Willpower: 2, Endurance: -2 },
		{ Athletics: 1, Destruction: 1, MaormerLore: 4, Sneak: 1 }
	),
	new CharacterTemplate("Reachman",
		{ Strength: 2, Speed: -2, Personality: -2 },
		{ Willpower: 2, Speed: -2, Personality: -2 },
		{ MediumArmor: 1, Mysticism: 1, ReachLore: 4, Survival: 1 }
	),
];

/// Supernatural type definitions.
const supernaturals = [
	new CharacterTemplate("", {}, {}, {}),
	new CharacterTemplate("Werewolf",
		{ Strength: 1, Agility: 1, Endurance: 1 },
		{ Strength: 1, Agility: 1, Endurance: 1 },
		{ Perception: 3, Survival: 2 },
		[ "Disease" ],
		[ "Silver" ]
	),
	new CharacterTemplate("Vampire",
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, Perception: 2, Sneak: 1 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	),
	new CharacterTemplate("Vampire (Daggerfall)",
		{ Strength: 2, Intelligence: 2, Willpower: 2, Speed: 2 },
		{ Strength: 2, Intelligence: 2, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, Perception: 2 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	),
	new CharacterTemplate("Vampire (Aundae)",
		{ Strength: 2, Willpower: 4, Speed: 2 },
		{ Strength: 2, Willpower: 4, Speed: 2 },
		{ BloodMagic: 2, Destruction: 1, Illusion: 1, Perception: 2 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	),
	new CharacterTemplate("Vampire (Berne)",
		{ Strength: 2, Willpower: 2, Agility: 2, Speed: 2 },
		{ Strength: 2, Willpower: 2, Agility: 2, Speed: 2 },
		{ BloodMagic: 2, LightArmor: 1, Perception: 2, Sneak: 1 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	),
	new CharacterTemplate("Vampire (Quarra)",
		{ Strength: 4, Willpower: 2, Speed: 2 },
		{ Strength: 4, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, HeavyArmor: 1, Perception: 2, Unarmed: 1 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	),
	new CharacterTemplate("Vampire (Cyrodiil)",
		{ Strength: 2, Willpower: 2, Speed: 2, Personality: 2 },
		{ Strength: 2, Willpower: 2, Speed: 2, Personality: 2 },
		{ BloodMagic: 2, Illusion: 1, Perception: 2, Speechcraft: 1 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	),
	new CharacterTemplate("Vampire (Volkihar)",
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ Strength: 2, Willpower: 2, Speed: 2 },
		{ BloodMagic: 2, Perception: 2 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	)
];

/// Tranformation definitions.
const supernaturalTransformations = [
	{
		parent: "Werewolf",
		template: new CharacterTemplate("Werewolf",
			{ Strength: 2, Speed: 2, Endurance: 2 },
			{ Strength: 2, Speed: 2, Endurance: 2 },
			{ Perception: 1, Unarmed: 3 },
			[],
			[ "Poison" ]
		)
	},
	{
		parent: "Vampire",
		template: new CharacterTemplate("Blood Scion",
			{ Endurance: 1 },
			{ Endurance: 1 },
			{ BloodMagic: 1, Unarmed: 1}
		)
	},
	{
		parent: "Vampire (Volkihar)",
		template: new CharacterTemplate("Vampire Lord",
			{ Speed: 2, Endurance: 2 },
			{ Speed: 2, Endurance: 2 },
			{ BloodMagic: 2, Destruction: 2, Illusion: 2, Mysticism: 2, Unarmed: 2}
		)
	},
	// SPECIAL - Werewwolf Behmoth, having the same parent as Werewolf, will only appear on GM Screen!
	{
		parent: "Werewolf",
		template: new CharacterTemplate("Werewolf Behemoth",
			{ Strength: 8, Speed: 2, Endurance: 4 },
			{ Strength: 8, Speed: 2, Endurance: 4 },
			{ Perception: 1, Unarmed: 3 },
			[],
			[ "Poison" ]
		)
	}
];

// const SPECIAL_ATTACK_TYPES = [ "None", "Physical", "Disease", "Flame", "Frost", "Poison", "Shock", "Silver" ];
const npcTemplates = [
// name, attack bonus, attack type, damage bonus, defense bonus, toughness bonus, resists, weaknesses, summon skill (leave blank for unsummonable)
	new NPCTemplate("Zombie",			0, 1, 0, -4, 0, [], [], "Conjuration"),
	new NPCTemplate("Skeleton",			0, 1, 2, 0, 2, [], [], "Conjuration"),
	new NPCTemplate("Ghost",			3, 4, 0, 0, 0, [ "Physical" ], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Wraith",			5, 4, 2, 0, 4, [ "Physical" ], [ "Silver "], "Conjuration"),
	new NPCTemplate("Vampire",			4, 1, 3, 3, 0, [], [ "Flame" ]),
	new NPCTemplate("Bloodfiend",		2, 1, 2, 0, 0, [], [ "Flame" ]),
	new NPCTemplate("Shambles",			2, 1, 4, 0, 4, [], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Scamp",			0, 1, 0, 2, 2, [], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Clannfear",		2, 1, 3, 0, 4, [], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Flame Atronach",	3, 3, 4, 1, 0, [ "Flame" ], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Frost Atronach",	2, 4, 3, 0, 4, [ "Frost" ], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Storm Atronach",	2, 6, 3, 0, 2, [ "Shock" ], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Winged Twilight",	2, 1, 2, 3, 0, [], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Dremora",			6, 1, 2, 2, 2, [ "Flame" ], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Daedroth",			4, 1, 3, 0, 4, [], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Hunger",			4, 1, 3, 0, 2, [], [ "Silver" ], "Conjuration"),
	new NPCTemplate("Familiar",			2, 1, 0, 2, -2, [], [], "Conjuration"),
	new NPCTemplate("Wolf",				2, 1, 0, 2, -2, [], [], "HandleAnimal"),
	new NPCTemplate("Bear",				2, 1, 4, 0, 3, [], [], "HandleAnimal"),
	new NPCTemplate("Small Animal",		0, 1, -2, 4, -2, [], [], "HandleAnimal"),
	new NPCTemplate("Medium Animal",	2, 1, 0, 0, 0, [], [], "HandleAnimal"),
	new NPCTemplate("Large Animal",		2, 1, 3, 0, 4, [], [], "HandleAnimal"),
	new NPCTemplate("Werewolf",			3, 1, 4, 1, 4, [], [ "Silver" ]),
];

/// Gets a character template by name.
function getTemplate(name, list) {
	return list.find(element => element.name === name);
}

/// CHARACTER FIELD DEFINITION SECTION
const classes = [ "", "Dragonknight", "Necromancer", "Nightblade", "Sorcerer", "Templar", "Warden" ];

const attributes = [
	new Attribute("Strength", "How strong you are."),
	new Attribute("Intelligence", "How smart you are."),
	new Attribute("Willpower", "How focused you are."),
	new Attribute("Agility", "How quickly you react."),
	new Attribute("Speed", "How fast you move."),
	new Attribute("Endurance","How tough you are."),
	new Attribute("Personality", "Affects your ability to gain information and better prices from NPCs."),
	new Attribute("Luck", "Affects everything you do in a small way.")
];

const skillsCombat = [
	new Skill("Two Handed", "Strength", "How well you use two handed weapons."),
	new Skill("One Handed", "Strength","How well you use a single one handed weapon."),
	new Skill("Block", "Endurance", "How well you protect yourself with a shield."),
	new Skill("Dual Wield", "Agility", "How well you use two weapons at once."),
	new Skill("Bow", "Agility", "How well you use bows."),
	new Skill("Unarmed", "Strength", "How well you can fight or grapple with your bare hands."),
	new Skill("Light Armor", "Speed", "How well you use light armor - robes and clothing."),
	new Skill("Medium Armor", "Agility", "How well you use medium armor - leather."),
	new Skill("Heavy Armor", "Endurance", "How well you use heavy armor - metal.")
];

const skillsMagic = [
	new Skill("Alteration", "Willpower", "How well you manipulate the natural world and its properties."),
	new Skill("Conjuration", "Intelligence", "How well you dominate the wills of daedra or the undead, or summon otherworldly weapons and armor."),
	new Skill("Destruction", "Willpower", "How well you use magic for destructive ends."),
	new Skill("Illusion", "Personality", "How well you alter the perceptions and thoughts of sentient beings."),
	new Skill("Mysticism", "Intelligence", "How well you focus mystical energy into feats of telekinesis or perception."),
	new Skill("Restoration", "Willpower", "How well you restore or bolster the body.")
];

const skillsGeneral = [
	new Skill("Acrobatics", "Agility", "How well you jump, climb, and avoid damage from falls."),
	new Skill("Athletics", "Speed", "How well you can run and swim."),
	new Skill("Legerdemain", "Intelligence", "How well you can pick pockets or locks."),
	new Skill("Mercantile", "Personality", "How well you barter and haggle."),
	new Skill("Perception", "Willpower", "Noticing details about the world around you."),
	new Skill("Sneak", "Agility", "How well you can move unseen and unheard."),
	new Skill("Speechcraft", "Personality", "How well you can influence others by admiring, intimidating, or taunting them.")
];

const skillsCrafting = [
	new Skill("Alchemy", "Intelligence", "How well you can brew potions and poisons, as well as recognize and use alchemical ingredients."),
	new Skill("Blacksmithing", "Endurance", "How well you can create metal items."),
	new Skill("Clothing", "Agility", "How well you can make clothing and leather items."),
	new Skill("Enchanting", "Intelligence", "How well you can add enchantments to items."),
	new Skill("Jewelry", "Agility", "How well you can create jewelry."),
	new Skill("Provisioning", "Willpower", "How well you can prepare food and drink."),
	new Skill("Woodworking", "Agility", "How well you can create wooden items.")
];

/// These skills represent specialized knowledge.  There is no governing attribute associated!
const skillsKnowledge = [
	new ExtraSkill("Altmer Lore", SKILL_DIFF_MODERATE, "Studying the history of the Altmer people, as well as their elvish language."),
	new ExtraSkill("Akaviri Lore", SKILL_DIFF_HARD, "Knowledge of the continent of Akavir."),
	new ExtraSkill("Ayleid Lore", SKILL_DIFF_HARD, "Studying the history of the extinct Ayleid people, and their language Ayleidoon."),
	new ExtraSkill("Blood Magic", SKILL_DIFF_HARD, "A form of dark magic to manipulate blood, most famously used by vampires."),
	new ExtraSkill("Bosmer Lore", SKILL_DIFF_MODERATE, "Studying the history of the Bosmer people, as well as the Wild Hunt."),
	new ExtraSkill("Breton Lore", SKILL_DIFF_MODERATE, "Studying the history of the Breton people and their mixed man/mer ancestry."),
	new ExtraSkill("Daedric Lore", SKILL_DIFF_MODERATE, "Studying the secrets of the daedra - their society/planes, summoning them, and their language."),
	new ExtraSkill("Dragon Lore", SKILL_DIFF_HARD, "Studying the secrets of the dragon lords of the Merethic Era, and their language which is now only used by the Greybeards."),
	new ExtraSkill("Dunmer Lore", SKILL_DIFF_MODERATE, "Studying the history of the Dunmer people, as well as their writings in Dunmeris or Ald Chimeris."),
	new ExtraSkill("Dwemerology", SKILL_DIFF_HARD, "Studying the secrets of the Dwemer, who disappeared in the First Era."),
	new ExtraSkill("Falmer Lore", SKILL_DIFF_ESOTERIC, "Studying the history of the Falmer, and what little remains of their culture."),
	new ExtraSkill("First Aid", SKILL_DIFF_MODERATE, "Treating and dressing wounds in the field."),
	new ExtraSkill("Handle Animal", SKILL_DIFF_EASY, "Dealing with animals, either tame or wild."),
	new ExtraSkill("Hist Lore", SKILL_DIFF_MODERATE, "Studying the intricacies of the Hist, as well as Jel, the language of the Argonians."),
	new ExtraSkill("Imperial Lore", SKILL_DIFF_MODERATE, "Studying the history of the Imperial people, and the Alessian Empire that came before them."),
	new ExtraSkill("Khajiit Lore", SKILL_DIFF_MODERATE, "Studying the history of the Khajiit people, as well as their Ta'agra language."),
	new ExtraSkill("Kothringi Lore", SKILL_DIFF_HARD, "Studying the history of the Kothringi people, who were wiped out by a plague earlier in the Second Era."),
	new ExtraSkill("Maormer Lore", SKILL_DIFF_HARD, "Knowledge of the maormer, or sea elves, as well as their language, Pyandonean."),
	new ExtraSkill("Merethic Lore", SKILL_DIFF_ESOTERIC, "Studying the origins of all the people of Tamriel, as well as their proto-language, Ehlnofex."),
	new ExtraSkill("Nature Magic", SKILL_DIFF_MODERATE, "Study of magic for harnessing and controlling nature, like the Wyresses of Daggerafall."),
	new ExtraSkill("Necromancy", SKILL_DIFF_MODERATE, "Knowledge of summoning and/or controlling the dead."),
	new ExtraSkill("Nedic Lore", SKILL_DIFF_HARD, "Studying the history of the early men who settled Tamriel, the Nedes."),
	new ExtraSkill("Nord Lore", SKILL_DIFF_MODERATE, "Studying the history of the Nords and their ancestral homeland of Atmora."),
	new ExtraSkill("Orcish Lore", SKILL_DIFF_MODERATE, "Studying the history of the pariah mer, or Orcs, as well as the modern and archaic forms of their language."),
	new ExtraSkill("Reach Lore", SKILL_DIFF_MODERATE, "Knowledge of the people, customs, and religion of the Reach."),
	new ExtraSkill("Redguard Lore", SKILL_DIFF_MODERATE, "Studying the history of the Redguard people and their ancestral homeland of Yokuda."),
	new ExtraSkill("Shadow Magic", SKILL_DIFF_ESOTERIC, "An obscure form of magic which is used by Nocturnal, but can also be learned by mortals in limited forms."),
	new ExtraSkill("Sload Lore", SKILL_DIFF_HARD, "Studying the history of the Sload, a slug-like race that live over the seas southwest of Tamriel."),
	new ExtraSkill("Survival", SKILL_DIFF_EASY, "Living off the land.")
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

	/// Prints character sheet, optionally with a link to profile page.
	print(id, profileLink=false) {
		var i;
		var printArr = [];
		var printout = $("#" + id);
		printout.empty();

		if (this.name) {
			printout.append("===============================<br />")
			printout.append("<h3>" + nameDecode(this.name).toUpperCase() + "</h3>");
		}

		printout.append("===============================<br />")

		if (this.player) {
			printout.append(((this.player[0] == "@") ? "" : "@") + nameDecode(this.player) + "<br />");
		}

		if (this.race) {
			printArr.push(this.race);
		}

		if (this.supernatural) {
			printArr.push(this.supernatural);
		}

		printArr.push((this.sex) ? "Female" : "Male");

		if (this.class) {
			printArr.push(this.class);
		}

		printout.append(printArr.join(" - ") + "<br />");

		if (this.transformation) {
			printout.append("<b class='transformation'>" + this.transformation + "!</b><br />");
		}

		printArr = [];

		for (i = 0; i < attributes.length; i++) {
			printArr.push(
				"<span data-key='" + attributes[i].key + "'>" + attributes[i].name.substring(0, 3) + ": " + this.getAttribute(attributes[i].key) + "</span>"
			);
		}

		printout.append("<strong>========= ATTRIBUTES ==========</strong><br />");
		printout.append(printArr.join("<br />") + "<br />");

		printArr = this.loadSkillArray(skillsCombat);

		if (printArr.length) {
			printout.append("<strong>======== COMBAT SKILLS ========</strong><br />");
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsMagic);

		if (printArr.length) {
			printout.append("<strong>======== MAGIC SKILLS =========</strong><br />");
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsGeneral);

		if (printArr.length) {
			printout.append("<strong>======= GENERAL SKILLS ========</strong><br />");
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsCrafting);

		if (printArr.length) {
			printout.append("<strong>======= CRAFTING SKILLS =======</strong><br />");
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.loadSkillArray(skillsKnowledge);

		if (printArr.length) {
			printout.append("<strong>====== KNOWLEDGE SKILLS =======</strong><br />");
			printout.append(printArr.join("<br />") + "<br />");
		}

		printArr = this.getResists();

		if (printArr.length) {
			printout.append("<strong>========= RESISTANCES =========</strong><br />");
			printout.append(printArr.join(", ") + "<br />");
		}

		printArr = this.getWeaknesses();

		if (printArr.length) {
			printout.append("<strong>========= WEAKNESSES ==========</strong><br />");
			printout.append(printArr.join(", ") + "<br />");
		}

		if (profileLink) {
			printout.append("<a href='profile.html?character=" + this.name + "&minimal=true' target='_blank'>View Description</a>");
		}
	}

	/// Helper function for printing character sheet.
	loadSkillArray(list) {
		var result = [];

		for (var i = 0; i < list.length; i++) {
			if (this.getSkill(list[i].key)) {
				result.push(
					"<span data-key='" + list[i].key + "'>" + list[i].name + ": " + this.getSkill(list[i].key) + "</span>"
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

const SPECIAL_ATTACK_TYPES = [ "None", "Physical", "Disease", "Flame", "Frost", "Poison", "Shock", "Silver" ];
const INJURY_LEVEL_DISPLAY = [ "Unhurt", "Injured", "Critical", "Incapacitated!", "Hidden" ];

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
		weapon: "Two Handed",
		skills: [ "TwoHanded" ]
	},
	{
		weapon: "One Hand and Shield",
		skills: [ "OneHanded", "Block" ],
		useBlock: true
	},
	{
		weapon: "Dual Wield",
		skills: [ "DualWield" ]
	},
	{
		weapon: "Bow",
		skills: [ "Bow" ]
	},
	{
		weapon: "Staff",
		skills: [ "Alteration", "Conjuration", "Destruction", "Illusion", "Mysticism", "Restoration", "BloodMagic", "NatureMagic", "Necromancy", "ShadowMagic" ]
	},
	{
		weapon: "Unarmed",
		skills: [ "Unarmed" ]
	},
	{
		weapon: "One Handed Only",
		skills: [ "OneHanded" ]
	},
	{
		weapon: "Shield Only",
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