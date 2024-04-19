import config from '../../config/config'
import getLogger, {
    getWaCacheLogger,
    getWaLogger,
    isWaQrLoggerDebug,
} from '../../config/logging'
import useAuthState, { AuthState } from '../helper/baileysAuthState'
import useChatState, { ChatState } from '../helper/chatState'
import downloadMessage from '../helper/downloadMsg'
import generateVC, { VCardData } from '../helper/genVc'
import useGroupState, { GroupState } from '../helper/groupState'
import useMessageState, { MessageState } from '../helper/messageState'
import processButton, { ButtonDef } from '../helper/processbtn'
import processMessage, { MediaType } from '../helper/processmessage'
import { AppType, FileType } from '../helper/types'
import { getInstanceService } from '../service/instance'
import { getSessionService } from '../service/session'
import { getCallbackService } from '../service/callback'
import { CallBackBody, CallBackType, Callback } from './callback'

import { Boom } from '@hapi/boom'
import {
    BaileysEventMap,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    default as makeWASocket,
} from '@whiskeysockets/baileys'
import axios from 'axios'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

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
    sections?: Section[]
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

export interface Section {
    title?: string
    rows?: Row[]
}

export interface Row {
    title?: string
    description?: string
    rowId?: string
}

class WhatsAppInstance {
    app: AppType
    socketConfig = {
        connectTimeoutMs: 2 * 60 * 1000,
        defaultQueryTimeoutMs: 20 * 1000,
    }
    logger: ReturnType<typeof getLogger>
    authState: AuthState | null = null
    chatState: ChatState | null = null
    groupState: GroupState | null = null
    messageState: MessageState | null = null
    callbackInstance: Callback | null = null

    config = {
        key: uuidv4(),
        mobile: false,
        dropOnConnClose: true,
        qr: '',
        qr_url: '',
        qrRetry: 0,
        initRetry: 0,
        online: false,
        allowCallback: false,
        callbackAddress: '',
    }

    sock: WASocket | null = null

    constructor (app: AppType, config: Partial<typeof this.config>) {
        this.app = app
        this.config = {
            ...this.config,
            ...config,
        }
        this.logger = getLogger('instance', this.config.key)
        this.callbackInstance = getCallbackService(this.app)
        if (this.config.allowCallback)
            this.callbackInstance = this.callbackInstance.enable(
                this.config.callbackAddress
            )
    }

    async _sendCallback (type: CallBackType, body: CallBackBody, key: string) {
        this.logger.debug(body, `callback: ${type}`)
        this.callbackInstance?.sendCallback(type, body, key)
    }

