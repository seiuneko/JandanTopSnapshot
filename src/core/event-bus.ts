import { unsafeWindow } from "$";

export const EventBus = new unsafeWindow.Vue();

export enum EventType {
    SNAPSHOT_CHANGE = 'snapshot-change',
    SNAPSHOT_DELETE_CURRENT = 'snapshot-delete-current'
}
