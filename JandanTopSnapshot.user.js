// ==UserScript==
// @name                Jandan Top Snapshot
// @name:zh             煎蛋热榜快照
// @namespace           https://github.com/seiuneko/JandanTopSnapshot
// @match               https://jandan.net/top*
// @version             2.1.0
// @description:zh      为煎蛋热榜添加快照功能
// @icon                data:image/webp;base64,UklGRnoAAABXRUJQVlA4TG4AAAAv/8A/EC+gkG0E6PxzcOfxKZwGmbRNPNb/Nx9T0LYN0zdE48/szX8A+H2AivbegKK2jaShMBSGwlJYCsMfzbXXs9uI/k+AHDtDeTYOq/N4dl3cpsfjM1t+j3PxldL//4Je3s/LfB39v3Asp/8AGw==
// @run-at              document-idle
// @grant               GM.getValue
// @grant               GM.setValue
// @grant               GM.deleteValue
// @grant               GM.listValues
// @grant               GM.addStyle
// @downloadURL         https://github.com/seiuneko/JandanTopSnapshot/raw/master/JandanTopSnapshot.user.js
// @supportURL          https://github.com/seiuneko/JandanTopSnapshot/issues
// @homepageURL         https://github.com/seiuneko/JandanTopSnapshot
// ==/UserScript==
'use strict';

const $ = unsafeWindow.$;
const jandanAppSelector = '.post > div:nth-child(1)';
const vueRoot = document.querySelector(jandanAppSelector).__vue__.$root;
if (!vueRoot) {
    throw new Error("无法获取页面Vue实例");
}

const tabTitleMap = {
    '4hr': '4小时热门',
    'pic': '热榜',
    'treehole': '树洞',
    '3days': '3日最佳',
    '7days': '7日最佳',
}
const getCurrentTab = (tab) => tabTitleMap[tab] || '未知';

