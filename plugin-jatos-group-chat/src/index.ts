import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

const info = <const>{
  name: "plugin-jspsych-jatos-waiting-room",
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
 * **plugin-jspsych-jatos-waiting-room**
 *
 * Implements a JATOS waiting room.
 *
 * @author Khuyen Le
 * @see {@link /plugin-jspsych-jatos-waiting-room/README.md}}
 */
class JspsychJatosWaitingRoomPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    var n_clicks = 0
    const html = `<div>
      <div id="jspsych-jatos-waiting-text">${trial.wait_text}</div>
      <button id="jspsych-jatos-join-btn" class="jspsych-btn">${trial.join_text}</button>
      <button id="jspsych-jatos-leave-btn" class="jspsych-btn">${trial.leave_text}</button>
      <p><span id="memberCounter">0</span>&nbsp;Members</p>

      </div>
    `
    display_element.innerHTML = html
    var join_button = display_element.querySelector("#jspsych-jatos-join-btn");
    join_button.addEventListener("click", () => {
      // alert('Join button was clicked!');
      // @ts-expect-error
      jatos.joinGroup({
        "onOpen": onOpen,
        "onMemberOpen": onMemberOpen,
        "onMessage": onMessage
      });
    });

    // What todo when jatos.js produces an error
    // @ts-expect-error
    jatos.onError(function(errorMsg) {
      console.log("Error: " + errorMsg);
    });

    var leave_button = display_element.querySelector("#jspsych-jatos-leave-btn");
    leave_button.addEventListener("click", () => {
      alert('Leave button was clicked!');
      n_clicks++;
    });

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

    function showMemberStatus() {
      // @ts-expect-error
      if (jatos.groupChannels && jatos.groupChannels.length > 0) {
      // @ts-expect-error
        display_element.querySelector("#memberCounter").textContent = jatos.groupChannels.length;
      } else {
        display_element.querySelector("#memberCounter").textContent = "0"
      }
    }

    showMemberStatus()
    
    if(n_clicks > 10){
      // data saving
      var trial_data = {
        data1: 99, // Make sure this type and name matches the information for data1 in the data object contained within the info const.
      };
      // end trial
      this.jsPsych.finishTrial(trial_data);
    }

  }
}

export default JspsychJatosWaitingRoomPlugin;
