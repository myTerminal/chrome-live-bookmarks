/* global require process chrome window document */

import { storage } from 'chrome-extension-helper';
import {
    switchToDarkTheme,
    switchToLightTheme
} from 'ample-alerts/build/scripts/ample-alerts.promises';

import {
    ItemTypes,
    ColorThemes,
    ItemsLayouts
} from './constants';
import {
    getSortedArrayByDescending,
    flattenTree,
    toggleProperty
} from './common';
import {
    createDomLoader,
    applyScalingToBookmarks
} from './dom';
import {
    createSaveSessionHandler,
    createClearAllSessionsHandler,
    onSessionItemClick,
    onSessionItemRenameAction,
    onSessionItemDeleteAction
} from './events';

import '../styles/styles.less';

const packageDetails = require('../../package.json');

// Function to render session items to the supplied Dom element
const renderSessionItems = (domElement, items, storedSessionsProperty) => {
    // Quit when the supplied collection is empty
    if (!items.length) {
        domElement.innerHTML = 'Your previously saved browser sessions appear here. You did not save any yet.';
        return;
    }

    // Create DOM string representing items
    const itemsDomStrings = items
        .map(
            ({ sessionName, urls }, i) => {
                const lengthLabel = urls.length === 1 ? `${urls.length} tab` : `${urls.length} tabs`;

                return `<div class="${ItemTypes.SESSION}" data-index="${i}" title="Restore ${lengthLabel}">
    <span class="session-item-label">${sessionName} - ${lengthLabel}</span>
    <span class="session-item-rename fas fa-pencil-alt" title="Rename"></span>
    <span class="session-item-delete fas fa-trash-alt" title="Delete"></span>
</div>`;
            }
        );

    // Assign DOM string to container
    domElement.innerHTML = itemsDomStrings.join('');

    // Attach event handlers to restore saved sessions
    domElement.querySelectorAll(`.${ItemTypes.SESSION}`)
        .forEach(
            (item, index) => {
                item.onclick = () => { onSessionItemClick(index, storedSessionsProperty); };

                item.querySelector('.session-item-rename')
                    .onclick = e => {
                        e.stopPropagation();
                        onSessionItemRenameAction(index, storedSessionsProperty);
                    };

                item.querySelector('.session-item-delete')
                    .onclick = e => {
                        e.stopPropagation();
                        onSessionItemDeleteAction(index, storedSessionsProperty);
                    };
            }
        );
};

// Function to render items of a particular type to a supplied Dom element
const renderUrlItems = (domElement, items, type, shouldAppend) => {
    // Quit when the supplied collection is empty
    if (!items.length) { return; }

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
    const colorThemeProperty = storage.createSyncedProperty(
        'color-theme',
        ColorThemes,
        createDomLoader(
            / (light|dark)/,
            document.querySelector('#color-theme'),
            v => { (v === 'dark' ? switchToDarkTheme : switchToLightTheme)(); }
        )
    );

    // Create preference property for items-layout
    const itemsLayoutProperty = storage.createSyncedProperty(
        'items-layout',
        ItemsLayouts,
        createDomLoader(
            / (list|pills)/,
            document.querySelector('#items-layout')
        )
    );

    // Create preference property for browser-sessions
    const storedSessionsProperty = storage.createSyncedProperty(
        'browser-sessions',
        [[]],
        value => { renderSessionItems(sessionsDom, value, storedSessionsProperty); }
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
        toggleProperty(colorThemeProperty, ColorThemes);
    };
    itemsLayoutSwitcher.onclick = () => {
        toggleProperty(itemsLayoutProperty, ItemsLayouts);
    };

    // Attach event to save current session
    saveCurrentSessionDom.onclick = createSaveSessionHandler(storedSessionsProperty);

    // Attach event to clear saved sessions
    clearSavedSessionsDom.onclick = createClearAllSessionsHandler(storedSessionsProperty);

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

// Start rendering the page
window.addEventListener('load', start);
