// 在全局变量区域添加连接状态和手动断开标记
let connectAttempts = 0;
const MAX_CONNECT_ATTEMPTS = 3;
let areMavlinkScriptsLoaded = false;
let mqttClient = null; // 统一管理MQTT客户端实例
let isManualDisconnect = false; // 标记是否手动断开连接

// 动态加载脚本的函数
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

			
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

	


	
// 修复连接函数，优化连接管理
function connect() {
    // 已存在连接则先关闭
    if (mqttClient && mqttClient.connected) {
        return;
    }

    // 检查是否已达到最大最大连接尝试次数
    if (connectAttempts >= MAX_CONNECT_ATTEMPTS) {
        showTempMessage(`已超过${MAX_CONNECT_ATTEMPTS}次连接失败，将不再再尝试重连`);
        return;
    }

    if (!config.mqttServer) {
        alert('MQTT服务器地址未配置！');
        return;
    }

    // 构建WebSocket URL: ws://<host>:<port>/mqtt
    const url = `ws://${config.mqttServer}/mqtt`;
    showTempMessage(`第${connectAttempts + 1}次连接MQTT`);

    const options = {
        clean: false,
        connectTimeout: 4000,
        clientId: `emqx_test_${Date.now()}`, // 使用时间戳确保clientId唯一
        username: '43',
        password: '123456',
        keepalive: 60, // 缩短心跳时间，提高检测灵敏度
        reconnectPeriod: 10 * 1000, // 修复拼写错误
        resubscribe: true // 重连后自动重新订阅主题
    };

    // 关闭可能存在的旧连接
    if (mqttClient) {
        try {
            mqttClient.end(false, { reasonCode: 0 });
        } catch (e) {
            console.error('关闭旧连接失败:', e);
        }
    }

    mqttClient = mqtt.connect(url, options);
    isManualDisconnect = false; // 重置手动断开标记

    mqttClient.on('connect', async function(connack) {
        if (connack.sessionPresent) {
            console.log('复用已有会话');
        }
        // 连接成功，重置连接计数器
        connectAttempts = 0;
        showTempMessage("MQTT已连接");

        // 更新按钮状态
        const statButton = document.getElementById('stat-button');
        if (statButton) {
            statButton.textContent = '🔌断开';
            statButton.onclick = mqDisconnect;
        }

        // 订阅主题
        mqttClient.subscribe(['/terminal/+/+/getInfo', '/terminal/dmz/data', MQTTXterminalc], (err) => {
            if (err) {
                console.error('订阅主题失败:', err);
                showTempMessage('订阅主题失败');
            }
        });

        // 加载脚本（仅一次）
        if (!areMavlinkScriptsLoaded) {
            try {
                await Promise.all([
                    loadScript('./gamepads.js'),
                    loadScript('./datasend.js'),
                    loadScript('./dogdatasend.js'),
                    loadScript('./jpkz.js'),
                    loadScript('./xnyg.js')
                ]);
                areMavlinkScriptsLoaded = true;
            } catch (error) {
                console.error('脚本加载失败:', error);
            }
        }

        // 视频播放初始化
        if (devices.length >= 1) {
            startVideoPlay(1, devices[0].id);
        }
        if (devices.length >= 2) {
            startVideoPlay(2, devices[1].id);
        }

        initApplication();
        initVideoControl();
        initVideoControls();
        if (typeof initJoysticks === 'function') {
            initJoysticks();
        }
    });

    // 合并消息处理逻辑，避免重复注册
    mqttClient.on('message', async function(topic, message) {
        try {
            if (topic === '/terminal/dmz/data') {
                await processDmzMessage(message);
            } else if (topic.match(/^\/terminal\/[^/]+\/[^/]+\/getInfo$/)) {
                processMqttMessage(topic, message);
            }
			else if (topic === MQTTXterminalc) {
              await processcallback(message);
				
            }
        } catch (error) {
            console.error(`处理${topic}消息失败:`, error);
        }
    });

    mqttClient.on('error', function(err) {
        console.error('MQTT连接错误：', err);
        showTempMessage(`连接错误: ${err.message}`);
        // 错误时不增加尝试次数，由close事件处理重连
    });

    mqttClient.on('close', function() {
        showTempMessage('MQTT连接已关闭');
        // 更新按钮状态
        const statButton = document.getElementById('stat-button');
        if (statButton) {
            statButton.textContent = '🔄连接';
            statButton.onclick = connect;
        }
stopVideoPlay();
 
    });

    // 增加重连事件监听
    mqttClient.on('reconnect', function() {
        console.log('正在尝试重连...');
        showTempMessage('正在重连MQTT服务器...');
    });
}
function mqDisconnect() {
    if (!mqttClient) return;

    isManualDisconnect = true; // 标记为手动断开
   // showTempMessage('正在断开连接...');
    stopVideoPlay();

    // 重置连接计数器
    connectAttempts = 0;

    // 更新按钮状态
    const statButton = document.getElementById('stat-button');
    if (statButton) {
        statButton.textContent = '🔄连接';
        statButton.onclick = connect;
    }

    try {
        // 优雅关闭连接
        mqttClient.end(false, { reasonCode: 0 }, (err) => {
            if (err) {
                console.error('断开连接失败:', err);
                showTempMessage('断开连接失败');
            } else {
                mqttClient = null; // 清空客户端实例
               // showTempMessage('已成功断开连接');
            }
        });
    } catch (e) {
        console.error('MQTT断开异常：', e);
        mqttClient = null;
    }
	
}

