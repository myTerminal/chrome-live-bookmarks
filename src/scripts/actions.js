/* global chrome */

// Function to restore session with a set of URLs
export const restoreSession = urlsToRestore => {
    chrome.windows.create(
        window => {
            // Extract the window id
            const windowId = window.id;

            // Navigate to the first URL in the current tab
            chrome.tabs.update(
                window.tabs[0].id,
                {
                    url: urlsToRestore[0]
                }
            );

            // Open the rest of the URLs in new tabs
            urlsToRestore.slice(1).forEach(
                url => {
                    chrome.tabs.create(
                        {
                            windowId,
                            url
                        }
                    );
                }
            );
        }
    );
};

// To suppress ESLint warning about single export
export const dummy = null;
