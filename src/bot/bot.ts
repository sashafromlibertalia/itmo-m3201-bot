import { Connection, createConnection, Repository } from "typeorm";
import { Queue } from "../entities/queue.entity";
import "reflect-metadata";
import { UserDTO } from "../dto/user.dto";
import { User } from "../entities/user.entity";
import { CitgenDTO } from "../dto/citgen.dto";
import { SwapDTO } from "../dto/swap.dto";

interface BotMethods {
    getUser(userDTO: UserDTO): Promise<User>;
    getUserPositionAtQueue(user: User, queue: Queue): Promise<number>;

    createQueue(chatId: number): Promise<Queue>;
    showQueue(chatId: number): Promise<Queue>;
    deleteQueue(id: string): Promise<void>;
    swapUsers(users: SwapDTO): Promise<Queue>;


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

    async getUser(userDTO: UserDTO): Promise<User> {
        let user: User | null = null
        if (!!userDTO.firstName) {
            user = (await this.userRepository.findOne({
                where: {
                    firstName: userDTO.firstName,
                    lastName: userDTO.lastName,
                },
                relations: ["queues"]
            }))!

            return user
        }

        user = (await this.userRepository.findOne({
            where: {
                short: userDTO.short
            },
            relations: ["queues"]
        }))!

        return user!
    }

    async getUserPositionAtQueue(user: User, queue: Queue): Promise<number> {
        if (!queue) throw new Error("Очередь не была предоставлена")
        if (!user) throw new Error("Нету пользователя")

        return queue.users.findIndex(u => u.id === user.id) + 1
    }

    async showQueue(chatId: number): Promise<Queue> {
        const queue = (await this.queueRepository.findOne({ where: { chatId: chatId.toString() }, relations: ["users"] }))!

        if (!queue) throw new Error("Очереди еще нет")

        return queue!
    }

    async addUserToQueue(userDTO: UserDTO, chatId: number): Promise<User> {
        if (await this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.queues", "queue")
            .where("queue.chatId = :chatId", { chatId: chatId.toString() })
            .andWhere("user.telegramId = :telegramId", { telegramId: userDTO.id })
            .getOne())
            throw new Error("Данный коллега уже добавлен во очередь")

        try {
            let user: User = (await this.userRepository.findOne({
                firstName: userDTO.firstName!,
                lastName: userDTO.lastName!,
                telegramId: userDTO.id!,
                short: userDTO.short!,
            }))!

            if (!user) {
                user = new User()
                user.firstName = userDTO.firstName!
                user.lastName = userDTO.lastName! + " " + new Date().getTime()
                user.telegramId = userDTO.id!
                user.short = userDTO.short!

                await this.userRepository.save(user);
            }

            await this.userRepository.save(user);

            const queue = await this.queueRepository
                .createQueryBuilder("queue")
                .leftJoinAndSelect("queue.users", "user")
                .where("queue.chatId = :chatId", { chatId: chatId.toString() })
                .getOne()

            queue!.users.push(user)
            await this.queueRepository.save(queue!)
            return (await this.userRepository
                .createQueryBuilder("user")
                .leftJoinAndSelect("user.queues", "queue")
                .where("queue.chatId = :chatId", { chatId: chatId.toString() })
                .andWhere("user.telegramId = :telegramId", { telegramId: userDTO.id })
                .getOne())!
        }
        catch (error) {
            throw new Error(error)
        }
    }

    async swapUsers(users: SwapDTO): Promise<Queue> {
        const queue = (await this.queueRepository.findOne({ where: { chatId: users.chatId.toString() }, relations: ["users"] }))!

        const callerPosition = queue.users.findIndex(u => u.id === users.caller.id)
        const resolverPosition = queue.users.findIndex(u => u.id === users.resolver.id)
        const queuePosition = users.caller.queues.findIndex(q => q.chatId === queue.chatId)

        queue.users[callerPosition] = users.resolver
        queue.users[resolverPosition] = users.caller

        users.caller.queues[queuePosition] = queue
        users.resolver.queues[queuePosition] = queue

        await this.userRepository.save(users.caller)
        await this.userRepository.save(users.resolver)

        return await this.queueRepository.save(queue)
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

    async createCitgen(citgenDTO: CitgenDTO): Promise<string> {
        throw new Error("Method not implemented.");
    }
}