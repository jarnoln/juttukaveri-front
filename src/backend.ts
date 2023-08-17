import axios from 'axios'


let server = import.meta.env.VITE_BACKEND_URL
if (!server) {
  server = 'http://127.0.0.1:8000'
}

export const apiClient = axios.create({
  baseURL: server,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})
