/* global require chrome window document */

import '../styles/styles.less';

const packageDetails = require('../../package.json');

const load = function () {
    document.querySelector('#title').innerText = `Chrome Live Bookmarks ${packageDetails.version}`;
};

window.addEventListener('load', load);
