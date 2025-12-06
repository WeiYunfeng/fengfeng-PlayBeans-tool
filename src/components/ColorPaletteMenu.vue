// src/components/ColorPaletteMenu.vue
<script setup>
import FloatingWindow from './FloatingWindow.vue';
import { ref, watch, computed } from 'vue';
import { store, useStore } from '../State'; 

// 🎯 导入完整的色板数据
import { palette144 } from '../data/palette144.js'; 
import { palette221 } from '../data/palette221.js'; 

// 🎯 确保导入 setCustomPalette
const { setPalette, setCustomPalette } = useStore();

// 辅助函数：将 rgb(r, g, b) 转换为 Hex (用于 CSS)
function rgbToHex(rgb) {
    // 修正正则表达式以处理可能的空格
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#000000';
    const toHex = (c) => parseInt(c).toString(16).padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

// 🎯 预处理色板数据：批量计算并添加 hex 字段
const colorPalette144 = palette144.map(item => ({
    ...item,
    rgb: item.color, // 将原始的 'color' 属性统一为 'rgb'
    hex: rgbToHex(item.color) // 计算 hex
}));
const colorPalette221 = palette221.map(item => ({
    ...item,
    rgb: item.color, 
    hex: rgbToHex(item.color)
}));

// 🎯 新增：合并所有可用颜色，用于自定义模式下的选择列表
const allAvailableColors = [...colorPalette144, ...colorPalette221];


// 局部状态：选中的色板键值 (144, 221, custom)
const selectedPaletteKey = ref(store.selectedPalette);
// 局部状态：用于自定义色板的颜色 ID 列表
const selectedColors = ref(store.customPalette.map(item => item.id));

// 监听全局状态变化，更新局部状态
watch(() => store.selectedPalette, (newVal) => {
    selectedPaletteKey.value = newVal;
});
// 监听自定义色板变化，同步到局部选择列表
watch(() => store.customPalette, (newVal) => {
    // 确保 selectedColors 始终反映全局 customPalette 的 ID
    selectedColors.value = newVal.map(item => item.id);
}, { deep: true, immediate: true });


// 监听色板选择变化，同步到全局状态
watch(selectedPaletteKey, (newKey) => {
    setPalette(newKey);
});


// 计算属性：当前显示的色板数据
const currentPalette = computed(() => {
    switch (selectedPaletteKey.value) {
        case '144':
            return colorPalette144;
        case '221':
            return colorPalette221;
        case 'custom':
            // 在自定义模式下，显示所有颜色供用户选择。
            return allAvailableColors; 
        default:
            return [];
    }
});

// 颜色选择/取消选择逻辑 (仅对 custom 色板有效)
const toggleColorSelection = (id) => {
    if (selectedPaletteKey.value !== 'custom') return;

    const index = selectedColors.value.indexOf(id);
    if (index > -1) {
        // 取消选择
        selectedColors.value.splice(index, 1);
    } else {
        // 选中
        selectedColors.value.push(id);
    }
};

// 保存自定义色板
const saveCustomPalette = () => {
    // 从 allAvailableColors 中筛选出 selectedColors 对应的完整颜色对象
    const customPaletteData = selectedColors.value
        .map(id => allAvailableColors.find(item => item.id === id))
        .filter(item => item !== undefined); 
        
    setCustomPalette(customPaletteData);
    alert('自定义色板已保存！');
};

</script>

<template>
  <FloatingWindow title="🌈 色板选择与管理" :initialX="1550" :initialY="400" :initialW="350" :initialH="420">
    <div class="setting-group">
      <label>色板选择</label>
      <select v-model="selectedPaletteKey" class="palette-select">
        <option value="144">144色板 (常见)</option>
        <option value="221">221色板 (全集)</option>
        <option value="custom">我的自定义色板</option>
      </select>
      <p class="info-text">当前色板颜色数量: {{ currentPalette.length }}</p>
    </div>

    <div class="setting-group">
      <label>当前色板（点击方块进行多选）</label>
      <div class="color-list">
        <div 
          v-for="item in currentPalette" 
          :key="item.id" 
          class="color-item"
          :class="{ selected: selectedColors.includes(item.id) }"
          @click="toggleColorSelection(item.id)"
          :title="`${item.name} (${item.rgb})`"
        >
          <div class="color-swatch" :style="{ backgroundColor: item.hex }"></div>
          
          <div class="color-label">{{ item.id }}</div>
          
        </div>
        
        <p v-if="currentPalette.length === 0" class="placeholder-text">加载颜色失败或色板为空。</p>
        <p v-else-if="selectedPaletteKey === 'custom' && selectedColors.length === 0" class="placeholder-text">请点击上方颜色块进行多选。</p>
      </div>
      
      <button v-if="selectedPaletteKey === 'custom'" @click="saveCustomPalette" class="apply-btn">保存当前自定义色板</button>
      
    </div>
  </FloatingWindow>
</template>

<style scoped>
.setting-group { margin-bottom: 12px; padding-bottom: 5px; border-bottom: 1px dashed #444; }
label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
.palette-select { padding: 5px; width: 100%; background: #444; border: 1px solid #555; color: white; border-radius: 3px; }
.info-text { font-size: 12px; color: #ccc; margin-top: 5px; }
.color-list { 
    display: flex; 
    flex-wrap: wrap; 
    gap: 4px; 
    max-height: 180px; 
    overflow-y: auto; 
    padding: 5px 0; 
}
.color-item { 
    border: 1px solid transparent; 
    display: flex; 
    flex-direction: column; 
    align-items: center;
}
.color-swatch { 
    width: 20px; 
    height: 20px; 
    border: 1px solid #ccc; 
    border-radius: 3px; 
}
.color-label {
    font-size: 8px; 
    color: #ccc;
    margin-top: 2px; 
    text-align: center;
    width: 25px; 
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.placeholder-text { font-size: 12px; color: #999; margin-top: 10px; }
.color-item.selected {
    border: 1px solid #007bff; /* 强调选中 */
    background-color: #333;
}
.apply-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 15px;
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
    margin-top: 10px;
}
</style>