<template>
    <div v-for="session in sessions" class="session">
      {{ session.created }}
      {{ session.replies.length }}
      {{ session.transcripts.length }}
      {{ session.ip }}
      {{ session.referer }}
      <div v-for="entry in getEntries(session)" :class="getClass(entry)">
        {{ entry.type }}: {{ entry.text }}
      </div>
    </div>
</template>

<script setup lang="ts">
import { apiClient } from '../backend'
import { onBeforeMount, ref } from 'vue'

interface Entry {
  created: string,
  text: string,
  type: string | null
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
  session.transcripts.forEach((element: Entry) => {
    entries.push({
      created: element.created,
      text: element.text,
      type: 'U'
    })
  });
  session.replies.forEach((element: Entry) => {
    entries.push({
      created: element.created,
      text: element.text,
      type: 'C'
    })
  });
  entries.sort((a: Entry, b: Entry) => {
    if (a.created > b.created) {
      return 1
    } else {
      return -1
    }
  })
  return entries
}

function getClass(entry: Entry) : string {
  if (entry.type == 'C') {
    return 'reply'
  }
  return 'transcript'
}
</script>

<style scoped>
.about {
  margin: 1rem 5rem 1rem 5rem;
  text-align: left;
}

.reply {
  background-color: rgb(240, 240, 240);
}

.transcript {
  background-color: rgb(220, 220, 220);
}

.session {
  background-color: rgb(200, 200, 200);
}

</style>
