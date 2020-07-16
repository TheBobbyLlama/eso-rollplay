const SEX_MALE = 0;
const SEX_FEMALE = 1;

const SKILL_DIFF_EASY = 0;
const SKILL_DIFF_MODERATE = 1;
const SKILL_DIFF_HARD = 2;
const SKILL_DIFF_ESOTERIC = 3;

const skillDifficultyNames = [ "Easy", "Moderate", "Hard", "Esoteric!" ];

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

const races = [
	new CharacterTemplate("Altmer",
		{ Strength: -2, Intelligence: 2, Speed: -2 },
		{ Strength: -2, Intelligence: 2, Endurance: -2 },
		{ AltmerLore: 4, Destruction: 1 }
	),
	new CharacterTemplate("Argonian",
		{ Willpower: -2, Agility: 2, Speed: 2, Endurance: -2, Personality: -2 },
		{ Intelligence: 2, Endurance: -2, Personality: -2 },
		{ HistLore: 4, Restoration: 1, Unarmed: 1 },
		[ "Disease" ]
	),
	new CharacterTemplate("Bosmer",
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2, Speed: 2, Endurance: -2 },
		{ BosmerLore: 4, Bow: 1 },
		[ "Poison" ]
	),
	new CharacterTemplate("Breton",
		{ Intelligence: 2, Willpower: 2, Agility: -2, Speed: -2, Endurance: -2 },
		{ Strength: -2, Intelligence: 2, Willpower: 2, Agility: -2, Endurance: -2 },
		{ BretonLore: 4, LightArmor: 1 }
	),
	new CharacterTemplate("Dunmer",
		{ Willpower: -2, Speed: 2, Personality: -2 },
		{ Willpower: -2, Speed: 2, Endurance: -2 },
		{ DualWield: 1, DunmerLore: 4 },
		[ "Flame" ]
	),
	new CharacterTemplate("Imperial",
		{ Willpower: -2, Agility: -2, Personality: 2},
		{ Agility: -2, Speed: -2, Personality: 2 },
		{ ImperialLore: 4, OneHandandShiled: 1 }
	),
	new CharacterTemplate("Khajiit",
		{ Willpower: -2, Agility: 2, Endurance: -2 },
		{ Strength: -2, Willpower: -2, Agility: 2 },
		{ KhajiitLore: 4, MediumArmor: 1, Unarmed: 2 }
	),
	new CharacterTemplate("Nord",
		{ Strength: 2, Intelligence: -2, Agility: -2, Endurance: 2, Personality: -2 },
		{ Strength: 2, Intelligence: -2, Willpower: 2, Agility: -2, Personality: -2 },
		{ NordLore: 4, TwoHanded: 1 },
		[ "Frost" ]
	),
	new CharacterTemplate("Orc",
		{ Strength: 1, Intelligence: -2, Willpower: 2, Agility: -1, Speed: -2, Endurance: 2, Personality: -2 },
		{ Strength: 1, Willpower: 1, Agility: -1, Speed: -2, Endurance: 2, Personality: -3 },
		{ HeavyArmor: 1, OrcishLore: 4 }
	),
	new CharacterTemplate("Redguard",
		{ Strength: 2, Intelligence: -2, Willpower: -2, Endurance: 2, Personality: -2 },
		{ Intelligence: -2, Willpower: -2, Endurance: 2},
		{ OneHandandShield: 1, RedguardLore: 4 }
	)
];

const supernaturals = [
	new CharacterTemplate("", {}, {}, {}),
	new CharacterTemplate("Vampire",
		{ Strength: 2, Agility: 2, Speed: 2 },
		{ Strength: 2, Agility: 2, Speed: 2 },
		{ Perception: 2 },
		[ "Disease" ],
		[ "Flame", "Silver" ]
	),
	new CharacterTemplate("Werewolf",
		{ Strength: 1, Endurance: 2 },
		{ Strength: 1, Endurance: 2 },
		{ Perception: 3, Survival: 1 },
		[ "Disease" ],
		[ "Poison", "Silver" ]
	)
];

