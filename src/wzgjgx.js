function addSingleDeviceMarker(device) {
    if (!window.largeMap || !window.smallMap) return;
    if (window.deviceMarkers.some(m => m.deviceId === device.id)) return;

    const icon = new AMap.Icon({
        size: new AMap.Size(35, 35),
        image: getDeviceIcon(device.id, device.id === currentDeviceId),
        anchor: 'center',
        imageSize: new AMap.Size(35, 35),
    });

    const largeMarker = new AMap.Marker({
        position: device.position,
        map: window.largeMap,
        icon: icon,
        zIndex: device.id === currentDeviceId ? 500 : 400,
        title: device.name
    });

    const smallMarker = new AMap.Marker({
        position: device.position,
        map: window.smallMap,
        icon: icon,
        zIndex: device.id === currentDeviceId ? 500 : 400,
        title: device.name
    });

    largeMarker.on('click', () => switchDevice(device.id));
    smallMarker.on('click', () => switchDevice(device.id));

    // 轨迹线（如果有历史轨迹）
    const pathPoints = devicePaths[device.id] || [];
    let largePathLine = null, smallPathLine = null;
    if (pathPoints.length > 0) {
        const pathColor = getDeviceColor(device.id);
        largePathLine = new AMap.Polyline({
            path: pathPoints,
            strokeColor: pathColor,
            strokeWeight: 2,
            strokeStyle: "dashed",
            strokeDasharray: [5, 3],
            map: window.largeMap
        });
        smallPathLine = new AMap.Polyline({
            path: pathPoints,
            strokeColor: pathColor,
            strokeWeight: 2,
            strokeStyle: "dashed",
            strokeDasharray: [5, 3],
            map: window.smallMap
        });
    }

    window.deviceMarkers.push({
        deviceId: device.id,
        largeMarker: largeMarker,
        smallMarker: smallMarker,
        largePathLine: largePathLine,
        smallPathLine: smallPathLine
    });
}

// 初始化设备标记
function initDeviceMarkers() {
	
	//console.log(`1`);
    // 清除现有标记和轨迹
    if (window.deviceMarkers) {
        window.deviceMarkers.forEach(marker => {
            marker.largeMarker.setMap(null);
            marker.smallMarker.setMap(null);
            
            // 清除轨迹线
            if (marker.largePathLine) marker.largePathLine.setMap(null);
            if (marker.smallPathLine) marker.smallPathLine.setMap(null);
        });
    }
   // console.log(`2`);
    window.deviceMarkers = [];
   // console.log(`3`);
    // 为每个设备创建标记
    devices.forEach(device => {
        const icon = new AMap.Icon({
            size: new AMap.Size(35, 35),
            image: getDeviceIcon(device.id, device.id === currentDeviceId),
            imageOffset: new AMap.Pixel(0, 0),
            anchor: 'center',
            imageSize: new AMap.Size(35, 35),
        });
        
        // 大地图标记
        const largeMarker = new AMap.Marker({
            position: device.position,
            map: window.largeMap,
            icon: icon,
            zIndex: device.id === currentDeviceId ? 500 : 400,
            title: device.name
        });
        
        // 小地图标记
        const smallMarker = new AMap.Marker({
            position: device.position,
            map: window.smallMap,
            icon: icon,
            zIndex: device.id === currentDeviceId ? 500 : 400,
            title: device.name
        });
       // console.log(`4`);
      // 创建轨迹线（修改部分）
const pathColor = getDeviceColor(device.id);
// 验证路径数据是否有效
const validPath = Array.isArray(devicePaths[device.id]) ? 
  devicePaths[device.id].filter(point => 
    Array.isArray(point) && point.length === 2 && 
    typeof point[0] === 'number' && typeof point[1] === 'number'
  ) : [];

// 新增：仅当路径有有效点时才创建轨迹线
let largePathLine = null;
let smallPathLine = null;
if (validPath.length > 0) {  // 至少需要一个点（避免空路径）
  largePathLine = new AMap.Polyline({
    path: validPath,
    strokeColor: pathColor,
    strokeWeight: 2,
    strokeStyle: "dashed",
    strokeDasharray: [5, 3],
    map: window.largeMap || null
  });

  smallPathLine = new AMap.Polyline({
    path: validPath,
    strokeColor: pathColor,
    strokeWeight: 2,
    strokeStyle: "dashed",
    strokeDasharray: [5, 3],
    map: window.smallMap || null
  });
}
       //  console.log(`6`);
        // 添加点击事件
        largeMarker.on('click', () => switchDevice(device.id));
        smallMarker.on('click', () => switchDevice(device.id));
        
        window.deviceMarkers.push({
            deviceId: device.id,
            largeMarker: largeMarker,
            smallMarker: smallMarker,
            largePathLine: largePathLine,
            smallPathLine: smallPathLine
        });
    });
}

