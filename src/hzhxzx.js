// 新增全局变量用于记录mission_id，初始值为331270
let missionId = 331270;

// 切换绘制状态
let points = [];
let isDrawing = false;
let currentPolyline = null;

function toggleDrawing() {
    isDrawing = !isDrawing;
    const button = document.getElementById('drawing-toggle'); 
    
    if (isDrawing) {
        // 高德地图通过AMap.event 监听点击事件 
         window.largeMap .on('click',  addPoint);
        button.textContent  = '关闭绘制';
        button.style.backgroundColor  = '#ffc107';
        button.style.color  = '#212529';
    } else {
         window.largeMap .off('click',  addPoint); // 移除事件监听 
        button.textContent  = '✨开始绘制';
        button.style.backgroundColor  = '';
        button.style.color  = '';
		
    }
}

// 修改addPoint函数（hzhxzx.js中）
function addPoint(e) {
    const coord = e.lnglat; 
   // showTempMessage(' 添加航点:', coord);
 
    // 获取默认高度（从输入框获取）
    const defaultHeight = parseFloat(document.getElementById('flight-height').value) || 50;
 
    const label = new AMap.Text({
        text: (points.length + 1).toString(),
        position: coord,
        style: {
            'background-color': '#007BFF',
            'color': 'white',
            'border-radius': '50%',
            'padding': '3px 6px',
            'font-size': '12px',
            'text-align': 'center'
        },
        offset: new AMap.Pixel(-10, -8),
        draggable: true  // 新增：允许拖拽
    });
    label.setMap(window.largeMap); 
 
    // 新增拖拽结束事件
    label.on('dragend', function(event) {
        // 获取当前航点索引
        const index = points.findIndex(p => p.label === label);
        if (index !== -1) {
            // 更新航点坐标
            points[index].coord = event.lnglat;
            // 刷新航线和列表
            updatePolyline();
            updateWaypointList();
        }
    });
 
    // 新增height属性存储当前航点高度
    points.push({  
        coord, 
        label,
        marker: label,
        height: defaultHeight
    });
    updatePolyline();
    updateWaypointList();
}

