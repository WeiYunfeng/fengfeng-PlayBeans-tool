// src/components/PixiCanvas.vue
<script setup>
import * as PIXI from 'pixi.js';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { store } from '../State'; // 🎯 导入 store

let app;
let gridContainer; // 存放所有方格和标号的容器
let fpsText; // 🎯 重新添加：用于显示 FPS 的文本对象
let isDragging = false;
let lastPointerPosition = { x: 0, y: 0 };
let isRotating = false;
let lastRotationAngle = 0;

const PIXEL_SIZE = 30; // 设定单个方格的大小（初始显示尺寸）
const BORDER_SIZE = 1; // 边框宽度 (用于计算坐标偏移)
const BORDER_COLOR = 0x333333; // 边框背景色
const LABEL_COLOR = 0xFFFFFF; // 标签文字颜色
// 🎯 新增常量：定义初始缩放值。请修改此值来设置默认缩放。
const INITIAL_SCALE = 0.5; 

const pixiContainer = ref(null); 

// 🎯 辅助函数：根据背景色亮度动态选择文本颜色（确保文字清晰）
function getLabelColor(hexColor) {
    // 将 PIXI 颜色整数 0xRRGGBB 转换为 R, G, B
    const r = (hexColor >> 16) & 0xFF;
    const g = (hexColor >> 8) & 0xFF;
    const b = hexColor & 0xFF;

    // 计算颜色亮度 (Luminance)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; 

    // 亮度低于 0.5 视为深色背景，使用白色文字 (0xFFFFFF)，否则使用黑色文字 (0x000000)
    return luminance < 0.5 ? 0xFFFFFF : 0x000000; 
}


// --- 核心绘制函数：绘制拼豆网格、边框和标号 ---
const drawBeadGrid = () => {
    if (!app || !gridContainer) return;

    // 1. 清空旧的绘制内容
    gridContainer.removeChildren();

    const W = store.gridWidth;
    const H = store.gridHeight;
    const totalW = W + 2 * BORDER_SIZE;
    const totalH = H + 2 * BORDER_SIZE;
    const lineColor = store.lineColor;
    const beadData = store.beadData;

    if (W === 0 || H === 0) {
        return;
    }
    
    // 设置容器中心锚点
    gridContainer.pivot.set(
        (totalW * PIXEL_SIZE) / 2,
        (totalH * PIXEL_SIZE) / 2
    );

    const graphics = new PIXI.Graphics();
    const textObjects = []; // 🎯 用于存放所有文本对象 (确保在最上层渲染)
    
    // --- 2. 绘制带编号的边框 (Outer Border) ---
    for (let y = 0; y < totalH; y++) {
        for (let x = 0; x < totalW; x++) {
            const isBorder = (x === 0 || x === totalW - 1 || y === 0 || y === totalH - 1);
            
            const posX = x * PIXEL_SIZE;
            const posY = y * PIXEL_SIZE;
            
            if (isBorder) {
                // 绘制深色边框背景
                graphics.beginFill(BORDER_COLOR);
                graphics.drawRect(posX, posY, PIXEL_SIZE, PIXEL_SIZE);
                graphics.endFill();

                // 添加编号标签（边框标签）
                let labelText = null;
                const style = new PIXI.TextStyle({
                    fontFamily: 'Arial',
                    fontSize: PIXEL_SIZE * 0.5,
                    fill: LABEL_COLOR,
                    align: 'center',
                });

                if (y === 0 && x >= BORDER_SIZE && x < totalW - BORDER_SIZE) { 
                    // 顶部行标签 (1, 2, 3...)
                    labelText = (x).toString();
                } else if (x === 0 && y >= BORDER_SIZE && y < totalH - BORDER_SIZE) { 
                    // 🎯 左侧列标签：使用数字 (1, 2, 3...)
                    labelText = (y - BORDER_SIZE + 1).toString();
                } 

                if (labelText) {
                    const text = new PIXI.Text({ text: labelText, style: style });
                    text.anchor.set(0.5); 
                    text.x = posX + PIXEL_SIZE / 2;
                    text.y = posY + PIXEL_SIZE / 2;
                    textObjects.push(text); // 收集边框文本
                }
            }
        }
    }
    
    // --- 3. 绘制核心拼豆网格和颜色 (Inner Grid & Beads) ---
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const posX = (x + BORDER_SIZE) * PIXEL_SIZE;
            const posY = (y + BORDER_SIZE) * PIXEL_SIZE;
            
            const bead = beadData[y] ? beadData[y][x] : null;

            // 3.1 填充颜色
            const fillColor = bead && bead.color !== undefined ? bead.color : 0xFFFFFF; 
            
            graphics.beginFill(fillColor);
            graphics.drawRect(posX, posY, PIXEL_SIZE, PIXEL_SIZE);
            graphics.endFill();

            // 3.2 绘制网格线条
            graphics.lineStyle(1, lineColor, 1);
            graphics.drawRect(posX, posY, PIXEL_SIZE, PIXEL_SIZE);

            // 🎯 3.3 绘制核心颜色标号
            const labelText = bead ? bead.id : null; 
            
            if (labelText) {
                // 动态获取文字颜色，确保在深色/浅色背景上都清晰
                const dynamicFillColor = getLabelColor(fillColor); 
                
                const style = new PIXI.TextStyle({
                    fontFamily: 'Arial',
                    fontSize: PIXEL_SIZE * 0.4, 
                    fill: dynamicFillColor, 
                    align: 'center',
                    fontWeight: 'bold', 
                });

                const text = new PIXI.Text({ text: labelText.toString(), style: style });
                text.anchor.set(0.5); 
                text.x = posX + PIXEL_SIZE / 2;
                text.y = posY + PIXEL_SIZE / 2;
                textObjects.push(text); // 收集拼豆标号文本
            }
        }
    }
    
    // --- 4. 渲染图层 (确保文本在最上层) ---
    // 先添加 graphics (背景、色块、网格线)
    gridContainer.addChild(graphics);
    
    // 后添加所有文本对象 (标号和边框数字)
    textObjects.forEach(text => {
        gridContainer.addChild(text);
    });
    
    // 确保画布居中
    resetView();
    app.render(); 
};

