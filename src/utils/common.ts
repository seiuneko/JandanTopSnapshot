import { unsafeWindow } from '$';
import { Jandan } from "@/types/jandan";
import { AppContext } from "@/core/app-context.ts";
import { EventPayload } from "@/core/event-bus.ts";

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

export function useLargePic(comments: Jandan.Comment[]): void {
    comments?.forEach(comment => {
        comment.images?.forEach(image => {
            if (!image.isGIF) {
                image.src = image.srcLarge;
            }
        });
    });
}

export function diffTucaoCount(payload: EventPayload.TucaoLoaded) {
    const {tucaoId, newTucaoCount} = payload;
    const vueRoot = AppContext.getInstance().vueRoot;

    const comment = vueRoot.comments.find(comment => comment.id.toString() === tucaoId)!;
    const diff = newTucaoCount - comment.sub_comment_count;
    if (diff === 0) return;

    const commentFuncRef = vueRoot.$refs[`comment-func-${tucaoId}`] as Array<HTMLElement>;
    const tucaoCountSpan = commentFuncRef[0].querySelector<HTMLElement>('.comment-count')!;

    const strongElement = document.createElement('strong');
    strongElement.className = 'tucao-diff';
    strongElement.textContent = ` (${diff.toLocaleString('en', {signDisplay: 'exceptZero'})})`;
    tucaoCountSpan.appendChild(strongElement);
}

export function clearTucaoDiff() {
    document.querySelectorAll('.tucao-diff').forEach(diff => diff.remove());
}