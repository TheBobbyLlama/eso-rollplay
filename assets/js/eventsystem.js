/// When events come out of the DB, they are plain objects.  This function typecasts them back to the proper class.
function forceEventType(event) {
	switch (event.eventType) {
		case "AddNPC":
			return Object.setPrototypeOf(event, EventAddNPC.prototype);
		case "AddPlayer":
			return Object.setPrototypeOf(event, EventAddPlayer.prototype);
		case "CancelQueuedRoll":
			return Object.setPrototypeOf(event, EventCancelQueuedRoll.prototype);
		case "CancelQueuedRollSuccess":
			return Object.setPrototypeOf(event, EventCancelQueuedRollSuccess.prototype);
		case "Close":
			return Object.setPrototypeOf(event, EventClose.prototype);
		case "End":
			return Object.setPrototypeOf(event, EventEnd.prototype);
		case "GMAllow":
			return Object.setPrototypeOf(event, EventGMResponseAllow.prototype);
		case "GMDeny":
			return Object.setPrototypeOf(event, EventGMResponseDeny.prototype);
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
		case "PlayerWeapon":
			return Object.setPrototypeOf(event, EventPlayerWeapon.prototype);
		case "PlayerAttack":
			return Object.setPrototypeOf(event, EventPlayerAttack.prototype);
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
		case "PlayerRequestSummon":
			return Object.setPrototypeOf(event, EventPlayerRequestSummon.prototype);
		case "PlayerRequestTransform":
			return Object.setPrototypeOf(event, EventPlayerRequestTransform.prototype);
		case "PlayerSummonAttack":
			return Object.setPrototypeOf(event, EventPlayerSummonAttack.prototype);
		case "PlayerSummonDismiss":
			return Object.setPrototypeOf(event, EventPlayerSummonDismiss.prototype);
		case "PlayerSummonResolution":
			return Object.setPrototypeOf(event, EventPlayerSummonResolution.prototype);
		case "PlayerToughness":
			return Object.setPrototypeOf(event, EventPlayerToughnessRoll.prototype);
		case "PlayerTransform":
			return Object.setPrototypeOf(event, EventPlayerTransform.prototype);
		case "PromptRoll":
			return Object.setPrototypeOf(event, EventPromptRoll.prototype);
		case "RemoveNPC":
			return Object.setPrototypeOf(event, EventRemoveNPC.prototype);
		case "RemovePlayer":
			return Object.setPrototypeOf(event, EventRemovePlayer.prototype);
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
		case "RollQueued":
			return Object.setPrototypeOf(event, EventRollQueued.prototype);
		case "RollSubordinate":
			return Object.setPrototypeOf(event, EventRollSubordinate.prototype);
		case "Start":
			return Object.setPrototypeOf(event, EventStart.prototype);
		default:
			return new EventError(event.eventType);
	}
}

/// Helper function to put summon information on an event if needed.
function setSummonEventData(event) {
	if ((event.player.indexOf("»") > -1) && (currentSession) && (currentSession.statuses)) {
		var parts = event.player.split("»");
		var curStatus = currentSession.statuses.find(element => element.name == nameDecode(parts[0]));

		if ((curStatus) && (curStatus.summon)) {
			event.summonTemplate = curStatus.summon.template;
			event.summonName = curStatus.summon.name;
		}
	}
}

/// Helper function for dual use player/pet events, to display the name properly.
function displayEventName(event) {
	if (event.player.indexOf("»") > -1) {
		var parts = event.player.split("»");
		var myPlayer = nameDecode(parts[0]);
		var result;

		if (event.summonName) {
			result = localize("DISPLAY_PET_NAME").replace(/NAME/, event.summonName);
		} else {
			result = localize("DISPLAY_PET");
		}

		return result.replace(/PLAYER/, myPlayer).replace(/TEMPLATE/, localize(event.summonTemplate));
	} else {
		return event.player;
	}
}

/// Base class for all other events.
class SharedEvent {
	constructor(myType) {
		this.eventType = myType;
		this.timeStamp = Date.now();
	}

