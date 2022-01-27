import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne } from "typeorm";
import { Queue } from "./queue.entity";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @ManyToOne(() => Queue, queue => queue.users)
    queue: number

    @Index({ unique: true })
    @Column()
    queuePosition: number;
}
