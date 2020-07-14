const SEX_MALE = 0;
const SEX_FEMALE = 1;

const SKILL_DIFF_EASY = 0;
const SKILL_DIFF_MODERATE = 1;
const SKILL_DIFF_HARD = 2;
const SKILL_DIFF_ESOTERIC = 3;

const skillDifficultyNames = [ "Easy", "Moderate", "Hard", "Esoteric" ];

class QualityTemplate {
	constructor(myName, myDesc, myMin, myMax) {
		this.name = myName;
		this.description = myDesc,
		this.key = myName.replace(/[():\- ]/g, "");
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
		this.difficulty = myDiff;
	}
}

class Race {
	constructor(myName, maleAttr, maleSkills, femaleAttr, femaleSkills) {
		this.name = myName;

		this.attributes = [];
		this.attributes[SEX_MALE] = maleAttr;
		this.attributes[SEX_FEMALE] = femaleAttr;

		this.skills = [];
		this.skills[SEX_MALE] = maleSkills;
		this.skills[SEX_FEMALE] = femaleSkills;

	}
}

const races = [
	new Race("Altmer",
		{ Strength: -2, Intelligence: 2, Speed: -2 },
		{ Destruction: 1, LanguageElvish: 4 },
		{ Strength: -2, Intelligence: 2, Endurance: -2 },
		{ Destruction: 1, LanguageElvish: 4 }
	),
	new Race("Argonian",
		{ Willpower: -2, Agility: 2, Speed: 2, Endurance: -2, Personality: -2 },
		{ LanguageJel: 4, Restoration: 1 },
		{ Intelligence: 2, Endurance: -2, Personality: -2 },
		{ LanguageJel: 4, Restoration: 1 }
	),
	new Race("Bosmer",
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ Bow: 1 },
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ Bow: 1 }
	),
	new Race("Breton",
		{ Intelligence: 2, Willpower: 2, Agility: -2, Speed: -2, Endurance: -2 },
		{ LightArmor: 1 },
		{ Strength: -2, Intelligence: 2, Willpower: 2, Agility: -2, Endurance: -2 },
		{ LightArmor: 1 }
	),
	new Race("Dunmer",
		{ Willpower: -2, Speed: 2, Personality: -2 },
		{ DualWield: 1, LanguageDunmeris: 4 },
		{ Willpower: -2, Speed: 2, Endurance: -2 },
		{ DualWield: 1, LanguageDunmeris: 4 }
	),
	new Race("Imperial",
		{ Willpower: -2, Agility: -2, Personality: 2},
		{ OneHandandShield: 1 },
		{ Agility: -2, Speed: -2, Personality: 2 },
		{ OneHandandShiled: 1 }
	),
	new Race("Khajiit",
		{ Willpower: -2, Agility: 2, Endurance: -2 },
		{ LanguageTaagra: 4, MediumArmor: 1 },
		{ Strength: -2, Willpower: -2, Agility: 2 },
		{ LanguageTaagra: 4, MediumArmor: 1 }
	),
	new Race("Nord",
		{ Strength: 2, Intelligence: -2, Agility: -2, Endurance: 2, Personality: -2 },
		{ TwoHanded: 1 },
		{ Strength: 2, Intelligence: -2, Willpower: 2, Agility: -2, Personality: -2 },
		{ TwoHanded: 1 }
	),
	new Race("Orc",
		{ Strength: 1, Intelligence: -2, Willpower: 2, Agility: -1, Speed: -2, Endurance: 2, Personality: -2 },
		{ HeavyArmor: 1, LanguageOrcish: 4 },
		{ Strength: 1, Willpower: 1, Agility: -1, Speed: -2, Endurance: 2, Personality: -3 },
		{ HeavyArmor: 1, LanguageOrcish: 4 }
	),
	new Race("Redguard",
		{ Strength: 2, Intelligence: -2, Willpower: -2, Endurance: 2, Personality: -2 },
		{ LanguageYoku: 4, OneHandandShield: 1 },
		{ Intelligence: -2, Willpower: -2, Endurance: 2},
		{ LanguageYoku: 4, OneHandandShield: 1 }
	)
];

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
	new Skill("One Hand and Shield", "Strength","How well you use a weapon and shield."),
	new Skill("Dual Wield", "Agility", "How well you use two weapons at once."),
	new Skill("Bow", "Agility", "How well you use bows."),
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
	new Skill("Mercantile", "Personality", "How well you barer and haggle."),
	new Skill("Perception", "Willpower", "Noticing details about the world around you."),
	new Skill("Security", "Intelligence", "How well you can pick pockets or locks."),
	new Skill("Sneak", "Agility", "How well you can move unseen and unheard."),
	new Skill("Speechcraft", "Personality", "How well you can influence others by admiring, intimidating, or taunting them.")
];

