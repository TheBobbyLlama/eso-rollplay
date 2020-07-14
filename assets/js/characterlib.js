const SEX_MALE = 0;
const SEX_FEMALE = 1;

class QualityTemplate {
	constructor(myName) {
		this.name = myName;
		this.key = myName.replace(/[() ]/g, "");
	}
}

class Attribute extends QualityTemplate {
	constructor(myName) {
		super(myName);
		this.max = 20;
	}
}

class Skill extends QualityTemplate {
	constructor(myName, myAttr) {
		super(myName);
		this.governing = myAttr;
		this.max = 10;
	}
}

class Race {
	// TODO!
}

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

const skillWeapon = [
	new Skill("Two Handed", "Strength"),
	new Skill("One Hand and Shield", "Strength"),
	new Skill("Dual Wield", "Agility"),
	new Skill("Bow", "Agility")
];

const skillArmor = [
	new Skill("Light Armor", "Speed"),
	new Skill("Medium Armor", "Agility"),
	new Skill("Heavy Armor", "Endurance")
];

const skillMagic = [
	new Skill("Alteration", "Willpower"),
	new Skill("Conjuration", "Intelligence"),
	new Skill("Destruction", "Willpower"),
	new Skill("Illusion", "Personality"),
	new Skill("Mysticism", "Intelligence"),
	new Skill("Restoration", "Willpower")
];