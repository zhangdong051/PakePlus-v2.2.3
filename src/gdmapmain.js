         // 初始化地图 - 创建两个地图实例，保持同步
        function initMaps() {
            // 大地图
            window.largeMap = new AMap.Map("map-container", {
                zoom: windowState.map.zoom,
                center: windowState.map.center,
                resizeEnable: true,
                rotateEnable: true,//是否开启地图旋转交互 鼠标右键 + 鼠标画圈移动 或 键盘Ctrl + 鼠标画圈移动
                pitchEnable: true,
                pitch: 0,
                rotation: 0,
                viewMode: '2D',//开启3D视图,默认为关闭
                zooms: [2, 20],
                terrain: true// 开启地形图
				
				
            });
            
            // 小地图
            window.smallMap = new AMap.Map("small-map-container", {
                zoom: windowState.map.zoom,
                center: windowState.map.center,
                resizeEnable: true,
                rotateEnable: false,
                pitchEnable: false,
                viewMode: '2D',
                zooms: [2, 20]
            });
            
            // 为两个地图添加相同的控件和设置
            setupMap(window.largeMap);
            setupMap(window.smallMap);
            
            // 监听大地图事件，同步到小地图
            window.largeMap.on('zoomend', function() {
                if (document.body.classList.contains('show-map-large')) {
                    window.smallMap.setZoom(window.largeMap.getZoom());
                }
            });
            
            window.largeMap.on('moveend', function() {
                if (document.body.classList.contains('show-map-large')) {
                    window.smallMap.setCenter(window.largeMap.getCenter());
                }
            });
            
        }


	 // 地图设置 - 已移除罗盘和缩放控件
 function setupMap(map) {
            // 仅保留比例尺控件
            AMap.plugin(["AMap.Scale"], function() {
                map.addControl(new AMap.Scale());
            });

// 修改setupMap函数中的图层切换控件部分
AMapUI.loadUI(['control/BasicControl'], function(BasicControl) {
    var layerCtrl = new BasicControl.LayerSwitcher({
        theme: 'common',
        position: 'tr'
    });
    map.addControl(layerCtrl);

    // 监听图层切换事件，同步到另一张地图
    layerCtrl.on('change', function() {
        const otherMap = map === window.largeMap ? window.smallMap : window.largeMap;
        if (otherMap) {
            // 同步图层状态（这里简化处理，实际需根据具体图层类型同步）
            otherMap.setLayers(map.getLayers());
            otherMap.resize();
        }
    });
});
			 
            
// 地图点击事件
// 地图点击事件
map.on('click', function(e) {
    const lngLatInput = document.getElementById("lngLatInfo");
    const mapContainer = document.getElementById('map-container');
    if (mapContainer && e.originalEvent && !mapContainer.contains(e.originalEvent.target)) {
        return;
    }
    if (lngLatInput) {
        lngLatInput.value = e.lnglat.getLng() + ',' + e.lnglat.getLat();
    }
    console.log(e.lnglat.getLng() + ',' + e.lnglat.getLat());
    // 新增：同步小地图状态并刷新
    if (window.smallMap) {
        // 同步中心位置
        window.smallMap.setCenter(e.lnglat);
        // 强制刷新地图尺寸和图层
        window.smallMap.resize();
        // 触发重绘（通过微小调整zoom实现）
        const currentZoom = window.smallMap.getZoom();
        window.smallMap.setZoom(currentZoom + 0.0002);
        window.smallMap.setZoom(currentZoom);
    }
});

 } 
 
 
 
