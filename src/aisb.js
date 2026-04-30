// AI识别核心变量（TensorFlow.js + COCO-SSD 版本）
let isAiDetectionEnabled = false;   // AI识别是否启用
let detectionInterval = null;       // 识别循环定时器
let videoFrame = null;              // 视频元素缓存
let cocoModel = null;               // COCO-SSD模型实例

// ---------- 新增：目标跟踪相关变量 ----------
let trackedTarget = null;           // 当前跟踪的目标 { class, bbox, lastSeen }
const TRACKING_IOU_THRESHOLD = 0.3; // 匹配阈值（交并比）
const TRACKING_TIMEOUT = 3000;      // 目标丢失超时时间（毫秒）
// -----------------------------------------

// 初始化TensorFlow.js和COCO-SSD模型（页面加载时预加载）
async function initCocoModel() {
    try {
        console.log("开始加载SSD模型...");
        cocoModel = await cocoSsd.load();
        console.log("SSD模型加载完成");
    } catch (e) {
        console.error("COCO-SSD模型加载失败：", e);
        alert("AI识别初始化失败：模型加载失败，请检查网络后刷新页面");
    }
}

// 页面加载时自动初始化模型
document.addEventListener('DOMContentLoaded', function() {
    if (typeof cocoSsd === 'undefined') {
        const tfScript = document.createElement('script');
        tfScript.src = 'tf.min.js';
        tfScript.onload = function() {
            const cocoScript = document.createElement('script');
            cocoScript.src = 'coco-ssd.min.js';
            cocoScript.onload = initCocoModel;
            document.body.appendChild(cocoScript);
        };
        document.body.appendChild(tfScript);
    } else {
        initCocoModel();
    }
});

// AI识别开关函数
function AiSb() {
    if (!cocoModel) {
        alert("AI模型尚未加载完成，请稍候重试");
        return;
    }

    isAiDetectionEnabled = !isAiDetectionEnabled;
    const statusEl = document.getElementById('ai-status');
    
    if (isAiDetectionEnabled) {
        statusEl.textContent = "已启用";
        videoFrame = document.getElementById('remote-video') || document.getElementById('small-remote-video');
        if (!videoFrame) {
            alert("未找到视频源，无法启动AI识别");
            isAiDetectionEnabled = false;
            statusEl.textContent = "未启用（无视频源）";
            return;
        }
        startAiDetection();
    } else {
        statusEl.textContent = "未启用";
        stopAiDetection();
        clearDetectionBoxes();
        trackedTarget = null; // 关闭识别时同时停止跟踪
    }
}

// 启动AI识别循环
function startAiDetection() {
    if (detectionInterval) return;
    
    let lastPredictions = []; // 用于绘制优化
    
    async function detectFrame() {
        if (!isAiDetectionEnabled || !videoFrame || videoFrame.paused || videoFrame.readyState !== 4) {
            return;
        }

        try {
            const predictions = await cocoModel.detect(videoFrame);
            
            // ---------- 跟踪处理（持续输出坐标） ----------
            if (trackedTarget) {
                let bestMatch = null;
                let bestIoU = 0;

                for (const pred of predictions) {
                    if (pred.class !== trackedTarget.class) continue; // 同类匹配
                    const iou = computeIoU(trackedTarget.bbox, pred.bbox);
                    if (iou > bestIoU && iou > TRACKING_IOU_THRESHOLD) {
                        bestIoU = iou;
                        bestMatch = pred;
                    }
                }

                if (bestMatch) {
                    // 更新跟踪目标
                    trackedTarget.bbox = bestMatch.bbox;
                    trackedTarget.lastSeen = Date.now();

                    // 计算中心坐标（原始视频分辨率）
                    const [x, y, w, h] = bestMatch.bbox;
                    const centerX = (x + w / 2).toFixed(1);
                    const centerY = (y + h / 2).toFixed(1);
                    
                    // 输出到控制台（可根据需要调整格式）
                    console.log(`跟踪 [${trackedTarget.class}] 中心: (${centerX}, ${centerY}) 置信度: ${(bestMatch.score * 100).toFixed(1)}%`);
                } else {
                    // 检查是否超时丢失
                    if (Date.now() - trackedTarget.lastSeen > TRACKING_TIMEOUT) {
                        console.log('跟踪目标已丢失（超时）');
                        trackedTarget = null;
                    }
                }
            }
            // --------------------------------------------

            // 绘制处理（优化：仅当检测结果变化时才清除/重建框）
            const isPredictionsSame = JSON.stringify(predictions.map(p => [p.class, p.score, p.bbox])) === 
                                     JSON.stringify(lastPredictions.map(p => [p.class, p.score, p.bbox]));
            if (!isPredictionsSame) {
                clearDetectionBoxes();
                lastPredictions = predictions;
                
                predictions.forEach(pred => {
                    if (pred.score < 0.6) return;
                    drawDetectionBox(
                        pred.bbox[0],
                        pred.bbox[1],
                        pred.bbox[2],
                        pred.bbox[3],
                        `${pred.class} (${(pred.score * 100).toFixed(1)}%)`,
                        pred.bbox  // 传入原始边界框供点击跟踪使用
                    );
                });
            }
        } catch (e) {
            console.error("AI识别帧处理出错：", e);
        }
    }
    
    detectionInterval = setInterval(detectFrame, 200);
}