	toHTML() {
		return "<div class='error'>" + localize("EVENT_ERROR_NO_OUTPUT").replace(/TYPE/, this.eventType) + "</div>";
	}
}

class EventError extends SharedEvent {
	constructor(myType) {
		super("Error");
		this.passedType = myType;
	}

	toHTML() {
		return "<div class='error'>" + localize("EVENT_ERROR_UNRECOGNIZED").replace(/TYPE/, this.eventType) + "</div>";
	}
}

/// Base class for any event that handles a die roll.
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

/// Events that are only for the GM - Rollplay screen will ignore them.
const GM_EVENTS = [
	"AddNPC",
	"CancelQueuedRoll",
	"CancelQueuedRollSuccess",
	"NPCDefense",
	"NPCRoll",
	"NPCToughness",
	"PlayerDisconnect",
	"RollQueued",
	"RollSubordinate"
];

/// Events involving multiple players - Will sometimes have to display extra player information.
const MULTI_PLAYER_EVENTS = [
	"PlayerContest"
];

// ADMINISTRATIVE EVENTS
class EventStart extends SharedEvent {
	constructor(ownMe) {
		super("Start");
		this.owner = ownMe;
	}

	toHTML() {
		return "<div>" + localize("EVENT_START").replace(/PLAYER/, this.owner).replace(/TIMESTAMP/, new Date(this.timeStamp).toLocaleString("en-US")) + "</div>"
	}
}

class EventEnd extends SharedEvent {
	constructor(ownMe) {
		super("End");
		this.owner = ownMe;
	}

	toHTML() {
		return "<div><p>" + localize("EVENT_END").replace(/PLAYER/, this.owner).replace(/TIMESTAMP/, new Date(this.timeStamp).toLocaleString("en-US")) + "</p><p>" + localize("EVENT_END_THANKS") + "</p></div>";
	}
}

class EventClose extends SharedEvent {
	constructor(ownMe) {
		super("Close");
		this.owner = ownMe;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_CLOSE").replace(/PLAYER/, this.owner) + "</div>";
	}
}

class EventGMPost extends SharedEvent {
	constructor(text) {
		super("GMPost");
		this.post = nameEncode(text);
	}

	toHTML() {
		return "<div class='gmComment'><h3>" + localize("LABEL_GM_POST") + "</h3><em>" + this.post.replace(/\n/g, "<br />") + "</em></div>"
	}
}

class EventAddNPC extends SharedEvent {
	constructor(myName) {
		super("AddNPC");
		this.name = myName;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_ADD_NPC").replace(/NAME/, this.name) + "</div>";
	}
}

class EventRemoveNPC extends SharedEvent {
	constructor(myName) {
		super("RemoveNPC");
		this.name = myName;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_REMOVE_NPC").replace(/NAME/, this.name) + "</div>";
	}
}

class EventAddPlayer extends SharedEvent {
	constructor(myPlayer, myIndex) {
		super("AddPlayer");
		this.player = myPlayer;
		this.index = myIndex
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_ADD_PLAYER").replace(/PLAYER/, this.player) + "</div>";
	}
}

class EventRemovePlayer extends SharedEvent {
	constructor(myPlayer) {
		super("RemovePlayer");
		this.player = myPlayer;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_REMOVE_PLAYER").replace(/PLAYER/, this.player) + "</div>";
	}
}

class EventPlayerConnect extends SharedEvent {
	constructor(myPlayer) {
		super("PlayerConnect");
		this.player = myPlayer;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_PLAYER_CONNECT").replace(/PLAYER/, this.player).replace(/TIMESTAMP/, new Date(this.timeStamp).toLocaleString("en-US")) + "</div>";
	}
}

class EventPlayerDisconnect extends SharedEvent {
	constructor(myPlayer) {
		super("PlayerDisconnect");
		this.player = myPlayer;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_PLAYER_DISCONNECT").replace(/PLAYER/, this.player).replace(/TIMESTAMP/, new Date(this.timeStamp).toLocaleString("en-US")) + "</div>";
	}
}

