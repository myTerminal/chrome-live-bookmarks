/* global require chrome window document */

import '../styles/styles.less';

const packageDetails = require('../../package.json');

const load = function () {
    const titleDom = document.querySelector('#title');
    const bookmarksBarDom = document.querySelector('#bookmarks-bar');
    const bookmarksDom = document.querySelector('#all-bookmarks');

    let bookmarkNodes = [];
    let urlBookmarks = [];
    let bookmarksBarBookmarks = [];
    let recentVisitedBookmarks = [];

    titleDom.innerText = `Chrome Live Bookmarks ${packageDetails.version}`;

    chrome.bookmarks.getTree(tree => {
        bookmarkNodes = flattenTree(tree[0]);
        urlBookmarks = bookmarkNodes.filter(n => n.url && n.url !== 'chrome://bookmarks/');
        bookmarksBarBookmarks = urlBookmarks.filter(n => n.parentId === '1');

        renderUrlBookmarks(bookmarksBarDom, bookmarksBarBookmarks);

        chrome.history.search(
            {
                text: '',
                maxResults: 50
            },
            items => {
                recentVisitedBookmarks = items
                    .filter(
                        i => urlBookmarks
                            .filter(
                                u => u.url.indexOf(i.url) > -1
                            )
                            .length
                    );

                renderUrlBookmarks(bookmarksDom, recentVisitedBookmarks);
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

const renderUrlBookmarks = (domElement, bookmarks) => {
    domElement.innerHTML += bookmarks
        .sort((a, b) => {
            if (a.visitCount < b.visitCount) {
                return 1;
            } else if (a.visitCount > b.visitCount) {
                return -1;
            } else {
                return 0;
            }
        })
        .map(
            b => `<div class="bookmark-item"><a href="${b.url}">${b.title}</a></div>`
        )
        .join('');
};

window.addEventListener('load', load);
