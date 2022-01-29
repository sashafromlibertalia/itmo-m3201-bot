import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { User } from "./user.entity";

@Entity("queues")
export class Queue {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    chatId: string;

    @ManyToMany(() => User, user => user.queues)
    @JoinTable()
    users: User[];
}