// 停止AI识别循环
function stopAiDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

// 绘制检测框（适配视频容器缩放 + 点击事件）
function drawDetectionBox(x, y, width, height, label, originalBbox) {
    const videoContainer = document.getElementById('large-video-container');
    if (!videoContainer) {
        console.error("绘制检测框失败：未找到large-video-container容器");
        return;
    }
    
    if (getComputedStyle(videoContainer).position === 'static') {
        videoContainer.style.position = 'relative';
    }
    videoContainer.style.zIndex = '100';
    videoContainer.style.pointerEvents = 'auto';

    const video = videoContainer.querySelector('video');
    if (!video) {
        console.error("绘制检测框失败：容器内未找到video元素");
        return;
    }
    
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    const scaleX = videoWidth > 0 ? (videoContainer.clientWidth / videoWidth) : 1;
    const scaleY = videoHeight > 0 ? (videoContainer.clientHeight / videoHeight) : 1;
    
    const boxLeft = Math.max(0, x * scaleX);
    const boxTop = Math.max(0, y * scaleY);
    const boxWidth = Math.max(0, width * scaleX);
    const boxHeight = Math.max(0, height * scaleY);
    
    const box = document.createElement('div');
    box.className = 'ai-detection-box';
    box.style.cssText = `
        position: absolute !important;
        left: ${boxLeft}px !important;
        top: ${boxTop}px !important;
        width: ${boxWidth}px !important;
        height: ${boxHeight}px !important;
        border: 2px solid #00ff00 !important;
        background-color: rgba(0, 255, 0, 0.2) !important;
        color: white !important;
        font-size: 12px !important;
        font-weight: bold !important;
        z-index: 9999 !important;
        padding: 2px 5px !important;
        box-sizing: border-box !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        user-select: none !important;
    `;
    box.textContent = label;
    box.dataset.detectionBox = true;
    
    // ---------- 点击事件：开始跟踪目标 ----------
    box.addEventListener('click', function(e) {
        e.stopImmediatePropagation();
        e.preventDefault();

        const targetClass = label.split(' ')[0]; // 提取类别（去除置信度）
        trackedTarget = {
            class: targetClass,
            bbox: originalBbox.slice(), // 拷贝原始边界框
            lastSeen: Date.now()
        };
        console.log(`开始跟踪目标：${targetClass}，原始坐标: [${originalBbox.map(v => v.toFixed(1))}]`);
    }, { capture: true });
    // --------------------------------------------
    
    // 移除可能重叠的旧框
    const oldBoxes = videoContainer.querySelectorAll(`.ai-detection-box`);
    oldBoxes.forEach(oldBox => {
        if (Math.abs(parseFloat(oldBox.style.left) - boxLeft) < 1 && 
            Math.abs(parseFloat(oldBox.style.top) - boxTop) < 1) {
            oldBox.remove();
        }
    });
    
    videoContainer.appendChild(box);
}

// 清除所有检测框
function clearDetectionBoxes() {
    const boxes = document.querySelectorAll('[data-detection-box]');
    boxes.forEach(box => box.remove());
}

// ---------- 工具函数：计算两个边界框的IoU ----------
function computeIoU(bbox1, bbox2) {
    const [x1, y1, w1, h1] = bbox1;
    const [x2, y2, w2, h2] = bbox2;

    const interX1 = Math.max(x1, x2);
    const interY1 = Math.max(y1, y2);
    const interX2 = Math.min(x1 + w1, x2 + w2);
    const interY2 = Math.min(y1 + h1, y2 + h2);

    const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
    const bbox1Area = w1 * h1;
    const bbox2Area = w2 * h2;

    return interArea / (bbox1Area + bbox2Area - interArea);
}

// ---------- 手动停止跟踪（可在控制台调用或绑定到按钮）----------
function stopTracking() {
    trackedTarget = null;
    console.log('手动停止跟踪');
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', function() {
    stopAiDetection();
    clearDetectionBoxes();
    cocoModel = null;
});

// 全局错误捕获
window.addEventListener('error', function(e) {
    if (e.message.includes('cocoSsd') || e.message.includes('tf')) {
        console.error("TensorFlow.js加载异常：", e);
        alert("AI识别功能异常：请检查网络连接，确保能访问TensorFlow.js CDN");
    }
});