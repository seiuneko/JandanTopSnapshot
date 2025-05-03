<template>
  <div v-if="title" class="comment-row p-2 snapshot-title-container">
    <span>当前热榜快照：</span>
    <strong>{{ title }}</strong>
  </div>
</template>

<script lang="ts">
import { EventBus, EventType } from '@/core/event-bus';
import { Snapshot } from '@/models/snapshot';

export default {
  el: (() => {
    const container = document.createElement('div');
    document.querySelector('.top-nav')!.after(container);
    return container;
  })(),
  name: "SnapshotTitle",
  data() {
    return {
      title: null as string | null
    }
  },
  created() {
    EventBus.$on(EventType.SNAPSHOT_CHANGE, (snapshot: Snapshot) => {
      this.title = snapshot.toString();
    });
  },
  beforeDestroy() {
    EventBus.$off(EventType.SNAPSHOT_CHANGE);
  }
};
</script>
