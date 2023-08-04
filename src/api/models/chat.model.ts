export interface ChatParticipant {
    id: string
    admin: string | null
}

export interface ChatType {
    id: string
    name: string
    participant?: ChatParticipant[]
    messages?: any[]
    creation?: number
    subjectOwner?: string
}

export interface Chat {
    key: string
    chat: ChatType[]
}

export default Chat
