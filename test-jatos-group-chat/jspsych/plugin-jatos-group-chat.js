var jsPsychPluginJatosGroupChat = (function (jspsych) {
  'use strict';

  var version = "0.0.1";

  const info = {
    name: "plugin-jatos-group-chat",
    version,
    parameters: {
      /** All the text */
      button_label_end_study: {
        type: jspsych.ParameterType.STRING,
        // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: "End Study"
      },
      button_label_quit_study: {
        type: jspsych.ParameterType.STRING,
        default: "Quit Study"
      },
      quit_alert_text: {
        type: jspsych.ParameterType.STRING,
        default: "Are you sure you want to quit the study?"
      },
      button_label_send: {
        type: jspsych.ParameterType.STRING,
        default: "Send"
      },
      message_placeholder: {
        type: jspsych.ParameterType.STRING,
        default: "Type your message and press enter."
      },
      connected_text: {
        type: jspsych.ParameterType.STRING,
        default: "You are connected."
      },
      new_member_text: {
        type: jspsych.ParameterType.STRING,
        default: "A new member joined:"
      }
      /** possible extensions: max number of people, etc. */
    },
    data: {
      chat_log: {
        type: jspsych.ParameterType.COMPLEX,
        array: true
      },
      chat_timestamps: {
        type: jspsych.ParameterType.COMPLEX,
        array: true
      },
      chat_senders: {
        type: jspsych.ParameterType.COMPLEX,
        array: true
      },
      chat_messages: {
        type: jspsych.ParameterType.COMPLEX,
        array: true
      },
      participant_id: {
        type: jspsych.ParameterType.STRING
      },
      group_member_id: {
        type: jspsych.ParameterType.STRING
      },
      /** message that was sent */
      group_id: {
        type: jspsych.ParameterType.STRING,
        description: "JATOS group result ID, if available."
      }
    },
    // When you run build on your plugin, citations will be generated here based on the information in the CITATION.cff file.
    citations: {
      "apa": "Martin Zettersten, Avery Yanowitz, Jenny Lee, Khuyen Le, Kushin Mukherjee, Steven Martinez Martin Zettersten, Avery Yanowitz, Jenny Lee, Khuyen Le, Kushin Mukherjee, Steven Martinez, M. Z. A. Y. J. L. K. L. K. M. S. M. (2023). {title}. Journal for Open Source Software, 1(1), 1. https://doi.org/10.21105/joss.12345 ",
      "bibtex": "@article{Martin2023title, 	author = {Martin Zettersten, Avery Yanowitz, Jenny Lee, Khuyen Le, Kushin Mukherjee, Steven Martinez Martin Zettersten, Avery Yanowitz, Jenny Lee, Khuyen Le, Kushin Mukherjee, Steven Martinez, Martin Zettersten, Avery Yanowitz, Jenny Lee, Khuyen Le, Kushin Mukherjee, Steven Martinez}, 	journal = {Journal for Open Source Software}, 	doi = {10.21105/joss.12345}, 	issn = {1234-5678}, 	number = {1}, 	year = {2023}, 	month = {may 11}, 	pages = {1}, 	publisher = {Open Journals}, 	title = {\\textbraceleft{}title\\textbraceright{}}, 	url = {{linkToPublicationInJournal}}, 	volume = {1}, }  "
    }
  };
  class JatosGroupChatPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
      this.jsPsych = jsPsych;
      this.trial_data = {
        chat_log: [],
        chat_timestamps: [],
        chat_senders: [],
        chat_messages: []
      };
      this.jatos = window.jatos;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
      this.params = trial;
      let html = `
      <div id="jatos-chat-content">
          <div class="pure-g">
              <div id="jatos-chat-history" class="pure-u-2-3" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                  <ul></ul>
              </div>
          </div>
          <form id="jatos-sendMsgForm" class="pure-form">
              <input id="jatos-msgText" type="text" class="pure-input-2-3" placeholder="${this.params.message_placeholder}">
              <button id="jatos-sendMsgButton" class="pure-button pure-button-primary" type='button'>${this.params.button_label_send}</button>
          </form>
          <button id="jatos-endStudyButton" class="pure-button pure-button-primary" style="margin-top: 15px;">${this.params.button_label_end_study}</button>
          <button id="jatos-quitStudyButton" class="pure-button pure-button-primary" style="margin-top: 15px;">${this.params.button_label_quit_study}</button>
      </div>
    `;
      display_element.innerHTML = html;
      const defaultColor = "#aaa";
      const historyElement = display_element.querySelector("#jatos-chat-history ul");
      const historyContainer = display_element.querySelector("#jatos-chat-history");
      const msgTextInput = display_element.querySelector("#jatos-msgText");
      const sendMsgButton = display_element.querySelector("#jatos-sendMsgButton");
      const endStudyButton = display_element.querySelector("#jatos-endStudyButton");
      const quitStudyButton = display_element.querySelector("#jatos-quitStudyButton");
      this.trial_data.chat_log = [];
      const appendToHistory = (full_text, raw_text, sender, color, isEvent = false) => {
        const listItem = document.createElement("li");
        listItem.textContent = full_text;
        listItem.style.color = color;
        historyElement.appendChild(listItem);
        historyContainer.scrollTop = historyContainer.scrollHeight;
        let curr_timestamp = (/* @__PURE__ */ new Date()).toISOString();
        let curr_chat_log = {
          timestamp: curr_timestamp,
          full_message: full_text,
          message: raw_text,
          color
        };
        if (!isEvent) {
          curr_chat_log["sender"] = sender;
          this.trial_data.chat_senders.push(sender);
        } else {
          curr_chat_log["sender"] = "system" + this.jatos.groupResultId, this.trial_data.chat_senders.push("system" + this.jatos.groupResultId);
        }
        this.trial_data.chat_log.push(curr_chat_log);
        this.trial_data.chat_timestamps.push(curr_timestamp);
        this.trial_data.chat_messages.push(raw_text);
        console.log(curr_chat_log);
      };
      const getTime = () => {
        return new Date((/* @__PURE__ */ new Date()).getTime()).toUTCString();
      };
      const stringToColour = (str) => {
        var color = Math.floor(Math.abs(Math.sin(parseInt(str)) * 16777215) % 16777215).toString(16);
        return "#" + color;
      };
      const onOpen = () => {
        const message = "You are connected.";
        appendToHistory(`${getTime()} - ${message}`, message, "system" + this.jatos.groupResultId, defaultColor, true);
        msgTextInput.focus();
      };
      const onClose = () => {
        const message = "You are disconnected.";
        appendToHistory(`${getTime()} - ${message}`, message, "system" + this.jatos.groupResultId, defaultColor, true);
        msgTextInput.disabled = true;
        sendMsgButton.disabled = true;
      };
      const onError = (error) => {
        const message = "An error occurred: " + error;
        appendToHistory(`${getTime()} - ${message}`, message, "system" + this.jatos.groupResultId, defaultColor, true);
      };
      const onMessage = (chatBundle) => {
        const memberId = chatBundle && chatBundle.groupMemberId ? chatBundle.groupMemberId : "UnknownMember";
        const receivedMsg = chatBundle && chatBundle.msg ? chatBundle.msg : "[empty message]";
        const msg = `${getTime()} - ${memberId}: ${receivedMsg}`;
        const color = stringToColour(String(memberId));
        appendToHistory(msg, receivedMsg, memberId, color, false);
      };
      const onMemberOpen = (memberId) => {
        const message = `A new member joined: ${memberId}`;
        appendToHistory(`${getTime()} - ${message}`, message, "system" + this.jatos.groupResultId, defaultColor, true);
      };
      const onMemberClose = (memberId) => {
        const message = `${memberId} left`;
        appendToHistory(`${getTime()} - ${message}`, message, "system" + this.jatos.groupResultId, defaultColor, true);
      };
      this.jatos.onLoad(() => {
        this.jatos.joinGroup({
          onOpen,
          onClose,
          onError,
          onMessage,
          onMemberOpen,
          onMemberClose
        });
        this.jatos.onError((error) => {
          const message = "jatos.onError (global): " + error;
          appendToHistory(`${getTime()} - ${message}`, message, "system" + this.jatos.groupResultId, defaultColor, true);
        });
      });
      msgTextInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter" || event.which === 13) {
          event.preventDefault();
          sendMsgButton.click();
        }
      });
      sendMsgButton.addEventListener("click", () => {
        const msg = msgTextInput.value.trim();
        if (!msg) {
          return;
        }
        msgTextInput.value = "";
        const memberId = this.jatos && this.jatos.groupMemberId ? this.jatos.groupMemberId : "LocalUser";
        const chatBundle = {
          msg,
          groupMemberId: memberId
        };
        let messageSentViaJatos = false;
        try {
          this.jatos.sendGroupMsg(chatBundle);
          messageSentViaJatos = true;
        } catch (e) {
          onError("Failed to send message via JATOS: " + (e.message || e));
        }
        appendToHistory(`${getTime()} - You: ${msg}`, msg, memberId, stringToColour(String(memberId)));
      });
      endStudyButton.addEventListener("click", () => {
        const trial_data = {
          chat_log: this.trial_data.chat_log,
          chat_timestamps: this.trial_data.chat_timestamps,
          chat_senders: this.trial_data.chat_senders,
          chat_messages: this.trial_data.chat_messages,
          participant_id: this.jatos && this.jatos.workerId ? this.jatos.workerId : null,
          group_member_id: this.jatos && this.jatos.groupMemberId ? this.jatos.groupMemberId : null,
          group_id: this.jatos && this.jatos.groupResultId ? this.jatos.groupResultId : null
        };
        this.jsPsych.finishTrial(trial_data);
      });
      quitStudyButton.addEventListener(
        "click",
        () => {
          var answer = confirm(this.params.quit_alert_text);
          if (answer) {
            let ppt_member_id = String(this.jatos.groupMemberId);
            let ppt_idx_bool = [];
            this.trial_data.chat_senders.forEach((sender_id, index) => {
              if (sender_id === ppt_member_id) {
                ppt_idx_bool.push(true);
              } else {
                ppt_idx_bool.push(false);
              }
            });
            for (let i = 0; i < ppt_idx_bool.length; i++) {
              if (ppt_idx_bool[i]) {
                this.trial_data.chat_timestamps[i] = "ppt withdrew";
                this.trial_data.chat_messages[i] = "ppt withdrew";
                this.trial_data.chat_log[i]["timestamp"] = "ppt withdrew";
                this.trial_data.chat_log[i]["message"] = "ppt withdrew";
                this.trial_data.chat_log[i]["color"] = "ppt withdrew";
              }
            }
          }
          this.jsPsych.finishTrial();
        }
      );
    }
  }

  return JatosGroupChatPlugin;

})(jsPsychModule);
//# sourceMappingURL=index.browser.js.map
