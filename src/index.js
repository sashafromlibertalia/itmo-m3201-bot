"use strict";
exports.__esModule = true;
var TelegramBot = require("node-telegram-bot-api");
var listener = new TelegramBot(process.env.TOKEN, { polling: true });
listener.onText(/\/echo (.+)/, function (msg, match) {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    var chatId = msg.chat.id;
    var resp = match[1]; // the captured "whatever"
    // send back the matched "whatever" to the chat
    listener.sendMessage(chatId, resp);
});
