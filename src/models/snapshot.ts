import { GM } from '$';
import { Jandan } from "@/types/jandan";
import { getCurrentTab, hashString } from "@/utils/common.ts";
import { CompressionUtil } from "@/utils/compression.ts";

export class Snapshot {
    timestamp: number = 0;
    compressedComments: string = '';
    currentTab: string = '';
    #hash: string = '';

    get hash(): string {
        return this.#hash;
    }

    static async generateHash(comments: ReadonlyArray<Jandan.Comment>): Promise<string> {
        return hashString(comments.map(c => c.id).join(''));
    }

    static async delete(snapshotId: string): Promise<void> {
        await GM.deleteValue(snapshotId);
    }

    async fromHash(hash: string): Promise<Snapshot> {
        const snapshot = await GM.getValue<Snapshot>(hash);
        if (snapshot) {
            Object.assign(this, snapshot);
            this.#hash = hash;
        }
        return this;
    }

    async create(comments: ReadonlyArray<Jandan.Comment>, currentTab: string): Promise<Snapshot> {
        this.timestamp = Date.now();
        this.currentTab = currentTab;
        this.#hash = await Snapshot.generateHash(comments);

        this.compressedComments = await CompressionUtil.compressToBase64(comments);
        await GM.setValue(this.#hash, this);

        return this;
    }

    async getComments(): Promise<ReadonlyArray<Jandan.Comment>> {
        return CompressionUtil.decompressFromBase64<Jandan.Comment[]>(this.compressedComments);
    }

    toString(): string {
        const datetime = new Date(this.timestamp).toISOLocaleString();
        return `${datetime} - ${getCurrentTab(this.currentTab)}`;
    }
}
