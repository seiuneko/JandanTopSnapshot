<template>
  <div class="row snapshot-manager-container">
    <h3 class="nav-header">快照操作</h3>
    <div class="snapshot-action">
      <button class="snapshot-btn" @click="takeSnapshot">拍摄快照</button>
      <button class="snapshot-btn" @click="recoverPage">恢复页面</button>
    </div>
    <h3 class="nav-header">快照列表</h3>
    <ol id="snapshot-list">
      <li v-for="snapshot in snapshotItems" :key="snapshot.hash"
          :class="{'current-snapshot': currentSnapshotHash === snapshot.hash}">
        <a class="restore-snapshot" href="#" title="单击恢复快照"
           @click.prevent="restoreSnapshot(snapshot.hash)">{{ snapshot }}</a>
        <i class="delete-snapshot" @click="deleteSnapshot(snapshot.hash)">删除</i>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { GM } from '$';
import { Jandan } from '@/types/jandan';
import { Snapshot } from '@/models/snapshot';
import { setPageTitle } from '@/utils/common';
import { AppContext } from '@/core/app-context';
import { EventBus, EventType } from '@/core/event-bus';

interface SnapshotManagerData {
  snapshotItems: Snapshot[];
  currentSnapshotHash: string | null;
}

const SnapshotManager = {
  el: (() => {
    const container = document.createElement('div');
    document.querySelector('aside.sidebar > :nth-child(4)')!.after(container);
    return container;
  })(),
  name: 'SnapshotManager',
  data(): SnapshotManagerData {
    return {
      snapshotItems: [] as Snapshot[],
      currentSnapshotHash: null as string | null,
    };
  },
  computed: {
    vueRoot(): Jandan.App {
      return AppContext.getInstance().vueRoot;
    }
  },
  mounted() {
    this.$el.appendChild(document.getElementById('float-window')!);
  },
  async created() {
    await this.init();
    EventBus.$on(EventType.SNAPSHOT_DELETE_CURRENT, this.deleteSnapshot);
    EventBus.$on(EventType.SNAPSHOT_CHANGE, payload => this.currentSnapshotHash = payload?.hash ?? null);
  },
  beforeDestroy() {
    EventBus.$off([EventType.SNAPSHOT_CHANGE, EventType.SNAPSHOT_DELETE_CURRENT]);
  },
  methods: {
    async init(): Promise<void> {
      await this.loadAllSnapshots();
    },

    async loadAllSnapshots(): Promise<void> {
      this.snapshotItems = [];
      const hashes = await GM.listValues();
      for (const hash of hashes) {
        const snapshot = await new Snapshot().fromHash(hash);
        this.snapshotItems.push(snapshot);
      }
      this.snapshotItems.sort((a, b) => b.timestamp - a.timestamp);
    },

    async takeSnapshot(): Promise<Snapshot | undefined> {
      if (!this.vueRoot.comments) {
        throw new Error("无法获取页面数据");
      }

      const currentHash = await Snapshot.generateHash(this.vueRoot.comments);
      const existingSnapshot = this.snapshotItems.find(s => s.hash === currentHash);
      if (existingSnapshot) {
        alert(`已存在相同内容的快照：${existingSnapshot.toString()}`);
        return existingSnapshot;
      }

      const snapshot = new Snapshot();
      await snapshot.create(this.vueRoot.comments, this.vueRoot.currentTab);
      this.snapshotItems.unshift(snapshot);
      EventBus.$emit(EventType.SNAPSHOT_CHANGE, snapshot);

      return snapshot;
    },

    async restoreSnapshot(hash: string): Promise<Snapshot> {
      const snapshot = this.snapshotItems.find(s => s.hash === hash);
      if (!snapshot) {
        throw new Error("未找到快照");
      }

      const comments = await snapshot.getComments();
      const newComments = comments.filter(comment => !(comment.id in this.vueRoot.commentTucao));
      const duplicateCount = comments.length - newComments.length;

      this.vueRoot.gifImages = {};
      for (const comment of newComments) {
        if (!comment.images) continue;

        comment.images.forEach((image, i) => {
          if (image.isGIF) {
            this.vueRoot.$set(
                this.vueRoot.gifImages,
                `${comment.id}-${i}`,
                {
                  thumbLoaded: false,
                  fullLoaded: false,
                  loading: false,
                  fullURL: image.srcLarge
                }
            );
          }
        });
      }
      this.vueRoot.comments = newComments;
      this.vueRoot.currentTab = snapshot.currentTab;
      Object.keys(this.vueRoot.expandedTucao).forEach(k => this.vueRoot.expandedTucao[k] = false);

      setPageTitle(snapshot.currentTab, snapshot.timestamp);
      EventBus.$emit(EventType.SNAPSHOT_CHANGE, {
        title: snapshot.toString(),
        hash,
        duplicateCount
      });

      return snapshot;
    },

    async deleteSnapshot(hash: string): Promise<void> {
      if (!confirm('确定要删除该快照吗？')) {
        return;
      }

      await Snapshot.delete(hash);
      this.snapshotItems = this.snapshotItems.filter(s => s.hash !== hash);
      if (this.currentSnapshotHash === hash) {
        this.currentSnapshotHash = null;
      }
    },

    recoverPage(): void {
      console.log('recoverPage');
    },
  }
};
export default SnapshotManager;
</script>

