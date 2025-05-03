<template>
  <div v-if="hash" class="comment-row p-2 w-full snapshot-footer-container">
    <button class="delete-current-snapshot w-full" @click="deleteCurrentSnapshot">删除当前快照</button>
  </div>
</template>

<script lang="ts">
import {EventBus, EventType} from '@/core/event-bus';
import {Snapshot} from '@/models/snapshot';
import {AppContext} from "@/core/app-context";

export default {
  el: (() => {
    const container = document.createElement('div');
    AppContext.getInstance().jandanApp.appendChild(container);
    return container;
  })(),
  name: "SnapshotFooter",
  data() {
    return {
      hash: null as string | null
    }
  },
  created() {
    EventBus.$on(EventType.SNAPSHOT_CHANGE, (snapshot: Snapshot) => {
      this.hash = snapshot.hash;
    });
  },
  beforeDestroy() {
    EventBus.$off(EventType.SNAPSHOT_CHANGE);
  },
  methods: {
    deleteCurrentSnapshot() {
      EventBus.$emit(EventType.SNAPSHOT_DELETE_CURRENT, this.hash);
    }
  }
};
</script>

