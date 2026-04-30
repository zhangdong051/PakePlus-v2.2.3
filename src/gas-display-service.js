// gas-display-service.js - 独立的气体数据显示服务
(function(global) {
    let domRef = null;
    
    const GasDisplayService = {
        init(DOM) {
            domRef = DOM;
        },
        
        update(data) {
            if (!domRef || !domRef.gasInfoPanel) return;
            if (!data || data.disconnected) {
                domRef.gasInfoPanel.innerHTML = `⚠️ 气体数据未连接`;
                domRef.gasInfoPanel.style.opacity = '0.9';
                return;
            }
            const o2 = (data.O2 !== undefined && data.O2 !== null) ? Number(data.O2).toFixed(1) : '--';
            const co = (data.CO !== undefined && data.CO !== null) ? Number(data.CO).toFixed(1) : '--';
            const h2s = (data.H2S !== undefined && data.H2S !== null) ? Number(data.H2S).toFixed(1) : '--';
            const ch4 = (data.CH4 !== undefined && data.CH4 !== null) ? Number(data.CH4).toFixed(1) : '--';
            let tsValue = (data.ts !== undefined && data.ts !== null) ? Number(data.ts).toFixed(1) : '--';
            const tsUnit = (data.ts !== undefined && !isNaN(Number(data.ts))) ? '°C' : '';
            
            domRef.gasInfoPanel.innerHTML = `
                <span><span class="gas-label">O₂</span><span class="gas-value">${o2}</span><span class="gas-unit">%VOL</span></span>
                <span class="gas-divider">|</span>
                <span><span class="gas-label">CO</span><span class="gas-value">${co}</span><span class="gas-unit">ppm</span></span>
                <span class="gas-divider">|</span>
                <span><span class="gas-label">H₂S</span><span class="gas-value">${h2s}</span><span class="gas-unit">ppm</span></span>
                <span class="gas-divider">|</span>
                <span><span class="gas-label">CH₄</span><span class="gas-value">${ch4}</span><span class="gas-unit">%LEL</span></span>
                <span class="gas-divider">|</span>
                <span><span class="gas-label">温度</span><span class="gas-value">${tsValue}</span><span class="gas-unit">${tsUnit}</span></span>
            `;
        },
        
        resetToDisconnected() {
            if (domRef && domRef.gasInfoPanel) domRef.gasInfoPanel.innerHTML = `🔌 气体数据等待连接`;
        },
        
        showWaiting() {
            if (domRef && domRef.gasInfoPanel) domRef.gasInfoPanel.innerHTML = `⏳ 订阅气体主题中...`;
        },
        
        parseAndUpdate(rawMsg) {
            try {
                let gasData = {};
                const trimmed = rawMsg.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    const parsed = JSON.parse(trimmed);
                    gasData.O2 = parsed.O2 ?? parsed.o2 ?? parsed.oxygen ?? null;
                    gasData.CO = parsed.CO ?? parsed.co ?? null;
                    gasData.H2S = parsed.H2S ?? parsed.h2s ?? null;
                    gasData.CH4 = parsed.CH4 ?? parsed.ch4 ?? null;
                    gasData.ts = parsed.ts ?? parsed.TS ?? parsed.temp ?? parsed.Temperature ?? null;
                } else {
                    const pattern = /(O2|CO|H2S|CH4|ts)\s*[:=]\s*([\d\.\-]+)/gi;
                    let match;
                    while ((match = pattern.exec(trimmed)) !== null) {
                        const key = match[1];
                        const val = parseFloat(match[2]);
                        if (!isNaN(val)) gasData[key] = val;
                    }
                }
                if (Object.keys(gasData).some(k => gasData[k] !== null && gasData[k] !== undefined)) {
                    this.update(gasData);
                } else if (domRef && domRef.gasInfoPanel) {
                    domRef.gasInfoPanel.innerHTML = `📡 气体数据: 解析中...<span style="font-size:10px;"> ${rawMsg.substring(0, 30)}</span>`;
                }
            } catch (e) {
                console.warn("气体消息解析失败", e);
                if (domRef && domRef.gasInfoPanel) domRef.gasInfoPanel.innerHTML = `⚠️ 气体数据格式异常`;
            }
        }
    };
    
    global.GasDisplayService = GasDisplayService;
})(window);