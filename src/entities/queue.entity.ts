import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./user.entity";

@Entity("queues")
export class Queue {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    chatId: string;

    @OneToMany(() => User, user => user.queue)
    users: User[];
}
