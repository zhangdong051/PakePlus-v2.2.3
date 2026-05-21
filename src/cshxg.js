		
	//初始化部分	
		// 修改初始化函数，启动多个视频
		function initApplication() {
			//showTempMessage('开始正常运行');
			initDeviceManagement();

			// 启动视频播放：只传递1或2作为设备索引
			if (devices.length >= 1) {
				// 第一个设备对应索引1
				startVideoPlay(1, devices[0].id); 
			}
			if (devices.length >= 2) {
				// 第二个设备对应索引2（最多只能有2个，因为HTML中只有两个小视频窗口）
				startVideoPlay(2, devices[1].id); 
			} else {
				// 没有第二个设备时，清空第二个视频窗口
				const videoElement = document.getElementById('small-remote-video-2');
				if (videoElement) { // 增加非空判断
					videoElement.srcObject = null;
				} else {
					console.warn('未找到small-remote-video-2元素');
				}
			}
		}

		// 在initDeviceManagement函数中添加roomId和MQTT主题的初始化
		function initDeviceManagement() {
			// 从本地存储加载设备列表，如果没有则使用默认设备
			const savedDevices = localStorage.getItem('droneDevices');
			if (savedDevices) {
				devices = JSON.parse(savedDevices);
				
				// 为没有型号的设备添加默认型号d10
				devices.forEach(device => {
					if (!device.model) {
						device.model = 'd10';
					}
				});
			} else {
				// 默认设备添加型号
				devices = [
					{ id: '864284040603669', name: 'M350', model: 'd10', online: false, position: [114.378185, 36.138881] }
				];
				saveDevices();
			}

			// 初始化设备轨迹存储
			devices.forEach(device => {
				if (!devicePaths[device.id]) {
					devicePaths[device.id] = [device.position];
				}
			});

			// 设置当前设备
			currentDeviceId = devices[0]?.id || null;
			currentDevice = devices.find(device => device.id === currentDeviceId) || null;

			// 关键修改：将roomId初始化为当前设备的ID
			roomId = currentDeviceId;
			
			// 根据当前设备型号更新MQTT主题
			if (currentDevice) {
				MQTTXterminals = `/terminal/${currentDevice.model}/${roomId}/setInfo`;
				MQTTXterminalg = `/terminal/${currentDevice.model}/${roomId}/getInfo`;
				MQTTXterminalc = `/terminal/${currentDevice.model}/${roomId}/callBack`;
				// console.log('MQTTXterminalg..........',MQTTXterminalg);
			} else {
				//fallback默认值
				MQTTXterminals = '/terminal/d10/' + roomId + '/setInfo';
				MQTTXterminalg = '/terminal/d10/' + roomId + '/getInfo';
				MQTTXterminalc = '/terminal/d10/' + roomId + '/callBack';
			}

			// 渲染设备列表
			renderDeviceList();  
			// 初始化设备标记
			initDeviceMarkers();
			// 初始化设备选择器
			renderDeviceSelectors();
		}
		// 在初始化设备管理后添加设备选择器选项
		function renderDeviceSelectors() {

			const selector2 = document.getElementById('device-selector-2');
			if (!selector2) return;

			// 清空现有选项
			selector2.innerHTML = '';
			
			// 为每个设备添加选项
			devices.forEach(device => {
				const option = document.createElement('option');
				option.value = device.id;
				option.textContent = device.name;
				selector2.appendChild(option);
			});
			// 设置默认选中项
			if (devices.length >= 2) {
				selector2.value = devices[1].id;
			} else if (devices.length === 1) {
				selector2.value = devices[0].id;
			}
			 
		}

		// 保存设备列表到本地存储
		function saveDevices() {
			localStorage.setItem('droneDevices', JSON.stringify(devices));
		}

		// 渲染设备列表
		function renderDeviceList() {
			const deviceList = document.getElementById('device-list');
			deviceList.innerHTML = '';

			devices.forEach(device => {
				const deviceItem = document.createElement('div');
				deviceItem.className = `device-item ${device.id === currentDeviceId ? 'active' : ''}`;
				deviceItem.onclick = (e) => {
					// 防止点击删除按钮时触发设备切换
					if (!e.target.classList.contains('delete-device')) {
						switchDevice(device.id);
					}
				};

				deviceItem.innerHTML = `
					<div class="device-status ${device.online ? '' : 'offline'}"></div>
					<div class="device-info">
						<div class="device-name">${device.name}</div>
						<div class="device-id">${device.id}</div>
					</div>
					<button class="edit-device" onclick="editDevice('${device.id}', event)">✍️</button>
					<button class="delete-device" onclick="deleteDevice('${device.id}', event)">❌</button>
				`;

				deviceList.appendChild(deviceItem);
			});
				// 新增：更新设备选择器
			renderDeviceSelectors();
			
		}
	function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){ if(m === '&') return '&amp;'; if(m === '<') return '&lt;'; if(m === '>') return '&gt;'; return m;}); }
    function renderDeviceSelectors() { const selector2 = document.getElementById('device-selector-2'); if(!selector2) return; selector2.innerHTML = ''; devices.forEach(device => { const option = document.createElement('option'); option.value = device.id; option.textContent = device.name; selector2.appendChild(option); }); if(devices.length >= 2) selector2.value = devices[1].id; else if(devices.length === 1) selector2.value = devices[0].id; }

    // 编辑设备逻辑
    let editingDeviceId = null;
    function editDevice(deviceId, event) {
        event.stopPropagation();
        const device = devices.find(d => d.id === deviceId);
        if(!device) return;
        editingDeviceId = deviceId;
        const modal = document.getElementById('edit-device-modal');
        document.getElementById('edit-device-id').value = device.id;
        document.getElementById('edit-device-name').value = device.name;
        document.getElementById('edit-device-model').value = device.model || 'd10';
        modal.style.display = 'flex';
    }
	function closeEditModal() { document.getElementById('edit-device-modal').style.display = 'none'; editingDeviceId = null; }
    function saveEditedDevice() {
        const newId = document.getElementById('edit-device-id').value.trim();
        const newName = document.getElementById('edit-device-name').value.trim();
        const newModel = document.getElementById('edit-device-model').value;
        if(!newId) { alert('设备ID不能为空'); return; }
        if(!newName) { alert('设备名称不能为空'); return; }
        const oldDevice = devices.find(d => d.id === editingDeviceId);
        if(!oldDevice) { closeEditModal(); return; }
        // 检查ID重复（排除自身）
        if(newId !== editingDeviceId && devices.some(d => d.id === newId)) { alert('设备ID已存在，请更换'); return; }
        // 执行修改
        const oldId = editingDeviceId;
        // 更新设备对象
        oldDevice.id = newId;
        oldDevice.name = newName;
        oldDevice.model = newModel;
        // 处理轨迹存储迁移
        if(oldId !== newId) {
            if(devicePaths[oldId]) { devicePaths[newId] = [...devicePaths[oldId]]; delete devicePaths[oldId]; }
            else { devicePaths[newId] = []; }
        }
        // 如果修改的是当前激活的设备，需要更新全局变量及MQTT主题
        if(currentDeviceId === oldId) {
            currentDeviceId = newId;
            currentDevice = oldDevice;
            roomId = newId;
            // 更新MQTT主题
            MQTTXterminals = `/terminal/${newModel}/${newId}/setInfo`;
            MQTTXterminalg = `/terminal/${newModel}/${newId}/getInfo`;
            MQTTXterminalc = `/terminal/${newModel}/${newId}/callBack`;
            if(mqtt && mqtt.connected) {
                try { mqtt.unsubscribe(`/terminal/${oldDevice.model}/${oldId}/getInfo`); }catch(e){}
                mqtt.subscribe(MQTTXterminalg);
            }
        }
        saveDevices();
        // 重新渲染设备列表及地图标记
        renderDeviceList();
        initDeviceMarkers();      // 刷新地图标记
        // 更新视频播放（重新绑定对应视频索引）
        if(devices.length >= 1) startVideoPlay(1, devices[0].id);
        if(devices.length >= 2) startVideoPlay(2, devices[1].id);
        else { const vid2 = document.getElementById('small-remote-video-2'); if(vid2) vid2.srcObject = null; }
        updateDeviceButtons();    // 根据型号更新控制按钮
        closeEditModal();
        alert('设备信息已更新');
    }
