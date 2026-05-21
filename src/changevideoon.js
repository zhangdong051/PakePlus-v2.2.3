// 更新按钮组（在切换设备时调用）
		function updateDeviceButtons() {
			if (currentDevice && currentDevice.model) {
				renderVideoSwitchButtons(currentDevice.model);
				renderControlButtons(currentDevice.model);
			}
		}
// 切换设备面板显示/隐藏
		function toggleDevicePanel() {
			const panel = document.getElementById('device-panel');
			panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
		}
// 渲染视频切换按钮
		function renderVideoSwitchButtons(model) {
			const container = document.getElementById('video-switch-buttons');
			if (!container) return;
			
			// 获取对应型号的配置，默认为d10
			const config = deviceButtonConfigs[model] || deviceButtonConfigs["d10"];
			
			// 清空现有按钮
			container.innerHTML = '';
			
			// 添加新按钮
			config.videoSwitches.forEach(btn => {
				const button = document.createElement('button');
				button.type = 'button';
				button.className = 'video-switch-btn';
				button.innerHTML = btn.label;
				button.setAttribute('onclick', btn.func);
				container.appendChild(button);
			});
		}
		
		
// 渲染控制按钮组
		function renderControlButtons(model) {
			const container = document.getElementById('control-buttons-group');
			if (!container) return;
			
			// 获取对应型号的配置，默认为d10
			const config = deviceButtonConfigs[model] || deviceButtonConfigs["d10"];
			
			// 清空现有按钮
			container.innerHTML = '';
			
			// 添加新按钮
			config.controls.forEach(btn => {
				const button = document.createElement('button');
				button.className = 'control-btn status-btn';
				button.innerHTML = btn.label;
				button.setAttribute('onclick', btn.func);
				container.appendChild(button);
			});
		}
// 添加切换视频设备的函数
		function changeDeviceForVideo(videoIndex, deviceId) {
			// 找到选中的设备
			// console.log(`************`);
			const selectedDevice = devices.find(d => d.id === deviceId);
			if (!selectedDevice) return;
			
			// 停止当前小窗口的视频流
			const videoElement = document.getElementById(`small-remote-video-${videoIndex}`);
			if (videoElement && videoElement.srcObject) {
				videoElement.srcObject.getTracks().forEach(track => track.stop());
				videoElement.srcObject = null;
			}
			// console.log(`change`);
			// 关键修复：使用已实现的startVideoPlay方法启动视频（替换initVideoStream）
			startVideoPlay(videoIndex, selectedDevice.id);
			
			// 更新小窗口的标签显示
			const labelElement = videoElement.parentElement.querySelector('.small-video-label');
			if (labelElement) {
				labelElement.textContent = selectedDevice.name;
			}
			
			// 保持小窗口激活状态
			videoElement.parentElement.parentElement.classList.add('active');
		}	

// 修改设备切换函数，确保切换设备时正确更新小窗口显示和MQTT主题
function switchDevice(deviceId) {
    const deviceIndex = devices.findIndex(d => d.id === deviceId) + 1;
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    currentDeviceId = deviceId;
    currentDevice = devices.find(device => device.id === deviceId) || null;

    // 1. 保存旧主题（同时保存MQTTXterminalg和MQTTXterminalc的旧主题）
    const oldMqttTopics = [MQTTXterminalg, MQTTXterminalc]; // 旧主题数组
    // 2. 更新全局MQTT主题变量
    roomId = deviceId;
    MQTTXterminals = `/terminal/${device.model}/${roomId}/setInfo`;
    MQTTXterminalg = `/terminal/${device.model}/${roomId}/getInfo`;
    MQTTXterminalc = `/terminal/${device.model}/${roomId}/callBack`;
    // 新主题数组
    const newMqttTopics = [MQTTXterminalg, MQTTXterminalc];
    
    // 3. 切换MQTT订阅（同时处理两个主题）
    if (mqttClient && mqttClient.connected) {
        // 先取消订阅所有旧主题
        mqttClient.unsubscribe(oldMqttTopics, (err) => {
            if (err) {
                console.error('取消旧主题订阅失败:', err);
                return;
            }
            // 再订阅所有新主题
            mqttClient.subscribe(newMqttTopics, (err) => {
                if (err) {
                    console.error('订阅新主题失败:', err);
                } else {
                   // console.log(`MQTT主题已切换为: ${newMqttTopics.join(', ')}`);

                }
            });
        });
    }

    // （以下原有其他逻辑保持不变）
    if (device.position && window.largeMap) {
		
        window.largeMap.setCenter(device.position);
        window.smallMap.setCenter(device.position);
		
    }

    const videoElement = document.getElementById(`small-remote-video-${deviceIndex}`);
    if (videoElement && videoElement.srcObject) {
        document.getElementById('remote-video').srcObject = videoElement.srcObject;
        document.body.classList.remove('active-video-1', 'active-video-2');
        document.body.classList.add(`active-video-${deviceIndex}`);
    }

    renderDeviceList();// 更新设备列表显示
    highlightCurrentDeviceMarker();// 高亮当前设备的标记
    syncSmallWindowContent();// 同步小窗口显示
    updateDeviceButtons();	// 更新按钮组
}
		
