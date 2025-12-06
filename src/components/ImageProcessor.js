// src/components/ImageProcessor.js
import { useGetters } from '../State.js'; // 🎯 从 State 获取当前色板

/**
 * 辅助函数：将 CSS RGB 字符串 'rgb(r, g, b)' 转换为 [r, g, b] 数组
 * @param {string} rgbStr 例如: 'rgb(255, 255, 255)'
 * @returns {number[]} [r, g, b]
 */
function parseRgb(rgbStr) {
    const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [0, 0, 0];
}

/**
 * 辅助函数：将 Hex #RRGGBB 转换为 Pixi/JS 颜色整数 0xRRGGBB
 * @param {string} hex 例如: '#FFD700'
 * @returns {number} 0xRRGGBB
 */
function hexToPixiColor(hex) {
    // 移除 # 号，并转换为数字
    return parseInt(hex.slice(1), 16);
}

/**
 * 颜色匹配的核心算法：欧氏距离最近邻匹配 (Nearest Neighbor by Euclidean Distance)
 * @param {number[]} targetRgb 目标颜色 [r, g, b]
 * @param {Array<{ id: string, hex: string, name: string, rgb: string }>} palette 当前色板数组
 * @returns {{ id: string, color: number }} 匹配结果 (id: 'A01', color: 0xFFFFFF)
 */
function findNearestColor(targetRgb, palette) {
    let minDistanceSq = Infinity;
    let nearestColor = null;

    // 🎨 如果色板为空，默认返回白色
    if (!palette || palette.length === 0) {
        return { id: 'ERR', color: 0xFFFFFF };
    }

    const [tr, tg, tb] = targetRgb;

    for (const colorItem of palette) {
        const [cr, cg, cb] = parseRgb(colorItem.rgb); // 确保使用预处理后的 rgb 字符串
        
        // 计算欧氏距离的平方 (避免开根号，速度更快)
        const dr = tr - cr;
        const dg = tg - cg;
        const db = tb - cb;
        const distanceSq = dr * dr + dg * dg + db * db;

        if (distanceSq < minDistanceSq) {
            minDistanceSq = distanceSq;
            nearestColor = {
                id: colorItem.id,
                // 🎯 确保返回 PIXI 颜色整数
                color: hexToPixiColor(colorItem.hex)
            };
        }
    }
    
    // 如果找不到最近的颜色（理论上不会），默认返回白色
    return nearestColor || { id: 'ERR', color: 0xFFFFFF };
}


/**
 * 图片颜色量化和匹配主函数
 * @param {ImageData} imageData 从 Canvas 获取的图片数据
 * @param {number} precision 像素合并精度 (例如 5x5 像素合并为一个拼豆)
 * @returns {Array<Array<{id: string, color: number}>>} 拼豆数据矩阵
 */
export function colorQuantizationAndMatch(imageData, precision) {
    const { getCurrentPalette } = useGetters();
    const palette = getCurrentPalette(); // 获取当前选中的色板

    if (!palette || palette.length === 0) {
        console.error("当前色板为空，无法进行图片转换！");
        return [];
    }

    const { data, width, height } = imageData;
    const gridWidth = Math.ceil(width / precision);
    const gridHeight = Math.ceil(height / precision);
    const beadMatrix = [];

    if (gridWidth === 0 || gridHeight === 0) {
        console.error("计算的拼豆矩阵尺寸为 0x0。");
        return [];
    }

    console.log(`原图 ${width}x${height}，精度 ${precision}px，转换成 ${gridWidth}x${gridHeight} 拼豆矩阵...`);

    // 遍历每一个拼豆格子的位置
    for (let y = 0; y < gridHeight; y++) {
        const row = [];
        for (let x = 0; x < gridWidth; x++) {
            let r_sum = 0, g_sum = 0, b_sum = 0;
            let pixelCount = 0;

            // 遍历当前格子范围内的所有像素，计算平均颜色 (下采样)
            for (let py = y * precision; py < Math.min((y + 1) * precision, height); py++) {
                for (let px = x * precision; px < Math.min((x + 1) * precision, width); px++) {
                    const index = (py * width + px) * 4; // 4 是 (R, G, B, A)
                    r_sum += data[index];
                    g_sum += data[index + 1];
                    b_sum += data[index + 2];
                    // 忽略透明度 data[index + 3]
                    pixelCount++;
                }
            }

            // 计算平均 RGB
            let avgR = 0, avgG = 0, avgB = 0;
            if (pixelCount > 0) {
                avgR = Math.round(r_sum / pixelCount);
                avgG = Math.round(g_sum / pixelCount);
                avgB = Math.round(b_sum / pixelCount);
            }
            
            // 🎯 将平均颜色与色板进行最近邻匹配
            const nearestBead = findNearestColor([avgR, avgG, avgB], palette);
            
            row.push(nearestBead);
        }
        beadMatrix.push(row);
    }
    
    return beadMatrix;
}