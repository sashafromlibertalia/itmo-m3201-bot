import { Queries } from "./queries"

const invalidCredentials = () => {
    return "У тебя недостаточно прав для этой команды, коллега."
}

const findCommand = (str: string) => {
    for (let cmd of Object.values(Queries))
        if (str.includes(cmd)) return cmd
}

const downloadUserPic = () => {
   
}

// Костыль
const SWAP_EVENT_EMITTER = "свапнуться"
const SWAP_EVENT_COMMITTER = "поменяться местами"

export { invalidCredentials, downloadUserPic, findCommand, SWAP_EVENT_EMITTER, SWAP_EVENT_COMMITTER }