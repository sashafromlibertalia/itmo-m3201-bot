import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Queue {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    usersAmount: number;

    @OneToMany(() => User, user => user.queue)
    users: User[];
}
