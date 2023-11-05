// ==UserScript==
// @name                Jandan Top Snapshot
// @name:zh             煎蛋热榜快照
// @namespace           https://github.com/seiuneko/JandanTopSnapshot
// @match               https://jandan.net/top*
// @version             1.0.0
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

const css = `
div#body {
    overflow: clip;
    display: flex;
    justify-content: space-between;
}

.snapshot-main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    line-height: 1.6em;
    padding: 20px;
    margin-left: -2px;
    border-bottom: 1px solid #e5e5e5;
    position: sticky;
    top: 0;
}

.snapshot-action {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
}

.snapshot-btn {
    cursor: pointer;
    padding: 5px 10px;
    margin: 5px;
    background: #EEE;
    font-size: 14px;
    border: 1px solid #e5e5e5;
}

ol#snapshot-list {
    border-bottom: none;
    margin-left: 0;
    padding: 0;
    height: 60vh;
    overflow: scroll;
    scrollbar-width: thin;
    counter-reset: list-item;
}

#snapshot-list::-webkit-scrollbar {
    width: 4px;
}

#snapshot-list > li {
    display: flex;
    align-items: center;
}

#snapshot-list > li:before {
    min-width: 1.5em;
    counter-increment: list-item;
    content: counter(list-item, decimal-leading-zero) '.';
    margin-right: 0.2em;
}

#snapshot-list > li.current-snapshot:before {
    color: #d33;
    content: '➡';
}

.delete-current-snapshot {
    background-color: #f9f9f9;
    border: 1px solid #e5e5e5;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 4px;
    width: 600px
}

.delete-snapshot {
    cursor: pointer;
    margin-left: auto;
    margin-right: 0.5em;
}
`;
const contentHTML = `
<div class="snapshot-main">
    <h3>热榜快照</h3>
    <div class="snapshot-action">
        <button id="take-snapshot" class="snapshot-btn">拍摄快照</button>
        <button id="reset-page" class="snapshot-btn">恢复页面</button>
    </div>
    <h3>快照列表</h3>
    <ol id="snapshot-list"></ol>
</div>
<div class="break"/>
`;
const snapshotItemHTML = `
<li>
    <a href="#" class="restore-snapshot" title="单击恢复快照"></a>
    <i class="delete-snapshot">删除</i>
</li>
`
const snapshotTitleHTML = `
<li>
    <div>
        <div class="row" style="padding-bottom: 20px">
            <span>当前热榜快照：</span>
            <strong id="snapshot-title"></strong>
        </div>
        <span class="break"></span>
    </div>
</li>
`;
const snapshotFooterHTML = `
<li>
    <div>
        <div class="row" style="padding-bottom: 20px">
            <button id="delete-current-snapshot" class="delete-current-snapshot">删除当前快照</button>
        </div>
        <span class="break"></span>
    </div>
</li>
`;

class Snapshot {
    #hash;
    timestamp;
    title;
    currentTab;
    content;

    static tabNameMapping = $('.hot-tabs > div')
        .toArray()
        .reduce((obj, e) => ({...obj, [e.id]: e.textContent}), {});

    get hash() {
        return this.#hash;
    }

