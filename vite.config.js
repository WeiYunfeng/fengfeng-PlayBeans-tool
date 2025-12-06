// vite.config.js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  // 🎯 核心修改：设置基础公共路径 (Base Path)
  // 部署到 GitHub Pages 时，仓库名称 'fengfeng-PlayBeans-tool' 成为子目录。
  // 确保所有资源链接都以这个子目录为基础。
  base: '/fengfeng-PlayBeans-tool/', 
  
  // 💡 备选方案：如果上面的绝对路径有问题，可以尝试使用相对路径 './' 
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