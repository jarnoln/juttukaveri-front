<template>
  <nav id="navbar" class="dark-background">
    <ul id="right-links">
      <li>
        <router-link id="navbar-home" active-class="active" :to="{ name: 'home' }">
          Etusivu
        </router-link>
      </li>
      <li>
        <router-link id="navbar-about" active-class="active" :to="{ name: 'about' }">
          Tietoja
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
#navbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
  background-color: navy;
}

ul {
  list-style: none;
  display: flex;
  padding-left: 1rem;
}

#left-links {
  padding-right: 2rem;
}

a {
  text-decoration: none;
  color: #cccccc;
  padding: 1rem;
}

a:visited {
  color:  #cccccc;
}

a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

a.active {
  color: white;
}
</style>