function ensureDeviceExists(deviceId, lon, lat, model) {
    if (!devices.find(d => d.id === deviceId)) {
        const newDevice = {
            id: deviceId,
            name: `设备-${deviceId.slice(-4)}`,
            model: model,
            position: [lon, lat],
            online: true
        };
        devices.push(newDevice);
        devicePaths[deviceId] = [[lon, lat]];
        renderDeviceList();          // 刷新设备列表 UI
        if (typeof addSingleDeviceMarker === 'function') {
            addSingleDeviceMarker(newDevice);  // 动态添加地图标记（见下一步）
        } else {
            initDeviceMarkers();      // 降级：全部重建
        }
        saveDevices();
        console.log(`自动注册新设备: ${deviceId} (${model})`);
    }
}

// 修改MQTT消息处理函数，确保数据解析后再更新轨迹和位置
function processMqttMessage(topic, message) {
    try {
        const str = message.toString();
        const jsonData = JSON.parse(str);

        const topicParts = topic.split('/');
        const deviceModelFromTopic = topicParts[2];   // 例如 d10, b2, sb
        const deviceIdFromTopic = topicParts[3];

        // ✅ 关键修复：使用消息自带的设备型号选择解析器
        const parser = modelParsers[deviceModelFromTopic] || parseDefaultData;
        const extractedData = parser(jsonData);

        if (!extractedData) return;

        // 确保设备存在（如果未注册则动态添加）
        ensureDeviceExists(deviceIdFromTopic, extractedData.gps_longitude, extractedData.gps_latitude, deviceModelFromTopic);

        // 更新位置和轨迹（所有设备都会执行）
        if (extractedData.gps_longitude && extractedData.gps_latitude) {
            updateDevicePosition(deviceIdFromTopic, extractedData.gps_longitude, extractedData.gps_latitude);
        }

        // 仅当这条数据属于当前选中的设备时，才更新 HUD 和数据面板
        if (deviceIdFromTopic === currentDeviceId) {
            updateDataDisplay(extractedData);
        }
    } catch (error) {
        console.error('消息解析失败:', error, message.toString());
    }
}



    // 停止视频播放
    async function stopVideoPlay() {
        if (videoSdk) {
            try {
                await videoSdk.close();
                document.getElementById('video-status').textContent = '视频：已停止';
            } catch (error) {
                console.error('停止视频错误:', error);
                document.getElementById('video-status').textContent = '视频：停止失败';
            }
            videoSdk = null;
            isVideoPlaying = false;
        }
    }




		
		