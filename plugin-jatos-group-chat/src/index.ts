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
    },
    username_generator_function: {
      type: ParameterType.FUNCTION,
      default: null, // If left undefined, will just use JATOS group member ID
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

  private genMemberId(jatosGroupId : any): string {
    let memberId : string;
    let gen_func = this.params.username_generator_function;
    if (this.jatos && jatosGroupId) {
      memberId = gen_func ? gen_func(jatosGroupId) : jatosGroupId;
    } else {
      memberId = "LocalUser";
    }
    return memberId;
  }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    this.params = trial;
    // --- HTML Structure ---

        /* jatos-chat-content: Defines ID attribute to reference content included in the chat
         * jatos-chat-history: Defines container for chat log history
         * jatos-sendMsgForm: Creates form element
         * jatos-msgText: Defines input element to allow users to type messages
         * jatos-sendMsgButton: Defines button element for the 'Send' button
         * jatos-endStudyButton Defines button element for the 'End Study' button
         * jatos-quitStudyButton Defines button element for the 'Quit Study' button
         */

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


     /** 
     * Defines trial chat log global array to store data from chat log *
     */
    this.trial_data.chat_log = [];

    const appendToHistory = (text: string, color: string, isEvent = false) => 
       /** 
       * Defines constant that will iteratively append corresponding timestamps, messages, and member IDs to the chat log trial array *
       */
      const listItem = document.createElement("li");
      listItem.textContent = text;
      listItem.style.color = color;
      historyElement.appendChild(listItem);
      historyContainer.scrollTop = historyContainer.scrollHeight;
      if (!isEvent) {
        this.trial_data.chat_log.push({
          timestamp: new Date().toISOString(),
          sender: this.genMemberId(this.jatos.groupMemberId),
          message: text,
          color: color
        });
      } else {
        this.trial_data.chat_log.push({
          timestamp: new Date().toISOString(),
          sender: "system " + this.jatos.groupResultId,
          message: text,
          color: color
        });
      }
    };


     /** 
     * Defines current data and time *
     */
    const getTime = () => {
      return new Date(new Date().getTime()).toUTCString();
    };

    const stringToColour = (str: string) => {

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
      //this.trial_data.events.push({ type: "jatos_connected", timestamp: new Date().toISOString(), message: message });
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
      //this.trial_data.events.push({ type: "jatos_disconnected", timestamp: new Date().toISOString(), message: message });
      msgTextInput.disabled = true;
      sendMsgButton.disabled = true;
    };

    const onError = (error: string) => {
       /** 
       * Generates message that an error has occurred *
       * Appends error message to chat log history *
       */ 
      const message = "An error occurred: " + error;
      appendToHistory(message, errorColor, true);
      //this.trial_data.events.push({ type: "jatos_error", timestamp: new Date().toISOString(), error: String(error) });
    };

    const onMessage = (chatBundle: { groupMemberId: string; msg: string; }) => {
      const memberId : string = chatBundle && chatBundle.groupMemberId ? chatBundle.groupMemberId : "UnknownMember";
       /** 
       * Creates constant to define member ID in the chat *
       * Creates constant to define a received message *
       * Creates constant for each received message that defines the time and corresponding member ID of each message  *
       * Assigns random color to each member ID *
       * Appends message and member ID to chat log history *
       */ 
      const receivedMsg = chatBundle && chatBundle.msg ? chatBundle.msg : "[empty message]";
      const msg = `${getTime()} - ${memberId}: ${receivedMsg}`;
      const color = stringToColour(memberId);
      appendToHistory(msg, color);
    };

    const onMemberOpen = (memberId: string) => {
       /** 
       * Generates message indicating that a new member has joined the group chat along with their member ID *
       * Appends ID of new member and timestamp to chat log history *
       */ 
      const message = `A new member joined: ${memberId}`;
      appendToHistory(message, defaultColor, true);
    };

    const onMemberClose = (memberId: string) => {
       /** 
       * Generates message indicating that a specific member has left the group chat *
       * Appends ID of member who left and timestamp to chat log history *
       */ 
      const message = `${memberId} left`;
      appendToHistory(message, defaultColor, true);
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
      this.jatos.onError((error: string) => {
        const message = "jatos.onError (global): " + error;
        appendToHistory(message, errorColor, true);
        //this.trial_data.events.push({ type: "jatos_global_error", timestamp: new Date().toISOString(), error: String(error) });
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
      
      msgTextInput.value = "";
      const memberId : string = this.genMemberId(this.jatos.groupMemberId);
      const chatBundle : object = {
        msg: msg,
        groupMemberId: memberId,
      };

      /* Declare messageSentViaJatos as 'false'*/
      let messageSentViaJatos = false;
        
      /* Sends the message and records any errors that may arise */
      try {
        this.jatos.sendGroupMsg(chatBundle);
        messageSentViaJatos = true;
      } catch (e) {
        onError("Failed to send message via JATOS: " + (e.message || e));
      }      
      
      appendToHistory(`${getTime()} - You: ${msg}`, stringToColour(memberId));
    });

    endStudyButton.addEventListener('click', () => {
       /** 
       * When 'End Study' button is clicked, organize the study data and store in a 'data' object and end the trial *
       */ 
      const trial_data = {
        chat_log: this.trial_data.chat_log,
        chat_timestamps: this.trial_data.chat_timestamps, 
        chat_senders: this.trial_data.chat_senders,
        chat_messages: this.trial_data.chat_messages,
        participant_id: (this.jatos && this.jatos.workerId) ? this.jatos.workerId : null,
        group_member_id: this.genMemberId(this.jatos.groupMemberId),
        group_id: (this.jatos && this.jatos.groupResultId) ? this.jatos.groupResultId : null,
      };
      this.jsPsych.finishTrial(trial_data);
    });

    quitStudyButton.addEventListener('click', () => {
       /** 
       * When 'Quit Study' button is clicked, collect member ID, and replace trial data with "ppt_withdrew"*
       */ 
      var answer = confirm(this.params.quit_alert_text)
      if (answer){
        // get the member id of the participant who is quitting
        let ppt_member_id = this.genMemberId(this.jatos.groupMemberId);
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
          }  
        }
        //TODO: check if this works. specifically, if the rest of the data exists.
        this.jsPsych.finishTrial()
      }
    })

  }

}

export default JatosGroupChatPlugin;