import * as dotenv from 'dotenv';
dotenv.config();

export const TOKEN = process.env.TOKEN!;
export const ADMIN_IDs = process.env.ADMIN_ID!.split(' ').map(id => Number(id));