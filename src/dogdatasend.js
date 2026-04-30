// ========== 新增：全局rc变量指向appState.rcValues ==========
window.rc0 = appState.rcValues.rc0;
window.rc1 = appState.rcValues.rc1;
window.rc2 = appState.rcValues.rc2;
window.rc3 = appState.rcValues.rc3;

// 新增临时弹窗函数，1秒后自动消失
function showTempMessage(message) {
    // 创建弹窗元素
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '8%';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.padding = '10px 20px';
    popup.style.backgroundColor = 'rgba(0,0,0,0.7)';
    popup.style.color = 'white';
    popup.style.borderRadius = '4px';
    popup.style.zIndex = '9999';
    popup.style.transition = 'opacity 0.3s';
    popup.textContent = message;

    // 添加到页面
    document.body.appendChild(popup);

    // 1秒后移除弹窗
    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 300);
    }, 1500);
}

// 【修复1】将变量挂载到window全局对象，避免暂时性死区
// 替代 let 声明，全局挂载可确保初始化优先于函数执行
window.isFirstEnter = true;
window.lastSendInitTime = 0;

// 再写函数
function GAME_command() {
   // showTempMessage("game-1");
    const currentTime = Date.now();

    // 初始化逻辑（仅B2）
    // 【修复2】访问全局挂载的变量，而非局部let变量
    if (window.isFirstEnter || currentTime - window.lastSendInitTime > 15000) {
        const initData1 = {
            "dataextratype": 10,
            "datatype": 4,
            "datahead": "Set Motion Mode",
            "datalen": 0,
            "data": { "motion_name": "normal" },
            "imei": "imei"
        };
        const initData2 = {
            "dataextratype": 10,
            "datatype": 11,
            "datahead": "Balance Stand Mode",
            "datalen": 0,
            "data": { "null": null },
            "imei": "imei"
        };

        publishMessage(JSON.stringify(initData1));
        publishMessage(JSON.stringify(initData2));

        // 【修复3】更新全局变量
        window.isFirstEnter = false;
        window.lastSendInitTime = currentTime;
    }

    // 遥控数据
    const rawRc0 = window.rc0; // 显式访问全局rc变量，增强可读性
    const rawRc1 = window.rc1;
    const rawRc3 = window.rc3;

    // B2 控制计算
    const rcToB2Vx = (rawRc0 / 100) * 1.2;
    const rcToB2Vy = (-rawRc1 / 100) * 0.4;
    const rcToB2Vyaw = (-rawRc3 / 100) * 0.75;

	let vx = Math.max(-0.8, rcToB2Vx);
	let vy = rcToB2Vy;
	let vyaw = rcToB2Vyaw;

	// 保留一位小数
	vx = Math.round(vx * 10) / 10;
	vy = Math.round(vy * 10) / 10;
	vyaw = Math.round(vyaw * 10) / 10;

	const controlLog = `宇树B2 - vx:${vx} m/s | vy:${vy} m/s | vyaw:${vyaw} r/s`;
    showTempMessage(controlLog);

    const controlData = {
        "dataextratype": 10,
        "datatype": 16,
        "datahead": "Move",
        "datalen": 0,
        "data": { "vx": vx, "vy": vy, "vyaw": vyaw },
        "imei": "imei"
    };

    publishMessage(JSON.stringify(controlData));
}

// 以下函数保持不变（仅保留关键部分，完整代码需复用原有逻辑）
function qilipaxia() {
    if (event) event.stopPropagation();
    showTempMessage("起立/趴下");
    const jsonData = {
        "dataextratype": 11,
        "datatype": 1,
        "datahead": "Stand Up/Get Down",
        "datalen": 0,
        "data": { "null": null },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function aimoshi() {
    if (event) event.stopPropagation();
    showTempMessage("Ai模式");
    const jsonData = {
        "dataextratype": 10,
        "datatype": 4,
        "datahead": "Set Motion Mode",
        "datalen": 0,
        "data": { "motion_name": "ai" },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function changguimoshi() {
    if (event) event.stopPropagation();
    showTempMessage("常规模式");
    const jsonData = {
        "dataextratype": 10,
        "datatype": 4,
        "datahead": "Set Motion Mode",
        "datalen": 0,
        "data": { "motion_name": "normal" },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function chixuyidong() {
    if (event) event.stopPropagation();
    showTempMessage("持续移动");
    const jsonData = {
        "dataextratype": 10,
        "datatype": 19,
        "datahead": "Continuous Gait",
        "datalen": 0,
        "data": { "flag": 0 },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function jinruzuni() {
    if (event) event.stopPropagation();
    showTempMessage("进入阻尼");
    const jsonData = {
        "dataextratype": 10,
        "datatype": 10,
        "datahead": "Enter Damping",
        "datalen": 0,
        "data": { "null": null },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function pinghengzhanli() {
    if (event) event.stopPropagation();
    showTempMessage("平衡站立");
    const jsonData = {
        "dataextratype": 10,
        "datatype": 11,
        "datahead": "Balance Stand Mode",
        "datalen": 0,
        "data": { "null": null },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function tingzhiyidong() {
    if (event) event.stopPropagation();
    showTempMessage("停止移动");
    const jsonData = {
        "dataextratype": 10,
        "datatype": 12,
        "datahead": "Stop Move",
        "datalen": 0,
        "data": { "null": null },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function huifuzhanli() {
    if (event) event.stopPropagation();
    showTempMessage("恢复站立");
    const jsonData = {
        "dataextratype": 10,
        "datatype": 15,
        "datahead": "Recovery Stand",
        "datalen": 0,
        "data": { "null": null },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));
}

function qiehuanbutai() {
    if (event) event.stopPropagation();

    const gaitMap = [
        "锁定站立",
        "盲走模式",
        "持续踏步模式",
        "视觉辅助模式",
        "平面行走模式"
    ];

    if (window.currentGait === undefined) {
        window.currentGait = 0;
    }

    const currentGaitName = gaitMap[window.currentGait];
    console.log("切换步态：", window.currentGait, "\t", currentGaitName);
    showTempMessage(currentGaitName);

    const jsonData = {
        "dataextratype": 10,
        "datatype": 17,
        "datahead": "Switch Gait",
        "datalen": 0,
        "data": { "gait": window.currentGait },
        "imei": "imei"
    };
    publishMessage(JSON.stringify(jsonData));

    window.currentGait = (window.currentGait + 1) % 5;
}