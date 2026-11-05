# Siftebot / Naghnoogh

Telegram group management bot built with grammY and SQLite.

## Setup

1. Use Node.js 22.
2. Run `npm install`.
3. Set `BOT_TOKEN` and `OWNER_ID` in the environment (or `.env`).
4. Run `npm start`.

## Games

Send `العاب` in a group to open the games menu. Pressing a game button displays a short rules popup and starts a round in the group. The first correct text answer (or correct option button) wins **2 points**. Each round lasts 60 seconds, then the correct answer is shown.

Available games:
- 🧠 معاني
- 🔤 تفكيك
- ➗ رياضيات
- 🎯 خيارات
- 👤 خمن الشخصية
- 🚩 خمن الدولة
- 🎬 خمن الفيلم
- 🧠 صح أم خطأ
- 🔍 من أنا؟
- 🔢 خمن الرقم
- 📝 أكمل المثل

Game points remain separate for each group and are stored in the existing SQLite database.
