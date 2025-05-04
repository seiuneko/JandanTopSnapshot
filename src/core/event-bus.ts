import { unsafeWindow } from "$";

export const EventBus = new unsafeWindow.Vue();

export enum EventType {
    SNAPSHOT_CHANGE = 'snapshot-change',
    SNAPSHOT_DELETE_CURRENT = 'snapshot-delete-current',
    TUCAO_LOADED = 'tucao-loaded'
}

export namespace EventPayload {
    export interface SnapshotChange {
        hash?: string
        title?: string;
        duplicateCount?: number;
    }

    export interface TucaoLoaded {
        tucaoId: string;
        newTucaoCount: number;
    }
}
