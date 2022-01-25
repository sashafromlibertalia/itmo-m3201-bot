import TelegramBot = require("node-telegram-bot-api"); 

const listener = new TelegramBot(process.env.TOKEN, {polling: true});

listener.onText(/\/echo (.+)/, (msg, match: any) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
  
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
  
    // send back the matched "whatever" to the chat
    listener.sendMessage(chatId, resp);
  });