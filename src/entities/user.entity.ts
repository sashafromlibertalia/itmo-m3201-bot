import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne } from "typeorm";
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

    @ManyToOne(() => Queue, queue => queue.users, { cascade: true, onDelete: "CASCADE" })
    queue: Queue;
}