class EventRollQueued extends SharedEvent {
	constructor(myPlayer, parentId) {
		super("RollQueued");
		this.player = myPlayer;
		this.parent = parentId;
	}

	toHTML() {
		return "<div class='gmExtra subordinate' data-player='" + this.player + "'>" + localize(MULTI_PLAYER_EVENTS.find(item => this.parent.startsWith(item)) ? "EVENT_ROLL_QUEUED_PLAYER" : "EVENT_ROLL_QUEUED").replace(/PLAYER/, this.player) + "</div>";
	}
}

class EventCancelQueuedRoll extends SharedEvent {
	constructor(myPlayer, rollId) {
		super("CancelQueuedRoll");
		this.player = myPlayer;
		this.roll = rollId;
	}

	toHTML() {
		return "";
	}
}

class EventCancelQueuedRollSuccess extends SharedEvent {
	constructor(myPlayer, rollId) {
		super("CancelQueuedRollSuccess");
		this.player = myPlayer;
		this.parent = rollId;
	}

	toHTML() {
		return "<div class='gmExtra subordinate'>" + localize(MULTI_PLAYER_EVENTS.find(item => this.parent.startsWith(item)) ? "EVENT_CANCEL_QUEUED_ROLL_SUCCESS_PLAYER" : "EVENT_CANCEL_QUEUED_ROLL_SUCCESS").replace(/PLAYER/, this.player) + "</div>";
	}
}

class EventGMResponseAllow extends SharedEvent {
	constructor(myPlayer, myRequest, parentId, myComment) {
		super("GMAllow");
		this.player = myPlayer;
		this.request = myRequest;
		this.parent = parentId;
		this.comment = myComment;
	}

