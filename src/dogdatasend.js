//1.云深处机器狗起立趴下
function qilipaxia() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("起立/趴下");
				const jsonData = {
				"dataextratype": 11,
				"datatype": 1,
				"datahead": "Stand Up/Get Down",
				"datalen": 0,
				"data": {
					"null": null
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}



 // showTempMessage("已拍照");



//1.宇树机器狗
function aimoshi() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("Ai模式");
				const jsonData = {
				"dataextratype": 10,
				"datatype": 4,
				"datahead": "Set Motion Mode",
				"datalen": 0,
				"data": {
					"motion_name": "ai"
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}
//1.宇树机器狗
function changguimoshi() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("常规模式");
				const jsonData = {
				"dataextratype": 10,
				"datatype": 4,
				"datahead": "Set Motion Mode",
				"datalen": 0,
				"data": {
					"motion_name": "normal"
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}
//1.宇树机器狗
function chixuyidong() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("持续移动");
				const jsonData = {
				 "dataextratype": 10,
				"datatype": 19,
				"datahead": "Continuous Gait",
				"datalen": 0,
				"data": {
					"flag": 0
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}





//1.宇树机器狗
function jinruzuni() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("进入阻尼");
				const jsonData = {
				"dataextratype": 10,
				"datatype": 10,
				"datahead": "Enter Damping",
				"datalen": 0,
				"data": {
					"null": null
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}
//2.宇树机器狗
function pinghengzhanli() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("平衡站立");
				const jsonData = {
				"dataextratype": 10,
				"datatype": 11,
				"datahead": "Balance Stand Mode",
				"datalen": 0,
				"data": {
					"null": null
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}
//2.宇树机器狗
function tingzhiyidong() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("停止移动");
				const jsonData = {
				"dataextratype": 10,
				"datatype": 12,
				"datahead": "Stop Move",
				"datalen": 0,
				"data": {
					"null": null
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}
//3.宇树机器狗
function huifuzhanli() {
	    // 阻止事件冒泡到视频容器，避免触发镜头控制
    if (event) {
        event.stopPropagation();
    }
         showTempMessage("恢复站立");
				const jsonData = {
				"dataextratype": 10,
				"datatype": 15,
				"datahead": "Recovery Stand",
				"datalen": 0,
				"data": {
					"null": null
				},
				"imei": "imei"
				};
			// 2. 序列化为JSON字符串
			const jsonStr = JSON.stringify(jsonData);
			mqttClient.publish(MQTTXterminals, jsonStr); 	
          	
}
//4.宇树机器狗
// 正常可用版：和 huifuzhanli 同结构，能成功阻止镜头控制
function qiehuanbutai() {
    // 👇 完全和你能用的恢复站立函数一样
    if (event) {
        event.stopPropagation();
    }

    // 步态映射
    const gaitMap = [
        "锁定站立",
        "盲走模式",
        "持续踏步模式",
        "视觉辅助模式",
        "平面行走模式"
    ];

    // 读取当前步态（全局变量保存状态）
    if (window.currentGait === undefined) {
        window.currentGait = 0;
    }

    const currentGaitName = gaitMap[window.currentGait];
    console.log("切换步态：", window.currentGait, "\t", currentGaitName);
    showTempMessage(currentGaitName);

    // MQTT 发送（和你原逻辑完全一致）
    const jsonData = {
        "dataextratype": 10,
        "datatype": 17,
        "datahead": "Switch Gait",
        "datalen": 0,
        "data": { "gait": window.currentGait },
        "imei": "imei"
    };
    mqttClient.publish(MQTTXterminals, JSON.stringify(jsonData));

    // 循环切换
    window.currentGait = (window.currentGait + 1) % 5;
}