/**
 * 处理MQTT接收的数据并提取所需字段
 * @param {Object} jsonData - 解析后的JSON数据对象
 * @returns {Object|null} 提取的数据对象或null（处理失败时）
 */
function parseD10Data(jsonData) {
  try {
    // 宽松校验：若缺少data字段，返回默认值而非抛出错误
    if (!jsonData || !jsonData.data) {
      console.warn("数据结构不完整（缺少data字段），使用默认值");
      return {
        gps_longitude: 0,
        gps_latitude: 0,
        gps_altitude: 0,
        gps_fix_state: "未知",
        acc_w: 0,
        acc_x: 0,
        acc_y: 0,
        acc_z: 0,
        sudu_x: 0,
        battery_bfb: 0,
        mobile_date: "20251010",
        mobile_time: "101010",
        mobile_mccmnc: "未知",
        mobile_network: "未知",
        mobile_freqband: "未知",
        mobile_pcellid: "未知",
        mobile_rsrp: "未知",
        mobile_snr: "未知",
        mobile_uplink: "未知",
        mobile_downlink: "未知"
      };
    }

    // 原有解析逻辑...
    const data = jsonData.data;
    let rawLng = data.gps_position?.longitude;
    rawLng = rawLng / 10000000;
    let rawLat = data.gps_position?.latitude;
    rawLat = rawLat / 10000000;

    let gcjLng = "114.388185";
    let gcjLat = "36.148881";
    if (typeof rawLng === 'number' && typeof rawLat === 'number') {
      const transformed = CoordTransform.wgs84togcj02(rawLng, rawLat);
      gcjLng = transformed.lng;
      gcjLat = transformed.lat;
    }

    return {
      gps_longitude: gcjLng,
      gps_latitude: gcjLat,
      gps_altitude: data.gps_position?.altitude ?? "未知",
      gps_fix_state: data.gps_details?.total_satellite_number_used ?? "未知",
      acc_w: data.quaternion?.q0 ?? 0,
      acc_x: data.quaternion?.q1 ?? 0,
      acc_y: data.quaternion?.q2 ?? 0,
      acc_z: data.quaternion?.q3 ?? 0,
      sudu_x: data.velocity?.data?.x ?? 0,
      battery_bfb: data.single_battery_info_index_first?.battery_capacity_percent ?? 0,
      mobile_date: data.gps_date ?? "未知",
      mobile_time: data.gps_time ?? "未知",
      mobile_mccmnc: data.mobile_info?.mccmnc ?? "未知",
      mobile_network: data.mobile_info?.network ?? "未知",
      mobile_freqband: data.mobile_info?.freqband ?? "未知",
      mobile_pcellid: data.mobile_info?.pcellid ?? "未知",
      mobile_rsrp: data.mobile_info?.rsrp ?? "未知",
      mobile_snr: data.mobile_info?.snr ?? "未知",
      mobile_uplink: data.mobile_info?.uplink_bandwidth ?? "未知",
      mobile_downlink: data.mobile_info?.downlink_bandwidth ?? "未知"
    };
  } catch (error) {
    console.error("数据提取失败：", error.message);
    return null; // 出错时返回null，避免后续处理异常
  }
}
/**
 * 组合mobile_date和mobile_time为标准日期时间格式
 * @param {string|number} mobileDate - 日期（格式：YYYYMMDD，如20251211）
 * @param {string|number} mobileTime - 时间（格式：HHMMSS的简写，如33638对应113638）
 * @returns {string} 格式化后的日期时间（如2025-12-11 11:36:38）
 */
function combineDateTime(mobileDate, mobileTime) {
    // 处理日期部分
    if (!mobileDate || String(mobileDate).length !== 8) {
        return "日期格式错误";
    }
    const dateStr = String(mobileDate);
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const formattedDate = `${year}-${month}-${day}`;

    // 1. 精准空值判断
    if (mobileTime === undefined || mobileTime === null || mobileTime === '') {
        return "时间格式错误";
    }
    // 2. 转为字符串并去除首尾空格
    let timeStr = String(mobileTime).trim();

    // 4. 处理时间长度
    if (timeStr.length > 6) {
        return "时间格式错误";
    }
    timeStr = timeStr.padStart(6, '0');

    // 兜底校验
    if (timeStr.length !== 6) {
        return "时间格式错误";
    }

    // 处理小时部分：UTC转北京时间（+8小时）
    let hour = parseInt(timeStr.slice(0, 2), 10); // 转为数字
    hour = (hour + 8) % 24; // +8小时并处理跨天（如23+8=31 → 31%24=7）
    hour = hour.toString().padStart(2, '0'); // 补0保持两位格式

    const minute = timeStr.slice(2, 4);
    const second = timeStr.slice(4, 6);
    const formattedTime = `${hour}:${minute}:${second}`;

    return `${formattedDate} ${formattedTime}`;
}


