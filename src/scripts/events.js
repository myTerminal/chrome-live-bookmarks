/* global chrome */

import {
    alert,
    confirm,
    prompt
} from 'ample-alerts/build/scripts/ample-alerts.promises';

import { restoreSession } from './actions';

// Function to create an event-handler to save current session
export const createSaveSessionHandler = storedSessionsProperty =>
    () => {
        prompt(
            'What would you like to name the session?',
            { isModal: true, defaultResponse: `Session ${(new Date()).getTime()}` }
        ).then(
            sessionName => {
                chrome.tabs.query(
                    { currentWindow: true },
                    tabs => {
                        // Create an array of tab URLs
                        const tabUrlsToSave = tabs.map(t => t.url)
                            .filter(s => s !== 'chrome://newtab/'); // Ignore chrome://newtab

                        // Skip if there's no tab to be saved
                        if (!tabUrlsToSave.length) { return; }

                        // Get current value
                        storedSessionsProperty.get(
                            value => {
                                // Store current session along with previously stored sessions
                                storedSessionsProperty.set(
                                    [{ sessionName, urls: tabUrlsToSave }]
                                        .concat(value)
                                );
                            }
                        );
                    }
                );
            }
        );
    };

// Function to create an event-handler to clear all saved sessions
export const createClearAllSessionsHandler = storedSessionsProperty =>
    () => {
        confirm(
            'Delete all saved sessions?',
            { isModal: true }
        ).then(
            () => { storedSessionsProperty.set([]); }
        );
    };

// Event-handler for session item select
export const onSessionItemClick = (itemIndex, storedSessionsProperty) => {
    storedSessionsProperty.get(
        values => { restoreSession(values[itemIndex].urls); }
    );
};

// Event-handler for session item rename
export const onSessionItemRenameAction = (itemIndex, storedSessionsProperty) => {
    prompt(
        'Enter a new name for the session',
        { isModal: true }
    ).then(
        newName => {
            // Abort rename if no name is provided
            if (!newName) {
                alert(
                    'Session not renamed',
                    { autoClose: 2000 }
                );
                return;
            }

            storedSessionsProperty.get(
                values => {
                    storedSessionsProperty.set(
                        values.map(
                            (session, i) =>
                                (i === itemIndex ? { ...session, sessionName: newName } : session)
                        )
                    );
                }
            );
        }
    );
};

// Event-handler for session item delete
export const onSessionItemDeleteAction = (itemIndex, storedSessionsProperty) => {
    confirm(
        'Delete the saved session?',
        { isModal: true }
    ).then(
        () => {
            storedSessionsProperty.get(
                values => {
                    storedSessionsProperty.set(
                        values.filter(
                            (v, i) => i !== itemIndex
                        )
                    );
                }
            );
        }
    );
};
