import { User } from "../entities/user.entity";

export type SwapDTO = {
    caller: User,
    resolver: User,
    chatId: number,
}