	toHTML() {
		return "<div class='playersubordinate'><p>" + localize("EVENT_GM_ALLOW").replace(/ACTION/, this.request) + "</p>" +
		((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
		"</div>";
	}
}

class EventGMResponseDeny extends SharedEvent {
	constructor(myPlayer, myRequest, parentId, myComment) {
		super("GMDeny");
		this.player = myPlayer;
		this.request = myRequest;
		this.parent = parentId;
		this.comment = myComment;
	}

	toHTML() {
		return "<div class='playersubordinate'><p>" + localize("EVENT_GM_DENY").replace(/ACTION/, this.request) + "</p>" +
		((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
		"</div>";
	}
}

// ACTIVE EVENTS
class EventPromptRoll extends SharedEvent {
	constructor(myPlayer, rollKey, myComment) {
		super("PromptRoll");
		this.id = "PromptRoll_" + Date.now();
		this.player = myPlayer;
		this.key = rollKey;
		this.comment = myComment;
	}

	toHTML() {
		return "<div id='" + this.id + "' class='gmInfo'><p>" + localize("EVENT_PROMPT_ROLL").replace(/PLAYER/, this.player).replace(/ROLLTYPE/, localize(getQuality(this.key).name)) + "</p>" +
		((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
		"</div>";
	}
}
class EventRoll extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("Roll", rollData);
		this.id = "PlayerContest_" + Date.now();
		this.player = myPlayer;

		if (rollData) {
			if (rollData.parent) {
				this.parent = rollData.parent;
			}
		}
	}

	toHTML() {
		var rollType;
		var keyName = getQuality(this.key).name;

		if (this.lucky) {
			rollType = localize("ROLL_TEXT_LUCKY").replace(/LUCKY/, "<span class='luckyRoll'>" + localize("LUCKY") + "</span>");
		} else if (this.unlucky) {
			rollType = localize("ROLL_TEXT_UNLUCKY").replace(/UNLUCKY/, "<span class='unluckyRoll'>" + localize("UNLUCKY") + "</span>");
		} else  {
			rollType = localize("ROLL_TEXT");
		}

		return "<div id='" + this.id + "' countMe>" +
				"<div>" +
					"<p>" + rollType.replace(/PARTICIPANT/, this.player).replace(/ROLLTYPE/, localize(keyName)) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
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
					"<p>" + localize("ROLL_TEXT").replace(/PARTICIPANT/, this.name).replace(/ROLLTYPE/, this.rollType && localize(getQuality(this.rollType).name)) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
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
					"<span>" + localize((this.success) ? "EVENT_ROLL_RESOLUTION_SUCCESS" : "EVENT_ROLL_RESOLUTION_FAILURE") + "</span>" +
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
				"<p>" + localize("ROLL_TEXT").replace(/PARTICIPANT/, this.name).replace(/ROLLTYPE/, "") + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
				((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
			"</div>" +
			"<div class='rollResult'>" +
				localize("LABEL_ROLL_RESULT") + " " + this.result +
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
					"<p>" + localize("ROLL_TEXT").replace(/PARTICIPANT/, this.name).replace(/ROLLTYPE/, "") + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + localize("ROLL_VS").replace(/PARTICIPANT/, this.player) + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
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
			rollType = localize("ROLL_TEXT_LUCKY").replace(/LUCKY/, "<span class='luckyRoll'>" + localize("LUCKY") + "</span>");
		} else if (this.unlucky) {
			rollType = localize("ROLL_TEXT_UNLUCKY").replace(/UNLUCKY/, "<span class='unluckyRoll'>" + localize("UNLUCKY") + "</span>");
		} else  {
			rollType = localize("ROLL_TEXT");
		}

		return "<div class='playersubordinate' countMe>" +
				"<div>" +
					"<p>" + localize("ROLL_TEXT").replace(/PARTICIPANT/, this.player).replace(/ROLLTYPE/, localize(keyName)) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") vs " + this.npc + ":" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
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
		var rollType1 = localize(getQuality(this.key1).name);
		var rollType2 = localize(getQuality(this.key2).name);

		return "<div id='" + this.id + "' countMe><span>" + localize("EVENT_ROLL_PLAYER_CONTESTED").replace(/PLAYER1/, this.player1).replace(/ROLLTYPE1/, localize(rollType1)).replace(/PLAYER2/, this.player2).replace(/ROLLTYPE2/, localize(rollType2)) + "</span></div>";
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
			rollType = localize("ROLL_TEXT_LUCKY").replace(/LUCKY/, "<span class='luckyRoll'>" + localize("LUCKY") + "</span>");
		} else if (this.unlucky) {
			rollType = localize("ROLL_TEXT_UNLUCKY").replace(/UNLUCKY/, "<span class='unluckyRoll'>" + localize("UNLUCKY") + "</span>");
		} else  {
			rollType = localize("ROLL_TEXT");
		}
		
		return "<div class='playersubordinate' countMe>" +
				"<div>" +
					"<p>" + localize("ROLL_TEXT").replace(/PARTICIPANT/, this.player).replace(/ROLLTYPE/, localize(keyName)) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + "):" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
	}
}

// COMBAT
// Multipurpose - supports player or pet targets!
class EventNPCAttack extends SharedEvent {
	constructor(myName, myTarget, myMod, myResult, myComment) {
		super("NPCAttack");
		this.id = "NPCAttack_" + Date.now();
		this.name = myName;
		this.player = myTarget;
		this.modifier = myMod;
		this.result = myResult;
		this.comment = nameEncode(myComment);

		setSummonEventData(this);
	}

	toHTML() {
		return "<div class='gmInfo' id='" + this.id + "' attacker='" + this.name + "' target='" + this.player + "' countMe>" +
				"<div>" +
					"<p>" + localize("EVENT_ATTACK").replace(/ATTACKER/, this.name) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + displayEventName(this).replace(/,$/, "") + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
	}
}

// Multipurpose - supports player or pet targets!
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

		setSummonEventData(this);
	}

	toHTML() {
		if (this.success) {
			return "<div class='gmExtra subordinate'>" +
				"<div>" +
					"<p>" + localize("EVENT_ATTACK_RESOLUTION_HIT").replace(/ATTACKER/, this.name).replace(/DEFENDER/, displayEventName(this)).replace(/,$/, "") + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ")</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
		} else {
			return "<div class='subordinate'><i>" + localize("EVENT_ATTACK_RESOLUTION_MISS") + ((this.comment) ? " <span class='rollComment'>" + this.comment + "</span>" : "") + "</i></div>"
		}
	}
}

// Multipurpose - supports player or pet attackers!
class EventNPCDefense extends SharedEvent {
	constructor(myPlayer, myDefender, myMod, myResult, parentId) {
		super("NPCDefense");
		this.player = myPlayer;
		this.defender = myDefender;
		this.modifier = myMod;
		this.result = myResult;
		this.parent = parentId;

		setSummonEventData(this);
	}

	toHTML() {
		return "<div class='gmExtra subordinate'>" +
				"<div>" +
					"<p>" + localize("EVENT_ATTACK_DEFEND").replace(/DEFENDER/, this.defender) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + localize("EVENT_ATTACK_DEFEND_VS").replace(/ATTACKER/, displayEventName(this).replace(/,$/, "")) + "</p>" +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
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
		var action;

		if (this.weak) {
			action = localize("EVENT_COMBAT_TOUGHNESS_WEAK").replace(/WEAK/, "<span class='damageWeakness'>" + localize("WEAK") + "</span>");
		} else if (this.resist) {
			action = localize("EVENT_COMBAT_TOUGHNESS_RESIST").replace(/RESISTS/, "<span class='damageResist'>" + localize("RESISTS") + "</span>");
		} else {
			action = localize("EVENT_COMBAT_TOUGHNESS");
		}
		
		return "<div class='gmExtra subordinate'>" +
			"<div>" +
				"<p>" + action.replace(/DEFENDER/, this.name).replace(/DAMAGETYPE/, localize(SPECIAL_ATTACK_TYPES[this.attackType]).toLowerCase()) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ")" + "</p>" +
				((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
			"</div>" +
			"<div class='rollResult'>" +
				localize("LABEL_ROLL_RESULT") + " " + this.result +
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
			rollType = " " + localize("PLAYER_ROLL_LUCKY").replace(/LUCKY/, "<span class='luckyRoll'>" + localize("LUCKY") + "</span>");
		} else if (this.unlucky) {
			rollType = " " + localize("PLAYER_ROLL_UNLUCKY").replace(/UNLUCKY/, "<span class='unluckyRoll'>" + localize("UNLUCKY") + "</span>");
		} else  {
			rollType = "";
		}

		return "<div id='" + this.id + "' attacker='" + this.player + "' target='" + this.target + "' data-key='" + this.key + "' countMe>" +
				"<div>" +
					"<p>" + localize("EVENT_ATTACK").replace(/ATTACKER/, this.player) + " (" + localize(getQuality(this.key).name) + ", " + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + this.target + rollType + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
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
			return "<div class='subordinate'><i>" + localize("EVENT_ATTACK_RESOLUTION_MISS") + ((this.comment) ? " <span class='rollComment'>" + this.comment + "</span>" : "") + "</i></div>"
		} else {
			return "";
		}
	}
}

// Multipurpose - supports players or pets!
class EventPlayerDamageRoll extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("PlayerDamage", rollData);
		this.player = myPlayer;
		if (rollData) {
			this.target = rollData.npc;

			if (rollData.shieldPenalty) {
				this.shieldPenalty = rollData.shieldMod;
				this.result += this.shieldPenalty;
			}
		}

		setSummonEventData(this);
	}