/**
 * 人员的数据解析
 * @param {Object} jsonData - MQTT原始数据
 * @returns {Object} 标准化解析结果
 */
//{"gps":{"lat":34.762799014519885,"lng":113.7452637555122,"battery":100,"timestamp":1764841586238}}
function parseSbData(jsonData) {
    const gpsInfo = jsonData.gps || {};
    // 提取GPS经纬度（原始数据格式已符合显示需求，无需额外转换）
    const lng = gpsInfo.lng || 0;
    const lat = gpsInfo.lat || 0;
	const battery = gpsInfo.battery || 0;
    // 提取时间戳作为移动时间
    const timestamp = gpsInfo.timestamp || "？";
	const testTimestamp = timestampToDateTime(timestamp); //转换为标准时间
    
    // 返回包含updateDataDisplay所需所有字段的对象，缺失字段用默认值填充
    return {
        gps_longitude: lng,
        gps_latitude: lat,
        gps_altitude: 0, // 人员数据无海拔信息
        gps_fix_state: "？", // 人员数据无卫星数量信息
        acc_w: 0, // 四元数默认值，避免计算错误
        acc_x: 0,
        acc_y: 0,
        acc_z: 0,
        sudu_x: 0, // 速度默认值，避免toFixed报错
        battery_bfb: battery, // 人员数据无电池信息
        mobile_time: testTimestamp, // 使用GPS时间戳
        mobile_mccmnc: "？",
        mobile_network: "？",
        mobile_freqband: "？",
        mobile_pcellid: "？",
        mobile_rsrp: "？",
        mobile_snr: "？"
    };

}

/**
 * 宇树（b2）型号设备的数据解析
 * @param {Object} jsonData - MQTT原始数据
 * @returns {Object} 标准化解析结果
 */
function parseB2Data(jsonData) {
    const info = jsonData.info || {};
    // 宇树设备特有解析逻辑
    return {
        gps_longitude: info.pos?.lon || 0,
        gps_latitude: info.pos?.lat || 0,
        gps_altitude: info.height || 0,
        battery_bfb: info.batt_level || 0,
        // 其他b2特有字段...
    };
}

