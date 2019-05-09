/* global chrome document */

import { ColorThemes, StorageKeys } from './constants';

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
    }
};

export const load = {
    [StorageKeys.COLORTHEME]: value => {
        const bodyDom = document.body;

        bodyDom.className = bodyDom.className
            .replace(/(light|dark)/, '')
            + value;

        document.querySelector('#color-theme').innerText = value;
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
    }
};
