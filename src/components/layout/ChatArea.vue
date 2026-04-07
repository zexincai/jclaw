<template>
  <div class="flex flex-col h-full min-h-0">
    <MessageList class="flex-1 min-h-0" />
    <InputBar />
  </div>
</template>

<script setup lang="ts">
import MessageList from '../chat/MessageList.vue'
import InputBar from '../chat/InputBar.vue'
</script>
