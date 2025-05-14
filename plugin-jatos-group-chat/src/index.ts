import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

const info = <const>{
  name: "plugin-jatos-group-chat",
  version: version,
  parameters: {
    /** All the text */
    end_text: {
      type: ParameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
      default: "End Study",
    },
    quit_text: {
      type: ParameterType.STRING,
      default: "Quit Study"
    },
    quit_alert_text: {
      type: ParameterType.STRING,
      default: "Are you sure you want to quit the study?"
    },
    send_text: {
      type: ParameterType.STRING, 
      default: "Send",
    },
    message_placeholder: {
      type: ParameterType.STRING, 
      default: "Your message ...",
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
    /** date and time, needs to be converted to string */
    timestamp: {
      type: ParameterType.STRING,
    },
    /** name of sender, needs to be converted to string. If a system message, then this should be `system_` + session_id */
    sender: {
      type: ParameterType.STRING,
    }, 
    /** message that was sent */
    message: {
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
  private timestamps: string[]; 
  private senders: string[];
  private messages: string[];

  trial(display_element: HTMLElement, trial: TrialType<Info>) {

    const html = `<div>
      <div id="jspsych-waiting-text">${trial.wait_text}</div>
      <button id="jspsych-join-btn" class="jspsych-btn">${trial.join_text}</button>
      <button id="jspsych-leave-btn" class="jspsych-btn">${trial.leave_text}</button>
      <p><span id="jspsych-member-counter">0</span>&nbsp;Members</p>
      </div>
    `
    display_element.innerHTML = html

    function showMemberStatus() {
      // @ts-expect-error
      if (jatos.groupChannels && jatos.groupChannels.length > 0) {
      // @ts-expect-error
        display_element.querySelector("#jspsych-member-counter").textContent = jatos.groupChannels.length;
      } else {
        display_element.querySelector("#jspsych-member-counter").textContent = "0"
      }
    }

    showMemberStatus()

    var join_button = display_element.querySelector("#jspsych-join-btn");
    join_button.addEventListener("click", () => {
      // @ts-expect-error
      jatos.joinGroup({
        "onOpen": onOpen,
        "onMemberOpen": onMemberOpen,
        "onMessage": onMessage
      });
    });

    /** These three functions are mainly to troubleshoot, remove in the final version */
    function onOpen() {
      showMemberStatus()
      console.log("You joined a group and opened a group channel");
    }
    
    function onMemberOpen(memberId) {
      showMemberStatus()
      console.log("In our group another member (ID " + memberId + ") opened a group channel");
    }
    
    function onMessage(msg) {
      showMemberStatus()
      console.log("You received a message: " + msg);
    }
    
    // What todo when jatos.js produces an error
    // @ts-expect-error
    jatos.onError(function(errorMsg) {
      console.log("Error: " + errorMsg);
    });
    
    var leave_button = display_element.querySelector("#jspsych-leave-btn");
    leave_button.addEventListener("click", () => {
      // data saving
      var trial_data = {
        data1: 99, // Make sure this type and name matches the information for data1 in the data object contained within the info const.
      };
      // end trial
      this.jsPsych.finishTrial(trial_data);
    });

    if(1 < 0){
      // data saving
      var trial_data = {
        data1: 99, // Make sure this type and name matches the information for data1 in the data object contained within the info const.
      };
      // end trial
      this.jsPsych.finishTrial(trial_data);
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
      this.senders.forEach((sender_id, index) => {
        if (sender_id == ppt_member_id) {
          ppt_idx_bool.push(true);
        } else {
          ppt_idx_bool.push(false);
        }
      });

      for (let i = 0; i < ppt_idx_bool.length; i++) {
        if (ppt_idx_bool[i]) {
          this.timestamps[i] = "ppt withdrew"
          this.messages[i] = "ppt withdrew"
        }  
      }
      //TODO: check if this works. specifically, if the rest of the data exists.
      this.jsPsych.finishTrial()
    }
  }

  /** this function should be called when participant clicks the End Study button*/
  private end_study(response = null) {

    const trial_data = <any>{};
    trial_data.timestamp = this.timestamps
    trial_data.senders = this.senders
    trial_data.messages = this.messages

    this.jsPsych.finishTrial(trial_data);
  }
}

export default JatosGroupChatPlugin;