	toHTML() {
		var rollType;
		var shieldString;

		if (this.lucky) {
			rollType = localize("ROLL_DAMAGE_TEXT_LUCKY").replace(/LUCKY/, "<span class='luckyRoll'>" + localize("LUCKY") + "</span>");
		} else if (this.unlucky) {
			rollType = localize("ROLL_DAMAGE_TEXT_UNLUCKY").replace(/UNLUCKY/, "<span class='unluckyRoll'>" + localize("UNLUCKY") + "</span>");
		} else  {
			rollType = localize("ROLL_DAMAGE_TEXT");
		}

		if (this.shieldPenalty) {
			shieldString = " - " + Math.abs(this.shieldPenalty) + " " + localize("SHIELD_BONUS_PENALTY");
		} else {
			shieldString = "";
		}

		return "<div class='playersubordinate'>" +
				"<div>" +
					"<p>" +  rollType.replace(/ATTACKER/, displayEventName(this)) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + shieldString + ")" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
	}
}

// Multipurpose - supports players or pets!
class EventPlayerDefense extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("PlayerDefense", rollData);
		if (rollData) {
			this.attacker = rollData.npc;

			if (rollData.useBlock) {
				this.blockMod = rollData.blockMod;
				this.result += this.blockMod;
			}
		}

		this.player = myPlayer;
		setSummonEventData(this);
	}

	toHTML() {
		var blockString;
		var rollType;

		if (this.lucky) {
			rollType = " " + localize("PLAYER_ROLL_LUCKY").replace(/LUCKY/, "<span class='luckyRoll'>" + localize("LUCKY") + "</span>");
		} else if (this.unlucky) {
			rollType = " " + localize("PLAYER_ROLL_UNLUCKY").replace(/UNLUCKY/, "<span class='unluckyRoll'>" + localize("UNLUCKY") + "</span>");
		} else  {
			rollType = "";
		}

		if (this.blockMod) {
			blockString = " + " + this.blockMod + " " + localize("SHIELD_BONUS_PENALTY");
		} else {
			blockString = "";
		}

		return "<div class='playersubordinate' data-parent='" + this.parent + "' countMe>" +
				"<div>" +
					"<p>" + localize("EVENT_ATTACK_DEFEND").replace(/DEFENDER/, displayEventName(this)) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + blockString + ") " + localize("EVENT_ATTACK_DEFEND_VS").replace(/ATTACKER/, this.attacker).replace(/!$/, "") + rollType + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
	}
}

