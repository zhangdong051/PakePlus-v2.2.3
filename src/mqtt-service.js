// mqtt-service.js - 独立的MQTT服务模块（增强版：支持B2状态解析+上下行计数）
(function(global) {
    let dependencies = null;
    
    const MqttService = {
        init(deps) {
            dependencies = deps;
            this.bindEvents();
            this.updateUiByConnection(false);
            this.bindImeiChangeEvent();
            // 初始化上下行计数器（存入appState）
            if (dependencies.appState.mqtt) {
                dependencies.appState.mqtt.upMsgCount = 0;
                dependencies.appState.mqtt.downMsgCount = 0;
            }
        },
        
        bindEvents() {
            const DOM = dependencies.DOM;
            DOM.mqttToggleBtn.addEventListener('click', () => this.toggleConnection());
            DOM.video.refreshBtn.addEventListener('click', () => {
                if (dependencies.appState.mqtt.isConnected) {
                    dependencies.SrsVideoService.startPlay();
                } else {
                    dependencies.MessageService.add('请先连接MQTT再刷新视频', true);
                }
            });
        },
        
        bindImeiChangeEvent() {
            const DOM = dependencies.DOM;
            DOM.imeiInput.addEventListener('change', () => {
                if (dependencies.appState.mqtt.isConnected && dependencies.appState.mqtt.client && dependencies.appState.mqtt.client.connected) {
                    dependencies.MessageService.add(`IMEI已变更为 ${DOM.imeiInput.value.trim()}，正在重新订阅气体主题...`);
                    this.resubscribeGasTopic();
                }
                // IMEI变更时重置上下行计数和B2面板显示
                this.resetB2StatusAndCounters();
            });
        },
        
        // 重置B2面板及计数器
        resetB2StatusAndCounters() {
            if (dependencies.appState.mqtt) {
                dependencies.appState.mqtt.upMsgCount = 0;
                dependencies.appState.mqtt.downMsgCount = 0;
            }
            this.updateB2CountersDisplay();
            const b2Container = document.querySelector('.B2-status');
            if (b2Container) {
                const versionDiv = document.getElementById('version');
                const stateDiv = document.getElementById('state');
                const batteryDiv = document.getElementById('battery_capacity');
                const currentDiv = document.getElementById('current');
                const cycleDiv = document.getElementById('cycle');
                const motorCommDiv = document.getElementById('motor_state-communication_frequency');
                if (versionDiv) versionDiv.textContent = '--';
                if (stateDiv) stateDiv.textContent = '--';
                if (batteryDiv) batteryDiv.textContent = '--';
                if (currentDiv) currentDiv.textContent = '--';
                if (cycleDiv) cycleDiv.textContent = '--';
                if (motorCommDiv) motorCommDiv.textContent = '--';
            }
        },
        
        parseHostPort() {
            const DOM = dependencies.DOM;
            const addrPort = DOM.mqttAddrPort.value.trim();
            if (!addrPort) {
                dependencies.MessageService.add('请输入服务器地址和端口，格式: IP:端口', true);
                return null;
            }
            const parts = addrPort.split(':');
            if (parts.length !== 2) {
                dependencies.MessageService.add('地址格式错误，请使用 IP:端口 格式', true);
                return null;
            }
            const host = parts[0];
            const port = parts[1];
            if (!host || !port || isNaN(parseInt(port))) {
                dependencies.MessageService.add('无效的端口号', true);
                return null;
            }
            return { host, port: parseInt(port) };
        },
        
        generateTopicsFromImei() {
            const DOM = dependencies.DOM;
            const imei = DOM.imeiInput.value.trim();
            if (!imei) {
                dependencies.MessageService.add('IMEI号不能为空，请填写设备IMEI', true);
                return null;
            }
            return {
                publishTopic: `/terminal/b2/${imei}/setInfo`,
                subscribeTopic: `/terminal/b2/${imei}/getInfo`
            };
        },
        
        buildGasTopic() {
            const DOM = dependencies.DOM;
            const imei = DOM.imeiInput.value.trim();
            if (!imei) return null;
            return `/terminal/qt/${imei}/getInfo`;
        },
        
        subscribeGasTopic() {
            if (!dependencies.appState.mqtt.client || !dependencies.appState.mqtt.client.connected) return;
            const gasTopic = this.buildGasTopic();
            if (!gasTopic) {
                dependencies.MessageService.add('无法构建气体主题，请检查IMEI', true);
                return;
            }
            if (dependencies.appState.mqtt.gasTopic === gasTopic) return;
            if (dependencies.appState.mqtt.gasTopic && dependencies.appState.mqtt.gasTopic !== gasTopic) {
                this.unsubscribeGasTopic(() => this.doSubscribeGas(gasTopic));
            } else {
                this.doSubscribeGas(gasTopic);
            }
        },
        
        doSubscribeGas(gasTopic) {
            if (!dependencies.appState.mqtt.client || !dependencies.appState.mqtt.client.connected) return;
            dependencies.appState.mqtt.client.subscribe(gasTopic, (err) => {
                if (err) {
                    dependencies.MessageService.add(`订阅气体数据失败: ${gasTopic} - ${err}`, true);
                    if (dependencies.GasDisplayService) dependencies.GasDisplayService.showWaiting();
                } else {
                    dependencies.MessageService.add(`✅ 已订阅气体数据: ${gasTopic}`);
                    dependencies.appState.mqtt.gasTopic = gasTopic;
                    if (dependencies.GasDisplayService) dependencies.GasDisplayService.update({ disconnected: true });
                    const DOM = dependencies.DOM;
                    if (DOM.gasInfoPanel) DOM.gasInfoPanel.innerHTML = `🌫️ 气体数据监测中...`;
                }
            });
        },
        
        unsubscribeGasTopic(callback) {
            if (!dependencies.appState.mqtt.client || !dependencies.appState.mqtt.client.connected || !dependencies.appState.mqtt.gasTopic) {
                if (callback) callback(null);
                return;
            }
            const oldTopic = dependencies.appState.mqtt.gasTopic;
            dependencies.appState.mqtt.client.unsubscribe(oldTopic, (err) => {
                if (!err) {
                    dependencies.MessageService.add(`已取消气体订阅: ${oldTopic}`);
                    dependencies.appState.mqtt.gasTopic = null;
                }
                if (callback) callback(err);
            });
        },
        
        resubscribeGasTopic() {
            if (!dependencies.appState.mqtt.isConnected || !dependencies.appState.mqtt.client || !dependencies.appState.mqtt.client.connected) return;
            this.unsubscribeGasTopic(() => this.subscribeGasTopic());
        },
        
        async toggleConnection() {
            if (dependencies.appState.mqtt.isConnected) {
                await this.disconnect();
            } else {
                await this.connect();
            }
        },
        
        connect() {
            return new Promise((resolve) => {
                if (dependencies.appState.mqtt.client && dependencies.appState.mqtt.client.connected) this.disconnect();
                const hostPort = this.parseHostPort();
                if (!hostPort) {
                    this.updateUiByConnection(false);
                    resolve(false);
                    return;
                }
                const topics = this.generateTopicsFromImei();
                if (!topics) {
                    this.updateUiByConnection(false);
                    resolve(false);
                    return;
                }
                const { publishTopic, subscribeTopic } = topics;
                dependencies.appState.mqtt.publishTopic = publishTopic;
                dependencies.appState.mqtt.subscribeTopic = subscribeTopic;
                const brokerUrl = `ws://${hostPort.host}:${hostPort.port}/mqtt`;
                dependencies.appState.mqtt.brokerUrl = brokerUrl;
                const options = {
                    clientId: 'b2-ctrl-' + Math.random().toString(16).substring(2, 10),
                    clean: true,
                    connectTimeout: 5000,
                    reconnectPeriod: 2000,
                    resubscribe: true
                };
                dependencies.appState.mqtt.client = mqtt.connect(brokerUrl, options);
                dependencies.appState.mqtt.client.on('connect', () => {
                    dependencies.MessageService.add(`MQTT连接成功 [${brokerUrl}]`);
                    this.handleConnectSuccess();
                    dependencies.SrsVideoService.startPlay();
                    resolve(true);
                });
                dependencies.appState.mqtt.client.on('message', (topic, message) => this.handleMessage(topic, message));
                dependencies.appState.mqtt.client.on('close', () => this.handleDisconnect());
                dependencies.appState.mqtt.client.on('reconnect', () => {
                    dependencies.MessageService.add('MQTT重连中...');
                    const DOM = dependencies.DOM;
                    DOM.mqttStatus.textContent = '重连中...';
                    if (DOM.mqttIndicator) DOM.mqttIndicator.className = 'status-indicator status-yellow';
                });
                dependencies.appState.mqtt.client.on('error', (err) => {
                    console.error('MQTT Error:', err);
                    dependencies.MessageService.add(`连接错误: ${err.message || err}`, true);
                    this.handleDisconnect();
                    resolve(false);
                });
            });
        },
        
        handleConnectSuccess() {
            if (!dependencies.appState.mqtt.client || !dependencies.appState.mqtt.client.connected) return;
            dependencies.appState.mqtt.client.subscribe(dependencies.appState.mqtt.subscribeTopic, (err) => {
                if (err) dependencies.MessageService.add(`订阅失败: ${err}`, true);
                else dependencies.MessageService.add(`已订阅主题: ${dependencies.appState.mqtt.subscribeTopic}`);
            });
            this.subscribeGasTopic();
            this.updateUiByConnection(true);
            // 重置计数器（新连接）
            dependencies.appState.mqtt.upMsgCount = 0;
            dependencies.appState.mqtt.downMsgCount = 0;
            this.updateB2CountersDisplay();
            this.resetB2StatusAndCounters(); // 清空旧数据显示等待状态
        },
        
        handleMessage(topic, message) {
            const msgStr = message.toString();
            if (msgStr.length < 200) {
                dependencies.MessageService.add(`收到 [${topic}]: ${msgStr.substring(0, 100)}`);
            }
            
            // 处理气体主题（原有逻辑）
            const currentGasTopic = this.buildGasTopic();
            if (currentGasTopic && topic === currentGasTopic && dependencies.GasDisplayService) {
                dependencies.GasDisplayService.parseAndUpdate(msgStr);
            }
            
            // 处理B2设备状态主题（此次新增）
            const currentSubscribeTopic = dependencies.appState.mqtt.subscribeTopic;
            if (currentSubscribeTopic && topic === currentSubscribeTopic) {
                try {
                    const dataObj = JSON.parse(msgStr);
                    // 上行计数加1
                    if (dependencies.appState.mqtt) {
                        dependencies.appState.mqtt.upMsgCount = (dependencies.appState.mqtt.upMsgCount || 0) + 1;
                        this.updateB2CountersDisplay();
                    }
                    this.updateB2StatusFromData(dataObj);
                } catch(e) {
                    console.error('解析B2状态JSON失败:', e);
                    dependencies.MessageService.add('B2状态数据解析失败', true);
                }
            }
        },
        
        // 更新上下行计数显示
        updateB2CountersDisplay() {
            const upDiv = document.getElementById('uplink-data');
            const downDiv = document.getElementById('downlink-data');
            if (upDiv) {
                upDiv.textContent = `${dependencies.appState.mqtt.upMsgCount || 0}`;
            }
            if (downDiv) {
                downDiv.textContent = `${dependencies.appState.mqtt.downMsgCount || 0}`;
            }
        },
        
        // 根据MQTT消息更新B2状态面板
        updateB2StatusFromData(data) {
            // 实际数据在 data.data 中（根据提供的JSON结构）
            const innerData = data.data || data;
            if (!innerData) return;
            
            const bms = innerData.bms_state;
            const motors = innerData.motor_state || [];
            
            // 提取BMS相关字段
            let version = bms?.version || '--';
            let state = bms?.state;
            let batteryCapacity = bms?.battery_capacity;
            let currentMa = bms?.current;     // 单位 mA
            let cycle = bms?.cycle;
            
            // 状态映射（根据常用BMS数值，可自定义）
            let stateText = '未知';
            if (state === 0) stateText = '待机';
            else if (state === 1) stateText = '放电';
            else if (state === 2) stateText = '充电';
            else if (state === 8) stateText = '满电待机';
            else stateText = `模式${state}`;
            
            // 计算所有有效电机的平均通信频率（过滤 mode != 0 的电机）
            let totalFreq = 0;
            let validMotorCount = 0;
            if (Array.isArray(motors)) {
                motors.forEach(motor => {
                    if (motor && motor.mode !== 0 && motor.communication_frequency) {
                        totalFreq += motor.communication_frequency;
                        validMotorCount++;
                    }
                });
            }
            let avgCommFreq = validMotorCount > 0 ? Math.round(totalFreq / validMotorCount) : 0;
            let motorCommDisplay = avgCommFreq > 0 ? `平均 ${avgCommFreq} Hz` : '无数据';
            
            // 电流转换 mA -> A
            let currentA = currentMa !== undefined ? (currentMa / 1000).toFixed(2) : '--';
            
            // 更新DOM元素
            const versionDiv = document.getElementById('version');
            const stateDiv = document.getElementById('state');
            const batteryDiv = document.getElementById('battery_capacity');
            const currentDiv = document.getElementById('current');
            const cycleDiv = document.getElementById('cycle');
            const motorCommDiv = document.getElementById('motor_state-communication_frequency');
            
            if (versionDiv) versionDiv.textContent = `${version}`;
            if (stateDiv) stateDiv.textContent = `${stateText}`;
            if (batteryDiv) batteryDiv.textContent = `${batteryCapacity !== undefined ? batteryCapacity + '%' : '--'}`;
            if (currentDiv) currentDiv.textContent = `${currentA !== '--' ? currentA + ' A' : '--'}`;
            if (cycleDiv) cycleDiv.textContent = `${cycle !== undefined ? cycle : '--'}`;
            if (motorCommDiv) motorCommDiv.textContent = `${motorCommDisplay}`;
            
            // 可选：添加额外细节日志
            dependencies.MessageService.add(`B2状态更新 | 电量:${batteryCapacity}% 电流:${currentA}A 电机通讯:${avgCommFreq}Hz`);
        },
        
        disconnect() {
            return new Promise((resolve) => {
                if (dependencies.appState.mqtt.client && dependencies.appState.mqtt.client.connected) {
                    dependencies.appState.mqtt.client.end(true, () => {
                        dependencies.MessageService.add('MQTT连接已断开');
                        dependencies.SrsVideoService.stopPlay();
                        this.updateUiByConnection(false);
                        resolve();
                    });
                } else {
                    this.updateUiByConnection(false);
                    resolve();
                }
            });
        },
        
        handleDisconnect() {
            this.updateUiByConnection(false);
            dependencies.MessageService.add('MQTT连接已断开');
            if (dependencies.GasDisplayService) dependencies.GasDisplayService.resetToDisconnected();
            dependencies.appState.mqtt.gasTopic = null;
            // 断开时不清零计数器，但可根据需求保留或清零，这里保留计数显示但标记一下
            const upDiv = document.getElementById('uplink-data');
            const downDiv = document.getElementById('downlink-data');
            if (upDiv) upDiv.style.opacity = '0.6';
            if (downDiv) downDiv.style.opacity = '0.6';
        },
        
        updateUiByConnection(connected) {
            const DOM = dependencies.DOM;
            dependencies.appState.mqtt.isConnected = connected;
            if (connected) {
                DOM.mqttStatus.textContent = '远程服务✅';
                DOM.mqttToggleBtn.innerHTML = '<i class="fa fa-unplug mr-1"></i>断开';
                DOM.mqttToggleBtn.classList.add('connected');
                DOM.mqttToggleBtn.disabled = false;
                DOM.video.refreshBtn.disabled = false;
                // 恢复上下行显示样式
                const upDiv = document.getElementById('uplink-data');
                const downDiv = document.getElementById('downlink-data');
                if (upDiv) upDiv.style.opacity = '1';
                if (downDiv) downDiv.style.opacity = '1';
            } else {
                DOM.mqttStatus.textContent = '远程服务❌';
                DOM.mqttToggleBtn.innerHTML = '<i class="fa fa-plug mr-1"></i>连接';
                DOM.mqttToggleBtn.classList.remove('connected');
                DOM.mqttToggleBtn.disabled = false;
                dependencies.appState.mqtt.lastSent = '';
                DOM.video.refreshBtn.disabled = true;
                if (dependencies.appState.mqtt.client) {
                    try { dependencies.appState.mqtt.client.end(true); } catch(e) {}
                    dependencies.appState.mqtt.client = null;
                }
                if (dependencies.GasDisplayService) dependencies.GasDisplayService.resetToDisconnected();
            }
        },
        
        sendRCValues() {
            if (!dependencies.appState.mqtt.isConnected || !dependencies.appState.mqtt.client || !dependencies.appState.mqtt.publishTopic) return;
            const currentValue = `${dependencies.appState.rcValues.rc0},${dependencies.appState.rcValues.rc1},${dependencies.appState.rcValues.rc2}\r\n`;
            if (currentValue !== dependencies.appState.mqtt.lastSent) {
                dependencies.appState.mqtt.lastSent = currentValue;
                this.publishMessage(currentValue);
            }
        },
        
        publishMessage(message) {
            if (!dependencies.appState.mqtt.client || !dependencies.appState.mqtt.client.connected || !dependencies.appState.mqtt.publishTopic) return;
            dependencies.appState.mqtt.client.publish(dependencies.appState.mqtt.publishTopic, message, (err) => {
                if (err) {
                    dependencies.MessageService.add(`发送失败: ${err}`, true);
                } else {
                    // 下行计数增加（每条成功发送的消息）
                    if (dependencies.appState.mqtt) {
                        dependencies.appState.mqtt.downMsgCount = (dependencies.appState.mqtt.downMsgCount || 0) + 1;
                        this.updateB2CountersDisplay();
                    }
                }
            });
        }
    };
    
    global.MqttService = MqttService;
})(window);