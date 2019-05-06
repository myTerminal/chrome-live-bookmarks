/* global require chrome window document */

import '../styles/styles.less';

const packageDetails = require('../../package.json');

const load = function () {
    const titleDom = document.querySelector('#title');
    const bookmarksBarDom = document.querySelector('#bookmarks-bar .items');
    const bookmarksDom = document.querySelector('#all-bookmarks .items');

    let bookmarkNodes = [];
    let urlBookmarks = [];
    let bookmarksBarBookmarks = [];
    let recentVisitedBookmarks = [];
    let recentlyHistoryItems = [];

    titleDom.innerText = `Chrome Live Bookmarks ${packageDetails.version}`;

    chrome.bookmarks.getTree(tree => {
        bookmarkNodes = flattenTree(tree[0]);
        urlBookmarks = bookmarkNodes.filter(n => n.url && n.url !== 'chrome://bookmarks/');
        bookmarksBarBookmarks = urlBookmarks.filter(n => n.parentId === '1');

        renderUrlItems(bookmarksBarDom, bookmarksBarBookmarks, itemType.bookmark);

        chrome.history.search(
            {
                text: '',
                maxResults: 100
            },
            items => {
                recentVisitedBookmarks = urlBookmarks
                    .filter(
                        u => items
                            .filter(i => i.url.indexOf(u.url) > -1)
                            .length
                    );
                recentlyHistoryItems = items
                    .filter(
                        h => !urlBookmarks
                            .filter(u => u.url === h.url)
                            .length
                    );

                renderUrlItems(bookmarksDom, recentVisitedBookmarks, itemType.bookmark);
                renderUrlItems(bookmarksDom, recentlyHistoryItems, itemType.history, true);
            }
        );
    });
};

const flattenTree = node =>
    [node]
        .concat(
            node.children
                ? node.children.map(
                    n => flattenTree(n)
                ).reduce(
                    (a, c) => a.concat(c),
                    []
                )
                : []
        );

const renderUrlItems = (domElement, items, type, shouldAppend) => {
    if (!items.length) {
        return;
    }

    const itemsDomString = items
        .sort((a, b) => {
            if (a.visitCount < b.visitCount) {
                return 1;
            } else if (a.visitCount > b.visitCount) {
                return -1;
            } else {
                return 0;
            }
        })
        .filter(i => i.title && i.url)
        .map(
            b => `<div class="${type === itemType.bookmark ? 'bookmark-item' : 'history-item'}"><a href="${b.url}" title="${b.url}">${b.title}</a></div>`
        )
        .join('');

    if (shouldAppend) {
        domElement.innerHTML += itemsDomString;
    } else {
        domElement.innerHTML = itemsDomString;
    }
};

const itemType = {
    bookmark: 1,
    history: 2
};

window.addEventListener('load', load);