function getTemplate(name, list) {
	return list.find(element => element.name === name);
}

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
	new Skill("One Hand and Shield", "Strength","How well you use a weapon and shield."),
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
	new ExtraSkill("Altmer Lore", SKILL_DIFF_MODERATE, "Studying the history of the Altmer people, as well as their elvish language."),
	new ExtraSkill("Akaviri Lore", SKILL_DIFF_HARD, "Knowledge of the continent of Akavir."),
	new ExtraSkill("Ayleid Lore", SKILL_DIFF_HARD, "Studying the history of the extinct Ayleid people, and their language Ayleidoon."),
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
	new ExtraSkill("Khajiit Lore", SKILL_DIFF_MODERATE, "Studying the history of the Khajiit people, as well as their Ta'agra language."),
	new ExtraSkill("Imperial Lore", SKILL_DIFF_MODERATE, "Studying the history of the Imperial people, and the Alessian Empire that came before them."),
	new ExtraSkill("Kothringi Lore", SKILL_DIFF_HARD, "Studying the history of the Kothringi people, who were wiped out by a plague earlier in the Second Era."),
	new ExtraSkill("Maormer Lore", SKILL_DIFF_HARD, "Knowledge of the maormer, or sea elves, as well as their language, Pyandonean."),
	new ExtraSkill("Merethic Lore", SKILL_DIFF_ESOTERIC, "Studying the origins of all the people of Tamriel, as well as their proto-language, Ehlnofex."),
	new ExtraSkill("Nedic Lore", SKILL_DIFF_HARD, "Studying the history of the early men who settled Tamriel, the Nedes."),
	new ExtraSkill("Nord Lore", SKILL_DIFF_MODERATE, "Studying the history of the Nords and their ancestral homeland of Atmora."),
	new ExtraSkill("Orcish Lore", SKILL_DIFF_MODERATE, "Studying the history of the pariah mer, or Orcs, as well as the modern and archaic forms of their language."),
	new ExtraSkill("Necromancy", SKILL_DIFF_MODERATE, "Knowledge of summoning and/or controlling the dead."),
	new ExtraSkill("Reach Lore", SKILL_DIFF_MODERATE, "Knowledge of the people, customs, and religion of the Reach."),
	new ExtraSkill("Redguard Lore", SKILL_DIFF_MODERATE, "Studying the history of the Redguard people and their ancestral homeland of Yokuda."),
	new ExtraSkill("Sload Lore", SKILL_DIFF_HARD, "Studying the history of the Sload, a slug-like race that live over the seas southwest of Tamriel."),
	new ExtraSkill("Survival", SKILL_DIFF_EASY, "Living off the land.")
];

const masterQualityList = [ attributes, skillsCombat, skillsMagic, skillsGeneral, skillsCrafting, skillsKnowledge ];

function getQuality(key) {
	for (var i = 0; i < masterQualityList.length; i++) {
		var tryMe = masterQualityList[i].find(element => element.key == key);

		if (tryMe) {
			return tryMe;
		}
	}

	return undefined;
}

function internalDieRoll() {
	return (1 + Math.floor(20 * Math.random()));
}

class CharacterSheet {
	constructor() {
		this.sex = SEX_MALE;
		this.race = "";
		this.supernatural = "";
		this.class = "";
		this.attributes = {};
		this.skills = {};
	}

	getItem(getMe, noSlider=false) {
		if (attributes.find(element => element.key == getMe)) {
			return this.getAttribute(getMe, noSlider);
		} else {
			return this.getSkill(getMe, noSlider);
		}
	}

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

		if ((!noSlider) && (getMe in this.attributes)) {
			result += this.attributes[getMe];
		}

