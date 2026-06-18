// ╔══════════════════════════════════════════════════════════════════╗
// ║          NFC ATTENDANCE SYSTEM — ESP8266 FIRMWARE                ║
// ║                                                                  ║
// ║  SETUP INSTRUCTIONS:                                             ║
// ║  ─────────────────────                                          ║
// ║  1. Update WiFi SSID and password below                         ║
// ║  2. Copy Supabase Project URL from your dashboard               ║
// ║  3. Copy Supabase anon key from Project Settings → API          ║
// ║  4. Update both values below (marked with YOUR_...)             ║
// ║  5. Connect ESP8266 to computer via USB                         ║
// ║  6. Select Board: "NodeMCU 1.0 (ESP-12E Module)"                ║
// ║  7. Select Port: /dev/ttyUSB0 or COM3 (your device)            ║
// ║  8. Upload sketch                                               ║
// ║  9. Open Serial Monitor at 9600 baud                            ║
// ║ 10. Scan a card — you should see the UID printed                ║
// ║                                                                  ║
// ║  HARDWARE:                                                       ║
// ║  ──────────                                                      ║
// ║  • ESP8266 (D0=Buzzer, D1=SCL, D2=SDA)                          ║
// ║  • PN532 NFC Reader (I2C mode)                                  ║
// ║  • 16x2 LCD Display with I2C backpack (0x3F)                    ║
// ║  • All on same I2C bus (D1/D2)                                  ║
// ╚══════════════════════════════════════════════════════════════════╝

#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <Wire.h>
#include <Adafruit_PN532.h>
#include <LiquidCrystal_I2C.h>

// ======================= WIFI SETTINGS =======================
// Enter your WiFi SSID and password
const char* ssid      = "MARVEL";
const char* password  = "123456789";

// ======================= SUPABASE SETTINGS =======================
// REQUIRED: Get these from https://supabase.com
// 1. Go to Project Settings -> API
// 2. Copy the Project URL and paste below (without /rest/v1)
// 3. Copy the "public" (anon) key and paste below
//
// Example:
// const char* SUPABASE_URL      = "https://lbqlntagejtdifyxvukk.supabase.co";
// const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
//
const char* SUPABASE_URL      = "https://lbqlntagejtdifyxvukk.supabase.co";
const char* SUPABASE_ANON_KEY = "sb_publishable_qbzAv4K01SPRxgXs2HaWQg_44_Qjx3Q";
// ==================================================================
//
// WORKFLOW:
// 1. User scans NFC card on this reader
// 2. Firmware sends card UID to Supabase
// 3. If card is unknown: double-beep + "Unknown Card" message
// 4. User goes to web app /add-card page, taps card again
// 5. Web app detects unknown card, redirects to /register with pre-filled UID
// 6. User enters student info (name, sex, phone, class, department)
// 7. Student is registered, card is now recognized by this reader
// ==================================================================

// Both devices on the SAME I2C bus — D2=SDA, D1=SCL
LiquidCrystal_I2C lcd(0x3F, 16, 2);
Adafruit_PN532    nfc(255, 255);   // I2C mode (IRQ/RST unused)

const int buzzer = D0;

// ── Helpers ──────────────────────────────────────────────

void lcdMsg(const char* line1, const char* line2 = "") {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(line1);
  if (strlen(line2) > 0) { lcd.setCursor(0, 1); lcd.print(line2); }
}

void beep(int ms = 150) {
  digitalWrite(buzzer, HIGH); delay(ms); digitalWrite(buzzer, LOW);
}

// ── Setup ─────────────────────────────────────────────────

void setup() {
  Serial.begin(9600);
  delay(200);
  Serial.println("\n\n=== BOOT ===");

  pinMode(buzzer, OUTPUT);
  digitalWrite(buzzer, LOW);

  // Single I2C bus for everything
  Wire.begin(D2, D1);
  delay(100);

  // LCD init (called twice — some 0x3F backpacks need it)
  lcd.init();
  delay(50);
  lcd.init();
  lcd.backlight();
  delay(100);
  lcdMsg("Booting...");
  delay(500);
  Serial.println("LCD OK");

  // WiFi
  lcdMsg("Connecting WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    ESP.wdtFeed();
    delay(500);
    Serial.print(".");
    if (++attempts > 40) {
      lcdMsg("WiFi Failed!", "Check creds");
      Serial.println("\nWiFi timeout — restarting");
      delay(3000);
      ESP.restart();
    }
  }
  Serial.println("\nWiFi OK: " + WiFi.localIP().toString());
  lcdMsg("WiFi Connected!", WiFi.localIP().toString().c_str());
  beep(100);
  delay(1000);

  // NFC — same Wire bus, different I2C address
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("PN532 not found — check I2C mode jumpers");
    lcdMsg("NFC Error!", "Check jumpers");
    delay(5000);
    ESP.restart();
  }
  Serial.print("PN532 found, firmware v");
  Serial.println((versiondata >> 16) & 0xFF);
  nfc.SAMConfig();

  lcdMsg("Ready!", "Scan Your Card");
  Serial.println("System ready");
}

