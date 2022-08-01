const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

const btnPanelBack = document.getElementById("btnPanelBack");
const btnPanelForward = document.getElementById("btnPanelForward");
const btnCopyOutput = document.getElementById("btnCopyOutput");

const outputTracker = document.getElementById("outputTracker");

const notesField = document.getElementById("notes");

const noteStorageToken = "ESORP[notes]";

var textChunks;
var curPanel;

function setCurrentPanel(newPanel) {
	if ((newPanel < 0) || (newPanel >= textChunks.length)) {
		return;
	}

	curPanel = newPanel;

	if (curPanel > 0) {
		btnPanelBack.removeAttribute("disabled");
	} else {
		btnPanelBack.setAttribute("disabled", true);
	}

	if (curPanel < textChunks.length - 1) {
		btnPanelForward.removeAttribute("disabled");
	} else {
		btnPanelForward.setAttribute("disabled", true);
	}

	outputTracker.innerHTML = (curPanel + 1) + "/" + textChunks.length;

	var tmpOutput = "";

	if (curPanel > 0) {
		tmpOutput += "+ ";
	}

	tmpOutput += textChunks[curPanel];

	if (curPanel < textChunks.length - 1) {
		tmpOutput += " +";
	}

	outputText.value = tmpOutput;
}

function processInput(e) {
	if (e.target.value) {
		var inputMe = e.target.value;
		textChunks = [];

		var start = 0;
		var end = start + 348;

		// Loop to break apart input text...
		while (end < inputMe.length - 1) {
			// Find end of last word, or if we can't, bite off the whole chunk.
			while (inputMe[end] !== " ") {
				end--;

				if (end === start) {
					end = start + 346;
					break;
				}
			}

			textChunks.push(inputMe.substring(start, end).trim());

			// Set up the next go in the loop.
			start = end;

			while ((start < inputMe.length - 1) && (inputMe[start] === " ")) {
				start++;
			}

			end = start + 346;
		}

		// Finally, grab the last piece.
		textChunks.push(inputMe.substring(start));

		setCurrentPanel(0);
		btnCopyOutput.removeAttribute("disabled");
	} else {
		btnPanelBack.setAttribute("disabled", true);
		btnPanelForward.setAttribute("disabled", true);
		btnCopyOutput.setAttribute("disabled", true);
		outputTracker.innerHTML = "0/0";
		outputText.value = "";
	}
}

inputText.addEventListener("change", processInput);

btnPanelBack.addEventListener("click", () => { setCurrentPanel(curPanel - 1); });
btnPanelForward.addEventListener("click", () => { setCurrentPanel(curPanel + 1); });
btnCopyOutput.addEventListener("click", () => { navigator.clipboard.writeText(outputText.value); });

notesField.addEventListener("change", () => { localStorage.setItem(noteStorageToken, notesField.value); });

notesField.value = localStorage.getItem(noteStorageToken);

console.log(localStorage.getItem(noteStorageToken));