// --- 初始化 Pixi 应用程序 ---
const initPixi = async () => { 
    const containerEl = pixiContainer.value; 
    
    if (!containerEl) {
        console.error("PIXI 容器未找到，无法初始化！");
        return; 
    }
    
    app = new PIXI.Application(); 
    
    try {
        await app.init({
            width: containerEl.clientWidth,
            height: containerEl.clientHeight,
            backgroundColor: 0xEEEEEE, // 浅灰色背景
            antialias: true,
        });
        
        containerEl.appendChild(app.canvas);
        
        // 1. 创建网格容器 (Grid Container)
        gridContainer = new PIXI.Container();
        gridContainer.eventMode = 'static'; // 允许接收事件
        gridContainer.cursor = 'grab';
        
        // 2. 交互设置
        gridContainer.on('pointerdown', onDragStart);
        gridContainer.on('pointerup', onDragEnd);
        gridContainer.on('pointerupoutside', onDragEnd);
        gridContainer.on('pointermove', onDragMove);
        app.stage.addChild(gridContainer);
        
        // 3. 启用鼠标滚轮和右键事件
        app.canvas.addEventListener('wheel', onWheel, { passive: false });
        app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        app.stage.on('rightdown', onRotateStart);
        app.stage.on('rightup', onRotateEnd);
        app.stage.on('pointermove', onRotateMove);
        
        // --- 🎯 重新添加 FPS 显示逻辑 ---
        const fpsStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xCCCCCC, // 灰色文字
            fontWeight: 'bold',
            // 背景阴影，使其在不同背景下都可见
            dropShadow: true,
            dropShadowColor: 0x000000, 
            dropShadowDistance: 1,
        });
        
        fpsText = new PIXI.Text({ text: 'FPS: 60', style: fpsStyle });
        
        // 锚点设置在左下角
        fpsText.x = 10;
        // 使用 app.screen.height 确保它位于底部 (需要在窗口调整大小时更新)
        fpsText.y = app.screen.height - 25; 
        
        app.stage.addChild(fpsText);
        // 监听 PIXI 渲染器尺寸变化（窗口调整大小时）
        app.renderer.on('resize', updateFpsPosition); 

        // 🎯 启动 FPS 更新循环
        app.ticker.add(updateFps);
        // -----------------------------
        
        // 初始视图居中
        resetView();
    } catch (error) {
        console.error("PIXI 初始化失败:", error);
    }
};

