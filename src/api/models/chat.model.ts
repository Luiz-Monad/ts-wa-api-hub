import { proto } from '@whiskeysockets/baileys/WAProto'
import MessageInfoType from './message.model'

export namespace ChatParticipantType {
    /** Rank enum. */
    export enum Rank {
        REGULAR = 0,
        ADMIN = 1,
        SUPERADMIN = 2,
    }
}

export interface ChatParticipantType extends proto.IGroupParticipant {
    /** GroupParticipant userJid */
    userJid: string

    /** GroupParticipant rank */
    rank?: ChatParticipantType.Rank | null
}

export interface ChatMessageType extends proto.IHistorySyncMsg {
    /** HistorySyncMsg message */
    message?: MessageInfoType | null

    /** HistorySyncMsg msgOrderId */
    msgOrderId?: number | Long | null
}

export default interface ChatType extends proto.IConversation {
    /** data store key */
    _id: string

    /** record deleted by the user */
    _deleted?: boolean

    /** Used when the chat is a group */
    _group?: any

    /** unix timestamp of when the last message was received in the chat */
    lastMessageRecvTimestamp?: number

    /*********** Inherited ***********/

    /** Conversation id */
    id: string

    /** Conversation messages */
    messages?: ChatMessageType[] | null

    /** Conversation newJid */
    newJid?: string | null

    /** Conversation oldJid */
    oldJid?: string | null

    /** Conversation lastMsgTimestamp */
    lastMsgTimestamp?: number | Long | null

    /** Conversation unreadCount */
    unreadCount?: number | null

    /** Conversation readOnly */
    readOnly?: boolean | null

    /** Conversation endOfHistoryTransfer */
    endOfHistoryTransfer?: boolean | null

    /** Conversation ephemeralExpiration */
    ephemeralExpiration?: number | null

    /** Conversation ephemeralSettingTimestamp */
    ephemeralSettingTimestamp?: number | Long | null

    /** Conversation endOfHistoryTransferType */
    endOfHistoryTransferType?: number | null

    /** Conversation conversationTimestamp */
    conversationTimestamp?: number | Long | null

    /** Conversation name */
    name?: string | null

    /** Conversation pHash */
    pHash?: string | null

    /** Conversation notSpam */
    notSpam?: boolean | null

    /** Conversation archived */
    archived?: boolean | null

    /** Conversation disappearingMode */
    disappearingMode?: any | null

    /** Conversation unreadMentionCount */
    unreadMentionCount?: number | null

    /** Conversation markedAsUnread */
    markedAsUnread?: boolean | null

    /** Conversation participant */
    participant?: ChatParticipantType[] | null

    /** Conversation tcToken */
    tcToken?: Uint8Array | null

    /** Conversation tcTokenTimestamp */
    tcTokenTimestamp?: number | Long | null

    /** Conversation contactPrimaryIdentityKey */
    contactPrimaryIdentityKey?: Uint8Array | null

    /** Conversation pinned */
    pinned?: number | null

    /** Conversation muteEndTime */
    muteEndTime?: number | Long | null

    /** Conversation wallpaper */
    wallpaper?: any | null

    /** Conversation mediaVisibility */
    mediaVisibility?: number | null

    /** Conversation tcTokenSenderTimestamp */
    tcTokenSenderTimestamp?: number | Long | null

    /** Conversation suspended */
    suspended?: boolean | null

    /** Conversation terminated */
    terminated?: boolean | null

    /** Conversation createdAt */
    createdAt?: number | Long | null

    /** Conversation createdBy */
    createdBy?: string | null

    /** Conversation description */
    description?: string | null

    /** Conversation support */
    support?: boolean | null

    /** Conversation isParentGroup */
    isParentGroup?: boolean | null

    /** Conversation parentGroupId */
    parentGroupId?: string | null

    /** Conversation isDefaultSubgroup */
    isDefaultSubgroup?: boolean | null

    /** Conversation displayName */
    displayName?: string | null

    /** Conversation pnJid */
    pnJid?: string | null

    /** Conversation shareOwnPn */
    shareOwnPn?: boolean | null

    /** Conversation pnhDuplicateLidThread */
    pnhDuplicateLidThread?: boolean | null

    /** Conversation lidJid */
    lidJid?: string | null
}
