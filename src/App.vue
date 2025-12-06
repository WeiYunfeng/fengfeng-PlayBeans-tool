<script setup>
import { ref } from 'vue';
import PixiCanvas from './components/PixiCanvas.vue';
import SettingsMenu from './components/SettingsMenu.vue';
import ColorStatsMenu from './components/ColorStatsMenu.vue';
import ColorPaletteMenu from './components/ColorPaletteMenu.vue'; 
import ImageImportMenu from './components/ImageImportMenu.vue';   

const pixiCanvasRef = ref(null); // 用于引用 PixiCanvas 组件

// 视角回正功能调用：通过 window 上的全局函数调用 PixiCanvas 内部暴露的函数
const handleResetView = () => {
    // 假设 PixiCanvas 已经通过 expose({ resetView }) 暴露了函数
    if (window.resetPixiView) {
        window.resetPixiView(); // 调用之前在 PixiCanvas.vue 中暴露到 window 上的函数
    } else {
        console.warn('Pixi 视角回正功能尚未准备好。');
    }
};

// 全屏显示功能实现
const toggleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
};
</script>

<template>
  <div id="app-container">
    <SettingsMenu />
    <ImageImportMenu />   
    <ColorStatsMenu />     
    <ColorPaletteMenu />   
       
    
    <main class="main-canvas-area">
      <PixiCanvas ref="pixiCanvasRef" /> 
    </main>

    <footer class="app-footer">
      <div class="footer-right">
        <button class="reset-btn" @click="handleResetView">视角回正</button> 
        <button class="fullscreen-btn" @click="toggleFullscreen">全屏显示</button>
      </div>
    </footer>
  </div>
</template>

<style>
/* 【核心修正 1】全局样式重置：清除 html 和 body 默认的 margin 和 padding */
html, body {
  margin: 0;
  padding: 0;
  /* 确保页面根元素没有滚动条 */
  overflow: hidden; 
}

/* 全局样式，用于重置和确保容器占满视口 */
#app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #1a1a1a; /* 深色背景 */
  font-family: Arial, sans-serif;
}

.main-canvas-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 底部状态栏样式 */
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #2c3e50;
  color: white;
  padding: 8px 15px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 100;
}

.footer-right button {
  background-color: #555;
  border: none;
  color: white;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-left: 10px;
}
.footer-right button:hover {
  background-color: #666;
}
</style>