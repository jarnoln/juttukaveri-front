<template>
  <div class="about" v-html="content">
  </div>
</template>

<script setup lang="ts">
import { apiClient } from '../backend'
import { onBeforeMount, ref } from 'vue'
import { marked } from 'marked'

const content = ref('')

onBeforeMount(() => {
  const path = '/api01/about'
  apiClient.get(path)
  .then(function(response) {
    console.log(response)
    console.log(response.data)
    content.value = marked.parse(response.data['readme'])
    console.log('content', content.value)
  })
})
</script>

<style scoped>
.about {
  margin: 1rem 5rem 1rem 5rem;
  text-align: left;
}

</style>
