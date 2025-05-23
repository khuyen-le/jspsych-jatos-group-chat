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
      },
      username_generator_function: {
        type: jspsych.ParameterType.FUNCTION,
        default: null
        // If left undefined, will just use JATOS group member ID
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
    getMemberId(jatosGroupMemberId) {
      let memberId;
      let gen_func = this.params.username_generator_function;
      if (this.jatos && jatosGroupMemberId) {
        memberId = gen_func ? gen_func(jatosGroupMemberId) : jatosGroupMemberId;
      } else {
        memberId = "LocalUser";
      }
      return memberId;
    }
    trial(display_element, trial) {
      this.params = trial;
      this.curr_member_id = this.getMemberId(this.jatos.groupMemberId);
      let html = `
      <div id="jatos-chat-content">
          <div id="jatos-chat-history" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
              <ul></ul>
          </div>
          <form id="jatos-sendMsgForm">
              <input id="jatos-msgText" class="jspsych-display-element" type="text" placeholder="${this.params.message_placeholder}">
              <button id="jatos-sendMsgButton" class="jspsych-btn" type='button'>${this.params.button_label_send}</button>
          </form>
          <button id="jatos-endStudyButton" class="jspsych-btn" style="margin-top: 15px;">${this.params.button_label_end_study}</button>
          <button id="jatos-quitStudyButton" class="jspsych-btn" style="margin-top: 15px;">${this.params.button_label_quit_study}</button>
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
        let numericValue = 0;
        for (let i = 0; i < str.length; i++) {
          numericValue += str.charCodeAt(i);
        }
        const randomVal = Math.abs(Math.sin(numericValue));
        const h = Math.floor(randomVal * 360);
        const s = 65 + Math.floor(randomVal * 25);
        const l = 45 + Math.floor(randomVal * 20);
        return hslToHex(h, s, l);
      };
      const hslToHex = (h, s, l) => {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(h / 60 % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        if (h >= 0 && h < 60) {
          [r, g, b] = [c, x, 0];
        } else if (h >= 60 && h < 120) {
          [r, g, b] = [x, c, 0];
        } else if (h >= 120 && h < 180) {
          [r, g, b] = [0, c, x];
        } else if (h >= 180 && h < 240) {
          [r, g, b] = [0, x, c];
        } else if (h >= 240 && h < 300) {
          [r, g, b] = [x, 0, c];
        } else {
          [r, g, b] = [c, 0, x];
        }
        const toHex = (value) => {
          const hex = Math.round((value + m) * 255).toString(16).padStart(2, "0");
          return hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      const onOpen = () => {
        const message = "You are connected.";
        this.members_in_chat = this.jatos.groupMembers;
        console.log(this.members_in_chat);
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
        this.members_in_chat.push(String(memberId));
        console.log(this.members_in_chat);
        appendToHistory(`${getTime()} - ${message}`, message, "system" + this.jatos.groupResultId, defaultColor, true);
      };
      const onMemberClose = (memberId) => {
        const message = `${memberId} left`;
        const remove_ppt_idx = this.members_in_chat.indexOf(memberId);
        if (remove_ppt_idx > -1) {
          this.members_in_chat.splice(remove_ppt_idx, 1);
        }
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
        const memberId = this.getMemberId(this.jatos.groupMemberId);
        const chatBundle = {
          msg,
          groupMemberId: memberId
        };
        try {
          this.jatos.sendGroupMsg(chatBundle);
        } catch (e) {
          onError("Failed to send message via JATOS: " + (e.message || e));
        }
        appendToHistory(`${getTime()} - You: ${msg}`, msg, memberId, stringToColour(String(memberId)));
      });
      endStudyButton.addEventListener("click", () => {
        console.log(this.saveData());
      });
      quitStudyButton.addEventListener("click", () => {
        var answer = confirm(this.params.quit_alert_text);
        console.log(this.members_in_chat);
        if (answer) {
          const remove_ppt_idx = this.members_in_chat.indexOf(this.jatos.groupMemberId);
          if (remove_ppt_idx > -1) {
            this.members_in_chat.splice(remove_ppt_idx, 1);
          }
          console.log(this.saveData());
          this.jatos.leaveGroup();
        }
      });
    }
    saveData() {
      this.trial_data.chat_senders.forEach((sender_id, i) => {
        if (!sender_id.includes("system") && !this.members_in_chat.includes(sender_id)) {
          this.trial_data.chat_timestamps[i] = "ppt withdrew";
          this.trial_data.chat_messages[i] = "ppt withdrew";
          this.trial_data.chat_log[i]["timestamp"] = "ppt withdrew";
          this.trial_data.chat_log[i]["message"] = "ppt withdrew";
          this.trial_data.chat_log[i]["full_message"] = "ppt withdrew";
          this.trial_data.chat_log[i]["color"] = "ppt withdrew";
        }
      });
      const trial_data = {
        chat_log: this.trial_data.chat_log,
        chat_timestamps: this.trial_data.chat_timestamps,
        chat_senders: this.trial_data.chat_senders,
        chat_messages: this.trial_data.chat_messages,
        participant_id: this.jatos && this.jatos.workerId ? this.jatos.workerId : null,
        group_member_id: this.jatos && this.jatos.groupMemberId ? this.jatos.groupMemberId : null,
        group_id: this.jatos && this.jatos.groupResultId ? this.jatos.groupResultId : null
      };
      return trial_data;
    }
  }

  return JatosGroupChatPlugin;

})(jsPsychModule);
//# sourceMappingURL=index.browser.js.map