// --- FPS 核心函数：在每个帧更新文本 ---
const updateFps = () => {
    if (fpsText && app.ticker.FPS) {
        // 使用 Math.round(app.ticker.FPS) 获取整数 FPS 值
        fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
    }
};

// --- 辅助函数：更新 FPS 文本位置，以适应窗口大小变化 ---
const updateFpsPosition = () => {
    if (fpsText && app) {
        // 重新计算底部位置
        fpsText.y = app.screen.height - 25;
    }
};


// --- 拖动, 缩放, 旋转, 居中逻辑 (保持不变) ---
const onDragStart = (e) => { 
    isDragging = true;
    lastPointerPosition = { x: e.globalX, y: e.globalY };
    gridContainer.cursor = 'grabbing';
};
const onDragEnd = () => { 
    isDragging = false;
    isRotating = false;
    gridContainer.cursor = 'grab';
};
const onDragMove = (e) => { 
    if (isDragging) {
        const dx = e.globalX - lastPointerPosition.x;
        const dy = e.globalY - lastPointerPosition.y;
        gridContainer.x += dx;
        gridContainer.y += dy;
        lastPointerPosition = { x: e.globalX, y: e.globalY };
    }
};
const onWheel = (e) => { 
    e.preventDefault(); 
    const scaleFactor = 1.1; // 缩放因子
    const currentScale = gridContainer.scale.x;
    let newScale;

    if (e.deltaY < 0) {
        // 放大
        newScale = currentScale * scaleFactor;
    } else {
        // 缩小
        newScale = currentScale / scaleFactor;
    }

    // 限制缩放范围
    newScale = Math.max(0.1, Math.min(5, newScale));

    const point = app.renderer.events.pointer.global;
    // 获取鼠标在 gridContainer 局部坐标系中的位置
    const worldPos = gridContainer.toLocal(point);

    // 缩放操作
    gridContainer.scale.set(newScale);

    // 保持缩放中心点不变 (平移修正)
    const newWorldPos = gridContainer.toLocal(point);
    gridContainer.x += (newWorldPos.x - worldPos.x) * newScale;
    gridContainer.y += (newWorldPos.y - worldPos.y) * newScale;
};
const onRotateStart = (e) => { 
    isRotating = true;
    const pointer = e.global;
    lastRotationAngle = Math.atan2(pointer.y - gridContainer.y, pointer.x - gridContainer.x);
};
const onRotateEnd = () => { isRotating = false; };
const onRotateMove = (e) => { 
    if (isRotating) {
        const pointer = e.global;
        const currentAngle = Math.atan2(pointer.y - gridContainer.y, pointer.x - gridContainer.x);
        const deltaAngle = currentAngle - lastRotationAngle;
        gridContainer.rotation += deltaAngle;
        lastRotationAngle = currentAngle;
    }
};

// 🎯 修正：使用 INITIAL_SCALE 常量
const resetView = () => { 
    // 居中和重置缩放/旋转
    gridContainer.x = app.screen.width / 2;
    gridContainer.y = app.screen.height / 2;
    gridContainer.rotation = 0;
    gridContainer.scale.set(INITIAL_SCALE); // 🎯 使用 INITIAL_SCALE 
};


onMounted(() => {
    initPixi().then(() => {
        // 🎯 初始时绘制一次 (将绘制示例网格或空白网格)
        drawBeadGrid();
        // 🎯 监听 store.beadData 变化（图片转换完成时），并重新绘制
        watch(() => store.beadData, drawBeadGrid, { deep: true });
        // 🎯 监听 gridWidth/gridHeight/lineColor 变化（设置菜单调整时）
        watch(() => [store.gridWidth, store.gridHeight, store.lineColor], drawBeadGrid, { deep: false });
    });
    // 暴露全局函数供 App.vue 中的“视角回正”按钮调用
    window.resetPixiView = resetView; 
});

onUnmounted(() => {
    if (app) {
        // 🎯 移除 FPS 循环监听
        app.ticker.remove(updateFps);
        app.renderer.off('resize', updateFpsPosition);
        
        app.canvas.removeEventListener('wheel', onWheel);
        app.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
        app.destroy(true); 
    }
});
</script>

<template>
  <div ref="pixiContainer" class="pixi-canvas-container"></div>
</template>

<style scoped>
/* 确保容器占满父元素 */
.pixi-canvas-container {
  width: 100%;
  height: 100%;
  cursor: grab;
}
</style>