// ── Main Loop ─────────────────────────────────────────────

void loop() {
  uint8_t uid[7]  = {0};
  uint8_t uidLen  = 0;

  ESP.wdtFeed();
  bool found = nfc.readPassiveTargetID(
    PN532_MIFARE_ISO14443A, uid, &uidLen, 3000
  );

  if (!found) return;  // timeout — loop cleanly

  beep(150);

  // Build UID hex string (e.g., "7A810E06")
  String cardID = "";
  for (uint8_t i = 0; i < uidLen; i++) {
    if (uid[i] < 0x10) cardID += "0";
    cardID += String(uid[i], HEX);
  }
  cardID.toUpperCase();
  Serial.println("Card UID: " + cardID);

  lcdMsg("Card Detected!", cardID.c_str());
  delay(500);
  lcdMsg("Checking...");

  // Look up the card UID in the database
  String studentName = "";
  bool known = lookupStudent(cardID, studentName);

  if (!known) {
    // Card not registered — prompt user to register it
    beep(80); delay(80); beep(80);  // double beep = unregistered card
    lcdMsg("New Card!", "Go to web app");
    Serial.println("Card not registered: " + cardID);
    Serial.println("  → Visit /add-card on web app to register");
    delay(2500);
    lcdMsg("Ready!", "Scan Your Card");
    return;
  }

  // Card found — log attendance
  bool ok = logAttendance(cardID);

  if (ok) {
    beep(200);
    lcdMsg("Welcome!", studentName.c_str());
    Serial.println("✓ Attendance logged for: " + studentName);
  } else {
    lcdMsg("Send Failed!", "Try again");
    Serial.println("✗ Attendance insert FAILED");
  }

  delay(2500);
  lcdMsg("Ready!", "Scan Your Card");
}

// ── Look up student by UID (GET request to Supabase REST API) ──
// Queries the "students" table to find a matching card UID.
// Returns true and fills `nameOut` if a registered student is found.
// Returns false if card UID is not in the database (user must register via web app).

bool lookupStudent(String uid, String &nameOut) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = String(SUPABASE_URL) +
               "/rest/v1/students?uid=eq." + uid + "&select=full_name";

  https.begin(client, url);
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  https.setTimeout(10000);

  int code = https.GET();
  String body = https.getString();
  https.end();

  Serial.println("Lookup HTTP " + String(code) + " | " + body);

  if (code != 200) return false;

  // Response looks like: [{"full_name":"John Doe"}]  or  []
  if (body.length() < 5) return false;  // "[]" = not found

  int nameStart = body.indexOf("\"full_name\":\"");
  if (nameStart == -1) return false;
  nameStart += strlen("\"full_name\":\"");
  int nameEnd = body.indexOf("\"", nameStart);
  if (nameEnd == -1) return false;

  nameOut = body.substring(nameStart, nameEnd);
  return true;
}

// ── Insert attendance record (POST request to Supabase RPC function) ──
// Calls the log_attendance() PostgreSQL function on the server.
// Server-side: looks up student by UID, then inserts an attendance record.
// This ensures the database is always consistent (atomic operation).
// Returns true if attendance was successfully logged.

bool logAttendance(String uid) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = String(SUPABASE_URL) + "/rest/v1/rpc/log_attendance";

  // Call the log_attendance() PostgreSQL function defined in supabase-schema.sql
  // Server looks up student_id from the UID, then inserts attendance atomically.
  // This keeps the database consistent and handles the card→student mapping.
  String payload = "{\"p_uid\":\"" + uid + "\"}";

  https.begin(client, url);
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  https.addHeader("Content-Type", "application/json");
  https.setTimeout(10000);

  int code = https.POST(payload);
  String body = https.getString();
  https.end();

  Serial.println("Insert HTTP " + String(code) + " | " + body);
  return (code == 200 || code == 204);
}
