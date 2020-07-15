
function initializePage() {
	var i;
	var attackSelectors = $("select[name='npcAttackType']");
	var resistSelectors = $("select[name='npcResist'], select[name='npcWeakness']");

	initializeDB();

	for (i = 0; i < SPECIAL_ATTACK_TYPES.length; i++) {
		if (i > 0) { 
			attackSelectors.append("<option>" + SPECIAL_ATTACK_TYPES[i] + "</option>");
		}

		resistSelectors.append("<option>" + SPECIAL_ATTACK_TYPES[i] + "</option>");
	}
}

initializePage();