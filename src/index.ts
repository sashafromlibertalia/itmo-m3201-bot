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
            .then((data: Queue) => {
                listener.sendMessage(chatId, "Очередь успешно добавлена, коллеги", {
                    reply_markup: {
                        inline_keyboard: [[{ text: 'Посмотреть эту очередь', callback_data: `${Queries.SHOW_QUEUE}-${data.id}` }]]
                    }
                });
            })
            .catch((error: Error) => {
                listener.sendMessage(chatId, error.message);
            })
    }
})

listener.onText(/\/queues/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    await bot.getQueues(chatId)
        .then((data: Queue[]) => {
            let response = "*Информация об очередях:*\n\n"
            for (let queue of data) {
                const date = `${queue.createdAt.getDate()}/${("0" + (queue.createdAt.getMonth() + 1)).slice(-2)}/${queue.createdAt.getFullYear()}`
                response += `\`Очередь #${queue.id}\`\nДата создания: _${date}_\nЧисло людей: _${queue.users?.length || 0}_\n\n`
            }

            listener.sendMessage(chatId, response, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: 'Посмотреть эту очередь', callback_data: `${Queries.SHOW_QUEUE}-${data[0].id}` }],
                    [{ text: 'Удалить очередь', callback_data: `${Queries.DELETE_QUEUE}-${data[0].id}` }]]
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
        case Queries.SHOW_QUEUE:
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
                                    { text: 'Поменяться с другим', callback_data: `${Queries.SWAP}-${data.id}` }
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
            break
        case Queries.SWAP:
            await bot.showQueue(chatId).then((data) => {
                let keys: TelegramBot.KeyboardButton[][] = []
                for (let i = 0; i < data.users.length; i += 4) {
                    keys.push(data.users.slice(i, i + 4).filter(user => user.telegramId !== query.from.id).map(user => {
                        return {
                            text: user.firstName + " " + user.lastName
                        }
                    }))
                }
                listener.sendMessage(chatId, `*${query.from.first_name}*, выбери коллегу, с кем хочешь свапнуться`, {
                    parse_mode: "Markdown",
                    reply_markup: {
                        keyboard: keys,
                        one_time_keyboard: true
                    }
                })
            })

            break
        default:
            listener.sendMessage(chatId, "Уважаемые коллеги, неизвестная команда")
            break
    }
})