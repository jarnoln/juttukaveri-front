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

interface Entry {
  created: string,
  text: string
}

interface Session {
  created: string,
  ip: string,
  referer: string,
  replies: Entry[],
  transcripts: Entry[]
}

const sessions = ref<Session[]>([])

onBeforeMount(() => {
  const path = '/api01/sessions'
  apiClient.get(path)
  .then(function(response) {
    console.log(response)
    console.log(response.data)
    sessions.value = response.data
  })
})

function getEntries(session: any) : Entry[] {
  const entries: Entry[] = []
  session.transcripts.forEach((element: Entry) => {entries.push(element)});
  session.replies.forEach((element: Entry) => {entries.push(element)});
  entries.sort((a: Entry, b: Entry) => {
    if (a.created > b.created) {
      return 1
    } else {
      return -1
    }
  })
  return entries
}

</script>

<style scoped>
.about {
  margin: 1rem 5rem 1rem 5rem;
  text-align: left;
}

</style>