// 删除设备
		function deleteDevice(deviceId, event) {
			event.stopPropagation(); // 阻止事件冒泡

			if (devices.length <= 1) {
				alert('至少保留一个设备');
				return;
			}

			if (confirm(`确定要删除设备 ${deviceId} 吗？`)) {
				// 从设备列表中移除
				devices = devices.filter(device => device.id !== deviceId);

				// 清除该设备的轨迹
				delete devicePaths[deviceId];

				// 如果删除的是当前设备，切换到第一个设备
				if (currentDeviceId === deviceId) {
					currentDeviceId = devices[0]?.id || null;

					// 更新全局变量
					if (currentDeviceId) {
						roomId = currentDeviceId;
						MQTTXterminals = '/terminal/d10/' + roomId + '/setInfo';
						MQTTXterminalg = '/terminal/d10/' + roomId + '/getInfo';
						MQTTXterminalc = '/terminal/d10/' + roomId + '/callBack';
						
						// 重新连接MQTT和视频
						if (mqtt && mqtt.connected) {
							mqtt.unsubscribe(MQTTXterminalg);
							//mqtt.unsubscribe(MQTTXterminalc);
							mqtt.subscribe(MQTTXterminalg);
							//mqtt.subscribe(MQTTXterminalc);
							restartVideoPlay();
						}
					}
				}

				// 保存并重新渲染
				saveDevices();
				renderDeviceList();
				initDeviceMarkers(); // 重新初始化标记
				 // 更新视频显示
			if (devices.length >= 1) {
				startVideoPlay(1, devices[0].id);
			}
			if (devices.length >= 2) {
				startVideoPlay(2, devices[1].id);
			} else {
				// 不足两个设备，第二个窗口显示黑屏
				const videoElement = document.getElementById('small-remote-video-2');
				videoElement.srcObject = null;
			}
			}
}
// 修改添加新设备函数
		function addNewDevice() {
			// 显示综合添加设备模态框
			const modal = document.getElementById('add-device-modal');
			modal.style.display = 'flex';
			
			// 重置输入框
			document.getElementById('new-device-id').value = '';
			document.getElementById('new-device-name').value = `无人机${devices.length + 1}`;
			
			// 确认按钮事件
			document.getElementById('add-device-confirm').onclick = function() {
				const deviceId = document.getElementById('new-device-id').value.trim();
				const deviceName = document.getElementById('new-device-name').value.trim();
				const modelSelector = document.getElementById('new-device-model');
				const selectedModelCode = modelSelector.value;
				
				// 验证输入
				if (!deviceId) {
					alert('设备ID不能为空!');
					return;
				}
				
				if (!deviceName) {
					alert('设备名称不能为空!');
					return;
				}
				
				// 检查设备是否已存在
				if (devices.find(d => d.id === deviceId)) {
					alert('设备已存在!');
					return;
				}
				
				const newDevice = {
					id: deviceId,
					name: deviceName,
					model: selectedModelCode,
					online: false,
					// 使用指挥所坐标作为新设备默认位置
					position: window.largeMap ? window.largeMap.getCenter() : config.commandPostCoord.split(',').map(Number)
				};
				
				devices.push(newDevice);
				devicePaths[deviceId] = []; // 初始化新设备的轨迹数组
				saveDevices();
				renderDeviceList();
				initDeviceMarkers(); // 重新初始化标记
				
				// 如果现在有两个设备了，启动第二个视频
				if (devices.length === 2) {
					startVideoPlay(2, devices[1].id);
				}
				
				modal.style.display = 'none';
				
				// 更新按钮
				if (currentDevice && currentDevice.model) {
					updateDeviceButtons();
				}
			};
			
			// 取消按钮事件
			document.getElementById('add-device-cancel').onclick = function() {
				modal.style.display = 'none';
			};
		}

