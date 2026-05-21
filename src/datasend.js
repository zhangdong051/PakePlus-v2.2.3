
// ********************MAVLINK发送控制函数*****************//

//获取控制权
	function kongzhiquan() {
		 //showTempMessage("获取控制权");
		 // 1. 构建JSON数据（对象）
					const jsonData = {
					"datatype": 140,
					  "datahead": "flight obtain joystick ctrl authority",
					  "datalen": 17,
					  "data": {
						"null": null
					  },
					  "imei": "InF3dWaXQjzH+xZF1fgqCA=="
					};
				// 2. 序列化为JSON字符串
				const jsonStr = JSON.stringify(jsonData);
				mqttClient.publish(MQTTXterminals, jsonStr); 
	}
	
// 用布尔值记录当前状态，初始为true（第一次用jsonData1）
let videostop = true;
function videostartstop() {

     // 根据状态动态显示提示文本
			const tipText = videostop ? "停止推流" : "开始推流";
			showTempMessage(tipText);
	 	    if (event) {
        event.stopPropagation();
    }
    // 直接根据状态选择数据，同时定义数据（简化结构）
    const jsonData = videostop ? {
		"dataextratype": 1,
		"datatype": 68,
		"datahead": "set device push video stream enable",
		"datalen": 37,
		"data": {
		"push_video_stream_enable": false
		},
		"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    } : {
		"dataextratype": 1,
		"datatype": 68,
		"datahead": "set device push video stream enable",
		"datalen": 37,
		"data": {
		"push_video_stream_enable": true
		},
		"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
    videostop = !videostop;
}

//激光测距
	function jiguangceju() {
	 // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
			showTempMessage("激光测距");
			const jsonData = {
						 "datatype": 144,
						  "datahead": "get camera laser ranging info",
						  "datalen": 24,
						  "data": {
							"mount_position": 1
						  },
						  "imei": "InF3dWaXQjzH+xZF1fgqCA=="
						};
					 // 序列化为JSON字符串并发送
					const jsonStr = JSON.stringify(jsonData);
					mqttClient.publish(MQTTXterminals, jsonStr); 
		}
		
// 解锁上锁
		let jiesuoad = true;
		function droneARM() {
			kongzhiquan();
			// 根据状态动态显示提示文本
			const tipText = jiesuoad ? "解锁" : "上锁";
			showTempMessage(tipText);
			// 直接根据状态选择数据，同时定义数据（简化结构）
			const jsonData = jiesuoad ? {
				"datatype": 135,
				"datahead": "flight turn on motors",
				"datalen": 17,
				"data": {
					"null": null
				},
				"imei": "InF3dWaXQjzH+xZF1fgqCA=="
			} : {
				"datatype": 136,
				"datahead": "flight turn off motors",
				"datalen": 17,
				"data": {
					"null": null
				},
				"imei": "InF3dWaXQjzH+xZF1fgqCA=="
			};
			mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
			jiesuoad = !jiesuoad;
		}
	
// 用布尔值记录当前状态，初始为true（第一次用jsonData1）
	let jiangluost = true;
	function dronetakeoff() {
		kongzhiquan();
			// 根据状态动态显示提示文本
			const tipText = jiangluost ? "起飞" : "降落";
			showTempMessage(tipText);
		// 直接根据状态选择数据，同时定义数据（简化结构）
		const jsonData = jiangluost ? {
				"datatype": 128,
				"datahead": "flight start take off",
				"datalen": 17,
				"data": {
				"null": null
				},
				"imei": "InF3dWaXQjzH+xZF1fgqCA=="
		} : {
				"datatype": 129,
				"datahead": "flight start landing",
				"datalen": 17,
				"data": {
				"null": null
				},
				"imei": "InF3dWaXQjzH+xZF1fgqCA=="
		};
		mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
		jiangluost = !jiangluost;
	}



// 用布尔值记录当前状态，初始为true（第一次用jsonData1）
let hanxianzt = true;
function droneZTHX() {
     // 根据状态动态显示提示文本
	const tipText = hanxianzt ? "航线暂停" : "航线恢复";
			showTempMessage(tipText);
    // 直接根据状态选择数据，同时定义数据（简化结构）
    const jsonData = hanxianzt ? {
				"datatype": 55,
				"datahead": "flight waypoint3 pause",
				"datalen": 17,
				"data": {
				"null": null
				},
				"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    } : {
			"datatype": 56,
			"datahead": "flight waypoint2 resume",
			"datalen": 17,
			"data": {
			"null": null
			},
			"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
    hanxianzt = !hanxianzt;
}

// 用布尔值记录当前状态，初始为true（第一次用jsonData1）
let fanhangst = true;
function droneRTL() {
      // 根据状态动态显示提示文本
	const tipText = fanhangst ? "开始返航" : "取消返航";
			showTempMessage(tipText);
    // 直接根据状态选择数据，同时定义数据（简化结构）
    const jsonData = fanhangst ? {
			"datatype": 138,
			"datahead": "flight start go home",
			"datalen": 17,
			"data": {
			"null": null
			},
			"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    } : {
			"datatype": 139,
			"datahead": "flight cancel go home",
			"datalen": 17,
			"data": {
			"null": null
			},
			"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
    fanhangst = !fanhangst;
}

function dronepicter() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("已拍照");
		// updateVehicleStatus('READ MODE');
     // 1. 构建JSON数据（对象）
				const jsonData = {
				"datatype": 208,
				"datahead": "camera start shoot single photo",
				"datalen": 24,
				"data": {
				"mount_position": 1
				},
				"imei": "InF3dWaXQjzH+xZF1fgqCA=="
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}


// 用布尔值记录当前状态，初始为true（第一次用jsonData1）
let luxiangzt = true;
function dronevideo() {
	
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
	
          // 根据状态动态显示提示文本
	const tipText = luxiangzt ? "开始录像" : "停止录像";
			showTempMessage(tipText);
    // 直接根据状态选择数据，同时定义数据（简化结构）
    const jsonData = luxiangzt ? {
        "datatype": 216,
        "datahead": "camera start record video",
        "datalen": 24,
        "data": { "mount_position": 1 },
        "imei": "InF3dWaXQjzH+xZF1fgqCA=="
    } : {
        "datatype": 217,
        "datahead": "camera stop record video",
        "datalen": 24,
        "data": { "mount_position": 1 },
        "imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };

    // 发布数据
    mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
    
    // 切换状态（下次调用用另一个数据）
    luxiangzt = !luxiangzt;
}

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

/****************/

// 初始化视频控制功能
function initVideoControl() {
    const videoContainer = document.getElementById('large-video-container');
    if (!videoContainer) return;
    
    // 视频控制区域点击事件
    videoContainer.addEventListener('click', handleVideoClick);
}

// 新增全局变量用于跟踪当前视频源类型（case）
let currentSourceType = 1; // 默认case 1
// 定义外部变量保存当前缩放因子，初始值参考原case3的初始factor
let currentZoomFactor = 2;
let fpvModeActivated = false;
// 处理视频区域点击事件
function handleVideoClick(e) {
    // 只有在大窗口显示视频时才响应控制
    if (!document.body.classList.contains('show-video-large')) {
        return;
    }
	
    // 双击任意位置执行镜头回中
    if (e.detail === 2) {
		//showTempMessage("镜头回中");
        resetCameraPosition();
        return;
    }
	
    // 三击任意位置执行镜头向下
	if (e.detail === 3) {
		const timerId = setTimeout(() => {
			  //showTempMessage("1秒后执行");
			  frCameraPosition();
			}, 1000);
        
        return;
    }
    // 单击事件处理（只处理单点击）
    if (e.detail !== 1) {
        return;
    }
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // 计算点击位置相对于容器的比例 (0-1)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // 定义中心参数（用于计算偏移比例）
    const centerX = 0.5;
    const centerY = 0.5;
    
    // 计算相对中心的偏移比例（-0.5到0.5范围）
    const dx = x - centerX; // 左右偏移（负为左，正为右）
    const dy = y - centerY; // 上下偏移（负为上，正为下）
    
    // 计算偏移强度（基于距离中心的相对距离，映射到0-1范围）
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.sqrt(0.5 * 0.5 + 0.5 * 0.5); // 对角线到中心的距离
    const strength = Math.min(distance / maxDistance, 1); // 归一化到0-1
    
    // 基础控制值（最大偏移时的数值）
    const maxPitch = 30;
    const maxYaw = 30;
    
    // 根据当前视频源类型（case）选择不同的计算方式
    let pitch = 0, yaw = 0; // 初始化默认值
    if (currentSourceType === 1||currentSourceType === 5) {

        // case 1: 不除以缩放因子
        pitch = -dy * maxPitch * 2; 
        yaw = dx * maxYaw * 2;
    } else if (currentSourceType === 2||currentSourceType === 3||currentSourceType === 4 ) {
        // case 2: 除以缩放因子
		//showTempMessage('缩放因子:' + currentZoomFactor);
        pitch = -(dy * maxPitch * 2) / currentZoomFactor;
        yaw = (dx * maxYaw * 2) / currentZoomFactor;
    }
    
    // 输出控制信息
    showTempMessage(`云台控制`);
    
    // 构建并发送MQTT消息
    const jsonData = {
        "datatype": 226,
        "datahead": "gimbal rotate",
        "datalen": 120,
        "data": {
            "mount_position": 1,
            "rotation": {
                "rotation_mode": 0,
                "pitch":  Math.round(pitch), // 取整发送
                "roll": 0,
                "yaw":Math.round(yaw),     // 取整发送
                "time": 0.2
            }
        },
        "imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    const jsonStr = JSON.stringify(jsonData);
    mqttClient.publish(MQTTXterminals, jsonStr);
}


function resetCameraPosition() {
    showTempMessage('镜头回中');
    // 构建JSON数据
    const jsonData = {
        "datatype": 225,
        "datahead": "gimbal reset",
        "datalen": 24,
        "data": {
            "mount_position": 1
        },
        "imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    // 序列化为JSON字符串并发送
    const jsonStr = JSON.stringify(jsonData);
    mqttClient.publish(MQTTXterminals, jsonStr); 	
}

function frCameraPosition() {
    showTempMessage('镜头向下');
    // 构建JSON数据
    const jsonData = {
        "datatype": 226,
        "datahead": "gimbal rotate",
        "datalen": 120,
        "data": {
            "mount_position": 1,
            "rotation": {
                "rotation_mode": 0,
                "pitch": -90, 
                "roll": 0,
                "yaw":0,    
                "time": 0.2
            }
        },
        "imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    // 序列化为JSON字符串并发送
    const jsonStr = JSON.stringify(jsonData);
    mqttClient.publish(MQTTXterminals, jsonStr); 	
}

function switchVideoSource(sourceType, event) {
    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
    
   // showTempMessage(`切换视频源: ${sourceType}`);
    // 更新当前视频源类型（用于后续判断计算方式）
    currentSourceType = sourceType;
    
    let jsonData;
    
    // 处理FPV模式激活
    if (sourceType === 6) {
		showTempMessage(`切换FPV`);
        // 执行case 6逻辑
        jsonData = {
            "dataextratype": 1,
            "datatype": 73,
            "datahead": "set device video source",
            "datalen": 22,
            "data": {
                "video_source": 7
            },
            "imei": "SPBYWofe5k38fF6N+9NwSQ=="
        };
        // 标记FPV模式已激活
        fpvModeActivated = true;
    } 
    // 处理需要先执行case 7的情况（1、2、5）
    else if ([1, 2, 5].includes(sourceType) && fpvModeActivated) {
        // 先执行一次case 7
        const case7Data = {
			"dataextratype": 1,
			"datatype": 73,
			"datahead": "set device video source",
			"datalen": 22,
			"data": {
			"video_source": 1
			},
			"imei": "SPBYWofe5k38fF6N+9NwSQ=="
        };
        mqttClient.publish(MQTTXterminals, JSON.stringify(case7Data));
       // showTempMessage("执行case 7");
        
        // 重置FPV激活状态
        fpvModeActivated = false;
        
        // 再执行对应sourceType的逻辑
        switch(sourceType) {
            case 1:
				showTempMessage(`切换广角`);
                jsonData = {
                    "dataextratype": 1,
                    "datatype": 28,
                    "datahead": "camera set stream source",
                    "datalen": 45,
                    "data": {
                        "mount_position": 1,
                        "stream_source": 1
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
            case 2:
				showTempMessage(`切换变焦`);
                jsonData = {
                    "dataextratype": 1,
                    "datatype": 28,
                    "datahead": "camera set stream source",
                    "datalen": 45,
                    "data": {
                        "mount_position": 1,
                        "stream_source": 2
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
            case 5:
				showTempMessage(`切换红外`);
                jsonData = {
                    "dataextratype": 1,
                    "datatype": 28,
                    "datahead": "camera set stream source",
                    "datalen": 45,
                    "data": {
                        "mount_position": 1,
                        "stream_source": 3
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
        }
    }
    // 处理其他正常情况
    else {
        switch(sourceType) {
			// showTempMessage("执行zoom");
            case 1:
				showTempMessage(`切换广角`);
                jsonData = {
                    "dataextratype": 1,
                    "datatype": 28,
                    "datahead": "camera set stream source",
                    "datalen": 45,
                    "data": {
                        "mount_position": 1,
                        "stream_source": 1
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
            case 2:
				showTempMessage(`切换变焦`);
                jsonData = {
                    "dataextratype": 1,
                    "datatype": 28,
                    "datahead": "camera set stream source",
                    "datalen": 45,
                    "data": {
                        "mount_position": 1,
                        "stream_source": 2
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
            case 3:
				showTempMessage(`变焦`+currentZoomFactor);
                currentZoomFactor += 1;
                jsonData = {
                    "datatype": 213,
                    "datahead": "camera optical zoom",
                    "datalen": 55,
                    "data": {
                        "mount_position": 1,
                        "direction": 1,
                        "factor": currentZoomFactor
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
            case 4:
                if (currentZoomFactor > 2) {
					showTempMessage(`变焦`+currentZoomFactor);
					currentZoomFactor -= 1; // 满足条件时减1
				} else {
					showTempMessage(`变焦已最小`);
					currentZoomFactor = 2; // 不满足条件时设为2
				}
                jsonData = {
                    "datatype": 213,
                    "datahead": "camera optical zoom",
                    "datalen": 55,
                    "data": {
                        "mount_position": 1,
                        "direction": 1,
                        "factor": currentZoomFactor
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
            case 5:
				showTempMessage(`切换红外`);
                jsonData = {
                    "dataextratype": 1,
                    "datatype": 28,
                    "datahead": "camera set stream source",
                    "datalen": 45,
                    "data": {
                        "mount_position": 1,
                        "stream_source": 3
                    },
                    "imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
                break;
        }
    }
    
    // 发送当前操作的MQTT消息
    if (jsonData) {
        const jsonStr = JSON.stringify(jsonData);
        mqttClient.publish(MQTTXterminals, jsonStr);
    }
}

//******************************发送数据处理***************//

  // 无人机设置相关变量
    let droneSettings = {
        returnAltitude: 200
    };
    
// 打开无人机设置对话框
    function openDroneSettings() {
        // 加载当前设置到表单
        document.getElementById('return-altitude').value = droneSettings.returnAltitude;
        
// 显示对话框
        document.getElementById('drone-settings-modal').style.display = 'flex';
    }
    
// 关闭无人机设置对话框
    function closeDroneSettings() {
        document.getElementById('drone-settings-modal').style.display = 'none';
    }
    
// 保存无人机设置
	function saveDroneSettings() {
    // 获取表单值（转换为整数）
    const returnAltitude = parseInt(document.getElementById('return-altitude').value);
    droneSettings.returnAltitude = returnAltitude; // 保持原有的设置存储
    // 发送MQTT消息，将获取到的高度值赋给altitude
    const jsonData = {
        "datatype": 105,
        "datahead": "flight set go home altitude",
        "datalen": 20,
        "data": {
            "altitude": returnAltitude // 直接使用页面获取的高度值
        },
        "imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    // 序列化为JSON字符串并发送
    const jsonStr = JSON.stringify(jsonData);
    mqttClient.publish(MQTTXterminals, jsonStr); 
    closeDroneSettings();
	showTempMessage("返航高度"+returnAltitude );
}
    
// 格式化SD卡
    function formatSdCard() {
		if (confirm('将格式化SD卡！')) {
	showTempMessage("开始格式化SD卡！");
    const jsonData = {
			"dataextratype": 1,
			"datatype": 48,
			"datahead": "camera format sd card storage",
			"datalen": 24,
			"data": {
			"mount_position": 1
			},
			"imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
             // 序列化为JSON字符串并发送
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 
} else {
  showTempMessage('已取消格式化');
}
}
// 用布尔值记录当前状态，初始为true（第一次用jsonData1）
let rtkenab = true;
function enablertkkg() {
     
	  // 根据状态动态显示提示文本
	const tipText = rtkenab ? "开启RTK" : "关闭RTK";
			showTempMessage(tipText);
    // 直接根据状态选择数据，同时定义数据（简化结构）
    const jsonData = rtkenab ? {
					"datatype": 96,
					"datahead": "flight set rtk position enable status",
					"datalen": 27,
					"data": {
					"rtk_enable_status": 1
					},
					"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    } : {
					"datatype": 96,
					"datahead": "flight set rtk position enable status",
					"datalen": 27,
					"data": {
					"rtk_enable_status": 0
					},
					"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
    rtkenab = !rtkenab;
}
// 关闭避障功能
// 用布尔值记录当前状态，初始为true（第一次用jsonData1）
let bizhangenab = true;
function enablebzkg() {
		  // 根据状态动态显示提示文本
	const tipText = bizhangenab ? "开启避障" : "关闭避障";
			showTempMessage(tipText);
    // 直接根据状态选择数据，同时定义数据（简化结构）
    const jsonData = bizhangenab ? {
			"datatype": 98,
			"datahead": "flight set horizontal visual obstacle avoidance enable status",
			"datalen": 53,
			"data": {
			"horizontal_obstacle_avoidance_enable_status": 1
			},
			"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    } : {
			"datatype": 98,
			"datahead": "flight set horizontal visual obstacle avoidance enable status",
			"datalen": 53,
			"data": {
			"horizontal_obstacle_avoidance_enable_status": 0
			},
			"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));
    bizhangenab = !bizhangenab;
}
// 更新失联行为设置函数
function enableslkg() {
    showTempMessage("设置失联动作！");
    // 获取选择的失联行为值
    const rcLostAction = parseInt(document.getElementById('rc-lost-action').value);
    
    const jsonData = {
        "datatype": 0x61,
        "datahead": "flight set rc lost action",
        "datalen": 24,
        "data": {
            "rc_lost_action": rcLostAction  // 使用选择的值
        },
        "imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    
    // 序列化为JSON字符串并发送
    const jsonStr = JSON.stringify(jsonData);
    mqttClient.publish(MQTTXterminals, jsonStr);         
}

//更新返航点
function gengxinfanhangd() {
if (confirm('将更新返航点！')) {
	showTempMessage("返航点已更新！");
    const jsonData = {
				"datatype": 104,
				"datahead": "flight set home location using current aircraft location",
				"datalen": 17,
				"data": {
				"null": null
				},
				"imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
             // 序列化为JSON字符串并发送
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 
} else {
  showTempMessage('已取消');
}
}

// 设置返航点（用户输入经纬度）
function shezhifanhangd() {
    // 提示用户输入经纬度，格式示例
    const input = prompt('请输入经纬度（例：34.768601,113.7405414）：', '');
    
    if (input === null) {
        showTempMessage('已取消设置返航点');
        return;
    }
    
    // 验证输入格式
    const [latitudeStr, longitudeStr] = input.split(',');
    if (!latitudeStr || !longitudeStr) {
        alert('输入格式错误，请使用"纬度,经度"格式');
        return;
    }
    
    const latitude = parseFloat(latitudeStr);
    const longitude = parseFloat(longitudeStr);
    
    // 简单验证经纬度范围
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
        alert('经纬度值无效，请重新输入');
        return;
    }
    
    if (confirm(`确认设置返航点为：\n纬度：${latitude}\n经度：${longitude}`)) {
        showTempMessage(`设置返航点：纬度=${latitude}，经度=${longitude}`);
        const jsonData = {
            "datatype": 103,
            "datahead": "flight set home location using GPS coordinates",
            "datalen": 62,
            "data": {
                "latitude": latitude,  // 使用用户输入的纬度
                "longitude": longitude // 使用用户输入的经度
            },
            "imei": "InF3dWaXQjzH+xZF1fgqCA=="
        };
        
        // 序列化为JSON字符串并发送
        const jsonStr = JSON.stringify(jsonData);
        mqttClient.publish(MQTTXterminals, jsonStr);
        alert('返航点已设置成功');
    } else {
        showTempMessage('已取消设置返航点');
    }         
}         	

//重置相机
function chongzhixiangji() {
if (confirm('相机将恢复出产设置！')) {
	showTempMessage("相机重置！");
    const jsonData = {
		"dataextratype": 1,
		"datatype": 24,
		"datahead": "camera reset camera settings",
		"datalen": 24,
		"data": {
		"mount_position": 1
		},
		"imei": "InF3dWaXQjzH+xZF1fgqCA=="
                };
             // 序列化为JSON字符串并发送
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 
} else {
  showTempMessage('已取消');
}         	
}
	
//打开mino控制台
    function minolianjie() {
 //   alert('打开mino控制台');
// 点击时打开一个“极简”小窗口
  window.open(
    "http://121.37.134.81:9755/login",
    "miniWindow",
    "width=1000,height=550,left=50,top=50,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes"
  );
}
//打开视频全局监控
    function videoliebiao() {
    alert('打开全局指挥');
// 点击时打开一个“极简”小窗口
// 不指定窗口大小，默认在新标签页打开
  window.open("videoliebiao.html", "_blank");
}

//打开链路界面
	function lianluweb() {
    alert('打开链路信息');
// 点击时打开一个“极简”小窗口
// 不指定窗口大小，默认在新标签页打开
  window.open("http://192.168.2.101");
}



