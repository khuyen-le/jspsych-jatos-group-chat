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
    chat_log_structured: {
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
    /** date and time, needs to be converted to string */
    participant_id: {
      type: ParameterType.STRING,
    },
    /** name of sender, needs to be converted to string. If a system message, then this should be `system_` + session_id */
    group_member_id: {
      type: ParameterType.STRING,
    }, 
    /** message that was sent */
    group_id: {
      type: ParameterType.STRING,
    }
  },
  // When you run build on your plugin, citations will be generated here based on the information in the CITATION.cff file.
  citations: '__CITATIONS__',
};

type Info = typeof info;

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

  constructor(private jsPsych: JsPsych) {}

  private params: TrialType<Info>;
  /** these private arrays should be updated as new messages come in */
  private chat_timestamps: string[]; 
  private chat_senders: string[];
  private chat_messages: string[];
  private chat_log_structured: object[];

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
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

    const quitStudyButton = display_element.querySelector("#jatos-quitStudyButton");

    quitStudyButton.addEventListener('click', () => {
      this.quit_study()
    }
  }

  /** this function should be called when participant clicks the Quit Study button */
  private quit_study() {
    var answer = confirm(this.params.quit_alert_text)
    if (answer){
      // get the member id of the participant who is quitting
      // @ts-expect-error
      let ppt_member_id = this.jatos.groupMemberId;
      // boolean array, store True for match, False for no match
      // this implementation allows the function to run in O(n)
      let ppt_idx_bool = [];
      this.chat_senders.forEach((sender_id, index) => {
        if (sender_id == ppt_member_id) {
          ppt_idx_bool.push(true);
        } else {
          ppt_idx_bool.push(false);
        }
      });

      for (let i = 0; i < ppt_idx_bool.length; i++) {
        if (ppt_idx_bool[i]) {
          this.chat_timestamps[i] = "ppt withdrew"
          this.chat_messages[i] = "ppt withdrew"
        }  
      }
      //TODO: check if this works. specifically, if the rest of the data exists.
      this.jsPsych.finishTrial()
    }
  }

  /** this function should be called when participant clicks the End Study button*/
  private end_study(response = null) {

    const trial_data = <any>{};
    trial_data.chat_timestamps = this.timestamps
    trial_data.chat_senders = this.senders
    trial_data.chat_messages = this.messages
    trial_data.chat_log_structured = this.chat_log_structured

    this.jsPsych.finishTrial(trial_data);
  }
}

export default JatosGroupChatPlugin;
