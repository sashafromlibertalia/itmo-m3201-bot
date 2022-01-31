import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Queue } from "./queue.entity";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    telegramId: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    short: string;

    @ManyToMany(() => Queue, queue => queue.users)
    @JoinTable()
    queues: Queue[];
}