    async init () {
        try {
            this.authState = await useAuthState(this.app, this.config.key)
            const state = this.authState.readState()
            const socketConfig = {
                auth: {
                    creds: state.creds,
                    /** caching makes the store faster to send/recv messages */
                    keys: makeCacheableSignalKeyStore(
                        state.keys,
                        getWaCacheLogger(this.config.key)
                    ),
                },
                mobile: this.config.mobile,
                browser: <[string, string, string]>Object.values(config.browser),
                logger: getWaLogger(this.config.key),
                printQRInTerminal: isWaQrLoggerDebug(),
                ...this.socketConfig,
            }
            this.sock = makeWASocket(socketConfig)
            this.setHandler()
            getInstanceService(this.app).register(this)
            getSessionService(this.app).saveSession(this)
            return this
        } catch (e) {
            const msg = 'Error when creating instance'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async _drop () {
        try {
            if (this.authState) {
                this.authState.dropCreds()
            }
            return this
        } catch (e) {
            this.logger.error(e, 'Error dropping auth state')
        }
    }

    async _onConnect () {
        if (!config.database.enabled) return
        this.chatState = await useChatState(this.app, this.config.key)
        this.groupState = await useGroupState(this.app, this.config.key)
        this.messageState = await useMessageState(this.app, this.config.key)
    }

    setHandler () {
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
            this.logger.debug(creds, 'creds.update')
            try {
                if (this.authState) {
                    this.authState.saveCreds()
                }
            } catch (e) {
                this.logger.error(e, 'creds.update')
            }
        })

        // on socket closed, opened, connecting
        sock?.ev.on('connection.update', async (update) => {
            this.logger.debug(update, 'connection.update')
            try {
                const { connection, lastDisconnect, qr } = update
                this.logger.info(`STATE: ${connection}`)

                if (connection === 'connecting') return

                if (connection === 'close') {
                    // reconnect if not logged out
                    if (
                        (lastDisconnect?.error as Boom)?.output?.statusCode !==
                        DisconnectReason.loggedOut
                    ) {
                        this.config.initRetry++
                        if (
                            this.config.initRetry < Number(config.instance.maxRetryInit)
                        ) {
                            await this.init()
                        } else {
                            if (this.config.dropOnConnClose) {
                                await this._drop()
                            }
                            this.logger.info('STATE: Init failure')
                            this.config.online = false
                        }
                    } else {
                        if (this.config.dropOnConnClose) {
                            await this._drop()
                        }
                        this.logger.info('STATE: Logged off')
                        this.config.online = false
                    }
                    await this._sendCallback(
                        'connection:close',
                        {
                            connection: connection,
                        },
                        this.config.key
                    )
                } else if (connection === 'open') {
                    await this._onConnect()
                    this.config.online = true
                    await this._sendCallback(
                        'connection:open',
                        {
                            connection: connection,
                        },
                        this.config.key
                    )
                }

                if (qr) {
                    await this._sendCallback(
                        'connection:key',
                        {
                            connection: connection,
                            qr: qr,
                        },
                        this.config.key
                    )
                    this.logger.info(`qr: ${qr}`)
                    QRCode.toDataURL(qr).then((base64image) => {
                        this.config.qr = base64image
                        this.config.qr_url = qr
                        this.config.qrRetry++
                        if (this.config.qrRetry >= Number(config.instance.maxRetryQr)) {
                            // close WebSocket connection
                            this.sock?.ws.close()
                            // remove all events
                            baileysEvents.forEach((ev) =>
                                this.sock?.ev.removeAllListeners(
                                    ev as keyof BaileysEventMap
                                )
                            )
                            // terminated
                            this.config.qr = ' '
                            this.logger.info('socket connection terminated')
                        }
                    })
                }
            } catch (e) {
                this.logger.error(e, 'connection.update')
            }
        })

        // sending presence
        sock?.ev.on('presence.update', async (pres) => {
            this.logger.debug(pres, 'presence.update')
            try {
                await this._sendCallback('presence', pres, this.config.key)
            } catch (e) {
                this.logger.error(e, 'presence.update')
            }
        })

        // on receive all chats/messages
        sock?.ev.on('messaging-history.set', async (ev) => {
            this.logger.debug(ev, 'messaging-history.set')
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
                this.logger.error(e, 'messaging-history.set')
            }
        })

        // on receive new chat
        sock?.ev.on('chats.upsert', async (newChat) => {
            this.logger.debug(newChat, 'chats.upsert')
            try {
                if (this.chatState) {
                    await this.chatState.upsertChats(newChat)
                }
            } catch (e) {
                this.logger.error(e, 'chats.upsert')
            }
        })

        // on chat change
        sock?.ev.on('chats.update', async (changedChat) => {
            this.logger.debug(changedChat, 'chats.update')
            try {
                if (this.chatState) {
                    await this.chatState.updateChats(changedChat)
                }
            } catch (e) {
                this.logger.error(e, 'chats.update')
            }
        })

        // on chat delete
        sock?.ev.on('chats.delete', async (deletedChats) => {
            this.logger.debug(deletedChats, 'chats.delete')
            try {
                if (this.chatState) {
                    await this.chatState.deleteChats(deletedChats)
                }
            } catch (e) {
                this.logger.error(e, 'chats.delete')
            }
        })

