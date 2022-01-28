import "reflect-metadata";
import * as TelegramBot from "node-telegram-bot-api"
import Bot from "./bot/bot";
import { TOKEN, ADMIN_IDs } from "./config";
import { invalidCredentials } from "./helpers/helpers";
import { Queries } from "./helpers/queries";

const listener = new TelegramBot(TOKEN, { polling: true });
const bot = new Bot();


listener.onText(/\/new/, async (msg: TelegramBot.Message) => {
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

listener.onText(/\/queues/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    await bot.getQueues()
        .then((data: string) => {
            listener.sendMessage(chatId, data, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Посмотреть первую очередь', callback_data: Queries.SHOW_FIRST_QUEUE }],
                        [{ text: 'Посмотреть вторую очередь', callback_data: Queries.SHOW_SECOND_QUEUE }],
                    ]
                }
            });
        })
})

listener.onText(/\/citgen/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const data: CitgenData = {
        author: `${msg.from!.first_name} ${msg.from!.last_name}`,
        message: "Абоба"
    }

    await bot.createCitgen(data)
        .then((data: string) => {
            listener.sendMessage(chatId, data);
        })
})


listener.on("callback_query", async (query: TelegramBot.CallbackQuery) => {
    const chatId = query.message!.chat.id
    switch (query.data) {
        case Queries.SHOW_SECOND_QUEUE:    
        case Queries.SHOW_FIRST_QUEUE:
            await bot.showQueue(query.data).then((data: string) => {
                listener.answerCallbackQuery(query.id)
                listener.sendMessage(chatId, data);
            })
            break
        default:
            break
    }
})