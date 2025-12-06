// src/State.js
import { reactive, readonly } from 'vue'; // 🎯 移除 computed，因为 getters 是一个函数，不需要依赖注入

// 🎯 导入色板数据
import { palette144 } from './data/palette144.js'; 
import { palette221 } from './data/palette221.js'; 

// --- 辅助函数：将 rgb(r, g, b) 转换为 Hex (用于 CSS) ---
function rgbToHex(rgb) {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#000000';
    const toHex = (c) => parseInt(c).toString(16).padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

// 🎯 预处理色板数据 (与 ColorPaletteMenu.vue 保持一致，确保有 hex 字段)
const processPalette = (palette) => palette.map(item => ({
    ...item,
    rgb: item.color, // 将原始的 'color' 属性统一为 'rgb'
    hex: rgbToHex(item.color) // 计算 hex
}));

const processedPalette144 = processPalette(palette144);
const processedPalette221 = processPalette(palette221);

// --- 默认状态 ---
const state = reactive({
    // 画板设定 (SettingsMenu)
    gridWidth: 52,       // ? x ?
    gridHeight: 52,
    lineColor: 0x444444, // Pixi 使用的 Hex 颜色 (例如 #444444)
    lineColorCss: '#444444', // CSS 颜色
    splitPrecision: 10,   // 像素/px

    // 色卡数据
    selectedPalette: '144', // '144', '221', 'custom'

    // 拼豆数据 (驱动 PixiCanvas 绘制)
    // 示例格式: Array<Array<{id: string, color: number}>>
    beadData: [], 
    
    // 🎯 存储预处理后的色板数据
    palette144: processedPalette144, 
    palette221: processedPalette221,
    customPalette: [], // 自定义色板 (由 ColorPaletteMenu 维护)
});

// --- Getters ---
const getters = {
    // 🎯 计算属性：动态获取当前选定的色板
    getCurrentPalette() {
        switch (state.selectedPalette) {
            case '144':
                return state.palette144;
            case '221':
                return state.palette221;
            case 'custom':
                return state.customPalette;
            default:
                return state.palette144;
        }
    }
};

// --- Actions / Mutations ---
const mutations = {
    setGridSize(width, height) {
        state.gridWidth = width;
        state.gridHeight = height;
        mutations.generateExampleBeadData();
    },
    setLineColor(hexPixi, cssColor) {
        state.lineColor = hexPixi;
        state.lineColorCss = cssColor;
    },
    setSplitPrecision(precision) {
        state.splitPrecision = precision;
    },
    setPalette(paletteKey) {
        state.selectedPalette = paletteKey;
    },
    // 🎯 新增: 设置自定义色板
    setCustomPalette(colors) {
        state.customPalette = colors;
    },
    // 🎯 核心新增: 导入图片转换后的拼豆数据
    setBeadData(data) {
        state.beadData = data;
        state.gridHeight = data.length;
        state.gridWidth = data.length > 0 ? data[0].length : 0;
    },
    // 占位函数：生成一个简单的 WxH 拼豆数据用于演示
generateExampleBeadData() {
    const data = Array.from({ length: state.gridHeight }, () =>
        Array.from({ length: state.gridWidth }, () => null)
    );
    state.beadData = data;
}
};

mutations.generateExampleBeadData(); // 初始化时生成初始数据

// 导出只读状态、可调用的修改函数和获取函数
export const store = readonly(state);
export const useStore = () => mutations;
export const useGetters = () => getters; // 🎯 导出 getters