// 获取设备轨迹线对应的颜色
		function getDeviceColor(deviceId) {
			const index = devices.findIndex(d => d.id === deviceId) % pathColors.length;
			return pathColors[index];
		}

// 修改：获取设备对应的图标
    function getDeviceIcon(deviceId, isActive = false) {
        // 找到设备型号
        const device = devices.find(d => d.id === deviceId);
        if (!device) return deviceTypeIcons.drone.normal;
        
        // 获取设备类型
        const deviceType = getDeviceType(device.model);
        
        // 返回对应状态的图标
        return isActive ? 
            deviceTypeIcons[deviceType].active : 
            deviceTypeIcons[deviceType].normal;
    }

// 更新RoomId并重新初始化相关配置
		function uint8ArrayToHexString(uint8Array) {
            return Array.from(uint8Array).map(byte => byte.toString(16).padStart(2, '0')).join('');
        }

 // 设置按钮事件
       document.getElementById('settings-button').addEventListener('click', openSettings);
 
// 设置对话框相关函数，加载保存的指挥所坐标
		function openSettings() {
			// 加载当前配置到输入框
			document.getElementById('video-server').value = config.videoServer;
			document.getElementById('mqtt-server').value = config.mqttServer;
			document.getElementById('zhihuisuolon').value = config.commandPostCoord || ''; // 加载指挥所坐标
			// 显示对话框
			document.getElementById('settings-modal').style.display = 'flex';
		}

    function closeSettings() {
        // 隐藏对话框
        document.getElementById('settings-modal').style.display = 'none';
    }

// 配置保存函数，保存指挥所坐标
		function saveSettings() {
			// 获取输入框的值
			const videoServer = document.getElementById('video-server').value.trim();
			const mqttServer = document.getElementById('mqtt-server').value.trim();
			const commandPostCoord = document.getElementById('zhihuisuolon').value.trim(); // 获取指挥所坐标

			// 验证输入
			if (videoServer && mqttServer) {
				// 保存配置
				config.videoServer = videoServer;
				config.mqttServer = mqttServer;
				config.commandPostCoord = commandPostCoord || '114.378185,36.138881'; // 保存指挥所坐标，确保有默认值
				
				// 保存到localStorage
				localStorage.setItem('appConfig', JSON.stringify(config));

				alert('设置已保存,下次启动生效');
				if (mqtt && mqtt.connected) {
					mqDisconnect();
					setTimeout(connect, 1000);
				}
				closeSettings();
			} else {
				alert('视频服务器和MQTT服务器地址不能为空！');
			}
		}

      // 切换航线执行面板
        function toggleExecutionPanel() {
            const panel = document.getElementById('execution-panel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        }
