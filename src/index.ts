import "reflect-metadata";
import * as TelegramBot from "node-telegram-bot-api"
import Bot from "./bot/bot";
import { TOKEN, ADMIN_IDs } from "./config";
import { findCommand, invalidCredentials } from "./helpers/helpers";
import { Queries } from "./helpers/queries";
import { UserDTO } from "./dto/user.dto";
import { Queue } from "./entities/queue.entity";
import { User } from "./entities/user.entity";

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
            .then(() => {
                listener.sendMessage(chatId, "Очередь успешно добавлена, коллеги");
            })
            .catch((error: Error) => {
                listener.sendMessage(chatId, error.message);
            })
    }
})

listener.onText(/\/queues/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    await bot.showQueue(chatId)
        .then((data: Queue) => {
            let response: string = ""
            if (data.users.length > 0) {
                response = `\`Очередь ${data.id}:\`\n\n`
                for (let [index, user] of data.users.entries()) {
                    response += `${index + 1}. _${user.firstName} ${user.lastName}_\n`
                }
            } else {
                response = `\`Очередь ${data.id}\` пустая, коллеги`
            }

            listener.sendMessage(chatId, response, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Записаться', callback_data: Queries.ADD_NEW_USER_TO_QUEUE },
                        ],
                        [
                            { text: 'Удалить очередь', callback_data: `${Queries.DELETE_QUEUE}-${data.id}` }
                        ]
                    ]
                }
            });
        })
        .catch((error: Error) => {
            listener.sendMessage(chatId, error.message, {
                parse_mode: "Markdown"
            });
        })
})

listener.onText(/\/swap/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const KEYS_PER_ROW = 4

    await bot.showQueue(chatId)
        .then((data: Queue) => {
            let response: string = ""
            let keys: TelegramBot.KeyboardButton[][] = []

            if (data.users.length > 0) {
                response = `*${msg.from!.first_name}*, выбери коллегу, с кем хочешь свапнуться`
                for (let i = 0; i < data.users.length; i += KEYS_PER_ROW) {
                    keys.push(data.users.slice(i, i + KEYS_PER_ROW).filter(user => user.telegramId !== msg.from!.id).map(user => {
                        return {
                            text: user.firstName + " " + user.lastName,
                        }
                    }))
                }      
                keys.push([{text: "❌ Закрыть клавиатуру"}])          
            } else {
                response = `\`Очередь ${data.id}\` пустая, коллеги`
            }
            
            listener.sendMessage(chatId, response, {
                parse_mode: "Markdown",
                reply_markup: {
                    keyboard: keys,
                    one_time_keyboard: true,
                    selective: true,
                    resize_keyboard: true
                },
                reply_to_message_id: msg.message_id
            })
        })
        .catch((error: Error) => {
            listener.sendMessage(chatId, error.message, {
                parse_mode: "Markdown"
            });
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
    const request = query.data?.replace(`${findCommand(query.data!)}-`, "")

    await listener.answerCallbackQuery(query.id)
    switch (findCommand(query.data!)) {
        case Queries.ADD_NEW_USER_TO_QUEUE:
            const userDto: UserDTO = {
                firstName: query.from!.first_name,
                lastName: query.from!.last_name || "",
                id: query.from!.id
            };
            await bot.addUserToQueue(userDto, chatId)
                .then((data: User) => {
                    const response = `*${data.firstName} ${data.lastName}* был успешно добавлен в \`очередь #${data.queues.find(q => q.chatId === chatId.toString())!.id}\` `
                    listener.sendMessage(chatId, response, {
                        parse_mode: "Markdown"
                    });
                })
                .catch((error: Error) => {
                    listener.sendMessage(chatId, error.message);
                })
            break
        case Queries.DELETE_QUEUE:
            const userId = query.from.id
            if (!ADMIN_IDs.includes(userId)) {
                await listener.sendMessage(chatId, invalidCredentials());
            } else {
                await bot.deleteQueue(request!)
                    .then(() => {
                        const response = `*Очередь была успешно удалена*`
                        listener.sendMessage(chatId, response, {
                            parse_mode: "Markdown"
                        })
                    })
                    .catch((error: Error) => {
                        listener.sendMessage(chatId, error.message, {
                            parse_mode: "Markdown"
                        });
                    })
            }
            break
        default:
            listener.sendMessage(chatId, "Уважаемые коллеги, неизвестная команда")
            break
    }
})
