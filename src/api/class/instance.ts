import config from '../../config/config'
import getLogger, { getWaCacheLogger, getWaLogger } from '../../config/logging'
import useAuthState, { AuthState } from '../helper/baileysAuthState'
import useChatState, { ChatState } from '../helper/chatState'
import downloadMessage from '../helper/downloadMsg'
import generateVC, { VCardData } from '../helper/genVc'
import useGroupState, { GroupState } from '../helper/groupState'
import useMessageState, { MessageState } from '../helper/messageState'
import processButton, { ButtonDef } from '../helper/processbtn'
import processMessage, { MediaType } from '../helper/processmessage'
import { AppType, FileType } from '../helper/types'
import getWebHookService, { WebHook } from '../service/webhook'
import getWebSocketService, { WebSocket } from '../service/websocket'
import { CallBackType } from './callback'
import { Boom } from '@hapi/boom'
import { DisconnectReason, GroupMetadata, GroupParticipant, WAMessage, proto, makeCacheableSignalKeyStore, default as makeWASocket } from '@whiskeysockets/baileys'
import axios from 'axios'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

const logger = getLogger('instance')

type WASocket = ReturnType<typeof makeWASocket>

// The following types are used instead of the ones from whiskeysockets because that's the public interface.
// except on the ByApp calls that are `private`, supposedly.

export type Lock = 'block' | 'unblock'

export type Status = 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'

export type ParticipantAction = 'add' | 'remove' | 'promote' | 'demote'

export type GroupAction = 'announcement' | 'locked' | 'not_announcement' | 'unlocked'

export interface ButtonMessage {
    buttons: ButtonDef[]
    text?: string
    footerText?: string
}

export interface ListMessage {
    text: string
    sections?: any
    buttonText?: string
    description?: string
    title?: string
}

export interface MediaButtonMessage {
    mediaType: MediaType
    image?: string
    footerText?: string
    text?: string
    buttons?: ButtonDef[]
    mimeType: string
}

export interface MessageKey {
    remoteJid?: string | null
    fromMe?: boolean | null
    id?: string | null
    participant?: string | null
}

class WhatsAppInstance {
    app: AppType
    socketConfig = {
        connectTimeoutMs: 2 * 60 * 1000,
        defaultQueryTimeoutMs: 2 * 1000,
        printQRInTerminal: true,
        logger: getWaLogger(),
    }
    key: string
    authState: AuthState | null = null
    chatState: ChatState | null = null
    groupState: GroupState | null = null
    messageState: MessageState | null = null
    webHookInstance: WebHook | null = null
    webSocketInstance: WebSocket | null = null

    instance = {
        qr: '',
        qr_url: '',
        qrRetry: 0,
        initRetry: 0,
        online: false,
    }

    sock: WASocket | null = null

    constructor(app: AppType, key?: string, allowWebhook?: boolean, webhook?: string | null, allowWebsocket?: boolean) {
        this.app = app
        this.key = key ? key : uuidv4()
        this.webHookInstance = getWebHookService(this.app)
        if (allowWebhook) this.webHookInstance = this.webHookInstance.enable(webhook)
        this.webSocketInstance = getWebSocketService(this.app)
        if (allowWebsocket) this.webSocketInstance = this.webSocketInstance.enable()
    }

    async _sendCallback(type: CallBackType, body: any, key: string) {
        logger.debug(body, `callback: ${type}`)
        this.webSocketInstance?.sendCallback(type, body, key)
        this.webHookInstance?.sendCallback(type, body, key)
    }

