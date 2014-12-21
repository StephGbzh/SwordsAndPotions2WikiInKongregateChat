// ==UserScript==
// @name        Swords & Potions 2 Wiki Bot for Kongregate chat
// @namespace   *
// @description Adds a small input box under the chat to request items definition from the Swords & Potions 2 wiki
// @include     http://www.kongregate.com/games/EdgebeeStudios/swords-and-potions-2*
// @version     1.03
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @grant       GM_addStyle
// @author      Stef
// ==/UserScript==

function waitForChat() {
	canary = document.querySelectorAll("div.chat_tabpane.users_in_room.clear")
	if (canary.length > 0) {
		above = document.querySelector("div#chat_window")
		GM_log("going in")
		initInput()
		GM_addStyle("div.chat_message_window {height:458px !important}")
		
	} else {
		GM_log("wait for it")
		setTimeout(waitForChat, 1000)
	}
}

waitForChat()

function addMessage(who, msg) {
	spanUsername = document.createElement("span")
	spanUsername.setAttribute("class", "username chat_message_window_username")
	
	spanUsername.setAttribute("username", who)
	spanUsername.textContent = who
	
	spanSeparator = document.createElement("span")
	spanSeparator.setAttribute("class", "separator")
	spanSeparator.textContent = ": "

	spanMessage = document.createElement("span")
	spanMessage.setAttribute("class", "message hyphenate")
	spanMessage.setAttribute("id", "sp2wikibot_message")
	GM_addStyle("#sp2wikibot_message {font-style:italic !important}")
	spanMessage.textContent = msg
	
	/*a = document.createElement("a")
	a.setAttribute("href", "")
	a.textContent = "test"
	a.addEventListener("click", fname, false)
	spanMessage.appendChild(a)*/

	spanClear = document.createElement("span")
	spanClear.setAttribute("class", "clear")

	p = document.createElement("p")
	p.appendChild(spanUsername)
	p.appendChild(spanSeparator)
	p.appendChild(spanMessage)
	p.appendChild(spanClear)

	divChat = document.createElement("div")
	divChat.setAttribute("id", "sp2wikibot_divmessage")
	GM_addStyle("#sp2wikibot_divmessage {background-color:#FAEBD7}")  // antiquewhite (maybe try blanchedalmond)
	divChat.appendChild(p)
	
	messageWindow = document.querySelector("div#chat_rooms_container > div.chat_room_template > div.chat_message_window")
	if (messageWindow.lastChild != null) {
		messageWindow = messageWindow.lastChild
	}
	
	messageWindow.appendChild(divChat)
}

function fname(event){
	event.preventDefault();
	event.stopPropagation();
}

function initInput() {
	textArea = document.createElement("textarea")
	textArea.setAttribute("class", "chat_input prompt_text")
	textArea.setAttribute("id", "sp2wikibot_textarea")
	GM_addStyle("#sp2wikibot_textarea {height:17px !important; margin-top:10px !important}")
	textArea.textContent = "Enter item:<asked item>"

	divInput = document.createElement("div")
	divInput.setAttribute("class", "chat_controls")
	divInput.setAttribute("id", "sp2wikibot_divinput")
	GM_addStyle("#sp2wikibot_divinput {height:22px !important}")
	divInput.appendChild(textArea)
	
	divMain = document.createElement("div")
	divMain.setAttribute("id", "sp2wikibot")
	divMain.appendChild(divInput)
	
	above.appendChild(divMain)
	
	textArea.addEventListener("keyup", function(event) {parseRequest(event);}, false)
	textArea.addEventListener("click", clickTextareaTheFirstTime, false)
}

function clickTextareaTheFirstTime() {
	textArea.value=""
	textArea.setAttribute("class", "chat_input")
	textArea.removeEventListener("click", clickTextareaTheFirstTime, false)
}

