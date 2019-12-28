/* global require process chrome window document */

import { storage } from 'chrome-extension-helper';
import {
    prompt,
    switchToDarkTheme,
    switchToLightTheme
} from 'ample-alerts/build/scripts/ample-alerts.promises';

import {
    ItemTypes,
    ColorThemes,
    ItemsLayouts
} from './constants';
import { getSortedArrayByDescending } from './common';

import '../styles/styles.less';

const packageDetails = require('../../package.json');

const start = () => {
    // Get reference to DOM elements
    const titleDom = document.querySelector('#title #title-text'),
        bookmarksBarDom = document.querySelector('#bookmarks-bar .items'),
        sessionsDom = document.querySelector('#browser-sessions .items'),
        saveCurrentSessionDom = document.querySelector('#save-session'),
        clearSavedSessionsDom = document.querySelector('#clear-sessions'),
        bookmarksDom = document.querySelector('#all-bookmarks .items'),
        colorThemeSwitcher = document.querySelector('#color-theme'),
        itemsLayoutSwitcher = document.querySelector('#items-layout'),
        togglePreferencesButtonDom = document.querySelector('#toggle-preferences'),
        preferencesDom = document.querySelector('#preferences'),
        preferencesBackdrop = document.querySelector('#preferences .backdrop');

    // Create local variables
    let bookmarkNodes = [],
        urlBookmarks = [],
        bookmarksBarBookmarks = [],
        recentVisitedBookmarks = [],
        recentlyHistoryItems = [];

    // Initialize storage helper
    storage.initializeStorage();

    // Create preference property for color-theme
    const colorThemePreference = storage.createSyncedProperty(
        'color-theme',
        ColorThemes,
        createDomLoader(
            / (light|dark)/,
            document.querySelector('#color-theme'),
            v => {
                if (v === 'dark') {
                    switchToDarkTheme();
                } else {
                    switchToLightTheme();
                }
            }
        )
    );

    // Create preference property for items-layout
    const itemsLayoutPreference = storage.createSyncedProperty(
        'items-layout',
        ItemsLayouts,
        createDomLoader(
            / (list|pills)/,
            document.querySelector('#items-layout')
        )
    );

    // Create preference property for browser-sessions
    const storedBrowserSessions = storage.createSyncedProperty(
        'browser-sessions',
        ['[]'],
        value => {
            renderSessionItems(sessionsDom, value, storedBrowserSessions);
        }
    );

    // Set the title
    titleDom.innerText = `Chrome Live Bookmarks (${packageDetails.version})${process.env.NODE_ENV === 'development' ? ' [DEBUG]' : ''}`;

    // Attach event to toggle preferences
    togglePreferencesButtonDom.onclick = () => {
        preferencesDom.className += ' visible';
    };
    preferencesBackdrop.onclick = () => {
        preferencesDom.className = preferencesDom.className.replace(' visible', '');
    };

    // Set listeners to toggle preference items
    colorThemeSwitcher.onclick = () => {
        toggleProperty(colorThemePreference, ColorThemes);
    };
    itemsLayoutSwitcher.onclick = () => {
        toggleProperty(itemsLayoutPreference, ItemsLayouts);
    };

    // Attach event to save current session
    saveCurrentSessionDom.onclick = () => {
        prompt(
            'What would you like to name the session?',
            {
                defaultResponse: `Session ${(new Date()).getTime()}`,
                isModal: true
            }
        ).then(
            sessionName => {
                chrome.tabs.query(
                    { currentWindow: true },
                    tabs => {
                        // Create an array of tab URLs
                        const tabUrlsToSave = tabs.map(t => t.url)
                            .filter(s => s !== 'chrome://newtab/'); // Ignore chrome://newtab

                        // Skip if there's no tab to be saved
                        if (!tabUrlsToSave.length) {
                            return;
                        }

                        // Get current value
                        storedBrowserSessions.get(
                            value => {
                                // Store current session along with previously stored sessions
                                storedBrowserSessions.set(
                                    JSON.stringify(
                                        [{ name: sessionName, urls: tabUrlsToSave }]
                                            .concat(JSON.parse(value))
                                    )
                                );
                            }
                        );
                    }
                );
            }
        );
    };

    // Attach event to clear saved sessions
    clearSavedSessionsDom.onclick = () => {
        storedBrowserSessions.set('[]');
    };

    // Read bookmarks
    chrome.bookmarks.getTree(tree => {
        // Get flat bookmarks collection
        bookmarkNodes = flattenTree(tree[0]);

        // Extract all url based bookmarks (exluding folder items)
        urlBookmarks = bookmarkNodes.filter(n => n.url && n.url !== 'chrome://bookmarks/');

        // Extract bookmarks on bookmarks bar
        bookmarksBarBookmarks = urlBookmarks.filter(n => n.parentId === '1');

        // Render bookmarks from bookmarks bar
        renderUrlItems(bookmarksBarDom, bookmarksBarBookmarks, ItemTypes.BOOKMARK);

        // Retrieve recent visits from history
        chrome.history.search(
            { text: '', maxResults: 100 },
            items => {
                // Determine recently visited bookmarks
                recentVisitedBookmarks = items
                    .filter(
                        i => urlBookmarks
                            .filter(u => i.url.indexOf(u.url) > -1)
                            .length
                    );

                // Filter non-bookmark history items
                recentlyHistoryItems = items
                    .filter(
                        h => !urlBookmarks
                            .filter(u => u.url === h.url)
                            .length
                    );

                // Populate list with bookmarks and history items
                renderUrlItems(bookmarksDom, recentVisitedBookmarks, ItemTypes.BOOKMARK);
                renderUrlItems(bookmarksDom, recentlyHistoryItems, ItemTypes.HISTORY, true);

                // Apply visual scaling to bookmarks
                applyScalingToBookmarks(bookmarksDom);

                // Mark 'ready' state
                document.body.className += ' ready';
            }
        );
    });
};

