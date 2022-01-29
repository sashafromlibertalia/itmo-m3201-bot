import { Queries } from "./queries"

const invalidCredentials = () => {
    return "У тебя недостаточно прав для этой команды, коллега."
}

const findCommand = (str: string) => {
    if (str.includes(Queries.ADD_NEW_USER_TO_QUEUE))
        return Queries.ADD_NEW_USER_TO_QUEUE

    if (str.includes(Queries.DELETE_QUEUE))
        return Queries.DELETE_QUEUE

    if (str.includes(Queries.SHOW_QUEUE))
        return Queries.SHOW_QUEUE
}

const downloadUserPic = () => {
   
}

export { invalidCredentials, downloadUserPic, findCommand }