        // on new mssage
        sock?.ev.on('messages.upsert', async (m) => {
            this.logger.debug(m, 'messages.upsert')
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
                        ['protocolMessage', 'senderKeyDistributionMessage'].includes(
                            messageType
                        )
                    )
                        return

                    const data = {
                        ...{ key: this.config.key },
                        ...msg,
                        messageKey: msg.key,
                        instanceKey: this.config.key,
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
                    await this._sendCallback('message', data, this.config.key)
                })
            } catch (e) {
                this.logger.error(e, 'messages.upsert')
            }
        })

        // on mssage change
        sock?.ev.on('messages.update', async (messages) => {
            this.logger.debug(messages, 'messages.update')
            try {
                if (this.messageState) {
                    await this.messageState.updateMessages(messages)
                }
            } catch (e) {
                this.logger.error(e, 'messages.update')
            }
        })

        // on mssage delete
        sock?.ev.on('messages.delete', async (messages) => {
            this.logger.debug(messages, 'messages.delete')
            try {
                if (this.messageState) {
                    await this.messageState.deleteMessages(messages)
                }
            } catch (e) {
                this.logger.error(e, 'messages.delete')
            }
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock?.ws.on('CB:call', async (data: any) => {
            this.logger.debug(data, 'CB:call')
            if (data.content) {
                if (data.content.find((e: { tag: string }) => e.tag === 'offer')) {
                    const content = data.content.find(
                        (e: { tag: string }) => e.tag === 'offer'
                    )
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
                        this.config.key
                    )
                } else if (
                    data.content.find((e: { tag: string }) => e.tag === 'terminate')
                ) {
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
                        this.config.key
                    )
                }
            }
        })

        sock?.ev.on('groups.upsert', async (newChat) => {
            this.logger.debug(newChat, 'groups.upsert')
            try {
                if (this.groupState) {
                    await this.groupState.upsertGroupChats(newChat)
                }
                await this._sendCallback(
                    'group_created',
                    {
                        data: newChat,
                    },
                    this.config.key
                )
            } catch (e) {
                this.logger.error(e, 'groups.upsert')
            }
        })

        sock?.ev.on('groups.update', async (newChat) => {
            this.logger.debug(newChat, 'groups.update')
            try {
                if (this.groupState) {
                    await this.groupState.updateGroupChats(newChat)
                }
                await this._sendCallback(
                    'group_updated',
                    {
                        data: newChat,
                    },
                    this.config.key
                )
            } catch (e) {
                this.logger.error(e, 'groups.update')
            }
        })

        sock?.ev.on('group-participants.update', async (newChat) => {
            this.logger.debug(newChat, 'group-participants.update')
            if (this.groupState) {
                await this.groupState.updateGroupParticipants(newChat)
            }
            await this._sendCallback(
                'group_participants_updated',
                {
                    data: newChat,
                },
                this.config.key
            )
        })
    }

    async deleteInstance () {
        try {
            await this._drop()
            if (this.chatState) {
                await this.chatState.archiveChats()
            }
            if (this.groupState) {
                await this.groupState.archiveGroupChats()
            }
            if (this.messageState) {
                await this.messageState.archiveMessages()
            }
            getInstanceService(this.app).unregister(this)
        } catch (e) {
            const msg = 'Error when deleting instance'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getInstanceDetail () {
        return {
            instance_key: this.config.key,
            instance_type: this.config.mobile ? 'mobile' : 'web',
            phone_connected: this.config.online,
            callbackEnabled: this.callbackInstance?.enabled,
            callbackUrl: this.callbackInstance?.address,
            callbackFilters: this.callbackInstance?.filters,
            callbackService: this.callbackInstance?.serviceName,
            user: this.config?.online ? this.sock?.user : {},
        }
    }

    _getWhatsAppId (id: string) {
        if (id.includes('@g.us') || id.includes('@s.whatsapp.net')) return id
        return id.includes('-') ? `${id}@g.us` : `${id}@s.whatsapp.net`
    }

    async _verifyId (id: string) {
        if (id.includes('@g.us')) return true
        const [result] = (await this.sock?.onWhatsApp(id)) ?? []
        if (result?.exists) return true
        throw new Error('no account exists')
    }

    async onWhatsApp (to: string) {
        try {
            const data = await this._verifyId(this._getWhatsAppId(to))
            return data
        } catch (e) {
            if ((e as Error).message === 'no account exists') return false
            const msg = 'Unable to verify if user is on whatsapp'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendTextMessage (to: string, message: string) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const data = await this.sock?.sendMessage(this._getWhatsAppId(to), {
                text: message,
            })
            return data
        } catch (e) {
            const msg = 'Unable to send text message'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendMediaFile (
        to: string,
        file: FileType,
        type: MediaType,
        caption?: string,
        filename?: string
    ) {
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
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendUrlMediaFile (
        to: string,
        url: string,
        type: MediaType,
        mimeType: string,
        caption?: string,
        fileName?: string
    ) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const data = await this.sock?.sendMessage(
                this._getWhatsAppId(to),
                processMessage({
                    type,
                    caption,
                    url,
                    mimeType,
                    fileName,
                })
            )
            return data
        } catch (e) {
            const msg = 'Unable to send url media file'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async downloadProfile (of: string) {
        try {
            await this._verifyId(this._getWhatsAppId(of))

            const ppUrl = await this.sock?.profilePictureUrl(
                this._getWhatsAppId(of),
                'image'
            )
            return ppUrl
        } catch (e) {
            const msg = `Unable to download user profile picture`
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getUserStatus (of: string) {
        try {
            await this._verifyId(this._getWhatsAppId(of))

            const status = await this.sock?.fetchStatus(this._getWhatsAppId(of))
            return status
        } catch (e) {
            const msg = `Unable to get user status`
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async blockUnblock (to: string, data: Lock) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const status = await this.sock?.updateBlockStatus(
                this._getWhatsAppId(to),
                data
            )
            return status
        } catch (e) {
            const msg = `Unable to ${data} user`
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendButtonMessage (to: string, data: ButtonMessage) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const result = await this.sock?.sendMessage(this._getWhatsAppId(to), {
                templateButtons: processButton(data.buttons),
                text: data.text ?? '',
                footer: data.footerText ?? '',
                viewOnce: true,
            })
            return result
        } catch (e) {
            const msg = 'Unable to send button message'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendContactMessage (to: string, data: VCardData) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const vcard = generateVC(data)
            const result = await this.sock?.sendMessage(await this._getWhatsAppId(to), {
                contacts: {
                    displayName: data.fullName,
                    contacts: [{ displayName: data.fullName, vcard }],
                },
            })
            return result
        } catch (e) {
            const msg = 'Unable to send contact message'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendListMessage (to: string, data: ListMessage) {
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
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async sendMediaButtonMessage (to: string, data: MediaButtonMessage) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const result = await this.sock?.sendMessage(this._getWhatsAppId(to), {
                image: { url: data.image! },
                footer: data.footerText ?? '',
                caption: data.text ?? '',
                templateButtons: processButton(data.buttons),
                mimetype: data.mimeType,
                viewOnce: true,
            })
            return result
        } catch (e) {
            const msg = 'Unable to send media button message'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async setStatus (status: Status, to: string) {
        try {
            await this._verifyId(this._getWhatsAppId(to))

            const result = await this.sock?.sendPresenceUpdate(
                status,
                this._getWhatsAppId(to)
            )
            return result
        } catch (e) {
            const msg = 'Unable to set user status'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // change your display picture or a group's
    async updateProfilePicture (id: string, url: string) {
        try {
            const img = await axios.get(url, { responseType: 'arraybuffer' })
            const res = await this.sock?.updateProfilePicture(
                this._getWhatsAppId(id),
                img.data
            )
            return res
        } catch (e) {
            const msg = 'Unable to update profile picture'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // get user or group object from db by id
    async getUserOrGroupById (id: string) {
        try {
            if (!this.groupState) return
            const group = await this.groupState.findGroupChat(this._getWhatsAppId(id))
            if (!group) throw new Error('unable to get group, check if the group exists')
            return group
        } catch (e) {
            const msg = 'Error get group failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // Group Methods
    _parseParticipants (users: string[]) {
        return users.map((users) => this._getWhatsAppId(users))
    }

    async createNewGroup (name: string, users: string[]) {
        try {
            const group = await this.sock?.groupCreate(
                name,
                this._parseParticipants(users)
            )
            return group
        } catch (e) {
            const msg = 'Error create new group failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async addNewParticipant (id: string, users: string[]) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                'add'
            )
            return res
        } catch (e) {
            const msg = 'Unable to add participant, you must be an admin in this group'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async makeAdmin (id: string, users: string[]) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                'promote'
            )
            return res
        } catch (e) {
            const msg =
                'Unable to promote some participants, check if you are admin in group or participants exists'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async demoteAdmin (id: string, users: string[]) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                'demote'
            )
            return res
        } catch (e) {
            const msg =
                'Unable to demote some participants, check if you are admin in group or participants exists'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getAllGroups () {
        try {
            if (!this.groupState) {
                return null
            }
            return await this.groupState.findGroupChats()
        } catch (e) {
            const msg = 'Unable to list all chats'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async leaveGroup (id: string) {
        try {
            if (!this.groupState) throw new Error('not initialized')
            const group = await this.groupState.findGroupChat(this._getWhatsAppId(id))
            if (!group) throw new Error('no group exists')
            return await this.sock?.groupLeave(this._getWhatsAppId(id))
        } catch (e) {
            const msg = 'Error leave group failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getInviteCodeGroup (id: string) {
        try {
            if (!this.groupState) throw new Error('not initialized')
            const group = await this.groupState.findGroupChat(this._getWhatsAppId(id))
            if (!group)
                throw new Error('unable to get invite code, check if the group exists')
            return await this.sock?.groupInviteCode(this._getWhatsAppId(id))
        } catch (e) {
            const msg = 'Error get invite group failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async getInstanceInviteCodeGroup (id: string) {
        try {
            return await this.sock?.groupInviteCode(this._getWhatsAppId(id))
        } catch (e) {
            const msg = 'Error get instance invite code group failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async groupFetchAllParticipating () {
        try {
            const result = await this.sock?.groupFetchAllParticipating()
            return result
        } catch (e) {
            const msg = 'Error group fetch all participating failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // update promote demote remove
    async groupParticipantsUpdate (
        id: string,
        users: string[],
        action: ParticipantAction
    ) {
        try {
            const res = await this.sock?.groupParticipantsUpdate(
                this._getWhatsAppId(id),
                this._parseParticipants(users),
                action
            )
            return res
        } catch (e) {
            const msg = `Unable to ${action} some participants, check if you are admin in group or participants exists`
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    // update group settings like
    // only allow admins to send messages
    async groupSettingUpdate (id: string, action: GroupAction) {
        try {
            const res = await this.sock?.groupSettingUpdate(
                this._getWhatsAppId(id),
                action
            )
            return res
        } catch (e) {
            const msg = `Unable to ${action} check if you are admin in group`
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async groupUpdateSubject (id: string, subject: string) {
        try {
            const res = await this.sock?.groupUpdateSubject(
                this._getWhatsAppId(id),
                subject
            )
            return res
        } catch (e) {
            const msg = 'Unable to update subject check if you are admin in group'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async groupUpdateDescription (id: string, description?: string) {
        try {
            const res = await this.sock?.groupUpdateDescription(
                this._getWhatsAppId(id),
                description
            )
            return res
        } catch (e) {
            const msg = 'Unable to update description check if you are admin in group'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async readMessage (msgObj: MessageKey) {
        try {
            const key = {
                ...(msgObj.remoteJid
                    ? { remoteJid: this._getWhatsAppId(msgObj.remoteJid) }
                    : {}),
                id: msgObj.id,
                // required when reading a msg from group
                ...(msgObj.participant
                    ? { participant: this._getWhatsAppId(msgObj.participant) }
                    : {}),
            }
            const res = await this.sock?.readMessages([key])
            return res
        } catch (e) {
            const msg = 'Error read message failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async reactMessage (id: string, key: MessageKey, emoji: string | null) {
        try {
            const reactionMessage = {
                react: {
                    text: emoji, // use an empty string to remove the reaction
                    key: {
                        ...key,
                        ...(key.remoteJid
                            ? { remoteJid: this._getWhatsAppId(key.remoteJid) }
                            : {}),
                    },
                },
            }
            const res = await this.sock?.sendMessage(
                this._getWhatsAppId(id),
                reactionMessage
            )
            return res
        } catch (e) {
            const msg = 'Error react message failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }

    async logout () {
        try {
            await this.sock?.logout()
        } catch (e) {
            const msg = 'Error logout failed'
            this.logger.error(e, msg)
            throw new Error(msg)
        }
    }
}

export default WhatsAppInstance
