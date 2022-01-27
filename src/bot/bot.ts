import { Connection, createConnection, getRepository, Repository } from "typeorm";
import { Queue } from "../entities/queue.entity";
import "reflect-metadata";

interface BotMethods {
    createQueue(): Promise<string>;
    getQueues(): Promise<string>;
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
            return `Информация о очередях:\n\n#${queues[0].id}. ${queues[0].createdAt}\n#${queues[1].id}. ${queues[1].createdAt}`
        }
        catch (error) {
            throw new Error(error)
        }
    }
}