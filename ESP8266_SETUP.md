# ESP8266 NFC Attendance System — Setup Guide

## Hardware Requirements

- **ESP8266** (NodeMCU 1.0 / ESP-12E Module)
- **PN532 NFC Reader** (configured for I2C mode)
- **16x2 LCD Display** with I2C backpack (address 0x3F)
- **USB Cable** (Micro USB for programming)
- **I2C Buzzer** or regular buzzer on GPIO pin (D0)

## Wiring Diagram

```
ESP8266 Pins:
├─ D0 (GPIO16) → Buzzer (+)
├─ D1 (GPIO5)  → I2C SCL (LCD + PN532)
├─ D2 (GPIO4)  → I2C SDA (LCD + PN532)
├─ GND        → Buzzer (-), LCD GND, PN532 GND
└─ 5V or 3.3V → LCD VCC, PN532 VCC

LCD I2C Backpack (0x3F):
├─ VCC → 5V
├─ GND → GND
├─ SCL → D1
└─ SDA → D2

PN532 NFC Reader (I2C mode):
├─ VCC → 5V
├─ GND → GND
├─ SCL → D1
└─ SDA → D2
```

**Important:** All devices share the **same I2C bus** (D1=SCL, D2=SDA).

## Software Setup

### 1. Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install on your computer

### 2. Add ESP8266 Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Boards Manager URLs", add:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Click **OK**
5. Go to **Tools → Board → Boards Manager**
6. Search for "ESP8266"
7. Install **"esp8266 by ESP8266 Community"**

### 3. Install Required Libraries
1. Go to **Sketch → Include Library → Manage Libraries**
2. Install each library (search and install):
   - **Adafruit PN532** (by Adafruit)
   - **LiquidCrystal I2C** (by Frank de Brabander)

### 4. Configure Firmware

**Important:** Edit these settings before uploading:

#### WiFi Settings
In the firmware, find:
```cpp
const char* ssid      = "MARVEL";           // ← Change to your WiFi name
const char* password  = "123456789";        // ← Change to your WiFi password
```

#### Supabase Credentials
Get these from your Supabase project:

1. Go to https://supabase.com and log in
2. Select your project
3. Click **Project Settings** (gear icon)
4. Go to **API** tab
5. Copy **Project URL** and **Service Role key** (or anon key)

Update the firmware:
```cpp
const char* SUPABASE_URL      = "https://lbqlntagejtdifyxvukk.supabase.co";  // ← Paste URL
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";   // ← Paste anon key
```

### 5. Select Board and Port

1. **Board Selection:**
   - Go to **Tools → Board → ESP8266 Boards**
   - Select **NodeMCU 1.0 (ESP-12E Module)**

2. **Port Selection:**
   - Go to **Tools → Port**
   - Select your USB port:
     - **Linux:** `/dev/ttyUSB0` or `/dev/ttyUSB1`
     - **Mac:** `/dev/cu.usbserial-*`
     - **Windows:** `COM3` or `COM4`

3. **Speed (optional but recommended):**
   - Go to **Tools → Upload Speed**
   - Select **115200**

### 6. Upload Firmware

1. Connect ESP8266 to your computer via USB cable
2. In Arduino IDE, click the **Upload** button (→ arrow icon)
3. Wait for the upload to complete

**Expected output:**
```
Uploading...
........ [████████████████████] 100%
Upload complete!
```

### 7. Monitor Serial Output

1. Click **Tools → Serial Monitor** (or Ctrl+Shift+M)
2. Set baud rate to **9600** (bottom right)
3. Press the **RESET** button on the ESP8266
4. You should see:
   ```
   === BOOT ===
   LCD OK
   Connecting WiFi...
   WiFi OK: 192.168.1.100
   PN532 found, firmware v1
   System ready
   ```

## Testing

### Test 1: Check Serial Output
1. Open Serial Monitor (Tools → Serial Monitor, 9600 baud)
2. You should see "System ready" and "Ready! Scan Your Card"

### Test 2: Scan an Unregistered Card
1. Tap an NFC card on the reader
2. **Expected behavior:**
   - LCD shows: "Card Detected! [UID]"
   - Buzzer does **double-beep** (unregistered)
   - LCD shows: "New Card! Go to web app"
   - Serial Monitor shows:
     ```
     Card UID: 7A810E06
     Card not registered: 7A810E06
       → Visit /add-card on web app to register
     ```

### Test 3: Register the Card
1. Open your web app (e.g., `http://localhost:3000/add-card`)
2. Tap the same card on your computer's NFC reader (if available) or click "Check Card"
3. Click "Check Card" with the UID from Step 2
4. You'll be redirected to `/register?uid=7A810E06`
5. Fill in student details and submit

### Test 4: Scan the Registered Card
1. Go back to the ESP8266
2. Tap the card again
3. **Expected behavior:**
   - LCD shows: "Card Detected! [UID]"
   - Buzzer does **single-beep** (registered)
   - LCD shows: "Welcome! [Student Name]"
   - Serial Monitor shows:
     ```
     Card UID: 7A810E06
     ✓ Attendance logged for: Abebe Kebede
     ```

## Troubleshooting

### "PN532 not found"
- Check I2C jumper on PN532 (should be in I2C mode, not SPI)
- Check wiring (D1=SCL, D2=SDA)
- Check both devices are on the same I2C bus

### "WiFi Failed"
- Check SSID and password are correct
- Make sure WiFi is 2.4GHz (some ESP8266 don't support 5GHz)
- Check router is broadcasting SSID

### "Card Detected" but "Send Failed"
- Check Supabase URL and key are correct
- Verify WiFi is connected (should see IP in boot message)
- Check the student record exists in Supabase

### Serial Monitor shows nothing
- Check baud rate is set to **9600**
- Try pressing RESET button on ESP8266
- Make sure USB cable is a data cable (not just power)

## Firmware Features

✓ Scans NFC cards and reads UID  
✓ Looks up student in Supabase database  
✓ Logs attendance with timestamp  
✓ Shows student name on LCD  
✓ Audio feedback (single/double beep)  
✓ Handles network errors gracefully  
✓ Automatically detects unregistered cards  

## How It Works

```
1. Tap card on reader
        ↓
2. ESP8266 reads UID (e.g., "7A810E06")
        ↓
3. ESP8266 sends GET request to Supabase:
   GET /rest/v1/students?uid=eq.7A810E06
        ↓
   ┌─────────────────────────────────┐
   │ Is card registered in database? │
   └─────────────────────────────────┘
        ├─ NO → Double-beep, "New Card"
        │       User registers via web app
        │
        └─ YES → Single-beep, "Welcome!"
                 Send POST to log_attendance()
                 Attendance recorded
```

---

**Questions?** Check the Supabase docs: https://supabase.com/docs