/**
 * 更新页面上的数据显示
 * @param {Object} data - 要显示的数据对象
 */
 /****公网更新逻辑
function updateDataDisplay(data) {
    if (!data) return;
 // 新增：处理日期时间组合
    const combinedDateTime = combineDateTime(data.mobile_date, data.mobile_time);
    // 更新各个数据字段的显示
			document.getElementById('lon-data').textContent = '📌' +  data.gps_longitude.toFixed(5);
			document.getElementById('lat-data').textContent = '📌' + data.gps_latitude.toFixed(5);
			document.getElementById('alt-data').textContent =  Math.round((data.gps_altitude/ 1000));
			document.getElementById('gps-data').textContent = '📡' + data.gps_fix_state;
			document.getElementById('mobtim-data').textContent = '🕒' + combinedDateTime;
			document.getElementById('mobmcc-data').textContent = 'ℹ️' + data.mobile_mccmnc;
			document.getElementById('mobnet-data').textContent = '🌏' + data.mobile_network;
			document.getElementById('mobbnd-data').textContent = '🖱️' + data.mobile_freqband;
			document.getElementById('mobpci-data').textContent = '🌐' + data.mobile_pcellid;
			document.getElementById('mobrsp-data').textContent = '📶' + data.mobile_rsrp;
			document.getElementById('mobsnr-data').textContent = '❌' + data.mobile_snr;
						document.getElementById('uplink-data').textContent = '🔼' + data.mobile_uplink+"k";
						document.getElementById('downlink-data').textContent = '🔽' + data.mobile_downlink+"k";
	        document.getElementById('batt-data').textContent = '🔋' + data.battery_bfb;
		    document.getElementById('speed-data').textContent = data.sudu_x.toFixed(2);//速度显示

            const q0 = data.acc_w;
            const q1 = data.acc_x;
            const q2 = data.acc_y;
            const q3 = data.acc_z;
	
// 四元数转横滚角（Roll）
			hudpitch = Math.asin(-2 * q1 * q3 + 2 * q0 * q2) * 57.3;
			hudroll  = - Math.atan2(2 * q2 * q3 + 2 * q0 * q1, -2 * q1 * q1 - 2 * q2 * q2 + 1) * 57.3;
			//console.log("pitch：", hudpitch);
	        linehud();
}	
****/
//自组网链路更新逻辑
function updateDataDisplay(data) {
    if (!data) return;
 // 新增：处理日期时间组合
    const combinedDateTime = combineDateTime(data.mobile_date, data.mobile_time);
    // 更新各个数据字段的显示
			document.getElementById('lon-data').textContent = '📌' +  data.gps_longitude.toFixed(5);
			document.getElementById('lat-data').textContent = '📌' + data.gps_latitude.toFixed(5);
			document.getElementById('alt-data').textContent =  Math.round((data.gps_altitude/ 1000));
			document.getElementById('gps-data').textContent = '📡' + data.gps_fix_state;
			document.getElementById('mobtim-data').textContent = '🕒' + combinedDateTime;
	        document.getElementById('batt-data').textContent = '🔋' + data.battery_bfb;
		    document.getElementById('speed-data').textContent = data.sudu_x.toFixed(2);//速度显示

            const q0 = data.acc_w;
            const q1 = data.acc_x;
            const q2 = data.acc_y;
            const q3 = data.acc_z;
	
// 四元数转横滚角（Roll）
			hudpitch = Math.asin(-2 * q1 * q3 + 2 * q0 * q2) * 57.3;
			hudroll  = - Math.atan2(2 * q2 * q3 + 2 * q0 * q1, -2 * q1 * q1 - 2 * q2 * q2 + 1) * 57.3;
			//console.log("pitch：", hudpitch);
	        linehud();
			//计划/terminal/dmz/data主题获取数据freq，neighborNodes（snr1，snr2，rssi1，rssi2，distance）替换以下数据

			
			
}
//解析激光测距数据
async function processcallback(message) {
  try {
    // 打印原始数据，方便排查格式问题
    const rawStr = message.toString();
 //   console.log('接收到原始数据:', rawStr);

    // 解析JSON数据
    const jsonData = JSON.parse(rawStr);
    
    // 提取激光雷达相关信息
    const dataHead = jsonData.datahead || "未知数据头";
    const laserInfo = jsonData.data?.laser_ranging_info || {};
    const longitude = laserInfo.longitude || "未知";
    const latitude = laserInfo.latitude || "未知";
    const distance = laserInfo.distance || "未知";
    const altitude = laserInfo.altitude || "未知";
    
    // 组合显示信息
    const displayText =  '⭕'+`🌏${longitude.toFixed(3)}🌏 ${latitude.toFixed(3)}🟡${altitude/10}🟢${distance}m`;
    
    // 更新显示（如果元素存在）
    const jiguangElement = document.getElementById('jiguang-data');
    if (jiguangElement) {
      jiguangElement.textContent = displayText;
    } else {
      console.warn("未找到jiguang-data元素，无法更新显示");
    }

  } catch (error) {
   // console.error('解析数据失败:', error, '原始消息:', message.toString());
  }
}
// 5. 解析DMZ数据（重点处理数组格式）
async function processDmzMessage(message) {
  try {
    // 打印原始数据，方便排查格式问题
    const rawStr = message.toString();
   // console.log('接收到dmz原始数据:', rawStr);

    const jsonData = JSON.parse(rawStr);
    // 核心修复：判断数据是数组还是单个对象
    const deviceList = Array.isArray(jsonData) ? jsonData : [jsonData];

    // 遍历所有设备数据
    deviceList.forEach(deviceData => {
      handleSingleDeviceData(deviceData);
    });

  } catch (error) {
    console.error('解析dmz数据失败:', error, '原始消息:', message.toString());
  }
}

