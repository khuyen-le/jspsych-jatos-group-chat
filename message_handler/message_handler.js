var jsPsychMessageHandlerPlugin = (function (jspsych) {
    'use strict';
    
    const info = {
    name: 'hello-world-plugin',
    version: "1.0.0",
    parameters: { 
        /** The path to the image file to display. */
        message: {
          type: jspsych.ParameterType.STRING,
          default: undefined
        },
      },
    };

    class MessageHandlerPlugin {
        constructor(jsPsych){
            this.jsPsych = jsPsych;
          }
    static info = info;
    trial(display_element, trial){
        let html_content = `${trial.message}`
      
        display_element.innerHTML = html_content;
      }
    }

    return MessageHandlerPlugin;

})(jsPsychModule);

/*This function initiates the Group Session*/
function onGroupSession(path) {
    var chatBundle = jatos.groupSession.find(path);
    var timestamp = path.split('/ts')[1];
    appendChatBundleToHistory(timestamp, chatBundle);
}

/*This function adds a new member to the group channel*/
function onMemberOpen(memberId) {
    appendToHistory("A new member joined: " + memberId, defaultColor);
}

/*This function signals when a member has left the group channel*/
function onMemberClose(memberId) {
    appendToHistory(memberId + " left", defaultColor);
}

/*This function accesses all the chat messages, prints a timestamp for each message, and appends this to the Chat Bundle*/
function printOldMsgs() {
    var chatHistory = jatos.groupSession.getAll();
    // JS objects have no order so we have to sort the chat messages's timestamps
    var orderedTimestamps = Object.keys(chatHistory).sort();
    orderedTimestamps.forEach(function (tsTimestamp) {
        var chatBundle = chatHistory[tsTimestamp];
        var timestamp = tsTimestamp.split('ts')[1];
        appendChatBundleToHistory(timestamp, chatBundle);
    });
}

/*This function gathers each member's ID and chat message and appends it to the Chat history*/
function appendChatBundleToHistory(timestamp, chatBundle) {
    if (typeof timestamp != 'string' || typeof chatBundle != 'object' ||
        typeof chatBundle.groupMemberId != 'string' || typeof chatBundle.msg != 'string') {
        return;
    }
    var utcTime = new Date(parseInt(timestamp)).toUTCString();
    var msgText;
    if (jatos.groupMemberId == chatBundle.groupMemberId) {
        msgText = utcTime + " - You: " + chatBundle.msg;
    } else {
        msgText = utcTime + " - " + chatBundle.groupMemberId + ": " + chatBundle.msg;
    }
    var color = stringToColour(chatBundle.groupMemberId);
    appendToHistory(msgText, color);
}



/*This function appears each message to the Chat History*/
function appendToHistory(text, color) {
    $("#history ul").append('<li>' + text + '</li>');
    $("#history li").last().css('color', color);
    // Scroll to bottom
    $("#history").scrollTop($("#history")[0].scrollHeight);
}


/*This function listens for whether the 'Enter' button is pressed (13) and interprets that as a click to send the message*/
$('#msgText').keypress(function (event) {
    // Check for 'Enter' button press
    if (event.which == 13) {
        event.preventDefault();
        // Treat it as if the send button was clicked.
        $("#sendMsgButton").click();
    }
});


/*This function seems to yoke the group member with the corresponding message and post it on the Chat Log*/
$('#sendMsgButton').click(function () {
    var msg = $('#msgText').val();
    if (!msg.trim()) {
        return;
    }

    // Create object to be send to all other participants with message text an group member ID
    $('#msgText').val("");
    var chatBundle = {
        "msg": msg,
        "groupMemberId": jatos.groupMemberId
    };
    var timestamp = new Date().getTime();
    var pointer = "/ts" + timestamp.toString();
    jatos.groupSession.add(pointer, chatBundle).fail(function () {
        appendToHistory("An error occured: group session synchronization failed", errorColor);
    });
});