    async init() {
        try {
            this.authState = await useAuthState(this.app, this.key)
            const state = this.authState.readState()
            const socketConfig = {
                auth: {
                    creds: state.creds,
                    /** caching makes the store faster to send/recv messages */
                    keys: makeCacheableSignalKeyStore(state.keys, getWaCacheLogger()),
                },
                browser: <[string, string, string]>Object.values(config.browser),
                ...this.socketConfig,
            }
            this.sock = makeWASocket(socketConfig)
            this.setHandler()
            return this
        } catch (e) {
            const msg = 'Error when creating instance'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async _drop() {
        try {
            if (this.authState) {
                this.authState.dropCreds()
            }
            return this
        } catch (e) {
            logger.error(e, 'Error dropping auth state')
        }
    }

    async _onConnect() {
        if (!config.database.enabled) return
        this.chatState = await useChatState(this.app, this.key)
        this.groupState = await useGroupState(this.app, this.key)
        this.messageState = await useMessageState(this.app, this.key)
    }

    setHandler() {
        const sock = this.sock

        const baileysEvents = [
            'creds.update',
            'messaging-history.set',
            'chats.upsert',
            'chats.update',
            'chats.delete',
            'presence.update',
            // 'contacts.upsert',
            // 'contacts.update',
            'messages.delete',
            'messages.update',
            // 'messages.media-update',
            'messages.upsert',
            // 'messages.reaction',
            'message-receipt.update',
            'groups.upsert',
            'groups.update',
            'group-participants.update',
            // 'blocklist.set',
            // 'blocklist.update',
            // 'call',
            // 'labels.edit',
            // 'labels.association',
        ]

        // on credentials update save state
        sock?.ev.on('creds.update', async (creds) => {
            logger.debug(creds, 'creds.update')
            try {
                if (this.authState) {
                    this.authState.saveCreds()
                }
            } catch (e) {
                logger.error(e, 'creds.update')
            }
        })

        // on socket closed, opened, connecting
        sock?.ev.on('connection.update', async (update) => {
            logger.debug(update, 'connection.update')
            try {
                const { connection, lastDisconnect, qr } = update
                logger.info(`STATE: ${connection}`)

                if (connection === 'connecting') return

                if (connection === 'close') {
                    // reconnect if not logged out
                    if (
                        (lastDisconnect?.error as Boom)?.output?.statusCode !==
                        DisconnectReason.loggedOut
                    ) {
                        this.instance.initRetry++
                        if (this.instance.initRetry < Number(config.instance.maxRetryInit)) {
                            await this.init()
                        } else {
                            await this._drop()
                            logger.info('STATE: Init failure')
                            this.instance.online = false
                        }
                    } else {
                        await this._drop()
                        logger.info('STATE: Logged off')
                        this.instance.online = false
                    }
                    await this._sendCallback(
                        'connection:close',
                        {
                            connection: connection,
                        },
                        this.key
                    )
                } else if (connection === 'open') {
                    await this._onConnect()
                    this.instance.online = true
                    await this._sendCallback(
                        'connection:open',
                        {
                            connection: connection,
                        },
                        this.key
                    )
                }

                if (qr) {
                    logger.info(`qr: ${qr}`)
                    QRCode.toDataURL(qr).then((base64image) => {
                        this.instance.qr = base64image
                        this.instance.qr_url = qr
                        this.instance.qrRetry++
                        if (this.instance.qrRetry >= Number(config.instance.maxRetryQr)) {
                            // close WebSocket connection
                            this.sock?.ws.close()
                            // remove all events
                            baileysEvents.forEach((ev) =>
                                this.sock?.ev.removeAllListeners(<any>ev)
                            )
                            // terminated
                            this.instance.qr = ' '
                            logger.info('socket connection terminated')
                        }
                    })
                }
            } catch (e) {
                logger.error(e, 'connection.update')
            }
        })

        // sending presence
        sock?.ev.on('presence.update', async (json) => {
            logger.debug(json, 'presence.update')
            try {
                await this._sendCallback('presence', json, this.key)
            } catch (e) {
                logger.error(e, 'presence.update')
            }
        })

        // on receive all chats/messages
        sock?.ev.on('messaging-history.set', async (ev) => {
            logger.debug(ev, 'messaging-history.set')
            try {
                if (this.chatState) {
                    await this.chatState.setChats(ev)
                }
                if (this.messageState) {
                    await this.messageState.setMessages(ev)
                }
                if (this.groupState) {
                    const allGroupParticipants = await this.groupFetchAllParticipating()
                    if (allGroupParticipants) {
                        await this.groupState.setGroupChats(allGroupParticipants)
                    }
                }
            } catch (e) {
                logger.error(e, 'messaging-history.set')
            }
        })

        // on receive new chat
        sock?.ev.on('chats.upsert', async (newChat) => {
            logger.debug(newChat, 'chats.upsert')
            try {
                if (this.chatState) {
                    await this.chatState.upsertChats(newChat)
                }
            } catch (e) {
                logger.error(e, 'chats.upsert')
            }
        })

        // on chat change
        sock?.ev.on('chats.update', async (changedChat) => {
            logger.debug(changedChat, 'chats.update')
            try {
                if (this.chatState) {
                    await this.chatState.updateChats(changedChat)
                }
            } catch (e) {
                logger.error(e, 'chats.update')
            }
        })

        // on chat delete
        sock?.ev.on('chats.delete', async (deletedChats) => {
            logger.debug(deletedChats, 'chats.delete')
            try {
                if (this.chatState) {
                    await this.chatState.deleteChats(deletedChats)
                }
            } catch (e) {
                logger.error(e, 'chats.delete')
            }
        })

        // on new mssage
        sock?.ev.on('messages.upsert', async (m) => {
            logger.debug(m, 'messages.upsert')
            try {
                if (this.messageState) {
                    await this.messageState.upsertMessages(m)
                }

                if (m.type !== 'notify') return

                // https://adiwajshing.github.io/Baileys/#reading-messages
                if (config.instance.markMessagesRead) {
                    const unreadMessages = m.messages.map((msg) => {
                        return {
                            remoteJid: msg.key.remoteJid,
                            id: msg.key.id,
                            participant: msg.key?.participant,
                        }
                    })
                    await sock.readMessages(unreadMessages)
                }

                m.messages.map(async (msg) => {
                    if (!msg.message) return

                    const messageType = Object.keys(msg.message)[0]
                    if (
                        [
                            'protocolMessage',
                            'senderKeyDistributionMessage',
                        ].includes(messageType)
                    )
                        return

                    const data = {
                        ...{ key: this.key },
                        ...msg,
                        messageKey: msg.key,
                        instanceKey: this.key,
                        text: <typeof m | null>null,
                        msgContent: <string | null | void>null,
                    }

                    if (messageType === 'conversation') {
                        data.text = m
                    }
                    if (config.webhookBase64) {
                        switch (messageType) {
                            case 'imageMessage':
                                data.msgContent = await downloadMessage(
                                    msg.message.imageMessage!,
                                    'image'
                                )
                                break
                            case 'videoMessage':
                                data.msgContent = await downloadMessage(
                                    msg.message.videoMessage!,
                                    'video'
                                )
                                break
                            case 'audioMessage':
                                data.msgContent = await downloadMessage(
                                    msg.message.audioMessage!,
                                    'audio'
                                )
                                break
                            default:
                                data.msgContent = ''
                                break
                        }
                    }
                    await this._sendCallback('message', data, this.key)
                })
            } catch (e) {
                logger.error(e, 'messages.upsert')
            }
        })

        // on mssage change
        sock?.ev.on('messages.update', async (messages) => {
            logger.debug(messages, 'messages.update')
            try {
                if (this.messageState) {
                    await this.messageState.updateMessages(messages)
                }
            } catch (e) {
                logger.error(e, 'messages.update')
            }
        })

        // on mssage delete
        sock?.ev.on('messages.delete', async (messages) => {
            logger.debug(messages, 'messages.delete')
            try {
                if (this.messageState) {
                    await this.messageState.deleteMessages(messages)
                }
            } catch (e) {
                logger.error(e, 'messages.delete')
            }
        })

        sock?.ws.on('CB:call', async (data) => {
            logger.debug(data, 'CB:call')
            if (data.content) {
                if (data.content.find((e: { tag: string }) => e.tag === 'offer')) {
                    const content = data.content.find((e: { tag: string }) => e.tag === 'offer')
                    await this._sendCallback(
                        'call_offer',
                        {
                            id: content.attrs['call-id'],
                            timestamp: parseInt(data.attrs.t),
                            user: {
                                id: data.attrs.from,
                                platform: data.attrs.platform,
                                platform_version: data.attrs.version,
                            },
                        },
                        this.key
                    )
                } else if (data.content.find((e: { tag: string }) => e.tag === 'terminate')) {
                    const content = data.content.find(
                        (e: { tag: string }) => e.tag === 'terminate'
                    )
                    await this._sendCallback(
                        'call_terminate',
                        {
                            id: content.attrs['call-id'],
                            user: {
                                id: data.attrs.from,
                            },
                            timestamp: parseInt(data.attrs.t),
                            reason: data.content[0].attrs.reason,
                        },
                        this.key
                    )
                }
            }
        })

        sock?.ev.on('groups.upsert', async (newChat) => {
            logger.debug(newChat, 'groups.upsert')
            try {
                if (this.groupState) {
                    await this.groupState.upsertGroupChats(newChat)
                }
                await this._sendCallback(
                    'group_created',
                    {
                        data: newChat,
                    },
                    this.key
                )
            } catch (e) {
                logger.error(e, 'groups.upsert')
            }
        })

        sock?.ev.on('groups.update', async (newChat) => {
            logger.debug(newChat, 'groups.update')
            try {
                if (this.groupState) {
                    await this.groupState.updateGroupChats(newChat)
                }
                await this._sendCallback(
                    'group_updated',
                    {
                        data: newChat,
                    },
                    this.key
                )
            } catch (e) {
                logger.error(e, 'groups.update')
            }
        })

        sock?.ev.on('group-participants.update', async (newChat) => {
            logger.debug(newChat, 'group-participants.update')
            if (this.groupState) {
                await this.groupState.updateGroupParticipants(newChat)
            }
            await this._sendCallback(
                'group_participants_updated',
                {
                    data: newChat,
                },
                this.key
            )
        })
    }

    async deleteInstance(key: string) {
        try {
            if (this.chatState) {
                await this.chatState.archiveChats()
            }
            if (this.groupState) {
                await this.groupState.archiveGroupChats()
            }
            if (this.messageState) {
                await this.messageState.archiveMessages()
            }
        } catch (e) {
            const msg = 'Error when deleting instance'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getInstanceDetail(key: string) {
        return {
            instance_key: key,
            phone_connected: this.instance?.online,
            webhookEnabled: this.webHookInstance?.enabled,
            webhookUrl: this.webHookInstance?.webHookUrl,
            webhookFilters: this.webHookInstance?.filters,
            websocketEnabled: this.webSocketInstance?.enabled,
            websocketFilters: this.webSocketInstance?.filters,
            user: this.instance?.online ? this.sock?.user : {},
        }
    }

    _getWhatsAppId(id: string) {
        if (id.includes('@g.us') || id.includes('@s.whatsapp.net')) return id
        return id.includes('-') ? `${id}@g.us` : `${id}@s.whatsapp.net`
    }

    async _verifyId(id: string) {
        if (id.includes('@g.us')) return true
        const [result] = (await this.sock?.onWhatsApp(id)) ?? []
        if (result?.exists) return true
        throw new Error('no account exists')
    }

    async onWhatsApp(to: string) {
        try {
            const data = await this._verifyId(this._getWhatsAppId(to))
            return data
        } catch (e) {
            if ((e as Error).message === 'no account exists') return false
            const msg = 'Unable to verify if user is on whatsapp'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendTextMessage(to: string, message: string) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const data = await this.sock?.sendMessage(
                this._getWhatsAppId(to), {
                text: message,
            })
            return data
        } catch (e) {
            const msg = 'Unable to send text message'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendMediaFile(to: string, file: FileType, type: MediaType, caption?: string, filename?: string) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const data = await this.sock?.sendMessage(
                this._getWhatsAppId(to),
                processMessage({
                    type,
                    caption,
                    mimeType: file?.mimetype,
                    buffer: file?.stream,
                    fileName: filename ? filename : file?.originalname,
                })
            )
            return data
        } catch (e) {
            const msg = 'Unable to send media file'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendUrlMediaFile(to: string, url: string, type: MediaType, mimeType: string, caption?: string) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const data = await this.sock?.sendMessage(
                this._getWhatsAppId(to),
                processMessage({
                    type,
                    caption,
                    url,
                    mimeType,
                })
            )
            return data
        } catch (e) {
            const msg = 'Unable to send url media file'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async downloadProfile(of: string) {
        try {
            await this._verifyId(this._getWhatsAppId(of))

            const ppUrl = await this.sock?.profilePictureUrl(
                this._getWhatsAppId(of),
                'image'
            )
            return ppUrl
        } catch (e) {
            const msg = `Unable to download user profile picture`
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getUserStatus(of: string) {
        try {
            await this._verifyId(this._getWhatsAppId(of))

            const status = await this.sock?.fetchStatus(this._getWhatsAppId(of))
            return status
        } catch (e) {
            const msg = `Unable to get user status`
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async blockUnblock(to: string, data: Lock) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const status = await this.sock?.updateBlockStatus(
                this._getWhatsAppId(to),
                data
            )
            return status
        } catch (e) {
            const msg = `Unable to ${data} user`
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendButtonMessage(to: string, data: ButtonMessage) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const result = await this.sock?.sendMessage(
                this._getWhatsAppId(to), {
                templateButtons: processButton(data.buttons),
                text: data.text ?? '',
                footer: data.footerText ?? '',
                viewOnce: true,
            })
            return result
        } catch (e) {
            const msg = 'Unable to send button message'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendContactMessage(to: string, data: VCardData) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const vcard = generateVC(data)
            const result = await this.sock?.sendMessage(
                await this._getWhatsAppId(to),
                {
                    contacts: {
                        displayName: data.fullName,
                        contacts: [{ displayName: data.fullName, vcard }],
                    },
                }
            )
            return result
        } catch (e) {
            const msg = 'Unable to send contact message'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendListMessage(to: string, data: ListMessage) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const result = await this.sock?.sendMessage(this._getWhatsAppId(to), {
                text: data.text,
                sections: data.sections,
                buttonText: data.buttonText,
                footer: data.description,
                title: data.title,
                viewOnce: true,
            })
            return result
        } catch (e) {
            const msg = 'Unable to send list message'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendMediaButtonMessage(to: string, data: MediaButtonMessage) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const result = await this.sock?.sendMessage(this._getWhatsAppId(to), {
                image: { url: data.image! },
                footer: data.footerText ?? '',
                caption: data.text,
                templateButtons: processButton(data.buttons),
                mimetype: data.mimeType,
                viewOnce: true,
            })
            return result
        } catch (e) {
            const msg = 'Unable to send media button message'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async setStatus(status: Status, to: string) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const result = await this.sock?.sendPresenceUpdate(status, to)
            return result
        } catch (e) {
            const msg = 'Unable to set user status'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // change your display picture or a group's
    async updateProfilePicture(id: string, url: string) {
        try {
            const img = await axios.get(url, { responseType: 'arraybuffer' })
            const res = await this.sock?.updateProfilePicture(id, img.data)
            return res
        } catch (e) {
            const msg = 'Unable to update profile picture'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // get user or group object from db by id
    async getUserOrGroupById(id: string) {
        try {
            if (!this.groupState) return
            const group = await this.groupState.findGroupChat(id)
            if (!group) throw new Error('unable to get group, check if the group exists')
            return group
        } catch (e) {
            const msg = 'Error get group failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // Group Methods
    _parseParticipants(users: string[]) {
        return users.map((users) => this._getWhatsAppId(users))
    }

    async createNewGroup(name: string, users: string[]) {
        try {
            const group = await this.sock?.groupCreate(
                name,
                users.map(this._getWhatsAppId)
            )
            return group
        } catch (e) {
            const msg = 'Error create new group failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async addNewParticipant(id: string, users: string[]) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                'add'
            )
            return res
        } catch (e) {
            const msg = 'Unable to add participant, you must be an admin in this group'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async makeAdmin(id: string, users: string[]) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                'promote'
            )
            return res
        } catch (e) {
            const msg = 'Unable to promote some participants, check if you are admin in group or participants exists'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async demoteAdmin(id: string, users: string[]) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                'demote'
            )
            return res
        } catch (e) {
            const msg = 'Unable to demote some participants, check if you are admin in group or participants exists'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getAllGroups() {
        try {
            if (!this.groupState) {
                return null
            }
            return await this.groupState.findGroupChats()
        } catch (e) {
            const msg = 'Unable to list all chats'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async leaveGroup(id: string) {
        try {
            if (!this.groupState) throw new Error('not initialized')
            const group = await this.groupState.findGroupChat(id)
            if (!group) throw new Error('no group exists')
            return await this.sock?.groupLeave(id)
        } catch (e) {
            const msg = 'Error leave group failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getInviteCodeGroup(id: string) {
        try {
            if (!this.groupState) throw new Error('not initialized')
            const group = await this.groupState.findGroupChat(id)
            if (!group)
                throw new Error('unable to get invite code, check if the group exists')
            return await this.sock?.groupInviteCode(id)
        } catch (e) {
            const msg = 'Error get invite group failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getInstanceInviteCodeGroup(id: string) {
        try {
            return await this.sock?.groupInviteCode(id)
        } catch (e) {
            const msg = 'Error get instance invite code group failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async groupFetchAllParticipating() {
        try {
            const result = await this.sock?.groupFetchAllParticipating()
            return result
        } catch (e) {
            const msg = 'Error group fetch all participating failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // update promote demote remove
    async groupParticipantsUpdate(id: string, users: string[], action: ParticipantAction) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                action
            )
            return res
        } catch (e) {
            const msg = `Unable to ${action} some participants, check if you are admin in group or participants exists`
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // update group settings like
    // only allow admins to send messages
    async groupSettingUpdate(id: string, action: GroupAction) {
        try {
            const res = await this.sock?.groupSettingUpdate(
                this._getWhatsAppId(id),
                action
            )
            return res
        } catch (e) {
            const msg = `Unable to ${action} check if you are admin in group`
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async groupUpdateSubject(id: string, subject: string) {
        try {
            const res = await this.sock?.groupUpdateSubject(
                this._getWhatsAppId(id),
                subject
            )
            return res
        } catch (e) {
            const msg = 'Unable to update subject check if you are admin in group'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async groupUpdateDescription(id: string, description?: string) {
        try {
            const res = await this.sock?.groupUpdateDescription(
                this._getWhatsAppId(id),
                description
            )
            return res
        } catch (e) {
            const msg = 'Unable to update description check if you are admin in group'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async readMessage(msgObj: MessageKey) {
        try {
            const key = {
                remoteJid: msgObj.remoteJid,
                id: msgObj.id,
                participant: msgObj?.participant, // required when reading a msg from group
            }
            const res = await this.sock?.readMessages([key])
            return res
        } catch (e) {
            const msg = 'Error read message failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async reactMessage(id: string, key: MessageKey, emoji: string | null) {
        try {
            const reactionMessage = {
                react: {
                    text: emoji, // use an empty string to remove the reaction
                    key: key,
                },
            }
            const res = await this.sock?.sendMessage(
                this._getWhatsAppId(id),
                reactionMessage
            )
            return res
        } catch (e) {
            const msg = 'Error react message failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async logout() {
        try {
            return await this.sock?.logout()
        } catch (e) {
            const msg = 'Error react message failed'
            logger.error(e, msg)
            throw new Error(msg)
        }
    }
}

export default WhatsAppInstance