const dateTimeFormat = new Intl.DateTimeFormat('sv', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

Date.prototype.toISOLocaleString = function () {
    return dateTimeFormat.format(this);
};

// language=CSS
const STYLES = `
    .snapshot-main {
        flex-direction: column;
        position: sticky;
        top: 0;
    }

    .snapshot-action {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        margin-bottom: 1rem;
    }

    .snapshot-btn {
        margin: 5px;
        border-radius: 0;
        background-color: #e5e5e5;
        border: none;
        font-size: smaller;
        padding: 5px;
    }

    ol#snapshot-list {
        max-height: 50vh;
        overflow: scroll;
        scrollbar-width: thin;
        counter-reset: list-item;
    }

    #snapshot-list::-webkit-scrollbar {
        width: 4px;
    }

    #snapshot-list a {
        font-size: smaller;
    }

    #snapshot-list > li {
        display: flex;
        align-items: center;
        font-family: 'Sarasa Mono SC Medium', monospace;
        padding: 0.1rem 0 0.1rem 0.5rem;
    }

    #snapshot-list > li:nth-child(even) {
        background-color: #efefef;
    }

    #snapshot-list > li:before {
        font-size: smaller;
        min-width: 1.5rem;
        counter-increment: list-item;
        content: counter(list-item, decimal-leading-zero) '.';
        margin-right: 0.2em;
    }

    #snapshot-list > li.current-snapshot:before {
        color: #d33;
        content: '➡';
    }

    .delete-current-snapshot {
        cursor: pointer;
        margin: 5px;
        border-radius: 0;
        background-color: #e5e5e5;
        border: none;
        padding: 5px;
    }

    .delete-snapshot {
        font-size: smaller;
        color: #bbb;
        cursor: pointer;
        margin-left: auto;
        margin-right: 0.5em;
    }

    .sidebar .float-window {
        position: unset !important;
    }

    .w-full {
        width: 100%;
    }
`;

const TEMPLATES = {
    content: `
<div class="row snapshot-main">
    <h3 class="nav-header">快照操作</h3>
    <div class="snapshot-action">
        <button id="take-snapshot" class="snapshot-btn">拍摄快照</button>
        <button id="reset-page" class="snapshot-btn">恢复页面</button>
    </div>
    <h3 class="nav-header">快照列表</h3>
    <ol id="snapshot-list"></ol>
</div>
`,
    snapshotItem: `
<li>
    <a href="#" class="restore-snapshot" title="单击恢复快照"></a>
    <i class="delete-snapshot">删除</i>
</li>
`,
    snapshotTitle: `
<div class="comment-row p-2 snapshot-title-container snapshot-element" >
    <span>当前热榜快照：</span>
    <strong id="snapshot-title"></strong>
</div>
`,
    snapshotFooter: `
<div class="comment-row p-2 w-full snapshot-footer-container snapshot-element" >
    <button id="delete-current-snapshot" class="delete-current-snapshot w-full">删除当前快照</button>
</div>
`
};

class Snapshot {
    #hash;
    timestamp;
    compressedComments;
    currentTab;

    hash() {
        return this.#hash;
    }

    async init(hash) {
        const snapshot = await GM.getValue(hash);
        if (snapshot) {
            Object.assign(this, snapshot);
            this.#hash = hash;
        }
        return this;
    }

    async new(comments, currentTab) {
        this.timestamp = Date.now();
        this.currentTab = currentTab;
        this.#hash = await Snapshot.generateHash(comments);

        const compressedStream = new Response(JSON.stringify(comments))
            .body
            .pipeThrough(new CompressionStream('gzip'));
        const buf = await new Response(compressedStream).arrayBuffer();
        this.compressedComments = btoa(String.fromCharCode(...new Uint8Array(buf)));

        await GM.setValue(this.#hash, this);

        return this;
    }

    async comments() {
        return fetch('data:;base64,' + this.compressedComments)
            .then(async res => {
                const decompressedStream = res.body.pipeThrough(
                    new DecompressionStream("gzip")
                );
                return await new Response(decompressedStream)
                    .text()
                    .then(text => JSON.parse(text));
            });
    }

    static async generateHash(comments) {
        return await hashString(comments.map(c => c.id).join());
    }

    toString() {
        const datetime = new Date(this.timestamp)
            .toISOLocaleString();
        return `${datetime} - ${getCurrentTab(this.currentTab)}`;
    }

    static async delete(snapshotId) {
        await GM.deleteValue(snapshotId);
    }
}

class SnapshotManager {
    constructor() {
        this.snapshotItems = [];
        this.currentSnapshotHash = null;
    }

    async init() {
        await this.loadAllSnapshots();
        this.renderSnapshotList();
    }

    async loadAllSnapshots() {
        this.snapshotItems = [];
        const hashes = await GM.listValues();
        for (const hash of hashes) {
            const snapshot = await new Snapshot().init(hash);
            this.snapshotItems.push(snapshot);
        }
        this.snapshotItems.sort((a, b) => b.timestamp - a.timestamp);
    }

    async takeSnapshot() {
        if (!vueRoot.comments) {
            throw new Error("无法获取页面数据");
        }

        const currentHash = await Snapshot.generateHash(vueRoot.comments);

        const existingSnapshot = this.snapshotItems.find(s => s.hash() === currentHash);
        if (existingSnapshot) {
            alert(`已存在相同内容的快照：${existingSnapshot.toString()}`);
            return existingSnapshot;
        }

        const snapshot = new Snapshot();
        await snapshot.new(vueRoot.comments, vueRoot.currentTab);

        this.snapshotItems.unshift(snapshot);
        this.currentSnapshotHash = snapshot.hash();

        this.renderSnapshotList();

        gifPreloader.preloadGifs();

        return snapshot;
    }

    async restoreSnapshot(hash) {
        const snapshot = this.snapshotItems.find(s => s.hash() === hash);
        if (!snapshot) {
            throw new Error("未找到快照");
        }

        clearSnapshotElements();
        gifPreloader.clear();

        const comments = await snapshot.comments();
        vueRoot.gifImages = {};
        for (const comment of comments) {
            if (!comment.images) continue;

            for (const [i, image] of comment.images.entries()) {
                if (image.isGIF) {
                    vueRoot.$set(
                        vueRoot.gifImages,
                        comment.id + '-' + i,
                        {
                            thumbLoaded: false,
                            fullLoaded: false,
                            loading: false,
                            fullURL: image.srcLarge
                        }
                    );
                }
            }
        }
        vueRoot.comments = comments;
        vueRoot.currentTab = snapshot.currentTab;

        this.currentSnapshotHash = hash;
        setPageTitle(snapshot.timestamp, getCurrentTab(snapshot.currentTab));
        this.renderSnapshotList();

        $snapshotTitle
            .clone(false)
            .insertAfter($topNav)
            .find('#snapshot-title')
            .text(snapshot.toString());

        $snapshotFooter
            .clone()
            .appendTo($comments)
            .find('#delete-current-snapshot')
            .click(() => this.deleteSnapshot(snapshot.hash()).then());

        gifPreloader.preloadGifs();

        return snapshot;
    }

    async deleteSnapshot(hash) {
        if (confirm('确定要删除该快照吗？') === false) {
            return;
        }

        await Snapshot.delete(hash);

        this.snapshotItems = this.snapshotItems.filter(s => s.hash() !== hash);

        if (this.currentSnapshotHash === hash) {
            this.currentSnapshotHash = null;
        }

        this.renderSnapshotList();
    }

    renderSnapshotList() {
        $snapshotList.empty();

        for (const snapshot of this.snapshotItems) {
            const $item = $(TEMPLATES.snapshotItem);
            $item.find('.restore-snapshot')
                .text(snapshot.toString())
                .on('click', (e) => {
                    e.preventDefault();
                    this.restoreSnapshot(snapshot.hash()).then();
                });

            $item.find('.delete-snapshot').on('click', () => {
                this.deleteSnapshot(snapshot.hash()).then();
            });

            if (this.currentSnapshotHash === snapshot.hash()) {
                $item.addClass('current-snapshot');
            }

            $snapshotList.append($item);
        }
    }

    initEvents() {
        $takeSnapshotBtn.on('click', () => this.takeSnapshot());
        $recoverPageBtn.on('click', () => {
            this.currentSnapshotHash = null;
            clearSnapshotElements();
            gifPreloader.clear();
            location.reload();
        });
    }
}

class GifPreloader {
    constructor() {
        this.currentImage = null;
        this.preloadTimer = null;
    }

    clear() {
        if (this.currentImage) {
            this.currentImage.onload = null;
            this.currentImage.onerror = null;
            this.currentImage = null;
        }
        if (this.preloadTimer) {
            clearTimeout(this.preloadTimer);
            this.preloadTimer = null;
        }
    }

    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`GIF预加载完成: ${url}`);
                resolve(true);
            };
            img.onerror = () => {
                console.log(`GIF预加载失败: ${url}`);
                resolve(false);
            };
            img.src = url;
        });
    }

    preloadGifs(delay = 1000) {
        if (this.preloadTimer) {
            clearTimeout(this.preloadTimer);
        }

        this.preloadTimer = setTimeout(async () => {
            console.log(`开始预加载GIF (延迟 ${delay}ms)`);

            const gifUrls = Object.values(vueRoot.gifImages)
                .map(gifInfo => gifInfo.fullURL);

            for (const url of gifUrls) {
                await this.loadImage(url);
            }

            this.preloadTimer = null;
        }, delay);
    }
}

