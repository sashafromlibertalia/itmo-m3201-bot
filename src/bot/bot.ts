import { Connection, createConnection, Repository } from "typeorm";
import { Queue } from "../entities/queue.entity";
import "reflect-metadata";
import { Queries } from "../helpers/queries";

interface BotMethods {
    createQueue(): Promise<string>;
    getQueues(): Promise<string>;
    createCitgen(citgenData: CitgenData): Promise<string>;
    showQueue(command: string): Promise<string>;
}

export default class Bot implements BotMethods {
    private readonly MAXIMUM_QUEUES_AMOUNT: number = 2;
    private queueRepository: Repository<Queue>;
    private connection: Connection;

    private async createDbConnection() {
        this.connection = await createConnection()
    }

    constructor() {
        this.createDbConnection().then(() => {
            this.queueRepository = this.connection.getRepository(Queue)
        })
    }

    async createQueue(): Promise<string> {
        if ((await this.queueRepository.find()).length === this.MAXIMUM_QUEUES_AMOUNT)
            throw new Error("Уважаемые коллеги, лимит очередей исчерпан")

        try {
            await this.queueRepository.save(new Queue())
            return "Очередь успешно добавлена, коллеги"
        }
        catch (error) {
            throw new Error(error)
        }
    }

    async getQueues(): Promise<string> {
        try {
            const queues = await this.queueRepository.find()
            if (!queues.length) return "Уважаемые коллеги, очередей еще нет"

            let result = "*Информация об очередях:*\n\n"
            for (let queue of queues) {
                const date = `${queue.createdAt.getDate()}/${("0" + (queue.createdAt.getMonth() + 1)).slice(-2)}/${queue.createdAt.getFullYear()}`                
                result += `\`Очередь #${queue.id}\`\nДата создания: _${date}_\nЧисло людей: _${queue.users?.length || 0}_\n\n`
            }
            return result
        }
        catch (error) {
            throw new Error(error)
        }
    }

    showQueue(command: string): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async createCitgen(citgenData: CitgenData): Promise<string> {
        throw new Error("Method not implemented.");
    }
}