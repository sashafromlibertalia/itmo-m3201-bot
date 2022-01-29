import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Queue } from "./queue.entity";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @Column()
    telegramId: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @ManyToMany(() => Queue, queue => queue.users, { cascade: true, onDelete: "CASCADE" })
    queues: Queue[];
}
