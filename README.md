# NFC Attendance System

ESP8266 + PN532 NFC reader that logs attendance directly to a Supabase
(Postgres) database, with a Next.js web console for registering cards and
watching scans come in live.

```
ESP8266 + PN532  ──HTTPS──▶  Supabase (Postgres + REST + Realtime)  ◀──  Next.js website
   (scans card)                  (students, attendance tables)         (register + dashboard)
```

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in the contents of
   `supabase-schema.sql`, and run it. This creates:
   - `students` — uid, full_name, phone, class
   - `attendance` — student_id, uid, scanned_at
   - `attendance_log` — a view joining the two, used by the dashboard
   - `log_attendance(p_uid)` — a Postgres function the ESP8266 calls to
     insert a scan in one request
3. Go to **Project Settings → API** and copy:
   - **Project URL** → used as `SUPABASE_URL`
   - **anon public key** → used as `SUPABASE_ANON_KEY`
4. Go to **Database → Replication** and confirm the `attendance` table has
   realtime enabled (the SQL script does this automatically via
   `alter publication supabase_realtime add table attendance;` — just
   double check it stuck).

## 2. Flash the ESP8266

Open `esp8266-firmware.ino` in Arduino IDE and fill in the top of the file:

```cpp
const char* ssid      = "YOUR_WIFI_NAME";
const char* password  = "YOUR_WIFI_PASSWORD";

const char* SUPABASE_URL      = "https://YOUR_PROJECT_REF.supabase.co";
const char* SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";
```

Required libraries (Library Manager): `Adafruit PN532`, `LiquidCrystal_I2C`
(Frank de Brabander version), ESP8266 board package.

Wiring (single I2C bus, no pin-switching):

| NodeMCU pin | Connects to |
|---|---|
| D1 (SCL) | LCD SCL **and** PN532 SCL |
| D2 (SDA) | LCD SDA **and** PN532 SDA |
| Vin (5V) | LCD VCC |
| 3V3 | PN532 VCC |
| GND | LCD GND, PN532 GND, buzzer – |
| D0 | buzzer + |

PN532 mode switches: `SW1 = 0`, `SW2 = 1` (I2C mode).

Behavior:
- Unregistered card → double beep, LCD shows "Unknown Card!"
- Registered card → single beep, LCD shows "Welcome, {name}", row appears
  in the web dashboard within ~1 second via Supabase Realtime

## 3. Run the website

```bash
cd web
npm install
cp .env.local.example .env.local
# edit .env.local with your Supabase URL + anon key
npm run dev
```

- `/` — live dashboard: scans-today / total-scans / registered-students
  stat cards, a class filter, and a realtime feed that highlights new
  scans as they arrive
- `/register` — form to register a new card (scan it once on the reader
  to get the UID from Serial Monitor, then fill in name/phone/class)

## 4. Deploy to Vercel

```bash
npm install -g vercel   # if not already installed
cd web
vercel
```

When prompted, add the two environment variables
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — or set them
afterward in the Vercel project dashboard under **Settings → Environment
Variables**, then redeploy.

## Notes on security (for the write-up / portfolio context)

This demo uses Supabase's `anon` key with permissive row-level-security
policies (`select`/`insert` open to anyone with the key) so the ESP8266
and the public website can both read/write without a backend in between.
That's a reasonable trade-off for a class project, but **not** how you'd
want it deployed for real attendance tracking — a production version
should put the ESP8266 and the register form behind a server-side API key
or service role, and restrict the anon key to read-only on the dashboard.
Worth a sentence in your report if you want to show you understand the
distinction between "demo-secure" and "production-secure."
# Updated