async function hashString(string) {
    const hash = await crypto.subtle.digest("SHA-1", (new TextEncoder()).encode(string));
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function setPageTitle(timestamp = Date.now(), tabTitle = getCurrentTab(vueRoot.currentTab)) {
    const datetime = new Date(timestamp).toISOLocaleString().slice(8, 16).replace(" ", "@");
    unsafeWindow.document.title = `${datetime} - ${tabTitle}`;
}

function clearSnapshotElements() {
    $('.snapshot-element').remove();
}

let $content, $snapshotList, $takeSnapshotBtn, $recoverPageBtn;
let $snapshotTitle, $snapshotFooter, $comments, $topNav;

function initDOMElements() {
    $content = $(TEMPLATES.content);

    $snapshotList = $content.find('#snapshot-list');
    $takeSnapshotBtn = $content.find('#take-snapshot');
    $recoverPageBtn = $content.find('#reset-page');

    $snapshotTitle = $(TEMPLATES.snapshotTitle);
    $snapshotFooter = $(TEMPLATES.snapshotFooter);

    $comments = $(jandanAppSelector);
    $topNav = $comments.find('.top-nav');
}

const gifPreloader = new GifPreloader();

function mergeTucao(url, topTucaoText) {
    const allUrl = url.replace('list', 'all');

    const xhr = new XMLHttpRequest();
    xhr.open('GET', allUrl, false);
    xhr.send();

    if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        const topTucao = JSON.parse(topTucaoText);
        data.hot_tucao = topTucao.hot_tucao;
        return JSON.stringify(data);
    } else {
        alert('获取完整吐槽数据失败');
        console.error(xhr.status);
        return topTucaoText;
    }
}

function setupXhrInterceptor() {
    const xhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        const xhr = this;
        const url = arguments[1];

        if (url.startsWith('/api/tucao/list')) {
            const getter = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText').get;
            Object.defineProperty(xhr, 'responseText', {
                get: () => {
                    let result = getter.call(xhr);
                    return mergeTucao(url, result);
                }
            });
        }

        return xhrOpen.apply(xhr, arguments);
    };
}

function setupTucaoToggle() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.key.toLowerCase() === 't') {
            const hoveredComment = $(jandanAppSelector).find('.comment-row.p-2:hover');
            if (hoveredComment.length) {
                hoveredComment.find('.button-group:last-child').trigger('click');
                e.preventDefault();
            }
        }
    });
}

function setupRouterHook() {
    window.addEventListener('popstate', () => {
        setPageTitle()
        clearSnapshotElements();
        gifPreloader.preloadGifs(2000);
    });
}

async function init() {
    setupXhrInterceptor();

    await GM.addStyle(STYLES);

    initDOMElements();

    setPageTitle();

    const snapshotManager = new SnapshotManager();

    $('aside.sidebar > :nth-child(4)').after($content);
    $('#float-window').appendTo('.snapshot-main');

    snapshotManager.initEvents();
    await snapshotManager.init();

    gifPreloader.preloadGifs(2000);

    setupRouterHook();
    setupTucaoToggle();
}

init().then();

