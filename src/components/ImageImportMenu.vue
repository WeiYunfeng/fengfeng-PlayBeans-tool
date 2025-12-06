// src/components/ImageImportMenu.vue
<script setup>
import FloatingWindow from './FloatingWindow.vue';
import { ref } from 'vue';
import { store, useStore } from '../State'; 
// 🎯 导入核心函数 (路径已根据您确认的同级目录修正)
import { colorQuantizationAndMatch } from './ImageProcessor.js'; 

// 🎯 导入 setBeadData mutation
const { setSplitPrecision, setBeadData } = useStore(); 

const fileInput = ref(null);
const previewUrl = ref(null);
const fileName = ref('');
// 从全局状态同步精度值
const precision = ref(store.splitPrecision); 

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    fileName.value = file.name;
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);
    
    console.log(`图片 '${fileName.value}' 已上传，等待转换...`);
  }
};

const triggerFileInput = () => {
    fileInput.value.click();
};

const updatePrecision = (delta) => {
  precision.value = Math.max(1, precision.value + delta);
  setSplitPrecision(precision.value); // 同步到全局状态
};

// 🎯 【核心功能】实现图片转换逻辑
const startConversion = () => {
    if (!previewUrl.value) {
        alert('请先导入图片');
        return;
    }
    
    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.error("无法获取 Canvas 2D 上下文。");
            return;
        }

        ctx.drawImage(image, 0, 0);
        
        // 1. 获取图片的像素数据
        const imageData = ctx.getImageData(0, 0, image.width, image.height);

        // 2. 调用核心转换函数
        const beadData = colorQuantizationAndMatch(imageData, precision.value);
        
        // 3. 更新全局状态，这将自动触发 PixiCanvas 重新绘制
        setBeadData(beadData);

        console.log(`图片转换完成！生成 ${beadData.length}x${beadData[0]?.length || 0} 拼豆数据。`);
    };
    image.crossOrigin = "anonymous"; 
    image.src = previewUrl.value; 
};
</script>

<template>
  <FloatingWindow title="🖼️ 图片导入与转换" :initialX="10" :initialY="350" :initialW="350" :initialH="450">
    <div class="setting-group">
        <label>导入图片:</label>
        <button @click="triggerFileInput" class="import-btn">选择本地图片</button>
        <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none;">
        <p v-if="fileName" class="file-name">已选择文件: {{ fileName }}</p>
        <p v-else class="placeholder-text">无文件</p>
    </div>
    
    <div class="setting-group">
      <label>分割精度 (像素/px): <span class="current-value">当前值: {{ precision }}px</span></label>
      <div class="input-controls">
        <button @click="updatePrecision(-1)">-</button>
        <input type="number" v-model.number="precision" min="1" class="input-medium">
        <button @click="updatePrecision(1)">+</button>
      </div>
    </div>

    <div class="preview-area">
        <label>图片预览:</label>
        <div class="image-box">
            <img v-if="previewUrl" :src="previewUrl" alt="图片预览" class="image-preview">
            <p v-else class="placeholder-text">导入图片后将在此处显示预览</p>
        </div>
    </div>
    
    <button @click="startConversion" class="apply-btn" :disabled="!previewUrl">
        开始图片像素化转换
    </button>
  </FloatingWindow>
</template>

<style scoped>
/* (样式代码保持不变) */
.setting-group { margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px dashed #444; }
label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
.current-value { font-weight: normal; color: #ccc; font-size: 12px; }
.import-btn { 
    background-color: #3e3e3e; 
    border: 1px solid #555; 
    color: white; 
    padding: 8px 15px; 
    cursor: pointer; 
    border-radius: 4px; 
    width: 100%;
}
.file-name { font-size: 12px; color: #ccc; margin-top: 5px; }

.input-controls { display: flex; align-items: center; gap: 5px; }
.input-controls button { background: #555; border: none; color: white; padding: 5px 10px; cursor: pointer; border-radius: 3px; }
.input-medium { width: 40px; text-align: center; background: #444; border: 1px solid #555; color: white; padding: 5px; border-radius: 3px; }

.preview-area { margin-bottom: 15px; }
.image-box {
    width: 100%;
    height: 150px;
    background-color: #2c2c2c;
    border: 1px dashed #555;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
.image-preview {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
.placeholder-text { font-size: 14px; color: #777; }
.apply-btn { 
    background-color: #28a745; 
    color: white; 
    border: none; 
    padding: 10px 15px; 
    cursor: pointer; 
    margin-top: 10px; 
    border-radius: 4px; 
    width: 100%;
}
</style>