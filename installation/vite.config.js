import { defineConfig } from 'vite'

export default defineConfig({
  envDir: ".",
  envPrefix: "INSTALLATION_",
  server: {
    port: 5174
  }
})