const attributes = [ "Strength", "Dexterity", "Consitution", "Intelligence", "Wisdom", "Charisma" ];
const skillsWeapons = [ "Dual Wield", "Sword and Shield", "Bow", "Two Handed", "Destruction Staff", "Healing Staff", "Unarmed", "One Handed" ];
const skillsDefensive = [ "Dodge" ];
const skillsMagic = [ "Alteration", "Conjuration", "Destruction", "Illusion", "Mysticism", "Restoration", "Thaumaturgy", "Blood", "Daedric Magic", "Necromancy" ];
const skillsCrafting = [ "Alchemy", "Blacksmithing", "Tailoring", "Enchanting", "Provisioning", "Woodworking" ];
const skillsRoleplay = [ "Appraise", "Balance", "Bluff", "Concentration", "Diplomacy", "Disable Traps", "Diguise", "Escape Artist", "Forgery", "Gather Information", "Handle Animals", "First Aid", "Stealth", "Intimidate", "Perception", "Perform", "Profession", "Ride", "Search", "Sense Motive", "Sleight of Hand", "Spell Research", "Swim", "Athletics", "Acrobatics", "Use Device", "Use Rope", "Survival" ];
const skillsLanguage = [ "Akaviri", "Aldmeris", "Ayleidoon", "Bosmeris", "Daedric", "Draconic", "Dunmeris", "Dwemeris", "Ehlnofex", "Falmer", "Giantish", "Goblin", "Harpy", "Imperial", "Impish", "Jel", "Kothringi", "Lamia", "Nedic", "Nordish", "Old Bretic", "Orcish", "Sload", "Taagra", "Tamrielic", "Tsaesci", "Umbrielic", "Yokudan"];

function fillPageSliders() {
	fillSection("attributes", attributes);
	fillSection("weapons", skillsWeapons);
	fillSection("defensive", skillsDefensive);
	fillSection("magic", skillsMagic);
	fillSection("crafting", skillsCrafting);
	fillSection("roleplaying", skillsRoleplay);
	fillSection("language", skillsLanguage);
}

function fillSection(sectionName, elements) {
	var parent = document.querySelector("#" + sectionName);
	var buildElement

	for (var i = 0; i < elements.length; i++) {
		buildElement = document.createElement("h3");
		buildElement.textContent = elements[i];
		parent.appendChild(buildElement);

		buildElement = document.createElement("input");
		buildElement.setAttribute("type", "range");
		buildElement.setAttribute("min", "1");
		buildElement.setAttribute("max", "6");
		buildElement.setAttribute("value", "1");
		parent.appendChild(buildElement);
	}
}

fillPageSliders();