// 修改switchToLargeView函数，添加当前激活视频索引标记
		function switchToLargeView(deviceIndex) {
			// 1. 查找视频元素
			const smallVideo = document.getElementById(`small-remote-video-${deviceIndex}`);
			const largeVideo = document.getElementById('remote-video');

			if (!smallVideo || !largeVideo || !smallVideo.srcObject) {
				console.error('视频元素或流不存在');
				return;
			}

			// 2. 切换视频源
			const smallVideoSrc = smallVideo.srcObject;
			largeVideo.srcObject = smallVideoSrc;

			// 3. 切换到大窗口显示视频模式
			document.body.classList.remove('show-map-large');
			document.body.classList.add('show-video-large');
			
			// 4. 移除之前的激活视频索引标记，添加当前的
			document.body.classList.remove('active-video-1', 'active-video-2');
			document.body.classList.add(`active-video-${deviceIndex}`);

			// 5. 播放视频
			largeVideo.play()
				.then(() => {
					setTimeout(() => {
						document.getElementById('video-error').style.display = 'none';
					}, 500);
				})
				.catch(error => {
					if (error.name !== 'AbortError') {
						console.warn('大窗口视频播放失败:', error);
						document.getElementById('video-error').style.display = 'block';
					}
				});

			// 6. 标记当前激活的小窗口
			document.querySelectorAll('.small-view').forEach(el => {
				el.classList.remove('active');
			});
			document.querySelector(`.small-view[onclick="switchToLargeView(${deviceIndex})"]`).classList.add('active');

			// 7. 切换当前设备
			const device = devices[deviceIndex - 1];
			if (device) {
				switchDevice(device.id);
			}

			// 8. 同步小窗口显示状态
			syncSmallWindowContent();
		}

// 修改视频播放函数，支持多设备
	async function startVideoPlay(deviceIndex, deviceId) {
    // 新增参数检查
    if (!deviceIndex || !deviceId) {
        console.error('startVideoPlay需要有效的deviceIndex和deviceId参数');
        return;
    }
    try {
        // 显示加载状态
        const videoLoading = document.getElementById('video-loading');
        if (deviceIndex === 1 || !isVideoPlaying[1]) {
            videoLoading.style.display = 'block';
        }

        // 关闭已有连接
        if (videoSdks[deviceIndex]) {
            await videoSdks[deviceIndex].close();
        }

        videoSdks[deviceIndex] = new SrsRtcWhipWhepAsync();

        // 将SDK的流绑定到对应的视频元素
        const videoElement = document.getElementById(`small-remote-video-${deviceIndex}`);
        videoElement.srcObject = videoSdks[deviceIndex].stream;

        // 如果是当前选中的设备，同时绑定到大窗口
        if (deviceId === currentDeviceId) {
            document.getElementById('remote-video').srcObject = videoSdks[deviceIndex].stream;
        }

        // 使用设备ID生成视频地址
        const whepUrl = `http://${config.videoServer}:1985/rtc/v1/whep/?app=live&stream=${deviceId}.flv`;
        console.log(`设备${deviceIndex}视频地址:`, whepUrl);

        await videoSdks[deviceIndex].play(whepUrl, {
            videoOnly: true,
            audioOnly: false
        });

        // 更新状态信息
        videoLoading.style.display = 'none';
        isVideoPlaying[deviceIndex] = true;

        document.getElementById('video-status').textContent = `视频：设备${deviceIndex}播放中`;


    } catch (error) {
        console.error(`设备${deviceIndex}视频播放错误:`, error);
        if (deviceIndex === 1 || !isVideoPlaying[1]) {
            videoLoading.style.display = 'none';
        }

        // 清理连接
        if (videoSdks[deviceIndex]) {
            try {
                await videoSdks[deviceIndex].close();
            } catch (closeErr) {
                console.error(`关闭设备${deviceIndex}视频连接错误:`, closeErr);
            }
            videoSdks[deviceIndex] = null;
        }
        isVideoPlaying[deviceIndex] = false;

        // 如果没有设备2，显示黑屏
        if (deviceIndex === 2 && devices.length < 2) {
            const videoElement = document.getElementById(`small-remote-video-2`);
            videoElement.srcObject = null;
        }
    }
}


// 停止视频播放
		async function stopVideoPlay(deviceIndex) {
			if (videoSdks[deviceIndex]) {
				try {
					await videoSdks[deviceIndex].close();
					document.getElementById('video-status').textContent = `视频：设备${deviceIndex}已停止`;
				} catch (error) {
					console.error(`停止设备${deviceIndex}视频错误:`, error);
				}
				videoSdks[deviceIndex] = null;
				isVideoPlaying[deviceIndex] = false;
			}
		}



// 重新加载视频
    async function restartVideoPlay() {
        await stopVideoPlay();
        await startVideoPlay();
    }