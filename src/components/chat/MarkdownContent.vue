<template>
  <div
    class="prose prose-sm prose-gray max-w-none text-gray-800
           prose-p:my-1 prose-p:leading-relaxed
           prose-headings:font-semibold prose-headings:text-gray-800
           prose-table:text-xs prose-td:py-1 prose-th:py-1
           prose-ul:my-1 prose-ol:my-1 prose-li:my-0
           prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1 prose-code:rounded
           prose-pre:bg-gray-900 prose-pre:text-gray-100"
    :class="{ 'streaming-cursor': streaming }"
    v-html="rendered"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

marked.setOptions({ breaks: true })

const props = defineProps<{
  content: string
  streaming?: boolean
}>()

const rendered = computed(() => marked.parse(props.content || '') as string)
</script>
