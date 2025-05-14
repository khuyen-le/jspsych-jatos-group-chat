
var JatosGroupChatPlugin = (function() {
    // Define the plugin info (using jsPsych v7 string types for parameters)
    const info = {
        name: "jatos-group-chat",
        description: "A jsPsych plugin for a real-time group chat using JATOS.",
        parameters: {
            prompt: {
                type: 'html-string', 
                pretty_name: "Prompt",
                default: "Your message ...",
                description: "The placeholder text for the message input field."
            },
            button_label_send: {
                type: 'string',
                pretty_name: "Button label Send",
                default: "Send",
                description: "The label for the send message button."
            },
            button_label_end_study: {
                type: 'string', 
                pretty_name: "Button label End Study",
                default: "End Study",
                description: "The label for the end study button."
            },
            on_finish: {
                type: 'function', 
                pretty_name: "On finish",
                default: null,
                description: "A function to be called when the trial finishes. Receives the trial data as an argument."
            }
        },
    };

    // Define the plugin class
    class JatosGroupChatPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
            this.trial_data = {}; // To store chat history and other relevant data
            this.jatos = window.jatos; // Assuming JATOS is loaded globally
        }

        trial(display_element, trial) {
            // --- HTML Structure ---
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

            // --- Styling (optional, can be moved to CSS file) ---
            const style = document.createElement('style');
            style.textContent = `
                #jatos-chat-history ul { list-style-type: none; padding: 0; margin: 0; }
                #jatos-chat-history li { margin-bottom: 5px; }
                /* Ensure .pure-g and .pure-u-2-3 are defined if PureCSS is used, or adjust styles: */
                /* Example basic flex layout if not using PureCSS for these specific elements: */
                /* .pure-g { display: flex; flex-direction: column; } */
                /* .pure-u-2-3 { width: 100%; } */
                /* If using PureCSS, ensure it's linked in your main HTML. */
                /* The following are attempts to make .pure-u-2-3 behave as intended with flex */
                 .pure-g { display: flex; }
                 .pure-u-2-3 { flex-basis: 66.666%; max-width: 66.666%; box-sizing: border-box; }
                 #jatos-sendMsgForm .pure-input-2-3 { width: calc(100% - 80px); /* Adjust width based on button size */ margin-right: 5px; }
                 #jatos-sendMsgForm .pure-button-primary { width: 70px; /* Example fixed width */ }
            `;
            display_element.prepend(style);


            // --- Chat Logic ---
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
                        timestamp: new Date().toISOString(),
                        message: text,
                        color: color
                    });
                }
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
                this.trial_data.events.push({ type: "jatos_connected", timestamp: new Date().toISOString(), message: message });
                msgTextInput.focus();
            };

            const onClose = () => {
                const message = "You are disconnected.";
                appendToHistory(message, defaultColor, true);
                this.trial_data.events.push({ type: "jatos_disconnected", timestamp: new Date().toISOString(), message: message });
                msgTextInput.disabled = true;
                sendMsgButton.disabled = true;
            };

            const onError = (error) => {
                const message = "An error occurred: " + error;
                appendToHistory(message, errorColor, true);
                this.trial_data.events.push({ type: "jatos_error", timestamp: new Date().toISOString(), error: String(error) });
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
                this.trial_data.events.push({ type: "jatos_member_joined", timestamp: new Date().toISOString(), memberId: memberId });
            };

            const onMemberClose = (memberId) => {
                const message = `${memberId} left`;
                appendToHistory(message, defaultColor, true);
                this.trial_data.events.push({ type: "jatos_member_left", timestamp: new Date().toISOString(), memberId: memberId });
            };

            // --- JATOS Integration ---
            if (this.jatos && typeof this.jatos.isJatosRun === 'function' && this.jatos.isJatosRun()) {
                this.jatos.onLoad(() => {
                    this.jatos.joinGroup({
                        onOpen: onOpen,
                        onClose: onClose,
                        onError: onError,
                        onMessage: onMessage,
                        onMemberOpen: onMemberOpen,
                        onMemberClose: onMemberClose,
                    });

                    this.jatos.onError((error) => {
                        const message = "jatos.onError global: " + error;
                        appendToHistory(message, errorColor, true);
                        this.trial_data.events.push({ type: "jatos_global_error", timestamp: new Date().toISOString(), error: String(error) });
                    });
                });
            } else {
                const notInJatosMsg = "Not running in JATOS environment or JATOS not fully loaded. Chat functionality will be limited.";
                appendToHistory(notInJatosMsg, errorColor, true);
                this.trial_data.events.push({ type: "environment_notice", timestamp: new Date().toISOString(), message: notInJatosMsg });
                msgTextInput.disabled = true;
                sendMsgButton.disabled = true;
            }


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

                let canSend = false;
                if (this.jatos && typeof this.jatos.isJatosRun === 'function' && this.jatos.isJatosRun()) {
                    if (this.jatos.group && this.jatos.group.isChannelOpen()) { // Check if group channel is open
                        try {
                            this.jatos.sendGroupMsg(chatBundle);
                            canSend = true;
                        } catch (e) {
                            onError("Failed to send message: " + (e.message || e));
                        }
                    } else if (!this.jatos.group) {
                        appendToHistory("Cannot send message: JATOS group object not available.", errorColor, true);
                    } else {
                        appendToHistory("Cannot send message: JATOS group channel not open.", errorColor, true);
                    }
                } else {
                     appendToHistory("Cannot send message: Not connected to JATOS group or JATOS not fully loaded.", errorColor, true);
                }

                // Always append to local history for the user who sent it.
                appendToHistory(`${getTime()} - You: ${msg}`, stringToColour(memberId));
            });

            endStudyButton.addEventListener('click', () => {
                const data = {
                    chat_history_raw: Array.from(historyElement.children).map(li => li.textContent),
                    chat_log_structured: this.trial_data.chat_log,
                    jatos_events: this.trial_data.events,
                    participant_id: (this.jatos && this.jatos.workerId) ? this.jatos.workerId : null,
                    group_member_id: (this.jatos && this.jatos.groupMemberId) ? this.jatos.groupMemberId : null,
                    group_id: (this.jatos && this.jatos.groupResultId) ? this.jatos.groupResultId : null,
                };

                display_element.innerHTML = '';
                this.jsPsych.finishTrial(data);

                if (trial.on_finish) {
                    trial.on_finish(data);
                }
            });
        }
    }

    JatosGroupChatPlugin.info = info; // Assign the info to the class

    // Make the plugin class globally available for jsPsych
    // jsPsych looks for the class name directly if it's not in jsPsych.plugins
    if (typeof window.JatosGroupChatPlugin === 'undefined') {
        window.JatosGroupChatPlugin = JatosGroupChatPlugin;
    }
    // For compatibility with older jsPsych versions or if you prefer to use the
    // jsPsych.plugins object:
    // if (typeof jsPsych !== 'undefined' && typeof jsPsych.plugins !== 'undefined') {
    //  jsPsych.plugins['jatos-group-chat'] = JatosGroupChatPlugin;
    // }

})(); // Immediately Invoked Function Expression (IIFE)