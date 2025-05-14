import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

const info = <const>{
  name: "plugin-jatos-group-chat",
  version: version,
  parameters: {
    /** All the text */
    button_label_end_study: {
      type: ParameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
      default: "End Study",
    },
    button_label_quit_study: {
      type: ParameterType.STRING,
      default: "Quit Study"
    },
    quit_alert_text: {
      type: ParameterType.STRING,
      default: "Are you sure you want to quit the study?"
    },
    button_label_send: {
      type: ParameterType.STRING, 
      default: "Send",
    },
    message_placeholder: {
      type: ParameterType.STRING, 
      default: "Type your message and press enter.",
    },
    connected_text: { 
      type: ParameterType.STRING, 
      default: "You are connected.",
    },
    new_member_text: { 
      type: ParameterType.STRING,
      default: "A new member joined:",
    }
    /** possible extensions: max number of people, etc. */
  },
  data: {
    chat_log: {
      type: ParameterType.COMPLEX, 
      array: true
    }, 
    chat_timestamps: {
      type: ParameterType.COMPLEX, 
      array: true
    }, 
    chat_senders: {
      type: ParameterType.COMPLEX, 
      array: true
    }, 
    chat_messages: {
      type: ParameterType.COMPLEX, 
      array: true
    },
    participant_id: {
      type: ParameterType.STRING,
    },
    group_member_id: {
      type: ParameterType.STRING,
    }, 
    /** message that was sent */
    group_id: {
      type: ParameterType.STRING,
      description: "JATOS group result ID, if available."
    }
  },
  // When you run build on your plugin, citations will be generated here based on the information in the CITATION.cff file.
  citations: '__CITATIONS__',
};

type Info = typeof info;

interface ChatData {
  chat_log: object[],
  chat_timestamps: string[],
  chat_senders: string[], 
  chat_messages: string[]
}

/**
 * **plugin-jatos-group-chat**
 *
 * This plugin implements a waiting room based on JATOS functionality.
 *
 * @author Khuyen Le
 * @see {@link /plugin-jatos-group-chat/README.md}}
 */
class JatosGroupChatPlugin implements JsPsychPlugin<Info> {
  static info = info;
  trial_data: ChatData;
  jatos: any;

  constructor(private jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
    this.trial_data = {
      chat_log: [],
      chat_timestamps: [], 
      chat_senders: [], 
      chat_messages: []
    }; // To store chat history and other relevant data
    // @ts-expect-error
    this.jatos = window.jatos; // Assuming JATOS is loaded globally
  }

  private params: TrialType<Info>;

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    this.params = trial;
    // --- HTML Structure ---
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
    
    // --- Chat Logic ---
    const defaultColor = "#aaa";
    const errorColor = "#f00";
    const historyElement = display_element.querySelector("#jatos-chat-history ul");
    const historyContainer = display_element.querySelector("#jatos-chat-history");
    const msgTextInput: HTMLButtonElement = display_element.querySelector("#jatos-msgText");
    const sendMsgButton: HTMLButtonElement = display_element.querySelector("#jatos-sendMsgButton");
    const endStudyButton: HTMLButtonElement = display_element.querySelector("#jatos-endStudyButton");
    const quitStudyButton: HTMLButtonElement = display_element.querySelector("#jatos-quitStudyButton");

    this.trial_data.chat_log = [];

    const appendToHistory = (text, color, isEvent = false) => {
      const listItem = document.createElement("li");
      listItem.textContent = text;
      listItem.style.color = color;
      historyElement.appendChild(listItem);
      historyContainer.scrollTop = historyContainer.scrollHeight;
      let curr_timestamp = new Date().toISOString();
      let curr_chat_log = {
        timestamp: curr_timestamp, 
        message: text,
        color: color
      }

      if (!isEvent) {
       curr_chat_log['sender'] = this.jatos.groupMemberId 
       this.trial_data.chat_senders.push(this.jatos.groupMemberId)
      } else {
        curr_chat_log['sender'] = "system " + this.jatos.groupResultId,
        this.trial_data.chat_senders.push("system " + this.jatos.groupResultId)
      }

      this.trial_data.chat_log.push(curr_chat_log);
      this.trial_data.chat_timestamps.push(curr_timestamp); 
      this.trial_data.chat_messages.push(text)
    
    };