		return result;
	}

	getAttributeModifier(key) {
		var attrVal = this.getAttribute(key);
		var result = attrVal - 10;
	
		if (result > 0) {
			result = Math.floor(result / 2.0);
		}
	
		return result;
	}

	getSkill(getMe, noSlider=false) {
		var result = 0;
		var tryMe = getTemplate(this.race, races);

		if ((tryMe) && (getMe in tryMe.skills)) {
			result += tryMe.skills[getMe];
		}

		tryMe = getTemplate(this.supernatural, supernaturals);

		if ((tryMe) && (getMe in tryMe.skills)) {
			result += tryMe.skills[getMe];
		}

		if ((!noSlider) && (getMe in this.skills)) {
			result += this.skills[getMe];
		}

		return result;
	}

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

		if (!internal) {
			var checkResists = this.getResists(true);

			result = result.filter(function(value, index, self) {
				return ((self.indexOf(value) === index) && (checkResists.indexOf(value) < 0));
			});
			result.sort();
		}

		return result;
	}

	getRollModifier(getMe) {
		if (attributes.find(element => element.key == getMe)) {
			return this.getAttributeModifier(getMe);
		} else {
			return this.getSkill(getMe);
		}
	}

	makeRoll(key) {
		return internalDieRoll() + this.getRollModifier(key);
	}

	makeResistanceRoll(attackType) {
		var result;

		if (this.getResists().indexOf(attackType) > -1) {
			result = Math.max(makeRoll("Endurance"), makeRoll("Endurance"));
		} else if (this.getWeaknesses().indexOf(attackType) > -1) {
			result = Math.min(makeRoll("Endurance"), makeRoll("Endurance"));
		} else {
			result = makeRoll("Endurance");
		}

		return result;
	}

	loadValueHandler(loadMe) {
		var loadList = Object.entries(loadMe);
		
		for (var i = 0; i < loadList.length; i ++) {
			this[loadList[i][0]] = loadList[i][1];
		}
	}

	print(id) {
		var i;
		var printArr = [];
		var printout = $("#" + id);
		printout.text("");

		if (this.name) {
			printout.append("===============================<br />")
			printout.append("<h3>" + this.name.toUpperCase() + "</h3>");
		}

		printout.append("===============================<br />")

		if (this.player) {
			printout.append("@" + this.player + "<br />");
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
	}

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

const SPECIAL_ATTACK_TYPES = [ "None", "Physical", "Disease", "Flame", "Frost", "Poison", "Shock", "Silver" ];
const INJURY_LEVEL_DISPLAY = [ "Unhurt", "Injured", "Critical", "Incapacitated!" ];

class NPC {
	constructor(myName) {
		this.name = myName;
		this.attackBonus = 0;
		this.AttackType = 1;
		this.resistanceBonus = 0;
		this.resist = 0;
		this.weakness = 0;
		this.injuryLevel = 0;
	}
}

class CharacterStatus {
	constructor(character) {
		this.name = character.name;
		this.injuryLevel = 0;

		// TODO - Equipped items?
	}
}

class RoleplaySession {
	constructor(ownMe) {
		this.owner = ownMe;
		this.characters = []; // CharacterSheets.
		this.statuses = []; // CharacterStatuses.
		this.npcs = []; // NPCs.
	}
}

function convertEventToHtml(event) {
	switch (event.eventType) {
		case "AddNPC":
			return "<div class='gmInfo'>NPC " + event.name + " has been added to the session.</div>";
		case "AddPlayer":
			return "<div class='gmInfo'>Player " + event.player + " has been added to the session.</div>";
		case "Close":
			return "<div class='gmInfo'>" + event.owner + " has closed this session.<br />THERE HAS BEEN AN ERROR IF YOU CAN SEE THIS.</div>";
		case "InjuryNPC":
			return "<div>" + event.name + " is now " + INJURY_LEVEL_DISPLAY[event.status] + "</div>";
		case "InjuryPlayer":
			return "<div>" + event.player + " is now " + INJURY_LEVEL_DISPLAY[event.status] + "</div>";
		case "Roll":
			return "<div id='Roll_" + event.id + "'>" +
				"<div>" +
					"<p>" + event.player + " rolls " + getQuality(event.key).name + " (" + ((event.modifier >= 0) ? "+" : "") + event.modifier + "):" + "</p>" +
					((event.comment) ? "<span class='rollComment'>" + event.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + event.result +
				"</div>" +
			"</div>";
		case "RollSubordinate":
			return "<div class='gmExtra subordinate'>" +
				"<div>" +
					"<p>" + event.name + " rolls " + " (" + ((event.modifier >= 0) ? "+" : "") + event.modifier + "):" + "</p>" +
					((event.comment) ? "<span class='rollComment'>" + event.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + event.result +
				"</div>" +
			"</div>";
		case "Start":
			return "<div>" + event.owner + " opened this session. (" + event.timeStamp + ")</div>";
	}
}

class SharedEvent {
	constructor(myType) {
		this.eventType = myType;
	}
}

const GM_EVENTS = [ "AddNPC", "AddPlayer", "RollSubordinate" ];

// ADMINISTRATIVE EVENTS
class EventStart extends SharedEvent {
	constructor(ownMe, myTime) {
		super("Start");
		this.owner = ownMe;
		this.timeStamp = myTime;
	}
}

class EventClose extends SharedEvent {
	constructor(ownMe) {
		super("Close");
		this.owner = ownMe;
	}
}

class EventAddNPC extends SharedEvent {
	constructor(myName) {
		super("AddNPC");
		this.name = myName;
	}
}

class EventAddPlayer extends SharedEvent {
	constructor(myPlayer) {
		super("AddPlayer");
		this.player = myPlayer;
	}
}

// ACTIVE EVENTS
class EventRoll extends SharedEvent {
	constructor(myPlayer, mySkill, myMod, myResult, myComment) {
		super("Roll");
		this.id = Date.now();
		this.player = myPlayer;
		this.key = mySkill;
		this.modifier = myMod;
		this.result = myResult;
		this.comment = myComment;
	}
}

class EventRollSubordinate extends SharedEvent {
	constructor(myName, myMod, myResult, myComment, parentId) {
		super("RollSubordinate");
		this.name = myName;
		this.modifier = myMod;
		this.result = myResult;
		this.comment = myComment;
		this.parent = parentId;
	}
}

class EventInjuryPlayer extends SharedEvent {
	constructor(myPlayer, myStatus) {
		super("InjuryPlayer");
		this.player = myPlayer;
		this.status = myStatus;
	}
}

class EventInjuryNPC extends SharedEvent {
	constructor(myName, myStatus) {
		super("InjuryNPC");
		this.name = myName;
		this.status = myStatus;
	}
}