// 修改updateWaypointList函数（hzhxzx.js中）
function updateWaypointList() {
    const container = document.getElementById('waypoint-items');
    container.innerHTML = ''; // 清空列表
 
    points.forEach((point, index) => {
        const item = document.createElement('div');
        item.className = 'waypoint-item';
        
        // 航点信息HTML，优化布局
        item.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%; gap: 8px;">
                <span style="min-width: 5px;">${index + 1}:</span>
                <div class="waypoint-coords">
                    <span>${point.coord.getLng().toFixed(6)}</span>
                    <span style="margin-left: 8px;">${point.coord.getLat().toFixed(6)}</span>
                </div>
                <div class="waypoint-height-control">
                    <input type="number" 
                           class="waypoint-height" 
                           data-index="${index}"
                           value="${point.height}" 
                           min="10" 
                           step="1">
                    <span>米</span>
                </div>
            </div>
        `;
        
        container.appendChild(item);
    });
 
    // 绑定高度输入框事件（保持不变）
    document.querySelectorAll('.waypoint-height').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const height = parseFloat(e.target.value);
            if (!isNaN(height) && height >= 10) {
                points[index].height = height;
            } else {
                alert('请输入有效的高度值（不小于10米）');
                e.target.value = points[index].height;
            }
        });
    });
}


// 添加拖放相关函数（放到hzhxzx.js中）
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
        container.appendChild(draggable);
    } else {
        container.insertBefore(draggable, afterElement);
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

function handleDrop(e) {
    e.preventDefault();
    // 获取新的排序
    const items = Array.from(container.children);
    const newOrder = items.map(item => parseInt(item.dataset.index));
    
    // 重新排序points数组
    const newPoints = newOrder.map(index => points[index]);
    
    // 更新points数组并重新渲染
    points = newPoints;
    updatePolyline();
    updateWaypointList();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.waypoint-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 修改删除最后一个航点函数
function removeLastPoint() {
    if (points.length === 0) {
        AMap.ui.showToast({ content: '没有可删除的航点！', type: 'error' });
        return;
    }
 
    const lastPoint = points.pop(); 
    lastPoint.marker.setMap(null);
    lastPoint.label.setMap(null); 
    updatePolyline();
    updateWaypointList(); // 新增：更新列表
 
    // 更新剩余航点编号 
    points.forEach((point, index) => {
        point.label.setText((index + 1).toString());
    });
}

// 更新航线（保持不变）
function updatePolyline() {
    // 移除旧航线（高德通过setMap(null)移除覆盖物）
    if (currentPolyline) {
        currentPolyline.setMap(null); 
    }
 
    // 创建新航线（需至少2个点）
    if (points.length  >= 2) {
       const path = points.map(p  => [p.coord.getLng(), p.coord.getLat()]);
        
        currentPolyline = new AMap.Polyline({
            path: path,
            strokeColor: "#28a745", // 线颜色 
            strokeWeight: 4,        // 线宽 
            strokeStyle: "solid",   // 线样式（solid|dash） 
            strokeDasharray: [5, 5], // 虚线间隔（高德使用数组而非字符串）
            lineJoin: "round",       // 折线拐点样式 
            opacity: 0.8,
            zIndex: 50              // 层级控制 
        });
        
        currentPolyline.setMap( window.largeMap );  // 添加到地图 
    }
}

// 修改清空所有要素函数
function clearAll() {
    if(points.length === 0) {
        alert('当前没有航点可清除！');
        return;
    }

    if(confirm('确定要清除所有航点和航线吗？')) {
        points.forEach(p => {
            p.marker.setMap(null); 
            p.label.setMap(null);
        });
        
        if (currentPolyline) currentPolyline.setMap(null); 
        
        points = [];
        currentPolyline = null;
        updateWaypointList(); // 新增：更新列表
        AMap.ui.showToast({ content: "清除完成", type: "success" });
    }
} 


// 切换执行面板显示/隐藏
function toggleExecutionPanel() {
    const panel = document.getElementById('execution-panel');
    panel.classList.toggle('show');
   
    // 如果航点少于2个且面板显示，则显示警告
    if(points.length < 2 && panel.classList.contains('show')) {
        alert('警告：至少需要2个航点才能执行航线！');
    }

}

function executeFlight() {
    if(points.length < 2) {
        alert('执行失败：至少需要2个航点才能执行航线！');
        return;
    }
    
    // 自动关闭绘制状态（核心新增逻辑）
    if (isDrawing) {
        isDrawing = false;
        window.largeMap.off('click', addPoint); // 移除地图点击事件
        const button = document.getElementById('drawing-toggle');
        button.textContent = '✨开始绘制';
        button.style.backgroundColor = '';
        button.style.color = '';
    }
    
    // 以下为原有逻辑保持不变
    const flightSpeed = parseFloat(document.getElementById('flight-speed').value);
    const returnHeight = parseFloat(document.getElementById('return-height').value);
    const lostAction = document.getElementById('lost-action').value;
    
    // 验证输入
    if (isNaN(flightSpeed) || isNaN(returnHeight)) {
        alert('请输入有效的数值参数！');
        return;
    }
    
    if (flightSpeed < 1 || returnHeight < 10) {
        alert('参数值不能小于最小值限制！');
        return;
    }
    
    // 打印航线信息
    console.log('开始执行航线...');
    console.log('航线参数:', {
        flightSpeed,
        returnHeight,
        lostAction
    });
    
    console.log('航点列表:');
    points.forEach((point, index) => {
        console.log(`航点 ${index + 1}:`, point.coord, `高度: ${point.height}米`);
    });
    
    // 显示执行结果
    let waypointInfo = points.map((p, i) => `航点 ${i+1}: ${p.height}米`).join('\n');
    const resultMessage = `航线即将开始执行！
航点数量: ${points.length}个
${waypointInfo}
航线速度: ${flightSpeed}米/秒
返航高度: ${returnHeight}米
遥控器失联动作: ${document.getElementById('lost-action').options[document.getElementById('lost-action').selectedIndex].text}`;
    alert(resultMessage);
    
    // 关闭面板
    toggleExecutionPanel();
    // 航线获取控制权
    hangdianhxzxkzq();
    // 调用航点处理函数
    hangdianhxzx(flightSpeed, lostAction);
    // 航线开始执行
    const timerId = setTimeout(() => {
        hangdianhxzxstat();
    }, 2000);
}

function hangdianhxzxstat() {
   showTempMessage('航线开始执行');
    // 构建JSON数据
    const jsonData = {

	  "datahead": "flight waypoint2 start",
	  "data": {
		"null": "null"
	  },
	  "datatype": 53,
	  "dataextratype": 0,
	  "imei": "eFzn49GF6iJn0po715+xdw==",
	  "dataLen": 17
    };
    // 序列化为JSON字符串并发送
    const jsonStr = JSON.stringify(jsonData);
    mqtt.publish(MQTTXterminals, jsonStr); 	
}


			
function hangdianhxzxkzq() {
   // console.log('航线控制权');
    // 构建JSON数据
    const jsonData = {
		"datatype": 140,
		"datahead": "flight obtain joystick ctrl authority",
		"datalen": 17,
		"data": {
			"null": null
		},
		"imei": "InF3dWaXQjzH+xZF1fgqCA=="
    };
    // 序列化为JSON字符串并发送
    const jsonStr = JSON.stringify(jsonData);
    mqtt.publish(MQTTXterminals, jsonStr); 	
}			
					

// 修改航点处理函数，使用每个航点的高度
function hangdianhxzx(flightSpeed, lostAction) { // 移除flightHeight参数
    // 验证所有航点高度
    for (const point of points) {
        if (isNaN(point.height) || point.height < 10) {
            alert(`航点 ${points.indexOf(point) + 1} 高度设置无效，请检查！`);
            return;
        }
    }

    // 1. 经纬度转换（保持不变）
    const radianPoints = points.map(point => {
        const rawLng = point.coord.getLng();
        const rawLat = point.coord.getLat();
        
        let gcjLng, gcjLat;
        if (typeof rawLng === 'number' && typeof rawLat === 'number') {
            const transformed = CoordTransform.gcj02towgs84(rawLng, rawLat);
            gcjLng = transformed.lng;
            gcjLat = transformed.lat;
        }
        
        return {
            longitude: gcjLng * Math.PI / 180,
            latitude: gcjLat * Math.PI / 180,
            height: point.height // 传递当前航点高度
        };
    });

    // 2. 构建mission数组（使用每个航点自己的高度）
    const mission = radianPoints.map(radPoint => ({
        "turn_mode": 0,          
        "max_flight_speed": flightSpeed,
        "waypoint_type": 2,       
        "auto_flight_speed": flightSpeed,
        "heading": 0,              
        "damping_distance": 40,      
        "latitude": radPoint.latitude,
        "point_of_interest": {
            "position_x": 0,
            "position_y": 0,
            "position_z": 0
        },
        "config": {
            "use_local_max_vel": 0,
            "use_local_cruise_vel": 0
        },
        "relative_height": radPoint.height, // 使用当前航点的高度
        "heading_mode": 0,
        "longitude": radPoint.longitude
    }));

    // 3. 构建完整JSON数据（其余部分保持不变）
    const jsonData = {
        "datahead": "flight waypoint2 upload mission",
        "data": {
            "action_when_rc_lost": lostAction === "return" ? 1 : 0,//如果收到return数据就是
            "max_flight_speed": flightSpeed,   
            "mission": mission,
            "auto_flight_speed": flightSpeed,
            "miss_total_len": points.length,     
            "action_list": {
                "action_num": 0,
                "actions": []
            },
            "goto_first_waypoint_mode": 0,
            "finished_action": 1,
            "mission_id": missionId,
            "repeat_times": 0
        },
        "datatype": 52,                          
        "dataextratype": 0,
        "imei": "eFzn49GF6iJn0po715+xdw==",
        "dataLen": 0
    };

    // 4. 计算dataLen并发送（保持不变）
    const jsonStr = JSON.stringify(jsonData);
    jsonData.dataLen = jsonStr.length;
    mqtt.publish(MQTTXterminals, jsonStr); 	
    missionId++;
}

function daorukml() {
    confirm('仅支持kml格式')
 // 获取隐藏的文件选择控件
  const fileInput = document.getElementById('fileSelector');
  
  // 重置文件选择器（避免重复选择同一文件时无法触发change事件）
  fileInput.value = '';
  
  // 触发文件选择对话框
  fileInput.click();
  
  // 监听文件选择事件
  fileInput.onchange = function(e) {
    // 获取选择的文件（只取第一个文件）
    const file = e.target.files[0];
    
    if (!file) {
      console.log('未选择文件');
      return;
    }
    
    // 验证文件类型（双重保险，虽然accept已经限制，但仍需前端验证）
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      alert('请选择txt格式的文件！');
      return;
    }
    
    console.log('已选择文件：', file.name);
    
    // 读取文件内容（如果需要处理文件内容，可使用以下代码）
    const reader = new FileReader();
    
    // 读取成功后的回调
    reader.onload = function(event) {
      const fileContent = event.target.result;
      console.log('文件内容：', fileContent);
      // 这里可以添加处理航线数据的逻辑（如解析坐标、展示等）
      alert(`成功读取文件：${file.name}\n文件大小：${file.size}字节`);
	  confirm('暂不支持此文件')
    };
    
    // 读取失败的回调
    reader.onerror = function() {
      alert('文件读取失败，请重试！');
    };
    
    // 以文本格式读取文件
    reader.readAsText(file, 'utf-8');
  };
}

function daochukml() {
    confirm('暂时不支持')
    // 直接根据状态选择数据，同时定义数据（简化结构）

}