// Multipurpose - supports players or pets!
class EventPlayerToughnessRoll extends SharedRollEvent {
	constructor(myPlayer, rollData) {
		super("PlayerToughness", rollData);
		this.player = myPlayer;

		if (rollData) {
			this.armor = rollData.armor;
			this.armorMod = rollData.armorMod;

			if (this.armorMod > 0) {
				this.result += this.armorMod;
			}
		}

		setSummonEventData(this);
	}

	toHTML() {
		var action;
		var rollType;

		if (this.lucky) {
			rollType = " with a <span class='luckyRoll'>lucky</span> roll!";
		} else if (this.unlucky) {
			rollType = " with an <span class='unluckyRoll'>unlucky</span> roll!";
		} else  {
			rollType = "";
		}

		if (this.weak) {
			action = localize("EVENT_COMBAT_TOUGHNESS_WEAK").replace(/WEAK/, "<span class='damageWeakness'>" + localize("WEAK") + "</span>");
		} else if (this.resist) {
			action = localize("EVENT_COMBAT_TOUGHNESS_RESIST").replace(/RESISTS/, "<span class='damageResist'>" + localize("RESISTS") + "</span>");
		} else {
			action = localize("EVENT_COMBAT_TOUGHNESS");
		}
		
		return "<div class='playersubordinate' data-parent='" + this.parent + "'>" +
				"<div>" +
					"<p>" + action.replace(/DEFENDER/, displayEventName(this)).replace(/DAMAGETYPE/, localize(SPECIAL_ATTACK_TYPES[this.attackType]).toLowerCase()) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ((this.armorMod >= 0) ? (" + " + this.armorMod + " " + localize("ARMOR_BONUS") + ")") : ")") + rollType + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
	}
}

