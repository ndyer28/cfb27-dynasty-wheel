import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name for project Pages
// (served at https://<user>.github.io/<repo>/). Use '/' for a user/custom-domain site.
export default defineConfig({
  base: '/cfb27-dynasty-wheel/',
  plugins: [react()],
})