// Function to flatten bookmark under a node into a collection
const flattenTree = node =>
    [node]
        .concat(
            node.children
                ? node.children
                    .map(n => flattenTree(n))
                    .reduce((a, c) => a.concat(c), [])
                : []
        );

// Function to render session items to the supplied Dom element
const renderSessionItems = (domElement, items, storedBrowserSessions) => {
    // Parse JSON string
    const parsedItems = JSON.parse(items);

    // Quit when the supplied collection is empty
    if (!parsedItems.length) {
        domElement.innerHTML = 'Your previously saved browser sessions appear here. You did not save any yet.';
        return;
    }

    // Create DOM string representing items
    const itemsDomString = parsedItems
        .map(
            ({ name, urls }, i) => {
                const lengthLabel = urls.length === 1 ? `${urls.length} tab` : `${urls.length} tabs`;

                return `<div class="${ItemTypes.SESSION}" data-index="${i}" title="Restore ${lengthLabel}">${name} - ${lengthLabel}</div>`;
            }
        )
        .join('');

    // Assign DOM string to container
    domElement.innerHTML = itemsDomString;

    // Attach event handlers to restore saved sessions
    domElement.querySelectorAll(`.${ItemTypes.SESSION}`)
        .forEach(
            item => {
                item.onclick = e => {
                    const itemIndex = +e.target.getAttribute('data-index');

                    storedBrowserSessions.get(
                        value => {
                            // Determine the selected session
                            const selectedSession = JSON.parse(value)[itemIndex];

                            restoreSession(selectedSession.urls);
                        }
                    );
                };
            }
        );
};

const restoreSession = urlsToRestore => {
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

// Function to render items of a particular type to a supplied Dom element
const renderUrlItems = (domElement, items, type, shouldAppend) => {
    // Quit when the supplied collection is empty
    if (!items.length) {
        return;
    }

    // Create DOM string representing items
    const itemsDomString = getSortedArrayByDescending(items, 'visitCount')
        .filter(i => i.title && i.url)
        .map(
            b => `
<div class="${type}">
  <a href="${b.url}" title="${b.url}">
    <span class="title">${b.title}</span>
    <span class="url">&nbsp;[${b.url}]</span>
  </a>
  <a class="fas fa-external-link-alt" href="${b.url}" target="_blank" title="Open in a new tab"></a>
</div>`
        )
        .join('');

    // Append or assign DOM string to container
    if (shouldAppend) {
        domElement.innerHTML += itemsDomString;
    } else {
        domElement.innerHTML = itemsDomString;
    }
};

// Function to apply scaling to bookmarks
const applyScalingToBookmarks = parentDom => {
    const items = parentDom.querySelectorAll('.bookmark-item'),
        maxScale = 2,
        scaleDelta = (maxScale - 1) / items.length;

    items.forEach((t, i) => {
        t.style.fontSize = `${(scaleDelta * (items.length - i) + 1)}em`;
    });
};

// Function to toggle a preference
const toggleProperty = (property, values) => {
    property.get(
        currentValue => {
            const projectedValue = currentValue === values[0]
                ? values[1]
                : values[0];

            property.set(projectedValue);
        }
    );
};

// Function to load preference labels to DOM
const createDomLoader = (search, domElement, onDone) =>
    value => {
        const bodyDom = document.body;

        bodyDom.className = `${bodyDom.className.replace(search, '')} ${value}`;
        domElement.innerText = value;

        if (onDone) {
            onDone(value);
        }
    };

// Start rendering the page
window.addEventListener('load', start);
