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
		{ ImperialLore: 4, OneHandandShield: 1 }
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
	new ExtraSkill("Necromancy", SKILL_DIFF_MODERATE, "Knowledge of summoning and/or controlling the dead."),
	new ExtraSkill("Nedic Lore", SKILL_DIFF_HARD, "Studying the history of the early men who settled Tamriel, the Nedes."),
	new ExtraSkill("Nord Lore", SKILL_DIFF_MODERATE, "Studying the history of the Nords and their ancestral homeland of Atmora."),
	new ExtraSkill("Orcish Lore", SKILL_DIFF_MODERATE, "Studying the history of the pariah mer, or Orcs, as well as the modern and archaic forms of their language."),
	new ExtraSkill("Reach Lore", SKILL_DIFF_MODERATE, "Knowledge of the people, customs, and religion of the Reach."),
	new ExtraSkill("Redguard Lore", SKILL_DIFF_MODERATE, "Studying the history of the Redguard people and their ancestral homeland of Yokuda."),
	new ExtraSkill("Shadow Magic", SKILL_DIFF_ESOTERIC, "An obscure form of magic which is used by Nocturnal, but can also be learned by mortals."),
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

	getAttributeSkillModifier(key) {
		var attrVal = this.getAttribute(key);
		var result = attrVal - 10;
	
		if (result > 0) {
			result = Math.floor(result / 2.0);
		}
	
		return result;
	}

	getAttributeModifier(key) {
		return this.getAttribute(key) - 10;
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

	resistsDamage(attackType) {
		return (this.getResists().indexOf(attackType) > -1);
	}

	weakToDamage(attackType) {
		return (this.getWeaknesses().indexOf(attackType) > -1);
	}

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

	getArmorModifier(armor) {
		return Math.floor(this.getSkill(WORN_ARMOR[armor]) / 2);
	}

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

	makeToughnessRoll(attackType) {
		var result = this.makeRoll("Toughness");

		if (this.resistsDamage(attackType)) {
			result = Math.max(result, this.makeRoll("Toughness"));
		} else if (this.weakToDamage(attackType)) {
			result = Math.min(result, this.makeRoll("Toughness"));
		}

		return result;
	}

	loadValueHandler(loadMe) {
		var loadList = Object.entries(loadMe);
		
		for (var i = 0; i < loadList.length; i ++) {
			this[loadList[i][0]] = loadList[i][1];
		}
	}

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
			printout.append("@" + nameDecode(this.player) + "<br />");
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

		if (profileLink) {
			printout.append("<a href='profile.html?character=" + this.name + "&minimal=true' target='_blank'>View Profile</a>");
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

function formatDescription(description) {
	return description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
}

const SPECIAL_ATTACK_TYPES = [ "None", "Physical", "Disease", "Flame", "Frost", "Poison", "Shock", "Silver" ];
const INJURY_LEVEL_DISPLAY = [ "Unhurt", "Injured", "Critical", "Incapacitated!", "Hidden" ];

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

const WORN_ARMOR = [ "LightArmor", "MediumArmor", "HeavyArmor" ];

class CharacterStatus {
	constructor(character) {
		this.name = character.name;
		this.injuryLevel = 0;
		
		const armorLevels = WORN_ARMOR.map(element => character.getSkill(element));
		this.wornArmor = armorLevels.indexOf(Math.max(...armorLevels));
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

function forceEventType(event) {
	switch (event.eventType) {
		case "AddNPC":
			return Object.setPrototypeOf(event, EventAddNPC.prototype);
		case "AddPlayer":
			return Object.setPrototypeOf(event, EventAddPlayer.prototype);
		case "Close":
			return Object.setPrototypeOf(event, EventClose.prototype);
		case "End":
			return Object.setPrototypeOf(event, EventEnd.prototype);
		case "GMPost":
			return Object.setPrototypeOf(event, EventGMPost.prototype);
		case "NPCStatus":
			return Object.setPrototypeOf(event, EventNPCStatus.prototype);
		case "InjuryPlayer":
			return Object.setPrototypeOf(event, EventInjuryPlayer.prototype);
		case "NPCAttack":
			return Object.setPrototypeOf(event, EventNPCAttack.prototype);
		case "NPCAttackResolution":
			return Object.setPrototypeOf(event, EventNPCAttackResolution.prototype);
		case "NPCDefense":
			return Object.setPrototypeOf(event, EventNPCDefense.prototype);
		case "NPCRoll":
			return Object.setPrototypeOf(event, EventNPCRoll.prototype);
		case "NPCToughness":
			return Object.setPrototypeOf(event, EventNPCToughnessRoll.prototype);
		case "PlayerArmor":
			return Object.setPrototypeOf(event, EventPlayerArmor.prototype);
		case "PlayerAttack":
			return Object.setPrototypeOf(event, EventPlayerAttack.prototype);
		case "PlayerBusy":
			return Object.setPrototypeOf(event, EventAddPlayer.prototype);
		case "PlayerAttackResolution":
			return Object.setPrototypeOf(event, EventPlayerAttackResolution.prototype);
		case "PlayerConnect":
			return Object.setPrototypeOf(event, EventPlayerConnect.prototype);
		case "PlayerDamage":
			return Object.setPrototypeOf(event, EventPlayerDamageRoll.prototype);
		case "PlayerDefense":
			return Object.setPrototypeOf(event, EventPlayerDefense.prototype);
		case "PlayerDisconnect":
			return Object.setPrototypeOf(event, EventPlayerDisconnect.prototype);
		case "PlayerToughness":
			return Object.setPrototypeOf(event, EventPlayerToughnessRoll.prototype);
		case "Roll":
			return Object.setPrototypeOf(event, EventRoll.prototype);
		case "RollContested":
			return Object.setPrototypeOf(event, EventContestedRoll.prototype);
		case "RollContestedSubordinate":
			return Object.setPrototypeOf(event, EventContestedResponse.prototype);
		case "RollSubordinateResolution":
			return Object.setPrototypeOf(event, EventRollSubordinateResolution.prototype);
		case "RollPlayerContested":
			return Object.setPrototypeOf(event, EventPlayerContestedRoll.prototype)
		case "RollPlayerContestedSubordinate":
			return Object.setPrototypeOf(event, EventPlayerContestedRollSubordinate.prototype);
		case "RollSubordinate":
			return Object.setPrototypeOf(event, EventRollSubordinate.prototype);
		case "Start":
			return Object.setPrototypeOf(event, EventStart.prototype);
		default:
			return new EventError(event.eventType);
	}
}

class SharedEvent {
	constructor(myType) {
		this.eventType = myType;
		this.timeStamp = new Date().toLocaleString("en-US")
	}

	toHTML() {
		return "<div class='error'>An event was raised with no output (" + this.eventType + ")</div>";
	}
}

class EventError extends SharedEvent {
	constructor(myType) {
		super("Error");
		this.passedType = myType;
	}

	toHTML() {
		return "<div class='error'>An event was raised with an unrecognized type (" + this.passedType + ")</div>";
	}
}

class SharedRollEvent extends SharedEvent {
	constructor(myType, rollData) {
		super(myType);

		if (rollData) {
			this.key = rollData.key;
			this.modifier = rollData.modifier;
			this.result = rollData.result + rollData.modifier;
			//this.rolls = rollData.rolls;
			this.comment = rollData.comment;

			if (rollData.attackType) {
				this.attackType = rollData.attackType;
			}

			if (rollData.parent) {
				this.parent = rollData.parent;
			}

			if (rollData.lucky) {
				this.lucky = true;
			}

			if (rollData.resist) {
				this.resist = true;
			}

			if (rollData.unlucky) {
				this.unlucky = true;
			}

			if (rollData.weak) {
				this.weak = true;
			}
		}
	}
}

const GM_EVENTS = [ "AddNPC", "NPCDefense", "NPCRoll", "NPCToughness", "PlayerBusy", "PlayerConnect", "PlayerDisconnect", "RollSubordinate" ];

// ADMINISTRATIVE EVENTS
class EventStart extends SharedEvent {
	constructor(ownMe) {
		super("Start");
		this.owner = ownMe;
	}

	toHTML() {
		return "<div>" + this.owner + " opened this session. (" + this.timeStamp + ")</div>";
	}
}

class EventEnd extends SharedEvent {
	constructor(ownMe) {
		super("End");
		this.owner = ownMe;
	}

	toHTML() {
		return "<div><p>The session has been ended by " + this.owner + ". (" + this.timeStamp + ")</p><p>Thanks for playing!</p></div>";
	}
}

class EventClose extends SharedEvent {
	constructor(ownMe) {
		super("Close");
		this.owner = ownMe;
	}

	toHTML() {
		return "<div class='gmInfo'>" + this.owner + " has closed this session.<br />YOU SHOULD NEVER SEE THIS.</div>";
	}
}

class EventGMPost extends SharedEvent {
	constructor(text) {
		super("GMPost");
		this.post = nameEncode(text);
	}

	toHTML() {
		return "<div class='gmComment'><h3>GM Post:</h3><em>" + this.post.replace(/\n/g, "<br />") + "</em></div>"
	}
}

class EventAddNPC extends SharedEvent {
	constructor(myName) {
		super("AddNPC");
		this.name = myName;
	}

	toHTML() {
		return "<div class='gmInfo'>NPC " + this.name + " has been added to the session.</div>";
	}
}

class EventAddPlayer extends SharedEvent {
	constructor(myPlayer) {
		super("AddPlayer");
		this.player = myPlayer;
	}

	toHTML() {
		return "<div class='gmInfo'>Player " + this.player + " has been added to the session.</div>";
	}
}

class EventPlayerConnect extends SharedEvent {
	constructor(myPlayer) {
		super("PlayerConnect");
		this.player = myPlayer;
	}

	toHTML() {
		return "<div class='gmInfo'>" + this.player + " has connected to the session.</div>";
	}
}

class EventPlayerDisconnect extends SharedEvent {
	constructor(myPlayer) {
		super("PlayerDisconnect");
		this.player = myPlayer;
	}

	toHTML() {
		return "<div class='gmInfo'>" + this.player + " has disconnected from the session.</div>";
	}
}

class EventPlayerBusy extends SharedEvent {
	constructor(myPlayer, parentId) {
		super("PlayerBusy");
		this.player = myPlayer;
		this.parent = parentId;
	}

	toHTML() {
		return "<div class='gmExtra subordinate'>" + this.player + " is busy.</div>";
	}
}

// ACTIVE EVENTS
class EventRoll extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("Roll", rollData);
		this.id = "PlayerContest_" + Date.now();
		this.player = myPlayer;
	}

	toHTML() {
		var rollType;
		var keyName = getQuality(this.key).name;

		if (this.lucky) {
			rollType = " makes a <span class='luckyRoll'>lucky</span> " + keyName + " roll";
		} else if (this.unlucky) {
			rollType = " makes an <span class='unluckyRoll'>unlucky</span> " + keyName+ " roll";
		} else  {
			rollType = " rolls " + keyName;
		}

		return "<div id='" + this.id + "' countMe>" +
				"<div>" +
					"<p>" + this.player + rollType + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventRollSubordinate extends SharedEvent {
	constructor(myName, myType, myMod, myResult, myComment, parentId) {
		super("RollSubordinate");
		this.name = myName;
		this.rollType = myType;
		this.modifier = myMod;
		this.result = myResult;
		this.comment = nameEncode(myComment);
		this.parent = parentId;
	}

	toHTML() {
		return "<div class='gmExtra subordinate'>" +
				"<div>" +
					"<p>" + this.name + " rolls " + ((this.rollType) ? this.rollType + " " : "") + "(" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventRollSubordinateResolution extends SharedEvent {
	constructor(pass, myComment, parentId) {
		super("RollSubordinateResolution");
		this.success = pass;
		this.comment = nameEncode(myComment);
		this.parent = parentId;
	}

	toHTML() {
		return "<div class='playersubordinate'>" +
					"<span>The roll " + ((this.success) ? "succeeds" : "fails") + "!</span>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
					"</div>";
	}
}


// NPC makes a general purpose roll with no further action required by players or the GM.
class EventNPCRoll extends SharedEvent {
	constructor(myName, myMod, myResult, myComment) {
		super("NPCRoll");
		this.name = myName;
		this.modifier = myMod;
		this.result = myResult;
		this.comment = nameEncode(myComment);
	}

	toHTML() {
		return "<div class='gmInfo' countMe>" +
			"<div>" +
				"<p>" + this.name + " rolls (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
				((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
			"</div>" +
			"<div class='rollResult'>" +
				"Result: " + this.result +
			"</div>" +
		"</div>";
	}
}

// NPC makes non-combat roll that requires player response.
class EventContestedRoll extends SharedEvent {
	constructor(myName, myTarget, targetQuality, myMod, myResult, myComment) {
		super("RollContested");
		this.id = "Contest_" + Date.now();
		this.name = myName;
		this.player = myTarget;
		this.key = targetQuality;
		this.modifier = myMod;
		this.result = myResult;
		this.comment = nameEncode(myComment);
	}

	toHTML() {
		return "<div class='gmInfo' id='" + this.id + "' data-against='" + this.key + "' countMe>" +
				"<div>" +
					"<p>" + this.name + " rolls (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") vs. " + this.player + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventContestedResponse extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("RollContestedSubordinate", rollData);
		this.player = myPlayer;
		if (rollData) {
			this.npc = rollData.npc;
		}
	}

	toHTML() {
		var rollType;
		var keyName = getQuality(this.key).name;

		if (this.lucky) {
			rollType = " makes a <span class='luckyRoll'>lucky</span> " + keyName + " roll";
		} else if (this.unlucky) {
			rollType = " makes an <span class='unluckyRoll'>unlucky</span> " + keyName+ " roll";
		} else  {
			rollType = " rolls " + keyName;
		}

		return "<div class='playersubordinate' countMe>" +
				"<div>" +
					"<p>" + this.player + rollType + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") vs " + this.npc + ":" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

// Players make a generic roll against each other.
class EventPlayerContestedRoll extends SharedEvent {
	constructor(myPlayer1, myKey1, myPlayer2, myKey2, myComment) {
		super("RollPlayerContested");
		this.id = "PlayerContest_" + Date.now();
		this.player1 = myPlayer1;
		this.key1 = myKey1;
		this.player2 = myPlayer2;
		this.key2 = myKey2;
		this.comment = myComment;
	}

	toHTML() {
		return "<div id='" + this.id + "' countMe><span>" + this.player1 + " rolls " + this.key1 + " against " + this.player2 + "'s " + this.key2 + "!</span></div>";
	}
}

class EventPlayerContestedRollSubordinate extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("RollPlayerContestedSubordinate", rollData);
		this.player = myPlayer;
	}

	toHTML() {
		var rollType;
		var keyName = getQuality(this.key).name;

		if (this.lucky) {
			rollType = " makes a <span class='luckyRoll'>lucky</span> " + keyName + " roll";
		} else if (this.unlucky) {
			rollType = " makes an <span class='unluckyRoll'>unlucky</span> " + keyName+ " roll";
		} else  {
			rollType = " rolls " + keyName;
		}
		
		return "<div class='playersubordinate' countMe>" +
				"<div>" +
					"<p>" + this.player + rollType + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

// COMBAT
class EventNPCAttack extends SharedEvent {
	constructor(myName, myTarget, myMod, myResult, myComment) {
		super("NPCAttack");
		this.id = "NPCAttack_" + Date.now();
		this.name = myName;
		this.player = myTarget;
		this.modifier = myMod;
		this.result = myResult;
		this.comment = nameEncode(myComment);
	}

	toHTML() {
		return "<div class='gmInfo' id='" + this.id + "' attacker='" + this.name + "' target='" + this.player + "' countMe>" +
				"<div>" +
					"<p>" + this.name + " attacks (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + this.player + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventNPCAttackResolution extends SharedEvent {
	constructor(myName, myTarget, isHit, myType, myMod, myResult, myComment, parentId) {
		super("NPCAttackResolution");
		this.name = myName;
		this.player = myTarget;
		this.success = isHit;

		if (isHit) {
			this.attackType = myType;
			this.modifier = myMod;
			this.result = myResult;
		}

		this.comment = nameEncode(myComment);
		this.parent = parentId;
	}

	toHTML() {
		if (this.success) {
			return "<div class='gmExtra subordinate'>" +
				"<div>" +
					"<p>" + this.name + " hits " + this.player + "! (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ")</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
		} else {
			return "<div class='subordinate'><i>The attack missed!" + ((this.comment) ? " <span class='rollComment'>" + this.comment + "</span>" : "") + "</i></div>"
		}
	}
}

class EventNPCDefense extends SharedEvent {
	constructor(myPlayer, myDefender, myMod, myResult, parentId) {
		super("NPCDefense");
		this.player = myPlayer;
		this.defender = myDefender;
		this.modifier = myMod;
		this.result = myResult;
		this.parent = parentId;
	}

	toHTML() {
		return "<div class='gmExtra subordinate'>" +
				"<div>" +
					"<p>" + this.defender + " defends (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") vs. " + this.player + "'s attack!" + "</p>" +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventNPCToughnessRoll extends SharedEvent {
	constructor(myName, myMod, myResult, type, resisted, weakTo, parentId) {
		super("NPCToughness");
		this.name = myName;
		this.modifier = myMod;
		this.result = myResult;
		this.attackType = type;
		this.resist = resisted;
		this.weak = weakTo;
		this.parent = parentId;
	}

	toHTML() {
		var action = " attempts to withstand ";

			if (this.weak) {
				action = " is <span class='damageWeakness'>WEAK</span> to ";
			} else if (this.resist) {
				action = " <span class='damageResist'>RESISTS</span> "
			}
			
			return "<div class='gmExtra subordinate'>" +
				"<div>" +
					"<p>" + this.name + action + SPECIAL_ATTACK_TYPES[this.attackType] + " damage (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ")" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventPlayerAttack extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("PlayerAttack", rollData);
		this.id = "Attack_" + Date.now();
		this.player = myPlayer;
		if (rollData) {
			this.target = rollData.target;
		}
	}

	toHTML() {
		var rollType;

		if (this.lucky) {
			rollType = " with a <span class='luckyRoll'>lucky</span> roll";
		} else if (this.unlucky) {
			rollType = " with an <span class='unluckyRoll'>unlucky</span> roll";
		} else  {
			rollType = "";
		}

		return "<div id='" + this.id + "' attacker='" + this.player + "' target='" + this.target + "' data-key='" + this.key + "' countMe>" +
				"<div>" +
					"<p>" + this.player + " attacks (" + getQuality(this.key).name + ", " + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + this.target + rollType + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventPlayerAttackResolution extends SharedEvent {
	constructor(myPlayer, myTarget, isHit, myType, myKey, myComment, parentId) {
		super("PlayerAttackResolution");
		this.player = myPlayer;
		this.target = myTarget;
		this.success = isHit;

		if (isHit) {
			this.attackType = myType;
			this.key = myKey;
		}

		this.comment = nameEncode(myComment);
		this.parent = parentId;
	}

	toHTML() {
		// No output on a success.
		if (!this.success) {
			return "<div class='subordinate'><i>The attack missed!" + ((this.comment) ? " <span class='rollComment'>" + this.comment + "</span>" : "") + "</i></div>"
		} else {
			return "";
		}
	}
}

class EventPlayerDamageRoll extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("PlayerDamage", rollData);
		this.player = myPlayer;
		if (rollData) {
			this.target = rollData.npc;
		}
	}

	toHTML() {
		var rollType;

		if (this.lucky) {
			rollType = " makes a <span class='luckyRoll'>lucky</span> roll";
		} else if (this.unlucky) {
			rollType = " makes an <span class='unluckyRoll'>unlucky</span> roll";
		} else  {
			rollType = " rolls";
		}

		return "<div class='playersubordinate'>" +
				"<div>" +
					"<p>" + this.player + rollType + " for damage (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ")" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventPlayerDefense extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("PlayerDefense", rollData);
		if (rollData) {
			this.attacker = rollData.npc;
		}

		this.player = myPlayer;
	}

	toHTML() {
		var rollType;

		if (this.lucky) {
			rollType = " with a <span class='luckyRoll'>lucky</span> roll";
		} else if (this.unlucky) {
			rollType = " with an <span class='unluckyRoll'>unlucky</span> roll";
		} else  {
			rollType = "";
		}

		return "<div class='playersubordinate' data-parent='" + this.parent + "' countMe>" +
				"<div>" +
					"<p>" + this.player + " defends (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") vs. " + this.attacker + "'s attack" + rollType + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventPlayerToughnessRoll extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("PlayerToughness", rollData);
		this.player = myPlayer;

		if (rollData) {
			this.armor = rollData.armor;
			this.armorMod = rollData.armorMod;
			this.result += this.armorMod;
		}
	}

	toHTML() {
		var action = " attempts to withstand ";
		var rollType;

		if (this.lucky) {
			rollType = " with a <span class='luckyRoll'>lucky</span> roll!";
		} else if (this.unlucky) {
			rollType = " with an <span class='unluckyRoll'>unlucky</span> roll!";
		} else  {
			rollType = "";
		}

		if (this.weak) {
			action = " is <span class='damageWeakness'>WEAK</span> to ";
		} else if (this.resist) {
			action = " <span class='damageResist'>RESISTS</span> "
		}
		
		return "<div class='playersubordinate' data-parent='" + this.parent + "'>" +
				"<div>" +
					"<p>" + this.player + action + SPECIAL_ATTACK_TYPES[this.attackType] + " damage (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + " + " + this.armorMod + " armor)" + rollType + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					"Result: " + this.result +
				"</div>" +
			"</div>";
	}
}

// CONTROLLED BY GM
class EventInjuryPlayer extends SharedEvent {
	constructor(myPlayer, myStatus) {
		super("InjuryPlayer");
		this.player = myPlayer;
		this.status = myStatus;
	}

	toHTML() {
		return "<div><span>" + this.player + " is now " + INJURY_LEVEL_DISPLAY[this.status] + ((this.status < INJURY_LEVEL_DISPLAY.length - 2) ? "." : "") + "</span></div>";
	}
}

class EventNPCStatus extends SharedEvent {
	constructor(myName, myStatus, myOld) {
		super("NPCStatus");
		this.name = myName;
		this.status = myStatus;
		this.oldStatus = myOld;
	}

	toHTML() {
		if (this.oldStatus == INJURY_LEVEL_DISPLAY.length - 1) {
			if (this.status > 0) {
				return "<div><span>" + this.name + " appears!  It is " + INJURY_LEVEL_DISPLAY[this.status] + ((this.status < INJURY_LEVEL_DISPLAY.length - 2) ? "." : "") + "</span></div>";
			} else {
				return "<div><span>" + this.name + " appears!</span></div>";
			}
		} else if (this.status == INJURY_LEVEL_DISPLAY.length - 1) {
			return "<div><span>" + this.name + " disappears!</span></div>";
		} else {
			return "<div><span>" + this.name + " is now " + INJURY_LEVEL_DISPLAY[this.status] + ((this.status < INJURY_LEVEL_DISPLAY.length - 2) ? "." : "") + "</span></div>";
		}
	}
}

// PLAYER STATUS EVENTS
class EventPlayerArmor extends SharedEvent {
	constructor(myName, armorIndex) {
		super("PlayerArmor");
		this.name = myName;
		this.armor = armorIndex;
	}

	toHTML() {
		return "<div class='gmInfo'>" + this.name + " has equipped " + getQuality(WORN_ARMOR[this.armor]).name + ".</div>";
	}
}