// 高亮当前设备标记
function highlightCurrentDeviceMarker() {
    if (!window.deviceMarkers) return;
    
    window.deviceMarkers.forEach(marker => {
        const isCurrent = marker.deviceId === currentDeviceId;
        const icon = new AMap.Icon({
            size: new AMap.Size(35, 35),
            image: getDeviceIcon(marker.deviceId, isCurrent),
            imageOffset: new AMap.Pixel(0, 0),
            anchor: 'center',
            imageSize: new AMap.Size(35, 35),
        });
        
        marker.largeMarker.setIcon(icon);
        marker.smallMarker.setIcon(icon);
        
        // 修正：使用 setOptions 方法设置 zIndex
        marker.largeMarker.setOptions({ zIndex: isCurrent ? 500 : 400 });
        marker.smallMarker.setOptions({ zIndex: isCurrent ? 500 : 400 });
    });
}

// 优化设备位置和轨迹更新函数
function updateDevicePosition(deviceId, lon, lat) {
    // 确保参数有效
    if (typeof lon !== 'number' || typeof lat !== 'number') {
        console.error('无效的经纬度数据:', lon, lat);
        return;
    }
    
    const device = devices.find(d => d.id === deviceId);
    if (device) {
        // 更新设备位置
        device.position = [lon, lat];
        device.online = true;
        
        // 更新轨迹
        if (!devicePaths[deviceId]) {
            devicePaths[deviceId] = [];
        }
        
        // 添加新的轨迹点
        devicePaths[deviceId].push([lon, lat]);
        
        // 限制轨迹点数量
        if (devicePaths[deviceId].length > MAX_PATH_POINTS) {
            devicePaths[deviceId].shift(); // 移除最旧的点
        }
        
        // 确保地图标记已初始化
        if (window.deviceMarkers) {
            // 找到对应的标记
            const markerInfo = window.deviceMarkers.find(m => m.deviceId === deviceId);
            if (markerInfo) {
                // 更新标记位置
                markerInfo.largeMarker.setPosition([lon, lat]);
                markerInfo.smallMarker.setPosition([lon, lat]);
                
                // 更新轨迹线
                markerInfo.largePathLine.setPath(devicePaths[deviceId]);
                markerInfo.smallPathLine.setPath(devicePaths[deviceId]);
            } else {
                console.warn(`未找到设备${deviceId}的标记信息，重新初始化标记`);
                // 如果未找到标记，重新初始化所有标记
                initDeviceMarkers();
            }
        }
    // 如果是当前设备，更新显示，添加地图初始化检查    
 if (deviceId === currentDeviceId && window.largeMap && window.smallMap) {
            // 先更新坐标变量
            window.initialLon = lon;
            window.initialLat = lat;
            // 再更新标记位置
           // updateMarkerPosition();
        }
        
        // 更新设备列表显示
        renderDeviceList();
    } else {
        console.warn(`设备${deviceId}不存在于设备列表中`);
    }
}

//添加绘制航迹线的函数
function drawFlightPath() {
    // 至少需要两个点才能绘制线段
    if (flightPath.length < 2) return;

    // 定义航迹线样式：灰色虚线
    const pathStyle = {
        strokeColor: "#999", // 灰色
        strokeWeight: 2,
        strokeStyle: "dashed", // 虚线
        strokeDasharray: [10, 5], // 虚线样式
        zIndex: 350 // 确保在标记下方
    };

    // 更新或创建大地图航迹线
    if (pathLineLarge) {
        pathLineLarge.setPath(flightPath);
    } else {
        pathLineLarge = new AMap.Polyline({
            path: flightPath,
            ...pathStyle,
            map: window.largeMap
        });
    }

    // 更新或创建小地图航迹线
    if (pathLineSmall) {
        pathLineSmall.setPath(flightPath);
    } else {
        pathLineSmall = new AMap.Polyline({
            path: flightPath,
            ...pathStyle,
            map: window.smallMap
        });
    }
}