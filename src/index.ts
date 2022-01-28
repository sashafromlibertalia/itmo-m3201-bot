import "reflect-metadata";
import * as TelegramBot from "node-telegram-bot-api"
import Bot from "./bot/bot";
import { TOKEN, ADMIN_IDs } from "./config";
import { invalidCredentials } from "./helpers/helpers";
import { Queries } from "./helpers/queries";
import { UserDTO } from "./dto/user.dto";

const listener = new TelegramBot(TOKEN, { polling: true });
const bot = new Bot();

listener.onText(/\/new/, async (msg: TelegramBot.Message) => {
    const userId = msg.from!.id
    const chatId = msg.chat.id;
    if (!ADMIN_IDs.includes(userId)) {
        await listener.sendMessage(chatId, invalidCredentials());
    }
    else {
        await bot.createQueue(chatId)
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
    await bot.getQueues(chatId)
        .then((data: string) => {
            listener.sendMessage(chatId, data, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: 'Посмотреть эту очередь', callback_data: Queries.SHOW_FIRST_QUEUE }]]
                }
            });
        })
        .catch((error: Error) => {
            listener.sendMessage(chatId, error.message);
        })
})

// listener.onText(/\/citgen/, async (msg: TelegramBot.Message) => {
//     const chatId = msg.chat.id;
//     const data: CitgenData = {
//         author: `${msg.from!.first_name} ${msg.from!.last_name}`,
//         message: "Абоба"
//     }

//     await bot.createCitgen(data)
//         .then((data: string) => {
//             listener.sendMessage(chatId, data);
//         })
// })

listener.on("callback_query", async (query: TelegramBot.CallbackQuery) => {
    const chatId = query.message!.chat.id
    switch (query.data) {
        case Queries.SHOW_FIRST_QUEUE:
            await listener.answerCallbackQuery(query.id)
            await bot.showQueue(Number(query.data), chatId)
                .then((data: string) => {
                    listener.sendMessage(chatId, data, {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Добавить участников', callback_data: Queries.ADD_NEW_USER_TO_QUEUE }],
                            ]
                        }
                    });
                })
                .catch((error: Error) => {
                    listener.sendMessage(chatId, error.message);
                })
            break
        case Queries.ADD_NEW_USER_TO_QUEUE:
            await listener.answerCallbackQuery(query.id)

            const userDto: UserDTO = {
                firstName: query.from!.first_name,
                lastName: query.from!.last_name || "",
                id: query.from!.id
            };

            await bot.addUserToQueue(userDto, chatId)
                .then((data: string) => {
                    listener.sendMessage(chatId, data, {
                        parse_mode: "Markdown"
                    });
                })
                .catch((error: Error) => {
                    listener.sendMessage(chatId, error.message);
                })
            break
        default:
            break
    }
})