// CONTROLLED BY GM
// Multipurpose - supports players or pets!
class EventInjuryPlayer extends SharedEvent {
	constructor(myPlayer, myStatus) {
		super("InjuryPlayer");
		this.player = myPlayer;
		this.status = myStatus;

		setSummonEventData(this);
	}

	toHTML() {
		return "<div><span>" + localize("EVENT_STATUS_PLAYER").replace(/PLAYER/, displayEventName(this)).replace(/STATUS/, localize(INJURY_LEVEL_DISPLAY[this.status])).replace(/!.$/, "!") + "</span></div>";
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
		var result;

		if (this.oldStatus == INJURY_LEVEL_DISPLAY.length - 1) {
			if (this.status > 0) {
				result= localize("EVENT_STATUS_NPC_APPEAR_INJURED").replace(/STATUS/, localize(INJURY_LEVEL_DISPLAY[this.status])).replace(/!.$/, "!");
			} else {
				result = localize("EVENT_STATUS_NPC_APPEAR");
			}
		} else if (this.status == INJURY_LEVEL_DISPLAY.length - 1) {
			result = localize("EVENT_STATUS_NPC_DISAPPEAR");
		} else {
			result= localize("EVENT_STATUS_NPC").replace(/STATUS/, localize(INJURY_LEVEL_DISPLAY[this.status])).replace(/!.$/, "!");
		}

		return "<div><span>" + result.replace(/NAME/, this.name) + "</span></div>";
	}
}

// PLAYER STATUS EVENTS
class EventPlayerWeapon extends SharedEvent {
	constructor(myName, weaponIndex) {
		super("PlayerWeapon");
		this.name = myName;
		this.weapon = weaponIndex;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_PLAYER_EQUIP").replace(/PLAYER/, this.name).replace(/ITEM/, localize(EQUIPPED_WEAPON[this.weapon].weapon)) + ".</div>";
	}
}

class EventPlayerArmor extends SharedEvent {
	constructor(myName, armorIndex) {
		super("PlayerArmor");
		this.name = myName;
		this.armor = armorIndex;
	}

	toHTML() {
		return "<div class='gmInfo'>" + localize("EVENT_PLAYER_EQUIP").replace(/PLAYER/, this.name).replace(/ITEM/, localize(getQuality(WORN_ARMOR[this.armor]).name)) + ".</div>";
	}
}

class EventPlayerRequestSummon extends SharedRollEvent {
	constructor(myName, rollData) {
		super("PlayerRequestSummon", rollData);
		this.player = myName;
		this.id = "RequestSummon_" + Date.now();

		if (rollData) {
			this.template = rollData.summonTemplate;
			this.petName = nameEncode(rollData.summonName);
		}
	}

