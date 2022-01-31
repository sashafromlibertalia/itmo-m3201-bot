import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { User } from "./user.entity";

@Entity("queues")
export class Queue {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    chatId: string;

    @ManyToMany(() => User, user => user.queues, { cascade: true, onDelete: "CASCADE", onUpdate: "CASCADE"})
    users: User[];
}
