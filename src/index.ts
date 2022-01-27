import "reflect-metadata";
import * as TelegramBot from "node-telegram-bot-api"
import Bot from "./bot/bot";
import { TOKEN, ADMIN_IDs } from "./config";
import { invalidCredentials } from "./helpers/helpers";

const listener = new TelegramBot(TOKEN, { polling: true });
const bot = new Bot();

listener.onText(/\/start/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    await listener.sendMessage(chatId, bot.greetUsers());
});

listener.onText(/\/queue/, async (msg: TelegramBot.Message) => {
    const userId = msg.from!.id
    const chatId = msg.chat.id;
    if (!ADMIN_IDs.includes(userId)) {
        await listener.sendMessage(chatId, invalidCredentials());
    }
    else {
        await bot.createQueue()
            .then((data: string) => {
                listener.sendMessage(chatId, data);
            })
            .catch((error: Error) => {
                listener.sendMessage(chatId, error.message);
            })
    }
})