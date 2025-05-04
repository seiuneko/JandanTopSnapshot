import { unsafeWindow } from "$";

import '@/utils/common'
import '@/services/api-interceptor.ts';

import { components } from "@/components";

import { diffTucaoCount, setPageTitle, useLargePic } from "@/utils/common.ts";
import { AppContext } from "@/core/app-context";
import { Shortcut } from "@/services/shortcut.ts";
import { GifPrefetcher } from "@/services/gif-prefetcher.ts";

import '@/style.css';
import { EventBus, EventPayload, EventType } from "@/core/event-bus.ts";
import { Jandan } from "@/types/jandan";

const gifPrefetcher = new GifPrefetcher();
const shortcut = new Shortcut();

function setupListeners(): void {
    const vueRoot = AppContext.getInstance().vueRoot;

    vueRoot.$watch('comments', (comments: Jandan.Comment[]) => {
        useLargePic(comments);
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

    EventBus.$on(EventType.TUCAO_LOADED, (payload: EventPayload.TucaoLoaded) => {
        diffTucaoCount(payload);
    });
}

async function init(): Promise<void> {
    setupListeners();

    components.forEach((c) => new unsafeWindow.Vue(c));
}

init().then();

