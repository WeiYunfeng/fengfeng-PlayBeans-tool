// src/components/FloatingWindow.vue

<script setup>
import { ref, onMounted } from 'vue'; // 🎯 导入 onMounted
import VueDraggableResizable from 'vue-draggable-resizable';
import 'vue-draggable-resizable/style.css'; 

// 定义组件接收的属性
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    initialX: { type: Number, default: 50 },
    initialY: { type: Number, default: 50 },
    initialW: { type: Number, default: 300 },
    initialH: { type: Number, default: 200 }
});

// 控制窗口内容是否折叠（显示/隐藏）
const isCollapsed = ref(false); 

// 🎯 1. 新增响应式状态：存储当前或计算得出的窗口高度
const currentH = ref(props.initialH);

// 🎯 2. 新增 DOM 引用：用于获取内容区的实际高度
const contentRef = ref(null); 

// 切换折叠状态
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
};

// 标题栏实际高度：30px (内容) + 10px (上下 padding) + 2px (上下 border) = 42px
const COLLAPSED_HEIGHT = 42; 

// 🎯 3. 在组件挂载后，计算最佳高度
onMounted(() => {
    if (contentRef.value) {
        // 获取内容区的实际滚动高度 (包含所有内容的完整高度)
        const contentHeight = contentRef.value.scrollHeight;
        
        // 最佳高度 = 内容高度 + 标题栏高度 + 标题栏与内容区之间的任何额外边距/边框
        // 注意：标题栏高度 COLLAPSED_HEIGHT 已经包含了边框和 padding (42px)
        // 窗口内容区的 padding 是 10px * 2 (上下) = 20px
        
        // 最佳高度应等于：内容滚动高度 + 标题栏高度 (42px)
        const optimalHeight = contentHeight + COLLAPSED_HEIGHT;

        // 🎯 4. 更新 currentH。我们使用 initialH 和 optimalHeight 中的较大值
        //    这样可以确保在内容很少时，窗口仍保持一个合理的最小高度 (initialH)，
        //    同时在内容溢出时，窗口能展开到足以显示所有内容的高度。
        currentH.value = Math.max(props.initialH, optimalHeight); 
    }
});
</script>

<template>
 <VueDraggableResizable
  :w="props.initialW"
  
  :h="isCollapsed ? COLLAPSED_HEIGHT : currentH"   
  :x="props.initialX"
  :y="props.initialY"
  :min-width="200"
  
  :min-height="isCollapsed ? COLLAPSED_HEIGHT : 150"
  
  :draggable="true"
  :resizable="!isCollapsed"
  class="floating-window"
  
  :class="{ 'collapsed-window': isCollapsed }" 
 >
  <div class="window-header" @dblclick="toggleCollapse">
   <span class="title-text">{{ props.title }}</span>
   <button @click="toggleCollapse" class="collapse-btn">
    {{ isCollapsed ? '展开 +' : '折叠 -' }}
   </button>
  </div>

  <div v-show="!isCollapsed" class="window-content" ref="contentRef">    <slot></slot>
  </div>
 </VueDraggableResizable>
</template>

<style scoped>
/* (样式保持不变) */
/* 确保组件及其内部元素使用准确的盒模型 */
.floating-window, .window-header, .window-content {
 box-sizing: border-box;
}

/* 【修正 2】移除 aggressive 的全局 overflow 样式，恢复正常缩放和滚动 */
.floating-window {
 display: flex;
 flex-direction: column;
 
 /* 移除之前添加的 overflow-y/x: hidden !important; */
 
 z-index: 10000 !important; 
 background-color: #333;
 border: 1px solid #555;
 border-radius: 5px;
 box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

/* 【修正 3】新增动态类：仅在折叠时，强制隐藏 VDR 组件产生的多余滚动条 */
.collapsed-window {
  overflow: hidden !important; 
}


.window-header {
 height: 30px; 
 background-color: #2c2c2c;
 color: white;
 padding: 5px 10px; 
 cursor: grab; 
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-radius: 5px 5px 0 0;
 flex-shrink: 0; 
}

.title-text {
 font-weight: bold;
}

.collapse-btn {
 background: none;
 border: 1px solid #777;
 color: white;
 padding: 2px 8px;
 cursor: pointer;
 border-radius: 3px;
 font-size: 12px;
}

.collapse-btn:hover {
 background-color: #444;
}

.window-content {
 padding: 10px;
 color: #ddd;
 
 /* 【修正 4】恢复内容区在展开时可滚动的功能 */
 overflow-y: auto; 
 
 flex-grow: 1; 
 min-height: 0; 
}
</style>