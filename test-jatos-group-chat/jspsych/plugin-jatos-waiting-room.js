var jsPsychPluginJatosWaitingRoom = (function (jspsych) {
  'use strict';

  var version = "0.0.1";

  const info = {
    name: "plugin-jatos-waiting-room",
    version,
    parameters: {
      /** Provide a clear description of the parameter_name that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
      min_n_people: {
        type: jspsych.ParameterType.INT,
        default: 2
      },
      join_text: {
        type: jspsych.ParameterType.STRING,
        // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: "JOIN"
      },
      leave_text: {
        type: jspsych.ParameterType.STRING,
        // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: "LEAVE"
      },
      wait_text: {
        type: jspsych.ParameterType.STRING,
        // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: "Waiting..."
      },
      n_people_waiting: {
        type: jspsych.ParameterType.INT,
        // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, KEYS, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: 0
      }
    },
    data: {
      /** actually doesn't need any data back, I think... */
      /** Provide a clear description of the data1 that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
      data1: {
        type: jspsych.ParameterType.INT
      }
    },
    // When you run build on your plugin, citations will be generated here based on the information in the CITATION.cff file.
    citations: {
      "apa": "Khuyen Le Khuyen Le, K. L. (2023). {title}. Journal for Open Source Software, 1(1), 1. https://doi.org/10.21105/joss.12345 ",
      "bibtex": "@article{Khuyen2023title, 	author = {Khuyen Le Khuyen Le, Khuyen Le}, 	journal = {Journal for Open Source Software}, 	doi = {10.21105/joss.12345}, 	issn = {1234-5678}, 	number = {1}, 	year = {2023}, 	month = {may 11}, 	pages = {1}, 	publisher = {Open Journals}, 	title = {\\textbraceleft{}title\\textbraceright{}}, 	url = {{linkToPublicationInJournal}}, 	volume = {1}, }  "
    }
  };
  class JatosWaitingRoomPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
      const html = `<div>
      <div id="jspsych-waiting-text">${trial.wait_text}</div>
      <button id="jspsych-join-btn" class="jspsych-btn">${trial.join_text}</button>
      <button id="jspsych-leave-btn" class="jspsych-btn">${trial.leave_text}</button>
      <p><span id="jspsych-member-counter">0</span>&nbsp;Members</p>
      </div>
    `;
      display_element.innerHTML = html;
      function showMemberStatus() {
        if (jatos.groupChannels && jatos.groupChannels.length > 0) {
          display_element.querySelector("#jspsych-member-counter").textContent = jatos.groupChannels.length;
        } else {
          display_element.querySelector("#jspsych-member-counter").textContent = "0";
        }
      }
      showMemberStatus();
      var join_button = display_element.querySelector("#jspsych-join-btn");
      join_button.addEventListener("click", () => {
        jatos.joinGroup({
          "onOpen": onOpen,
          "onMemberOpen": onMemberOpen,
          "onMessage": onMessage
        });
      });
      function onOpen() {
        showMemberStatus();
        console.log("You joined a group and opened a group channel");
      }
      function onMemberOpen(memberId) {
        showMemberStatus();
        console.log("In our group another member (ID " + memberId + ") opened a group channel");
      }
      function onMessage(msg) {
        showMemberStatus();
        console.log("You received a message: " + msg);
      }
      jatos.onError(function(errorMsg) {
        console.log("Error: " + errorMsg);
      });
      var leave_button = display_element.querySelector("#jspsych-leave-btn");
      leave_button.addEventListener("click", () => {
        var trial_data2 = {
          data1: 99
          // Make sure this type and name matches the information for data1 in the data object contained within the info const.
        };
        this.jsPsych.finishTrial(trial_data2);
      });
    }
  }

  return JatosWaitingRoomPlugin;

})(jsPsychModule);
//# sourceMappingURL=index.browser.js.map
