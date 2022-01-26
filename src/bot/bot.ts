import { getRepository } from "typeorm";
import { Queue } from "../entities/queue.entity";

interface BotMethods {
    createQueue(): Promise<string>;
    greetUsers(): string;
}

export default class Bot implements BotMethods {
    private readonly MAXIMUM_QUEUES_AMOUNT: number = 2;
    private readonly queueRepository;

    constructor() {
        this.queueRepository = getRepository(Queue)
    }

    greetUsers(): string {
        return "Мои команды:\n/queue - новая очередь\n/citgen - создание цитгена."
    }

    async createQueue(): Promise<string> {
        if ((await this.queueRepository.find()).length === this.MAXIMUM_QUEUES_AMOUNT)
            throw new Error("Уважаемые коллеги, лимит очередей исчерпан")
        
        try {
            this.queueRepository.save(new Queue())
            return "Очередь успешно добавлена, коллеги"
        }
        catch (error) {
            throw new Error(error)
        }
    }
}