function parseRequest(event) {
	if (event.keyCode == 38 && typeof(lastRequest) !== "undefined") { // up arrow
		textArea.value = lastRequest
		return
	}

	if (event.keyCode != 13) { // enter
		return
	}
	
	msg = textArea.value.replace(/\n/, "")  // remove line breaks
	addMessage("you", msg)
	textArea.value = ""
	lastRequest = msg
	
	msgParts = msg.split(":")
	
	requestType = msgParts[0].trim()
	
	if (requestType == "i" || requestType == "item") {
		searchWikiItem(msgParts[1])
	} else if (requestType == "u" || requestType == "use" || requestType == "r" || requestType == "rare") {
		searchWikiRare(msgParts[1])
	} else {
		addMessage("sp2wikiBot", "cannot understand request."
		 +"Some examples: item: long sword, use:volcanic rock, rare:Faery's Tear. "
		 +"Short forms can be used too: i, u and r")
	}
	chatWindow = document.querySelector("div#chat_rooms_container > div.chat_room_template > div.chat_message_window")
	setTimeout(function() {chatWindow.scrollTop = chatWindow.scrollHeight;}, 1000)
}

// each word gets one and only one upper case letter: the first one
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

//http://www.edgebee.com/wiki/index.php?title=Fire_dagger_Recipe
// =if(trim(G9)="","",hyperlink(CONCATENATE("http://www.edgebee.com/wiki/index.php?title=",substitute(G9," ","_"),"_Recipe"),"W"))
function searchWikiItem(item) {
	cleanItemName = toTitleCase(item.trim().replace(/ +/g, " "))
	cleanItemName = cleanItemName.replace(/ Of /g, " of ")  // damn wiki only accepts [Rr]ing_of_[Ww]izardry
	url = "http://www.edgebee.com/wiki/index.php?title="+cleanItemName.replace(/ /, "_")+"_Recipe"
	//GM_log(url)
	GM_xmlhttpRequest({
		method: "GET",
		url: url,
		onload: function( response ) {
			if ( response.status == 200 ) {
				var parser = new DOMParser();
				var responseDoc = parser.parseFromString(response.responseText, "text/html");
				rows = responseDoc.querySelectorAll("table[cellspacing='1'] > tbody > tr")

				nameLevel = rows[0].textContent.trim()
				worker = rows[1].querySelector("td+td").textContent.trim()
				workstation = rows[2].querySelector("td+td").textContent.trim()
				price = rows[3].querySelector("td+td").textContent.trim()
				resources = "Needs: "+rows[6].querySelector("td+td").textContent.trim()
				speed = "Speed: "+rows[7].querySelector("td+td").textContent.trim()
				unlocks = "Unlocks: "+rows[9].querySelector("td+td").textContent.trim()
				unlockedBy = "Unlocked by "+rows[10].querySelector("td+td").textContent.trim()
				recipes = "Precraft for: "+rows[11].querySelector("td+td").textContent.trim()
				quests = "Quests: "+rows[12].querySelector("td+td").textContent.trim()
				improvements = "Improvements: "+rows[13].querySelector("td+td").textContent.trim()
				
				addMessage("sp2wikiBot",
						   nameLevel+" • "+
						   worker+" • "+
						   workstation+" • "+
						   price+" • "+
						   resources+" • "+
						   speed+" • "+
						   unlocks + " • "+
						   unlockedBy + " • "+
						   recipes + " • "+
						   quests + " • "+
						   improvements)
			} else {
				addMessage("sp2wikiBot", "item not found")
			}
		}
	});
}

function searchWikiRare(rare) {
	cleanRareName = toTitleCase(rare.trim().replace(/ +/g, " "))
	url = "http://www.edgebee.com/wiki/index.php?title="+cleanRareName.replace(/ /, "_")
	//GM_log(url)
	GM_xmlhttpRequest({
		method: "GET",
		url: url,
		onload: function( response ) {
			if ( response.status == 200 ) {
				var parser = new DOMParser();
				var responseDoc = parser.parseFromString(response.responseText, "text/html");
				
				items = responseDoc.querySelectorAll("table.wikitable.sortable > tbody > tr > td:first-child")
				
				msg = cleanRareName+" is used in:"
				for (i=0; i<items.length; i++) {
					msg += " "+items[i].textContent.trim()+","
				}
				msg = msg.slice(0,-1) // remove last comma
				
				addMessage("sp2wikiBot", msg)
			} else {
				addMessage("sp2wikiBot", "rare not found")
			}
		}
	});
}
