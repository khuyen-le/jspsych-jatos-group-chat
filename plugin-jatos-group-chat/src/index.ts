import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

const info = <const>{
  name: "plugin-jatos-group-chat",
  version: version,
  parameters: {
    /** Provide a clear description of the parameter_name that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
    min_n_people: {
      type: ParameterType.INT, 
      default: 2,
    },
    join_text: {
      type: ParameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
      default: "JOIN",
    },
    leave_text: {
      type: ParameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
      default: "LEAVE",
    },
    wait_text: {
      type: ParameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
      default: "Waiting...",
    },
    n_people_waiting: {
      type: ParameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
      default: 0
    },
  },
  data: {
    /** actually doesn't need any data back, I think... */
    /** Provide a clear description of the data1 that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
    data1: {
      type: ParameterType.INT,
    },
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
}

export default JatosGroupChatPlugin;