    const getTime = () => {
      return new Date(new Date().getTime()).toUTCString();
    };

    const stringToColour = (str) => {
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
      const message = "You are connected.";
      appendToHistory(message, defaultColor, true);
      //this.trial_data.events.push({ type: "jatos_connected", timestamp: new Date().toISOString(), message: message });
      msgTextInput.focus();
    };

    const onClose = () => {
      const message = "You are disconnected.";
      appendToHistory(message, defaultColor, true);
      //this.trial_data.events.push({ type: "jatos_disconnected", timestamp: new Date().toISOString(), message: message });
      msgTextInput.disabled = true;
      sendMsgButton.disabled = true;
    };

    const onError = (error) => {
      const message = "An error occurred: " + error;
      appendToHistory(message, errorColor, true);
      //this.trial_data.events.push({ type: "jatos_error", timestamp: new Date().toISOString(), error: String(error) });
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
      //this.trial_data.events.push({ type: "jatos_member_joined", timestamp: new Date().toISOString(), memberId: memberId });
    };

    const onMemberClose = (memberId) => {
      const message = `${memberId} left`;
      appendToHistory(message, defaultColor, true);
      //this.trial_data.events.push({ type: "jatos_member_left", timestamp: new Date().toISOString(), memberId: memberId });
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
        //this.trial_data.events.push({ type: "jatos_global_error", timestamp: new Date().toISOString(), error: String(error) });
      });
    });
    

    // --- Event Listeners ---
    msgTextInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.which === 13) {
        event.preventDefault();
        sendMsgButton.click();
      }
    });

    sendMsgButton.addEventListener('click', () => {
      const msg = msgTextInput.value.trim();
      if (!msg) {
        return;
      }

      msgTextInput.value = "";
      const memberId = (this.jatos && this.jatos.groupMemberId) ? this.jatos.groupMemberId : "LocalUser";
      const chatBundle = {
        msg: msg,
        groupMemberId: memberId,
      };

      let messageSentViaJatos = false;
        
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
      // this is a little complicated...
      const trial_data = {
        chat_log: this.trial_data.chat_log,
        chat_timestamps: this.trial_data.chat_timestamps, 
        chat_senders: this.trial_data.chat_senders,
        chat_messages: this.trial_data.chat_messages,
        participant_id: (this.jatos && this.jatos.workerId) ? this.jatos.workerId : null,
        group_member_id: (this.jatos && this.jatos.groupMemberId) ? this.jatos.groupMemberId : null,
        group_id: (this.jatos && this.jatos.groupResultId) ? this.jatos.groupResultId : null,
      };
      this.jsPsych.finishTrial(trial_data);
    });

    quitStudyButton.addEventListener('click', () => {
      var answer = confirm(this.params.quit_alert_text)
      if (answer){
        // get the member id of the participant who is quitting
        let ppt_member_id = String(this.jatos.groupMemberId);
        // boolean array, store True for match, False for no match
        // this implementation allows the function to run in O(n)
        let ppt_idx_bool = [];
        this.trial_data.chat_senders.forEach((sender_id, index) => {
          if (sender_id == ppt_member_id) {
            ppt_idx_bool.push(true);
          } else {
            ppt_idx_bool.push(false);
          }
        });
  
        for (let i = 0; i < ppt_idx_bool.length; i++) {
          if (ppt_idx_bool[i]) {
            this.trial_data.chat_timestamps[i] = "ppt withdrew"
            this.trial_data.chat_messages[i] = "ppt withdrew"
            this.trial_data.chat_log[i]["timestamp"] = "ppt withdrew"
            this.trial_data.chat_log[i]["message"] = "ppt withdrew"
            this.trial_data.chat_log[i]["color"] = "ppt withdrew"
            }
          }  
        }
        //TODO: check if this works. specifically, if the rest of the data exists.
        this.jsPsych.finishTrial()
      }
    })

  }


}

export default JatosGroupChatPlugin;