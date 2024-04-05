import { proto } from '@whiskeysockets/baileys/WAProto'
import MessageInfoType from './message.model'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ChatParticipantType {
    /** Rank enum. */
    export enum Rank {
        REGULAR = 0,
        ADMIN = 1,
        SUPERADMIN = 2,
    }
}

/** Properties of a GroupParticipant. */
export interface ChatParticipantType extends proto.IGroupParticipant {
    /** GroupParticipant userJid */
    userJid: string

    /** GroupParticipant rank */
    rank?: ChatParticipantType.Rank | null
}

/** Properties of a HistorySyncMsg. */
export interface ChatMessageType extends proto.IHistorySyncMsg {
    /** HistorySyncMsg message */
    message?: MessageInfoType | null

    /** HistorySyncMsg msgOrderId */
    msgOrderId?: number | Long | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ChatType {
    /** EndOfHistoryTransferType enum. */
    export enum EndOfHistoryTransferType {
        COMPLETE_BUT_MORE_MESSAGES_REMAIN_ON_PRIMARY = 0,
        COMPLETE_AND_NO_MORE_MESSAGE_REMAIN_ON_PRIMARY = 1,
        COMPLETE_ON_DEMAND_SYNC_BUT_MORE_MSG_REMAIN_ON_PRIMARY = 2,
    }
}

/** Properties of a Conversation. */
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
    endOfHistoryTransferType?: ChatType.EndOfHistoryTransferType | null

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

    /** Conversation username */
    username?: string | null

    /** Conversation lidOriginType */
    lidOriginType?: string | null

    /** Conversation commentsCount */
    commentsCount?: number | null
}
