// vite.config.js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  // 🎯 核心修改：将基础路径设置为根目录 '/'
  // 启用自定义域名 doudou.weiyunfeng.cf 后，所有资源都从根路径加载。
  base: '/', 
  
  // 💡 提示：如果您在未来的项目中需要同时兼容自定义域名和非自定义域名，
  // 并且想保留相对路径的灵活性，可以使用备选的相对路径 './'
  // base: './', 

  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      // 保持现有的路径别名配置不变
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})