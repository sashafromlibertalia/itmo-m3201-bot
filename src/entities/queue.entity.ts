import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./user.entity";

@Entity("queues")
export class Queue {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column({default: 0})
    usersAmount: number;

    @OneToMany(() => User, user => user.queue)
    users: User[];
}
