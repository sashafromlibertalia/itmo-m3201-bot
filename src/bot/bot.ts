interface BotMethods {
    createQueue(): Promise<string>;
    greetUsers(): string;
}

export default class Bot implements BotMethods {
    private readonly MAXIMUM_QUEUES_AMOUNT: number = 2
    readonly queue: string[]

    constructor() {
        this.queue = []
    }

    greetUsers(): string {
        return "Мои команды:\n/queue - новая очередь\n/citgen - создание цитгена."
    }

    async createQueue(): Promise<string> {
        if (this.queue.length === this.MAXIMUM_QUEUES_AMOUNT) 
            throw new Error("Уважаемые коллеги, лимит очередей исчерпан")

        this.queue.push("TEST")

        return "Очередь успешно добавлена, коллеги"
    }
}