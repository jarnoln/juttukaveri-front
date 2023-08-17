<template>
    <div v-for="session in sessions">
      {{ session.created }}
      {{ session.replies.length }}
      {{ session.transcripts.length }}
      {{ session.ip }}
      {{ session.referer }}
      <div v-for="entry in getEntries(session)">
        {{ entry.text }}
      </div>
    </div>
</template>

<script setup lang="ts">
import { apiClient } from '../backend'
import { onBeforeMount, ref } from 'vue'

const sessions = ref([])

onBeforeMount(() => {
  const path = '/api01/sessions'
  apiClient.get(path)
  .then(function(response) {
    console.log(response)
    console.log(response.data)
    sessions.value = response.data
  })
})

function getEntries(session: any) : [] {
  const entries: any = []
  session.transcripts.forEach(element => {entries.push(element)});
  session.replies.forEach(element => {entries.push(element)});
  entries.sort((a,b) => { return a.created > b.created })
  return entries
}

</script>

<style scoped>
.about {
  margin: 1rem 5rem 1rem 5rem;
  text-align: left;
}

</style>
