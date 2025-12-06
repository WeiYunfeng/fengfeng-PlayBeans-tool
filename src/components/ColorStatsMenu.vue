// src/components/ColorStatsMenu.vue
<script setup>
import FloatingWindow from './FloatingWindow.vue';
import { store, useGetters } from '../State'; // 🎯 导入 store 和 useGetters
import { computed } from 'vue'; // 🎯 导入 computed

// --- 颜色统计计算 ---
const colorData = computed(() => {
    const { beadData } = store;
    // 如果没有数据，直接返回空数组
    if (!beadData || beadData.length === 0) {
        return [];
    }
    
    const { getCurrentPalette } = useGetters();
    const currentPalette = getCurrentPalette();
    
    const statsMap = new Map();
    
    // 1. 遍历拼豆数据，进行计数
    beadData.forEach(row => {
        row.forEach(bead => {
            // 使用 bead.id 进行统计
            if (bead && bead.id) {
                 statsMap.set(bead.id, (statsMap.get(bead.id) || 0) + 1);
            }
        });
    });
    
    // 2. 将统计结果与色板信息合并
    const results = [];
    statsMap.forEach((count, id) => {
        // 查找色板中对应的项，获取其 hex 和 name
        const paletteItem = currentPalette.find(item => item.id === id);
        
        if (paletteItem) {
            results.push({
                id: id,
                // 🎯 移除 name 字段，因为模板中不再使用
                // name: paletteItem.name || '未知', 
                count: count,
                color: paletteItem.hex || '#000000' // CSS 颜色
            });
        }
    });

    // 3. 按数量降序排列
    return results.sort((a, b) => b.count - a.count);
});

// 总计数量的计算
const totalCount = computed(() => {
    return colorData.value.reduce((sum, item) => sum + item.count, 0);
});
</script>

<template>
  <FloatingWindow title="🔢 色块数量统计" :initialX="1550" :initialY="10" :initialW="350" :initialH="300">
    <div class="stats-container">
        <table>
          <thead>
            <tr>
              <th>标号</th>
              <th>颜色</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in colorData" :key="item.id">
              <td>{{ item.id }}</td>
              <td>
                <div class="color-swatch" :style="{ backgroundColor: item.color }"></div>
              </td>
              <td>{{ item.count }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">总计</td> 
              <td>{{ totalCount }}</td>
            </tr>
          </tfoot>
        </table>
        <p v-if="colorData.length === 0" style="text-align: center; color: #999; padding-top: 15px;">
           暂无拼豆数据，请导入图片进行转换。
        </p>
    </div>
  </FloatingWindow>
</template>

<style scoped>
.stats-container { max-height: 250px; overflow-y: auto; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th, td {
  border: 1px solid #444;
  padding: 8px;
  text-align: center;
  font-size: 12px; /* 减小字号以适应更多列 */
}
th {
  background-color: #4a4a4a;
}
.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin: 0 auto;
  border: 1px solid #ccc;
}
tfoot td {
  font-weight: bold;
  background-color: #4a4a4a;
}
</style>