    async take(html, commentIDs, title, currentTab, persistent = true) {
        const snapshots = await GM.listValues();
        this.#hash = await hash(commentIDs);
        if (snapshots.includes(this.#hash)) {
            return Promise.reject('快照已存在');
        }
        this.timestamp = Date.now();
        this.title = title;
        this.currentTab = currentTab;

        const compressedStream = new Response(html)
            .body
            .pipeThrough(new CompressionStream('gzip'));
        const buf = await new Response(compressedStream).arrayBuffer();
        this.content = btoa(String.fromCharCode(...new Uint8Array(buf)));
        if (persistent) {
            return GM.setValue(this.hash, this);
        } else {
            return Promise.resolve();
        }
    }

    async restore() {
        return fetch('data:;base64,' + this.content)
            .then(async res => {
                const decompressedStream = res.body.pipeThrough(
                    new DecompressionStream("gzip")
                );
                return await new Response(decompressedStream).text();
            });
    }

    delete() {
        return GM.deleteValue(this.hash);
    }

    async init(hash) {
        const snapshot = await GM.getValue(hash);
        if (snapshot) {
            Object.assign(this, snapshot);
        }
        return this;
    }

    toString() {
        const datetime = new Date(this.timestamp)
            .toLocaleString("sv")
            .replaceAll('/', '-');
        return `${datetime} - ${Snapshot.tabNameMapping[this.currentTab]}`;
    }
}

let originalTitle = unsafeWindow.document.title;
const originalPage = new Snapshot();

GM.addStyle(css).then();
const $content = $(contentHTML);
const $snapshotTitle = $(snapshotTitleHTML);
const $snapshotFooter = $(snapshotFooterHTML);
const $snapshotItem = $(snapshotItemHTML);

const $snapshotList = $content.find('#snapshot-list');
const $takeSnapshotBtn = $content.find('#take-snapshot');
const $recoverPageBtn = $content.find('#reset-page');
const $commentlist = $(".commentlist");

async function takeSnapshotHandler(e, snapshot, persistent = true) {
    const $comments = $commentlist.clone(false)
    $comments.find('.gif-mask').remove();
    $comments.find('p:not(.bad_content)').show();

    snapshot = snapshot || $(this).data('snapshot');
    const title = originalTitle;
    const currentTab = $('.current-tab').attr('id');
    const commentIDs = $comments.find('.righttext')
        .toArray()
        .map((e) => e.textContent)
        .sort()
        .join('');
    snapshot.take($comments.html(), commentIDs, title, currentTab, persistent)
        .then(() => {
            if (persistent) {
                addSnapshotToSidebar(snapshot);
            }
        })
        .catch((e) => {
            alert(`拍摄快照失败：\n${e}`);
        });
}

function restoreSnapshotHandler(e, snapshot, persistent = true) {
    const $this = $(this);
    snapshot = snapshot || $this.parent().data('snapshot');
    snapshot.restore()
        .then(async html => {
            if (originalPage.content === undefined) {
                await takeSnapshotHandler(null, originalPage, false);
            }

            originalTitle = snapshot.title;
            setPageTitle(new Date(snapshot.timestamp));
            const $currentTab = $(`#${snapshot.currentTab}`)
            $currentTab.addClass('current-tab').siblings().removeClass('current-tab');
            $currentTab[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            const $html = $.parseHTML(html);
            $commentlist.html($html);
            if (persistent) {
                $this.parent().addClass('current-snapshot').siblings().removeClass('current-snapshot');
                $snapshotTitle
                    .clone(false)
                    .prependTo($commentlist)
                    .find('#snapshot-title')
                    .text(snapshot);
                $snapshotFooter
                    .clone()
                    .appendTo($commentlist)
                    .find('#delete-current-snapshot')
                    .click(() => {
                        $this.next().trigger('click');
                    });
            }
        })
        .catch((e) => {
            alert(`恢复快照失败：\n${e}`);
        });
    return false;
}

function deleteSnapshotHandler() {
    if (confirm('确定要删除该快照吗？') === false) {
        return;
    }
    const $parentLi = $(this).parent();
    const snapshot = $parentLi.data('snapshot');
    snapshot.delete()
        .then(() => {
            $parentLi.fadeTo(200, 0.01, function () {
                $(this).slideUp(150, function () {
                    $(this).remove();
                });
            });
        })
        .catch((e) => {
            alert(`删除快照失败：\n${e}`);
        });
}

function addSnapshotToSidebar(snapshot) {
    $snapshotItem
        .clone(false)
        .data('snapshot', snapshot)
        .prependTo($snapshotList)
        .find('.restore-snapshot')
        .text(snapshot);
}

function delegateEvent(...selectors) {
    selectors.forEach((selector) => {
        const e = $commentlist.find(selector);
        if (e.length === 0) {
            return;
        }
        const handler = $._data(e[0], "events").click[0].handler;
        e.off('click');
        $('.commentlist').on('click', selector, handler);
    });
}

function setPageTitle(date) {
    unsafeWindow.document.title = `${date.toLocaleString('sv').slice(8, 16).replace(" ", "@")} - ${originalTitle}`;
}

async function hash(string) {
    const hash = await crypto.subtle.digest("SHA-1", (new TextEncoder()).encode(string));
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function main() {
    setPageTitle(new Date());
    delegateEvent(
        '.comment-like, .comment-unlike',
        '.tucao-btn',
        'img'
    );

    $snapshotList.on('click', '.restore-snapshot', restoreSnapshotHandler);
    $snapshotList.on('click', '.delete-snapshot', deleteSnapshotHandler);
    $takeSnapshotBtn
        .data('snapshot', new Snapshot())
        .click(takeSnapshotHandler);
    $recoverPageBtn
        .click(() => restoreSnapshotHandler(null, originalPage, false));

    GM.listValues()
        .then(async snapshots => {
            for (const hash of snapshots) {
                const snapshot = await new Snapshot().init(hash);
                addSnapshotToSidebar(snapshot);
            }

            $('#sidebar').append($content)
        })
        .catch((e) => {
            alert(`加载快照列表失败：\n${e}`);
        });
}

main();