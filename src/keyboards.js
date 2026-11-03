import { InlineKeyboard } from "grammy";
export const gamesKeyboard = () => new InlineKeyboard().text("🧠 معاني", "game:mean");
export const ownerKeyboard = () => new InlineKeyboard()
  .text("📊 الإحصائيات", "owner:stats").row()
  .text("👥 المستخدمين", "owner:users").text("🏘️ المجموعات", "owner:groups").row()
  .text("📣 إذاعة عامة", "owner:broadcast").row()
  .text("🔒 الاشتراك الإجباري", "owner:force");
export const groupSettingsKeyboard = () => new InlineKeyboard()
  .text("🛡️ الحماية", "settings:security").text("🎮 الألعاب والنقاط", "settings:games").row()
  .text("💬 الردود", "settings:replies").text("👋 الترحيب", "settings:welcome").row()
  .text("⚠️ الإنذارات", "settings:warnings");
