// src/components/SettingsMenu.vue
<script setup>
import FloatingWindow from './FloatingWindow.vue';
import { ref, watch } from 'vue';
import { store, useStore } from '../State';

const { setGridSize, setLineColor } = useStore();

// 局部状态与全局状态同步
const width = ref(store.gridWidth);
const height = ref(store.gridHeight);
const color = ref(store.lineColorCss);

// 监听局部状态变化，同步到全局状态
watch([width, height], ([newW, newH]) => {
    // 限制最小尺寸为 1
    const finalW = Math.max(1, parseInt(newW) || 1);
    const finalH = Math.max(1, parseInt(newH) || 1);
    setGridSize(finalW, finalH);
});

watch(color, (newColorCss) => {
    // 将 CSS Hex 颜色转换为 Pixi 使用的数字 Hex (0xRRGGBB)
    const pixiHex = parseInt(newColorCss.replace('#', '0x'), 16);
    setLineColor(pixiHex, newColorCss);
});

const resetView = () => {
    if (window.resetPixiView) {
        window.resetPixiView();
    }
};

</script>

<template>
  <FloatingWindow title="🛠️ 画板设置" :initialX="10" :initialY="10" :initialW="400" :initialH="250">
    <div class="setting-group">
        <label>拼豆画板尺寸 (WxH):</label>
        <div class="input-controls">
            <input type="number" v-model.number="width" min="1" class="input-small">
            <span class="dimension-label">x</span>
            <input type="number" v-model.number="height" min="1" class="input-small">
        </div>
        <p class="info-text">当前画板大小: {{ store.gridWidth }} x {{ store.gridHeight }} 拼豆</p>
    </div>

    <div class="setting-group">
        <label>网格线条颜色 (Hex):</label>
        <div class="color-controls">
            <input type="color" v-model="color" class="color-input">
            <input type="text" v-model="color" class="input-medium">
        </div>
        <p class="info-text">线条颜色: {{ store.lineColorCss }}</p>
    </div>
    
    <button @click="resetView" class="reset-btn">
        <span class="icon">🔄</span> 重置画布视图 (缩放/位移/旋转)
    </button>
  </FloatingWindow>
</template>

<style scoped>
.setting-group { margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px dashed #444; }
label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
.info-text { font-size: 12px; color: #ccc; margin-top: 5px; }

.input-controls { display: flex; align-items: center; gap: 5px; }
.input-small { width: 60px; text-align: center; background: #444; border: 1px solid #555; color: white; padding: 5px; border-radius: 3px; }
.dimension-label { font-size: 16px; font-weight: bold; color: white; }

.color-controls { display: flex; align-items: center; gap: 10px; }
.color-input { width: 40px; height: 40px; border: none; padding: 0; cursor: pointer; }
.input-medium { width: 100px; background: #444; border: 1px solid #555; color: white; padding: 5px; border-radius: 3px; }

.reset-btn {
    background-color: #555; 
    color: white; 
    border: none; 
    padding: 10px 15px; 
    cursor: pointer; 
    margin-top: 10px; 
    border-radius: 4px; 
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.icon { margin-right: 5px; font-size: 18px; }
</style>