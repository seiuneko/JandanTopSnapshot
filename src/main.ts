import { unsafeWindow } from "$";

import '@/utils/common'
import '@/services/api-interceptor.ts';

import { components } from "@/components";

import { setPageTitle } from "@/utils/common.ts";
import { AppContext } from "@/core/app-context";
import { Shortcut } from "@/services/shortcut.ts";
import { GifPrefetcher } from "@/services/gif-prefetcher.ts";

import '@/style.css';

const gifPrefetcher = new GifPrefetcher();
const shortcut = new Shortcut();

function setupVueWatchers(): void {
    const watch = AppContext.getInstance().vueRoot.$watch;

    watch('comments', (_) => {
        shortcut.refreshComments();
    });
    watch('gifImages', (newVal) => {
        gifPrefetcher.prefetch(newVal).then();
    });
    watch('currentTab', (newVal) => {
        setPageTitle(newVal);
    }, {immediate: true});
}

async function init(): Promise<void> {
    setupVueWatchers();

    components.forEach((c) => new unsafeWindow.Vue(c));
}

init().then();

