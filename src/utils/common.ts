import { unsafeWindow } from '$';

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

export const tabTitleMap: Record<string, string> = {
    '4hr': '4小时热门',
    'pic': '热榜',
    'treehole': '树洞',
    '3days': '3日最佳',
    '7days': '7日最佳',
}

export const getCurrentTab = (tab: string): string => tabTitleMap[tab] || '未知';

export function setPageTitle(currentTab: string, timestamp: number = Date.now()): void {
    const title = getCurrentTab(currentTab);
    const datetime = new Date(timestamp).toISOLocaleString().slice(8, 16).replace(" ", "@");
    unsafeWindow.document.title = `${datetime} - ${title}`;
}

export async function hashString(string: string): Promise<string> {
    const hash = await crypto.subtle.digest("SHA-1", (new TextEncoder()).encode(string));
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}