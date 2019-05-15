/* global chrome document */

import { ColorThemes, ItemsLayouts, StorageKeys } from './constants';

export const get = {
    [StorageKeys.COLORTHEME]: onDone => {
        chrome.storage.sync.get(
            [
                StorageKeys.COLORTHEME
            ],
            values => {
                onDone(values[StorageKeys.COLORTHEME] || ColorThemes.LIGHT);
            }
        );
    },
    [StorageKeys.ITEMSLAYOUT]: onDone => {
        chrome.storage.sync.get(
            [
                StorageKeys.ITEMSLAYOUT
            ],
            values => {
                onDone(values[StorageKeys.ITEMSLAYOUT] || ItemsLayouts.LIST);
            }
        );
    }
};

export const load = {
    [StorageKeys.COLORTHEME]: value => {
        const bodyDom = document.body;

        bodyDom.className = bodyDom.className
            .replace(/ (light|dark)/, '')
            + ` ${value}`;

        document.querySelector('#color-theme').innerText = value;
    },
    [StorageKeys.ITEMSLAYOUT]: value => {
        const bodyDom = document.body;

        bodyDom.className = bodyDom.className
            .replace(/ (list|pills)/, '')
            + ` ${value}`;

        document.querySelector('#items-layout').innerText = value;
    }
};

export const set = {
    [StorageKeys.COLORTHEME]: (value, onDone) => {
        chrome.storage.sync.set(
            {
                [StorageKeys.COLORTHEME]: value
            },
            onDone
        );
    },
    [StorageKeys.ITEMSLAYOUT]: (value, onDone) => {
        chrome.storage.sync.set(
            {
                [StorageKeys.ITEMSLAYOUT]: value
            },
            onDone
        );
    }
};
