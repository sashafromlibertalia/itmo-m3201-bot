import { Connection, createConnection, Repository } from "typeorm";
import { Queue } from "../entities/queue.entity";
import "reflect-metadata";
import { Queries } from "../helpers/queries";
import { UserDTO } from "../dto/user.dto";
import { User } from "../entities/user.entity";
import { CitgenDTO } from "../dto/citgen.dto";

interface BotMethods {
    createQueue(chatId: number): Promise<string>;
    getQueues(chatId: number): Promise<string>;
    showQueue(queueNumber: number, chatId: number): Promise<string>;
    addUserToQueue(user: UserDTO, chatId: number): Promise<string>;

    createCitgen(citgenDTO: CitgenDTO): Promise<string>;
}

export default class Bot implements BotMethods {
    private readonly MAXIMUM_QUEUES_AMOUNT: number = 1;
    private connection: Connection;

    private queueRepository: Repository<Queue>;
    private userRepository: Repository<User>;

    constructor() {
        this.createDbConnection().then(() => {
            this.queueRepository = this.connection.getRepository(Queue)
            this.userRepository = this.connection.getRepository(User)
        })
    }

    private async createDbConnection() {
        this.connection = await createConnection()
    }

    async createQueue(chatId: number): Promise<string> {
        if ((await this.queueRepository.find({ where: { chatId: chatId } })).length === this.MAXIMUM_QUEUES_AMOUNT)
            throw new Error("Уважаемые коллеги, лимит очередей исчерпан")

        try {
            const queue = new Queue()
            queue.chatId = chatId.toString()
            await this.queueRepository.save(queue)
            return "Очередь успешно добавлена, коллеги"
        }
        catch (error) {
            throw new Error(error)
        }
    }

    async getQueues(chatId: number): Promise<string> {
        const queues = await this.queueRepository.find({ relations: ["users"], where: { chatId: chatId } })
        if (!queues.length)
            throw new Error("Уважаемые коллеги, очередей еще нет")

        let data = "*Информация об очередях:*\n\n"
        for (let queue of queues) {
            const date = `${queue.createdAt.getDate()}/${("0" + (queue.createdAt.getMonth() + 1)).slice(-2)}/${queue.createdAt.getFullYear()}`
            data += `\`Очередь #${queue.id}\`\nДата создания: _${date}_\nЧисло людей: _${queue.users?.length || 0}_\n\n`
        }
        return data
    }

    async showQueue(queueNumber: number, chatId: number): Promise<string> {
        if (![Queries.SHOW_FIRST_QUEUE.toString()].includes(queueNumber.toString()))
            throw new Error("Такой команды не существует")            

        const queue = await this.queueRepository
            .createQueryBuilder("queue")
            .leftJoinAndSelect("queue.users", "user")
            .andWhere("queue.chatId LIKE :chatId", { chatId: chatId.toString() })
            .getOne()

        if (!queue) throw new Error("Такой очереди не существует")
        if (!queue.users.length) return `\`Очередь ${queue.id}\` пустая, коллеги`

        let data = `\`Очередь ${queue.id}:\`\n\n`
        for (let user of queue.users.sort((u1, u2) => u1.queuePosition > u2.queuePosition ? 1 : u1.queuePosition < u2.queuePosition ? -1 : 0)) {
            data += `${user.queuePosition}. _${user.firstName} ${user.lastName}_\n`
        }

        return data
    }

    async addUserToQueue(userDTO: UserDTO, chatId: number): Promise<string> {
        const user = new User()
        user.firstName = userDTO.firstName
        user.lastName = userDTO.lastName
        user.id = userDTO.id

        try {
            if ((await this.userRepository.find()).find(user => user.id === userDTO.id))
                return "Данный коллега уже добавлен во очередь"

            await this.userRepository.save(user);

            const queue = await this.queueRepository
                .createQueryBuilder("queue")
                .leftJoinAndSelect("queue.users", "user")
                .andWhere("queue.chatId LIKE :chatId", { chatId: chatId.toString() })
                .getOne()

            queue!.users.push(user)

            await this.queueRepository.save(queue!)
            return `*${userDTO.firstName} ${userDTO.lastName}* был успешно добавлен в \`очередь #${queue?.id}\` `
        }
        catch (error) {
            throw new Error(error)
        }
    }

    async createCitgen(citgenDTO: CitgenDTO): Promise<string> {
        throw new Error("Method not implemented.");
    }
}