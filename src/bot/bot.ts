import { Connection, createConnection, Repository } from "typeorm";
import { Queue } from "../entities/queue.entity";
import "reflect-metadata";
import { Queries } from "../helpers/queries";
import { UserDTO } from "../dto/user.dto";
import { User } from "../entities/user.entity";
import { CitgenDTO } from "../dto/citgen.dto";

interface BotMethods {
    createQueue(chatId: number): Promise<Queue>;
    getQueues(chatId: number): Promise<Queue[]>;
    showQueue(chatId: number): Promise<Queue>;
    deleteQueue(id: string): Promise<void>;

    addUserToQueue(user: UserDTO, chatId: number): Promise<User>;

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

    async createQueue(chatId: number): Promise<Queue> {
        if ((await this.queueRepository.find({ where: { chatId: chatId } })).length === this.MAXIMUM_QUEUES_AMOUNT)
            throw new Error("Уважаемые коллеги, лимит очередей исчерпан")

        try {
            const queue = new Queue()
            queue.chatId = chatId.toString()
            await this.queueRepository.save(queue)
            return queue
        }
        catch (error) {
            throw new Error(error)
        }
    }

    async getQueues(chatId: number): Promise<Queue[]> {
        const queues = await this.queueRepository
            .find({ relations: ["users"], where: { chatId: chatId } })

        if (!queues.length) throw new Error("Уважаемые коллеги, очередей еще нет")

        return queues
    }

    async showQueue(chatId: number): Promise<Queue> {
        const queue = await this.queueRepository
            .createQueryBuilder("queue")
            .leftJoinAndSelect("queue.users", "user")
            .andWhere("queue.chatId = :chatId", { chatId: chatId.toString() })
            .getOne()

        if (!queue) throw new Error("Такой очереди не существует")

        return queue
    }

    async deleteQueue(id: string): Promise<void> {
        const queue = await this.queueRepository.findOne({ where: { id: id } })
        if (!queue) throw new Error(`*Очередь уже удалена*`)

        this.queueRepository
            .createQueryBuilder("queue")
            .delete()
            .from(Queue)
            .where("id = :id", { id: id })
            .execute()
    }

    async addUserToQueue(userDTO: UserDTO, chatId: number): Promise<User> {
        if ((await this.userRepository.find()).find(user => user.telegramId === userDTO.id))
            throw new Error("Данный коллега уже добавлен во очередь")

        try {
            const user = new User()
            user.firstName = userDTO.firstName
            user.lastName = userDTO.lastName
            user.telegramId = userDTO.id

            await this.userRepository.save(user);
            const queue = await this.queueRepository
                .createQueryBuilder("queue")
                .leftJoinAndSelect("queue.users", "user")
                .andWhere("queue.chatId LIKE :chatId", { chatId: chatId.toString() })
                .getOne()

            queue!.users.push(user)

            await this.queueRepository.save(queue!)
            return (await this.userRepository.findOne({ relations: ["queue"] }))!
        }
        catch (error) {
            throw new Error(error)
        }
    }

    async createCitgen(citgenDTO: CitgenDTO): Promise<string> {
        throw new Error("Method not implemented.");
    }
}