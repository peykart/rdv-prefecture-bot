const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;  // Add to your .env
const chatId = process.env.TELEGRAM_CHAT_ID;   // Add to your .env

const bot = new TelegramBot(token, { polling: false });

function sendNotification(message) {
  bot.sendMessage(chatId, message);
}

module.exports = sendNotification;
