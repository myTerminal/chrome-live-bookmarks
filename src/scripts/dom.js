/* global document */

// Function to load preference labels to DOM
export const createDomLoader = (search, domElement, onDone) =>
    value => {
        const bodyDom = document.body;

        bodyDom.className = `${bodyDom.className.replace(search, '')} ${value}`;
        domElement.innerText = value;

        if (onDone) {
            onDone(value);
        }
    };

// Function to apply scaling to bookmarks
export const applyScalingToBookmarks = parentDom => {
    const items = parentDom.querySelectorAll('.bookmark-item'),
        maxScale = 2,
        scaleDelta = (maxScale - 1) / items.length;

    items.forEach((t, i) => {
        t.style.fontSize = `${(scaleDelta * (items.length - i) + 1)}em`;
    });
};
