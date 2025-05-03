import { unsafeWindow } from "$";

import '@/utils/common'
import '@/services/api-interceptor.ts';

import { components } from "@/components";

import { setPageTitle } from "@/utils/common.ts";
import { AppContext } from "@/core/app-context";
import { Shortcut } from "@/services/shortcut.ts";
import { GifPrefetcher } from "@/services/gif-prefetcher.ts";

import '@/style.css';
import { EventBus, EventType } from "@/core/event-bus.ts";

const gifPrefetcher = new GifPrefetcher();
const shortcut = new Shortcut();

function setupVueWatchers(): void {
    const vueRoot = AppContext.getInstance().vueRoot;

    vueRoot.$watch('comments', (_) => {
        shortcut.refreshComments();
    });
    vueRoot.$watch('gifImages', (newVal) => {
        gifPrefetcher.prefetch(newVal).then();
    });
    vueRoot.$watch('currentTab', (newVal) => {
        setPageTitle(newVal);
    }, {immediate: true});
    vueRoot.$watch('isListLoading', (_) => {
        EventBus.$emit(EventType.SNAPSHOT_CHANGE, null);
    });
}

async function init(): Promise<void> {
    setupVueWatchers();

    components.forEach((c) => new unsafeWindow.Vue(c));
}

init().then();