// 新增dmz数据处理函数
// 修改datarecver.js中的handleSingleDeviceData函数
function handleSingleDeviceData(deviceData) {
  // ① 检查d10SN字段是否存在
  if (!deviceData.d10SN) {
    console.warn('单条dmz数据无d10SN字段:', deviceData);
    return;
  }

  // ② 检查当前设备是否为注册设备（从全局devices列表中匹配）
  // 注：devices是多设备2.0公网.html中存储注册设备的全局数组
  const isRegisteredDevice = devices.some(device => device.id === deviceData.d10SN);
  if (!isRegisteredDevice) {
    //console.log(`设备${deviceData.d10SN}未注册，跳过数据更新`);
    return;
  }

  // ③ 提取核心数据（增加容错，避免字段缺失报错）
  const freq = deviceData.freq ?? '未知';
  const neighborNodes = deviceData.neighborNodes || [];

  // ④ 遍历邻居节点（支持多个邻居节点）
  neighborNodes.forEach((node, index) => {
    const snr1 = node.snr1 ?? '未知';
    const snr2 = node.snr2 ?? '未知';
    const rssi1 = node.rssi1 ?? '未知';
    const rssi2 = node.rssi2 ?? '未知';
    const speed = node.speed ?? '未知';
    const distance = node.distance ?? '未知';

   /*
    console.log(`===== 注册设备(${deviceData.d10SN}) 第${index+1}个邻居节点数据 =====`);
    console.log('频率(freq):', freq);
    console.log('snr1:', snr1, 'snr2:', snr2);
    console.log('rssi1:', rssi1, 'rssi2:', rssi2);
    console.log('距离(distance):', distance);
    console.log('==========================================');
*/
    updateDeviceDataToUI(freq, snr1, snr2, rssi1, rssi2, speed, distance);
  });
}

// 7. （可选）更新数据到前端界面
function updateDeviceDataToUI(freq, snr1, snr2, rssi1, rssi2, speed, distance) {
  // 替换为你的DOM元素ID
 
        document.getElementById('mobmcc-data').textContent = `📢${freq}`;

        document.getElementById('mobnet-data').textContent = `ℹ️${snr1}`;

        document.getElementById('mobbnd-data').textContent = `ℹ️${snr2}`;

        document.getElementById('mobpci-data').textContent = `📶${rssi1}`;

        document.getElementById('mobrsp-data').textContent = `📶${rssi2}`;

        document.getElementById('mobsnr-data').textContent = `📈${distance}`;
		
		document.getElementById('uplink-data').textContent = `🔼${speed}`;

    
}



/**
 * 时间戳转日期时间（格式：YYYY-M-D H:m:s）
 * @param {number|string} timestamp - 时间戳（毫秒/秒）
 * @returns {string} 格式化后的日期时间 | 错误提示
 */
function timestampToDateTime(timestamp) {
  // 1. 校验并转换为数字类型
  const ts = Number(timestamp);
  if (isNaN(ts)) {
    return "无效的时间戳（请传入数字类型）";
  }

  // 2. 处理秒级时间戳（10位）→ 转为毫秒级（13位）
  const finalTs = ts.toString().length === 10 ? ts * 1000 : ts;

  // 3. 创建 Date 对象
  const date = new Date(finalTs);
  // 兼容无效时间戳（如：new Date(0) 是 1970-01-01）
  if (date.toString() === "Invalid Date") {
    return "时间戳超出有效范围";
  }

  // 4. 获取年、月、日、时、分、秒（月份从0开始，需+1）
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate(); // 1-31
  const hour = date.getHours(); // 0-23
  const minute = date.getMinutes(); // 0-59
  const second = date.getSeconds(); // 0-59

  // 5. 拼接成指定格式
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 在 datarecver.js 中添加（建议放在所有解析函数之后）
const modelParsers = {
  "d10": parseD10Data,       // D10型号设备使用parseD10Data解析
  "e20": parseD10Data,       // 假设E20与D10数据格式相同，若不同需新增parseE20Data
  "b2": parseB2Data,         // 宇树B2型号使用parseB2Data解析
  "sb": parseSbData,         // 人员设备使用parseSbData解析
  "lite3": parseDefaultData  // 云深处lite3，若没有专用解析函数则用默认解析
};

// 新增默认解析函数（处理未定义型号或格式异常的数据）
function parseDefaultData(jsonData) {
  console.warn("使用默认解析函数处理数据");
  return {
    gps_longitude: 0,
    gps_latitude: 0,
    gps_altitude: 0,
    battery_bfb: 0,
    // 其他必要字段的默认值...
  };
}

//hud互动开始

	function linehud(){
		const line = document.getElementById('line');
		const circle1 = document.getElementById('circle1');
	   let lineTop = hudpitch+50; // 俯仰
	   let lineRotation = hudroll; //横滚 
		line.style.top = `${lineTop}%`;
		line.style.transform = `rotate(${lineRotation}deg)`;
	   }

   //hud互动结束