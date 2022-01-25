import Queue from '../bot/models/queue.model';

interface BotMethods {
    createQueue(): Queue;
}

export default class Bot implements BotMethods {
    readonly queue: any[]

    constructor() {
        this.queue = []
    }


    createQueue(): Queue {
        throw new Error('Method not implemented.');
    }
}