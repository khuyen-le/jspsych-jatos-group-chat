var jsPsychJatosGroupChatPlugin = (function (jspsych) {
    'use strict';
  
    var version = "1.0.0"; // Version for this chat plugin
  
    const info = {
      name: "jatos-group-chat",
      version: version,
      parameters: {
        prompt: {
          type: jspsych.ParameterType.HTML_STRING,
          pretty_name: "Prompt",
          default: "Your message ...",
          description: "The placeholder text for the message input field."
        },
        button_label_send: {
          type: jspsych.ParameterType.STRING,
          pretty_name: "Button label Send",
          default: "Send",
          description: "The label for the send message button."
        },
        button_label_end_study: {
          type: jspsych.ParameterType.STRING,
          pretty_name: "Button label End Study",
          default: "End Study",
          description: "The label for the end study button."
        },
        on_finish: {
          type: jspsych.ParameterType.FUNCTION,
          pretty_name: "On finish",
          default: null,
          description: "A function to be called when the trial finishes. Receives the trial data as an argument."
        }
      },
      data: {
        chat_history_raw: {
          type: jspsych.ParameterType.ARRAY,
          description: "An array of strings, where each string is a raw message from the chat history display."
        },
        chat_log_structured: {
          type: jspsych.ParameterType.ARRAY,
          description: "An array of objects, each representing a chat message with timestamp, message content, and color."
        },
        jatos_events: {
          type: jspsych.ParameterType.ARRAY,
          description: "An array of objects, logging JATOS-specific events like connections, disconnections, errors, and member joins/leaves."
        },
        participant_id: {
          type: jspsych.ParameterType.STRING,
          description: "JATOS worker ID, if available."
        },
        group_member_id: {
          type: jspsych.ParameterType.STRING,
          description: "JATOS group member ID, if available."
        },
        group_id: {
          type: jspsych.ParameterType.STRING,
          description: "JATOS group result ID, if available."
        }
      },
      citations: { // Placeholder, replace with actual citation if available
      }
    };
  
    class JatosGroupChatPlugin {
      constructor(jsPsych) { // Receives the jsPsych instance from initJsPsych()
        this.jsPsych = jsPsych;
        this.trial_data = {}; // To store chat history and other relevant data
        this.jatos = window.jatos; // Assuming JATOS is loaded globally
      }
  
      static { // Static initialization block to assign info
        this.info = info;
      }
  
      trial(display_element, trial) {
        // --- HTML Structure includes ---

        /* jatos-chat-content: Defines ID attribute to reference content included in the chat
         * jatos-chat-history: Defines container for chat log history
         * jatos-sendMsgForm: Creates form element
         * jatos-msgText: Defines input element to allow users to type messages
         * jatos-sendMsgButton: Defines button element for the 'Send' button
         * jatos-endStudyButton Defines button element for the 'End Study' button
         */
        
        let html = `
          <div id="jatos-chat-content">
              <div class="pure-g">
                  <div id="jatos-chat-history" class="pure-u-2-3" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                      <ul></ul>
                  </div>
              </div>
              <form id="jatos-sendMsgForm" class="pure-form">
                  <input id="jatos-msgText" type="text" class="pure-input-2-3" placeholder="${trial.prompt}">
                  <button id="jatos-sendMsgButton" class="pure-button pure-button-primary" type='button'>${trial.button_label_send}</button>
              </form>
              <button id="jatos-endStudyButton" class="pure-button pure-button-primary" style="margin-top: 15px;">${trial.button_label_end_study}</button>
          </div>
        `;
        display_element.innerHTML = html;
  
        // --- Styling (optional, can be moved to CSS file) ---
        const style = document.createElement('style');
        style.textContent = `
          #jatos-chat-history ul { list-style-type: none; padding: 0; margin: 0; }
          #jatos-chat-history li { margin-bottom: 5px; word-wrap: break-word; }
          .pure-g { display: flex; }
          .pure-u-2-3 { flex-basis: 100%; max-width: 100%; box-sizing: border-box; } /* Adjusted for single column chat */
          #jatos-sendMsgForm { display: flex; }
          #jatos-sendMsgForm .pure-input-2-3 { flex-grow: 1; margin-right: 5px; }
          /* Ensure PureCSS is loaded or define .pure-button, .pure-button-primary, .pure-form, etc. */
        `;
        display_element.prepend(style);
  
        // --- Chat Logic ---
        const defaultColor = "#aaa";
        const errorColor = "#f00";
        const historyElement = display_element.querySelector("#jatos-chat-history ul");
        const historyContainer = display_element.querySelector("#jatos-chat-history");
        const msgTextInput = display_element.querySelector("#jatos-msgText");
        const sendMsgButton = display_element.querySelector("#jatos-sendMsgButton");
        const endStudyButton = display_element.querySelector("#jatos-endStudyButton");
  

        /** 
         * Defines trial chat log global array to store data from chat log *
         * Defines trial events global array to store data for JATOS events *
         */
        this.trial_data.chat_log = [];
        this.trial_data.events = [];
  
        const appendToHistory = (text, color, isEvent = false) => {
         /** 
         * Defines constant that will iteratively append corresponding timestamps, messages, and member IDs to the chat log *
         */
          const listItem = document.createElement("li");
          listItem.textContent = text;
          listItem.style.color = color;
          historyElement.appendChild(listItem);
          historyContainer.scrollTop = historyContainer.scrollHeight;
          if (!isEvent) {
            this.trial_data.chat_log.push({
              timestamp: new Date().toISOString(),
              message: text,
              color: color
            });
          }
        };
  
        const getTime = () => {
         /** 
         * Defines current data and time *
         */
          return new Date(new Date().getTime()).toUTCString();
        };
  
        const stringToColour = (str) => {
         /** 
         * Defines random color that will later be used for each unique member ID *
         */
          if (!str) return defaultColor;
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          let colour = '#';
          for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
          }
          return colour;
        };
  

        const onOpen = () => {
         /** 
         * Generates message that lets user know they have been connected to Jatos *
         * Appends message to chat log history *
         */
          const message = "You are connected.";
          appendToHistory(message, defaultColor, true);
          this.trial_data.events.push({ type: "jatos_connected", timestamp: new Date().toISOString(), message: message });
          msgTextInput.focus();
        };
  
        const onClose = () => {
         /** 
         * Generates message that lets user know they have been disconnected from Jatos *
         * Appends message to chat log history *
         * *Disables send button and ability to send any more messages * 
         */
          const message = "You are disconnected.";
          appendToHistory(message, defaultColor, true);
          this.trial_data.events.push({ type: "jatos_disconnected", timestamp: new Date().toISOString(), message: message });
          msgTextInput.disabled = true;
          sendMsgButton.disabled = true;
        };
  
        const onError = (error) => {
         /** 
         * Generates message that an error has occurred *
         * Appends error message to chat log history *
         */ 
          const message = "An error occurred: " + error;
          appendToHistory(message, errorColor, true);
          this.trial_data.events.push({ type: "jatos_error", timestamp: new Date().toISOString(), error: String(error) });
        };
  
        const onMessage = (chatBundle) => {
         /** 
         * Creates constant to define member ID in the chat *
         * Creates constant to define a received message *
         * Creates constant for each received message that defines the time and corresponding member ID of each message  *
         * Assigns random color to each member ID *
         * Appends message and member ID to chat log history *
         */ 
          const memberId = chatBundle && chatBundle.groupMemberId ? chatBundle.groupMemberId : "UnknownMember";
          const receivedMsg = chatBundle && chatBundle.msg ? chatBundle.msg : "[empty message]";
          const msg = `${getTime()} - ${memberId}: ${receivedMsg}`;
          const color = stringToColour(memberId);
          appendToHistory(msg, color);
        };
  
        const onMemberOpen = (memberId) => {
         /** 
         * Generates message indicating that a new member has joined the group chat along with their member ID *
         * Appends ID of new member and timestamp to chat log history *
         */ 
          const message = `A new member joined: ${memberId}`;
          appendToHistory(message, defaultColor, true);
          this.trial_data.events.push({ type: "jatos_member_joined", timestamp: new Date().toISOString(), memberId: memberId });
        };
  
        const onMemberClose = (memberId) => {
         /** 
         * Generates message indicating that a specific member has left the group chat *
         * Appends ID of member who left and timestamp to chat log history *
         */ 
          const message = `${memberId} left`;
          appendToHistory(message, defaultColor, true);
          this.trial_data.events.push({ type: "jatos_member_left", timestamp: new Date().toISOString(), memberId: memberId });
        };
  
        // --- JATOS Integration ---
    
          this.jatos.onLoad(() => { // jatos.onLoad ensures JATOS is ready.
            this.jatos.joinGroup({
              onOpen: onOpen,
              onClose: onClose,
              onError: onError,
              onMessage: onMessage,
              onMemberOpen: onMemberOpen,
              onMemberClose: onMemberClose,
            });
  
            // JATOS global error handler (distinct from channel errors)
            this.jatos.onError((error) => {
              const message = "jatos.onError (global): " + error;
              appendToHistory(message, errorColor, true);
              this.trial_data.events.push({ type: "jatos_global_error", timestamp: new Date().toISOString(), error: String(error) });
            });
          });
        
  
        // --- Event Listeners ---
        msgTextInput.addEventListener('keypress', (event) => {
        /** 
         * Enables keyboard press of 'Enter' to send message in the chat by authorizing the click of the 'Send' button *
         */ 
          if (event.key === 'Enter' || event.which === 13) {
            event.preventDefault();
            sendMsgButton.click();
          }
        });
  
        sendMsgButton.addEventListener('click', () => {
         /* Trim whitespaces and return the message. If the message is null or empty, exit the function */
          const msg = msgTextInput.value.trim();
          if (!msg) {
            return;
          }
  
          /* If groupMemberID variable exists, define memberID as groupMemberID, else, define memberID constant as 'LocalUser' */
          /* Organize chatBundle constant to reflect the message and the corresponding member ID */
          msgTextInput.value = "";
          const memberId = (this.jatos && this.jatos.groupMemberId) ? this.jatos.groupMemberId : "LocalUser";
          const chatBundle = {
            msg: msg,
            groupMemberId: memberId,
          };
  
          /* Declare messageSentViaJatos as 'false'*/
          let messageSentViaJatos = false;
           
           /* Sends the message and records any errors that may arise */
            // if (this.jatos.group && typeof this.jatos.group.isChannelOpen === 'function' && this.jatos.group.isChannelOpen()) {
              try {
                this.jatos.sendGroupMsg(chatBundle);
                messageSentViaJatos = true;
              } catch (e) {
                onError("Failed to send message via JATOS: " + (e.message || e));
              }
            // } else if (!this.jatos.group) {
            //   appendToHistory("Cannot send message: JATOS group object not available.", errorColor, true);
            // } else {
            //   appendToHistory("Cannot send message: JATOS group channel not open.", errorColor, true);
            // }
          
  
          appendToHistory(`${getTime()} - You: ${msg}`, stringToColour(memberId));
        });
  
        endStudyButton.addEventListener('click', () => {
         /** 
         * When 'End Study' button is clicked, organize the collected data and store in a 'data' object, clear the HTML display, and end the trial *
         */ 
          const data = {
            chat_history_raw: Array.from(historyElement.children).map(li => li.textContent),
            chat_log_structured: this.trial_data.chat_log,
            jatos_events: this.trial_data.events,
            participant_id: (this.jatos && this.jatos.workerId) ? this.jatos.workerId : null,
            group_member_id: (this.jatos && this.jatos.groupMemberId) ? this.jatos.groupMemberId : null,
            group_id: (this.jatos && this.jatos.groupResultId) ? this.jatos.groupResultId : null,
          };
  
          // Clean up the display
          display_element.innerHTML = '';
  
          // End the jsPsych trial with the collected data
          this.jsPsych.finishTrial(data);
  
          // Call the on_finish callback if provided
          if (trial.on_finish) {
            trial.on_finish(data);
          }
        });
      }
    }
  
    return JatosGroupChatPlugin;
  
  })(jsPsychModule); // Pass the global jsPsychModule which contains ParameterType