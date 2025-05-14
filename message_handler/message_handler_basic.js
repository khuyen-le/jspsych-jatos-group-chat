var jsPsychMessageHandlerPlugin = (function (jspsych) {
    'use strict';
    
    const info = {
    name: 'message-handler-plugin',
    version: "1.0.0",
    parameters: { 
        /** The path to the image file to display. */
        stimulus: {
            type: jspsych.ParameterType.HTML_STRING,
            default: void 0
          },
      },
    };

    class MessageHandlerPlugin {
        constructor(jsPsych){
            this.jsPsych = jsPsych;
          }
    static info = info;
    trial(display_element, trial){
        let html_content = `${trial.stimulus}`
      
        display_element.innerHTML = html_content;
      }
    }

    return MessageHandlerPlugin;

})(jsPsychModule);