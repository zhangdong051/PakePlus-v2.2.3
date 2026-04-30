/**
 * ESP32 + 合宙DTU + RS485传感器（自动流向控制模块）
 * 
 * 功能：
 * 1. 定时读取传感器（O2, CO, H2S, CH4）
 * 2. 打包为JSON通过串口1（合宙DTU）上传MQTT
 * 3. 接收下行JSON并打印到调试串口（可扩展控制）
 */

#include <ModbusMaster.h>
#include <ArduinoJson.h>

// ==================== 引脚定义 ====================
#define RXD2 16           // UART2 RX (接485模块 TX)
#define TXD2 17           // UART2 TX (接485模块 RX)
#define DTU_RX 18         // UART1 RX (接合宙DTU TX)
#define DTU_TX 19         // UART1 TX (接合宙DTU RX)

// ==================== 全局对象 ====================
ModbusMaster sensor;      // Modbus 主站对象（从机地址1）
unsigned long lastRead = 0;
const unsigned long READ_INTERVAL = 5000;   // 5秒读一次

String downlinkBuffer = "";                 // 下行JSON缓冲区

// ==================== 初始化 ====================
void setup() {
  // 调试串口（USB）
  Serial.begin(115200);
  
  // 串口1：与合宙DTU通信（9600,8N1）
  Serial1.begin(9600, SERIAL_8N1, DTU_RX, DTU_TX);
  Serial1.setTimeout(10);
  
  // 串口2：与485模块通信（9600,8N1）
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  
  // Modbus 初始化（从机地址 = 1，使用 Serial2）
  // 注意：自动流向控制模块不需要 preTransmission/postTransmission
  sensor.begin(1, Serial2);
  
  Serial.println("ESP32 started. Waiting for sensor data...");
}

// ==================== 主循环 ====================
void loop() {
  // 定时读取传感器
  if (millis() - lastRead >= READ_INTERVAL) {
    lastRead = millis();
    readSensorsAndPublish();
  }
  
  // 处理来自DTU的下行JSON（以换行符分隔）
  while (Serial1.available()) {
    char c = Serial1.read();
    if (c == '\n') {
      if (downlinkBuffer.length() > 0) {
        processDownlink(downlinkBuffer);
        downlinkBuffer = "";
      }
    } else {
      downlinkBuffer += c;
    }
  }
}

// ==================== 读取传感器并上传 ====================
void readSensorsAndPublish() {
  // 读取10个保持寄存器（地址 0x0000 开始）
  uint8_t result = sensor.readHoldingRegisters(0x00, 10);
  
  if (result == sensor.ku8MBSuccess) {
    // 获取寄存器值（索引0~9）
    uint16_t reg2 = sensor.getResponseBuffer(2);   // O2
    uint16_t reg4 = sensor.getResponseBuffer(4);   // CO
    uint16_t reg6 = sensor.getResponseBuffer(6);   // H2S
    uint16_t reg8 = sensor.getResponseBuffer(8);   // CH4
    
    // 根据文档转换为实际物理值
    float o2  = reg2 / 100.0;   // 两位小数
    float co  = reg4;           // 无小数点
    float h2s = reg6 / 10.0;    // 一位小数
    float ch4 = reg8 / 10.0;    // 一位小数
    
    // 构建JSON
    StaticJsonDocument<200> doc;
    doc["O2"]  = o2;
    doc["CO"]  = co;
    doc["H2S"] = h2s;
    doc["CH4"] = ch4;
    doc["ts"]  = millis();       // 可选时间戳
    
    char jsonBuffer[200];
    size_t len = serializeJson(doc, jsonBuffer);
    
    // 通过串口1发送给合宙DTU（加换行符）
    Serial1.println(jsonBuffer);
    
    // 调试打印
    Serial.print("Upload: ");
    Serial.println(jsonBuffer);
  } else {
    // 读取失败，发送错误JSON
    StaticJsonDocument<100> errDoc;
    errDoc["error"] = "modbus_fail";
    errDoc["code"]  = result;
    char errBuf[100];
    serializeJson(errDoc, errBuf);
    Serial1.println(errBuf);
    Serial.print("Modbus error: ");
    Serial.println(result);
  }
}

// ==================== 处理下行JSON ====================
void processDownlink(const String& jsonStr) {
  // 打印到调试串口
  Serial.print("Downlink: ");
  Serial.println(jsonStr);
  
  // 解析JSON
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, jsonStr);
  
  if (err) {
    Serial.print("JSON parse failed: ");
    Serial.println(err.c_str());
    return;
  }
  
  // ========== 示例：控制LED（可根据需要扩展） ==========
  if (doc.containsKey("led")) {
    int state = doc["led"];   // 0或1
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, state);
    Serial.print("LED set to ");
    Serial.println(state);
  }
  
  // 在这里添加更多下行逻辑，例如：
  // - 修改传感器采集间隔（需要配合动态调整 READ_INTERVAL）
  // - 控制继电器
  // - 查询实时数据等
}