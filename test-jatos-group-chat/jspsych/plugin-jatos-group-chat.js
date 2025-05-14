var jsPsychPluginJatosGroupChat = (function (jspsych) {
  'use strict';

  var version = "0.0.1";

  const info = {
    name: "plugin-jatos-group-chat",
    version,
    parameters: {
      /** All the text */
      end_text: {
        type: jspsych.ParameterType.STRING,
        // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: "End Study"
      },
      quit_text: {
        type: jspsych.ParameterType.STRING,
        default: "Quit Study"
      },
      quit_alert_text: {
        type: jspsych.ParameterType.STRING,
        default: "Are you sure you want to quit the study?"
      },
      send_text: {
        type: jspsych.ParameterType.STRING,
        default: "Send"
      },
      message_placeholder: {
        type: jspsych.ParameterType.STRING,
        default: "Your message ..."
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
      chat_history_raw: {
        type: jspsych.ParameterType.STRING,
        description: "An array of strings, where each string is a raw message from the chat history display."
      },
      chat_log_structured: {
        type: jspsych.ParameterType.OBJECT,
        description: "An array of objects, each representing a chat message with timestamp, message content, and color."
      },
      jatos_events: {
        type: jspsych.ParameterType.OBJECT,
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
        events: []
      };
      this.jatos = window.jatos;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
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
      const defaultColor = "#aaa";
      const errorColor = "#f00";
      const historyElement = display_element.querySelector("#jatos-chat-history ul");
      const historyContainer = display_element.querySelector("#jatos-chat-history");
      const msgTextInput = display_element.querySelector("#jatos-msgText");
      const sendMsgButton = display_element.querySelector("#jatos-sendMsgButton");
      const endStudyButton = display_element.querySelector("#jatos-endStudyButton");
      this.trial_data.chat_log = [];
      this.trial_data.events = [];
      const appendToHistory = (text, color, isEvent = false) => {
        const listItem = document.createElement("li");
        listItem.textContent = text;
        listItem.style.color = color;
        historyElement.appendChild(listItem);
        historyContainer.scrollTop = historyContainer.scrollHeight;
        if (!isEvent) {
          this.trial_data.chat_log.push({
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            message: text,
            color
          });
        }
      };
      const getTime = () => {
        return new Date((/* @__PURE__ */ new Date()).getTime()).toUTCString();
      };
      const stringToColour = (str) => {
        if (!str) return defaultColor;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let colour = "#";
        for (let i = 0; i < 3; i++) {
          const value = hash >> i * 8 & 255;
          colour += ("00" + value.toString(16)).substr(-2);
        }
        return colour;
      };
      const onOpen = () => {
        const message = "You are connected.";
        appendToHistory(message, defaultColor, true);
        this.trial_data.events.push({ type: "jatos_connected", timestamp: (/* @__PURE__ */ new Date()).toISOString(), message });
        msgTextInput.focus();
      };
      const onClose = () => {
        const message = "You are disconnected.";
        appendToHistory(message, defaultColor, true);
        this.trial_data.events.push({ type: "jatos_disconnected", timestamp: (/* @__PURE__ */ new Date()).toISOString(), message });
        msgTextInput.disabled = true;
        sendMsgButton.disabled = true;
      };
      const onError = (error) => {
        const message = "An error occurred: " + error;
        appendToHistory(message, errorColor, true);
        this.trial_data.events.push({ type: "jatos_error", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: String(error) });
      };
      const onMessage = (chatBundle) => {
        const memberId = chatBundle && chatBundle.groupMemberId ? chatBundle.groupMemberId : "UnknownMember";
        const receivedMsg = chatBundle && chatBundle.msg ? chatBundle.msg : "[empty message]";
        const msg = `${getTime()} - ${memberId}: ${receivedMsg}`;
        const color = stringToColour(memberId);
        appendToHistory(msg, color);
      };
      const onMemberOpen = (memberId) => {
        const message = `A new member joined: ${memberId}`;
        appendToHistory(message, defaultColor, true);
        this.trial_data.events.push({ type: "jatos_member_joined", timestamp: (/* @__PURE__ */ new Date()).toISOString(), memberId });
      };
      const onMemberClose = (memberId) => {
        const message = `${memberId} left`;
        appendToHistory(message, defaultColor, true);
        this.trial_data.events.push({ type: "jatos_member_left", timestamp: (/* @__PURE__ */ new Date()).toISOString(), memberId });
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
          appendToHistory(message, errorColor, true);
          this.trial_data.events.push({ type: "jatos_global_error", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: String(error) });
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
        appendToHistory(`${getTime()} - You: ${msg}`, stringToColour(memberId));
      });
      endStudyButton.addEventListener("click", () => {
        const data = {
          chat_log_structured: this.trial_data.chat_log,
          jatos_events: this.trial_data.events,
          participant_id: this.jatos && this.jatos.workerId ? this.jatos.workerId : null,
          group_member_id: this.jatos && this.jatos.groupMemberId ? this.jatos.groupMemberId : null,
          group_id: this.jatos && this.jatos.groupResultId ? this.jatos.groupResultId : null
        };
        display_element.innerHTML = "";
        this.jsPsych.finishTrial(data);
        if (trial.on_finish) {
          trial.on_finish(data);
        }
      });
    }
  }

  return JatosGroupChatPlugin;

})(jsPsychModule);
//# sourceMappingURL=index.browser.js.map
