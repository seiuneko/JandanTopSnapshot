<template>
  <div v-if="title" class="comment-row p-2 snapshot-title-container">
    <span>当前热榜快照：</span>
    <strong>{{ title }}</strong>
    <span v-if="duplicateCount > 0" class="duplicate-count">
      （{{ duplicateCount }} 条重复）
    </span>
  </div>
</template>

<script lang="ts">
import { EventBus, EventPayload, EventType } from '@/core/event-bus';

const SnapshotTitle = {
  el: (() => {
    const container = document.createElement('div');
    document.querySelector('.top-nav')!.after(container);
    return container;
  })(),
  name: "SnapshotTitle",
  data() {
    return {
      title: null as string | null,
      duplicateCount: 0
    }
  },
  created() {
    EventBus.$on(EventType.SNAPSHOT_CHANGE, (payload: EventPayload.SnapshotChange) => {
      this.title = payload?.title ?? null;
      this.duplicateCount = payload?.duplicateCount ?? 0;
    });
  },
  beforeDestroy() {
    EventBus.$off(EventType.SNAPSHOT_CHANGE);
  }
};
export default SnapshotTitle;
</script>
