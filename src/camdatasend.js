// 全局变量：记录首次进入状态和上次发送初始化数据的时间
let isFirstEnter = true;
let lastSendInitTime = 0;

function GAME_command() {

showTempMessage("game-1");
    // 检查当前设备是否存在
    if (!currentDevice || !currentDevice.model) {
        console.error("未找到当前设备信息");
        return;
    }
showTempMessage("game-2");
    const currentModel = currentDevice.model;
    const currentTime = Date.now();
    
    // 根据不同设备型号处理初始化数据发送
    if (isFirstEnter || (currentTime - lastSendInitTime > 15000)) {
        let initData1, initData2;
        
        switch (currentModel) {
            case "d10":
            case "e20":
				showTempMessage("game-3");
                // 无人机类型设备初始化数据
                initData1 = {
                    "datatype": 140,
                    "datahead": "flight obtain joystick ctrl authority",
                    "datalen": 17,
                    "data": { "null": null },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                initData2 = {
                    "datahead": "flight set joystick mode",
                    "data": {
                        "stable_control_mode": 1,
                        "horizontal_coordinate": 1,
                        "vertical_control_mode": 0,
                        "yaw_control_mode": 1,
                        "horizontal_control_mode": 1
                    },
                    "datatype": 107,
                    "dataextratype": 0,
                    "imei": "eFzn49GF6iJn0po715+xdw==",
                    "dataLen": 142
                };
                break;
                
            case "b2":
                // 宇树机器人初始化数据
                initData1 = {//运控模式
                    "dataextratype": 10,
                    "datatype": 4,
                    "datahead": "Set Motion Mode",
                    "datalen": 0,
                    "data": {
                        "motion_name": "normal"
                    },
                    "imei": "imei"
                };
                initData2 = {//平衡站立
                    "dataextratype": 10,
                    "datatype": 11,
                    "datahead": "Balance Stand Mode",
                    "datalen": 0,
                    "data": {
                        "null": null
                    },
                    "imei": "imei"
                };
                break;
                
            case "lite3":
                // 云深处机器人初始化数据
                initData1 = {
                    "dataextratype": 11,
                    "datatype": 2,
                    "datahead": "Set Motion State",
                    "datalen": 0,
                    "data": {
                        "mode": 0
                    },
                    "imei": "imei"
                };
                break;
            default:
                console.warn(`未定义的设备型号: ${currentModel}`);
                return;
        }

        // 发送初始化数据
        if (initData1) {
            mqttClient.publish(MQTTXterminals, JSON.stringify(initData1));
        }
        if (initData2) {
            mqttClient.publish(MQTTXterminals, JSON.stringify(initData2));
        }
        
        // 更新状态标记
        isFirstEnter = false;
        lastSendInitTime = currentTime;
    }

    // 根据设备型号处理控制命令（分设备适配rc数值范围，支持小数）
    let controlData;
    let controlLog = ""; // 控制日志内容
    
    // 基础rc值（-100 ~ 100）
    const rawRc0 = rc0; // 对应无人机俯仰/机器狗vx
    const rawRc1 = rc1; // 对应无人机横滚/机器狗vy
    const rawRc2 = rc2; // 对应无人机油门
    const rawRc3 = rc3; // 对应无人机航向/机器狗vyaw
    
    switch (currentModel) {
        case "d10":
        case "e20":
			showTempMessage("game-4");
            // 无人机：rc(-100~100) → 控制值(-10~10)，保留小数（如rc0=35 → 3.5）
            const pitch = rawRc0 * 0.1;    // 俯仰 (-10 ~ 10)
            const roll = rawRc1 * 0.1;     // 横滚 (-10 ~ 10)
            const throttle = rawRc2 * 0.1; // 油门 (-10 ~ 10)
            const yaw = rawRc3 * 0.1;      // 航向 (-10 ~ 10)
            controlLog = `无人机 [${currentModel}] - P:${pitch.toFixed(1)} R:${roll.toFixed(1)} T:${throttle.toFixed(1)} Y:${yaw.toFixed(1)}`;
            
            controlData = {
                "datatype": 143,
                "datahead": "flight execute joystick action",
                "datalen": 44,
                "data": {
                    "x": pitch,    
                    "y": roll,     
                    "z": throttle, 
                    "yaw": yaw     
                },
                "imei": "InF3dWaXQjzH+xZF1fgqCA=="
            };
            break;
            
        case "b2":
            // 宇树机器人：rc(-100~100) → 基础控制值(-1~1)，再映射到物理范围
            // 常规运控模式物理范围：
            // vx: [-0.8~1.2] (m/s) | vy: [-0.4~0.4] (m/s) | vyaw: [-0.75~0.75] (rad/s)
            const rcToB2Vx = (rawRc0 / 100) * 1.2; // -100→-1.2（超出-0.8需 clamp），100→1.2
            const rcToB2Vy = (-rawRc1 / 100) * 0.4; // -100→-0.4，100→0.4
            const rcToB2Vyaw = (-rawRc3 / 100) * 0.75; // -100→-0.75，100→0.75
            
            // 对vx做范围限制（常规运控vx下限-0.8）
            const vx = Math.max(-0.8, rcToB2Vx); 
            const vy = rcToB2Vy;
            const vyaw = rcToB2Vyaw;
            
            controlLog = `宇树B2 - vx:${vx.toFixed(2)} m/s | vy:${vy.toFixed(2)} m/s | vyaw:${vyaw.toFixed(2)} rad/s`;
            
            controlData = {
                "dataextratype": 10,
                "datatype": 16,
                "datahead": "Move",
                "datalen": 0,
                "data": {
                    "vx": vx,
                    "vy": vy,
                    "vyaw": vyaw
                },
                "imei": "imei"
            };
            break;
            
        case "lite3":
            // 云深处机器人：rc(-100~100) → 控制值(-1~1)，保留小数（如rc0=50 → 0.5）
            const x = rawRc0 * 0.01;      // 前后 (-1 ~ 1)
            const y = rawRc1 * 0.01;      // 左右 (-1 ~ 1)
            const lite3Yaw = rawRc3 * 0.01; // 偏航 (-1 ~ 1)
            controlLog = `云深处lite3 - x:${x.toFixed(2)} | y:${y.toFixed(2)} | yaw:${lite3Yaw.toFixed(2)}`;
            
            controlData = {
                "dataextratype": 11,
                "datatype": 3,
                "datahead": "Axis Control",
                "datalen": 0,
                "data": {
                    "x": x,
                    "y": y,
                    "yaw": lite3Yaw
                },
                "imei": "imei"
            };
            break;

        default:
            console.warn(`未定义的设备型号控制逻辑: ${currentModel}`);
            return;
    }

    // 打印格式化的控制日志（保留小数，便于调试）
    showTempMessage(controlLog);
    
    // 发送控制数据
    if (controlData) {
        mqttClient.publish(MQTTXterminals, JSON.stringify(controlData));
    }
}