const skillsCrafting = [
	new Skill("Alchemy", "Intelligence", "TODO"),
	new Skill("Blacksmithing", "Endurance", "TODO"),
	new Skill("Clothing", "Agility", "TODO"),
	new Skill("Enchanting", "Intelligence", "TODO"),
	new Skill("Jewelry", "Agility", "TODO"),
	new Skill("Provisioning", "Willpower", "TODO"),
	new Skill("Woodworking", "Agility", "TODO")
];

// These skills represent specialized knowledge.  There is no governing attribute associated!
const skillsKnowledge = [
	new ExtraSkill("First Aid", SKILL_DIFF_MODERATE, "Treating and dressing wounds in the field."),
	new ExtraSkill("Language: Akaviri", SKILL_DIFF_HARD, "Discerning the language used on the continent of Akavir."),
	new ExtraSkill("Language: Ayleidoon", SKILL_DIFF_HARD, "Discerning the language of the Ayleids of the First Era, which is now only known in written form."),
	new ExtraSkill("Language: Daedric", SKILL_DIFF_MODERATE, "Discerning the language of the daedra."),
	new ExtraSkill("Language: Draconic", SKILL_DIFF_ESOTERIC, "Discerning the language of the dragons of the Merethic Era, which is now only used by the Greybeards."),
	new ExtraSkill("Language: Dunmeris", SKILL_DIFF_EASY, "Discerning the language of the Dunmer, or dark elves."),
	new ExtraSkill("Language: Dwemeris", SKILL_DIFF_ESOTERIC, "Discerning the language of the Dwemer of the First Era, which is now forgotten and only persists in written form."),
	new ExtraSkill("Language: Ehlnofex", SKILL_DIFF_ESOTERIC, "Discerning the proto-language of all known cultures on Mundus."),
	new ExtraSkill("Language: Elvish", SKILL_DIFF_EASY, "Discerning the language of the Altmer, or high elves."),
	new ExtraSkill("Language: Falmeris", SKILL_DIFF_ESOTERIC, "Discerning the language of the Falmer of the First Era, which is now forgotten and only persists in written form."),
	new ExtraSkill("Language: Jel", SKILL_DIFF_EASY, "Discerning the language of the Argonians."),
	new ExtraSkill("Language: Kothringi", SKILL_DIFF_HARD, "Discerning the language of the Kothringi, who were wiped out by a plague earlier in the Second Era."),
	new ExtraSkill("Language: Nedic", SKILL_DIFF_HARD, "Discerning the language of the Nedes of the First Era, an early race of men."),
	new ExtraSkill("Language: Old Orcish", SKILL_DIFF_HARD, "Discerning the language of the Orcs of the First Era, which has been superseded by the more modern Orcish language."),
	new ExtraSkill("Language: Orcish", SKILL_DIFF_MODERATE, "Discerning the language of the Orcs."),
	new ExtraSkill("Language: Pyandonean", SKILL_DIFF_EASY, "Discerning the langauge of the Maormer, or sea elves."),
	new ExtraSkill("Language: Ta-agra", SKILL_DIFF_EASY, "Discerning the language of the Khajiit."),
	new ExtraSkill("Language: Yoku", SKILL_DIFF_MODERATE, "Discerning the language of Yokuda, ancestral homeland of the Redguards."),
	new ExtraSkill("Necromancy", SKILL_DIFF_EASY, "Knowledge of summoning and/or controlling the dead."),
	new ExtraSkill("Survival", SKILL_DIFF_EASY, "Living off the land.")
];

const masterQualityList = [ attributes, skillsCombat, skillsMagic, skillsGeneral, skillsCrafting, skillsKnowledge ];

class CharacterSheet {
	constructor() {
		this.sex = SEX_MALE;
		this.race = null;
		this.attributes = {};
		this.skills = {};
	}

	getItem(getMe) {
		if (attributes.find(element => element.key == getMe)) {
			return this.getAttribute(getMe);
		} else {
			return this.getSkill(getMe);
		}
	}

	getAttribute(getMe) {
		var result = 10;

		if ((this.race) && (getMe in this.race.attributes[this.sex])) {
			result += this.race.attributes[getMe];
		}

		if (getMe in this.attributes) {
			result += this.attributes[getMe];
		}

		return result;
	}

	getSkill(getMe) {
		var result = 0;

		if ((this.race) && (getMe in this.race.skills[this.sex])) {
			result += this.race.skills[getMe];
		}

		if (getMe in this.skills) {
			result += this.skills[getMe];
		}

		return result;
	}
}