	toHTML() {
		var rollType;
		var nameString = "";
		var keyName = getQuality(this.key).name;

		if (this.lucky) {
			rollType = localize("ROLL_TEXT_LUCKY").replace(/LUCKY/, "<span class='luckyRoll'>" + localize("LUCKY") + "</span>");
		} else if (this.unlucky) {
			rollType = localize("ROLL_TEXT_UNLUCKY").replace(/UNLUCKY/, "<span class='unluckyRoll'>" + localize("UNLUCKY") + "</span>");
		} else  {
			rollType = localize("ROLL_TEXT");
		}

		if (this.petName) {
			nameString = " " + localize("EVENT_SUMMON_ROLL_NAME").replace(/NAME/, this.petName);
		}

		return "<div id='" + this.id + "' data-player='" + this.player + "' data-template='" + this.template + "' data-pet-name='" + this.petName + "' countMe>" +
				"<div>" +
					"<p>" + rollType.replace(/PARTICIPANT/, this.player).replace(/ROLLTYPE/, localize(keyName)) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + localize("EVENT_SUMMON_ROLL").replace(/TEMPLATE/, localize(this.template)) + nameString + ":" + "</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventPlayerSummonResolution extends SharedEvent {
	constructor(myName, mySuccess, myTemplate, myPetName, myComment, myParent) {
		super("PlayerSummonResolution");
		this.player = nameEncode(myName);
		this.success = mySuccess;
		this.template = myTemplate;
		this.petName = nameEncode(myPetName);
		this.comment = nameEncode(myComment);
		this.parent = myParent;
	}

	toHTML() {
		return "<div class='playersubordinate'><p>" + localize((this.success) ? "EVENT_SUMMON_SUCCESS" : "EVENT_SUMMON_FAILURE") + "</p>" +
		((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
		"</div>";
	}
}

class EventPlayerSummonDismiss extends SharedEvent {
	constructor(myName, myTemplate, myPetName) {
		super("PlayerSummonDismiss");
		this.player = myName;
		this.template = myTemplate;
		this.petName = myPetName;
	}

	toHTML() {
		var summon;

		if (this.petName) {
			summon = localize("DISPLAY_PET_NAME").replace(/NAME/, this.petName);
		} else {
			summon = localize("DISPLAY_PET");
		}

		return "<div><p>" + localize("EVENT_SUMMON_DISMISS").replace(/PET/, summon.replace(/PLAYER/, this.player).replace(/TEMPLATE/, localize(this.template))) + "</p></div>";
	}
}

class EventPlayerSummonAttack extends SharedRollEvent {
	constructor(myPlayer, myTemplate, myPetName, rollData) {
		super("PlayerSummonAttack", rollData);
		this.id = "SummonAttack_" + Date.now();
		this.player = myPlayer;
		this.template = myTemplate;
		this.petName = myPetName;
		if (rollData) {
			this.target = rollData.target;
		}
	}

	toHTML() {
		var summon;

		if (this.petName) {
			summon = localize("DISPLAY_PET_NAME").replace(/NAME/, this.petName);
		} else {
			summon = localize("DISPLAY_PET");
		}

		return "<div id='" + this.id + "' attacker='" + nameEncode(this.player) + "»" + this.template + "' target='" + this.target + "' data-key='" + this.key + "' countMe>" +
				"<div>" +
					"<p>" + localize("EVENT_ATTACK").replace(/ATTACKER/, summon.replace(/PLAYER/, this.player).replace(/TEMPLATE/, localize(this.template))) + " (" + ((this.modifier >= 0) ? "+" : "") + this.modifier + ") " + this.target + "!</p>" +
					((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
				"</div>" +
				"<div class='rollResult'>" +
					localize("LABEL_ROLL_RESULT") + " " + this.result +
				"</div>" +
			"</div>";
	}
}

class EventPlayerRequestTransform extends SharedEvent {
	constructor(myName, transformTarget) {
		super("PlayerRequestTransform");
		this.id = "RequestTransform_" + Date.now();
		this.name = myName;
		this.transform = transformTarget;
	}

	toHTML() {
		var request;

		if (this.transform) {
			request = localize("EVENT_TRANSFORM_REQUEST_START").replace(/FORM/, localize(this.transform));
		} else {
			request = localize("EVENT_TRANSFORM_REQUEST_END");
		}

		return "<div class='gmInfo' id='" + this.id + "' data-player='" + this.name + "' data-key='" + this.transform + "'>" + request.replace(/PLAYER/, this.name) + ".</div>";
	}
}

class EventPlayerTransform extends SharedEvent {
	constructor(myPlayer, transformTarget, parentId, myComment) {
		super("PlayerTransform");
		this.player = myPlayer;
		this.transform = transformTarget;
		this.comment = myComment;

		if (parentId) {
			this.parent = parentId;
		}
	}

	toHTML() {
		var result;

		if (this.transform) {
			result = localize("EVENT_TRANSFORMATION").replace(/FORM/, "<strong>" + localize(this.transform) + "</strong>");
		} else {
			result = localize("EVENT_TRANSFORMATION_END");
		}

		return "<div class='playersubordinate'><p>" + result.replace(/PLAYER/, this.player) + "</p>" +
		((this.comment) ? "<span class='rollComment'>" + this.comment + "</span>" : "") +
		"</div>";
	}
}