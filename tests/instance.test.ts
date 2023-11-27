/* eslint-disable @typescript-eslint/no-explicit-any */
import WhatsAppInstance, { ListMessage } from '../src/api/class/instance'
import express, { Application } from 'express'
import useAuthState from '../src/api/helper/baileysAuthState'
import makeWASocket from '@whiskeysockets/baileys'
import getLogger from '../src/config/logging'
import { MediaType } from '../src/api/helper/processmessage'
import generateVC, { VCardData } from '../src/api/helper/genVc'
import axios from 'axios'

const ioc: Record<string, any> = {}
jest.mock('express', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        get: jest.fn((key: string) => ioc[key]),
        set: jest.fn((key: string, value) => (ioc[key] = value)),
    })),
}))

jest.mock('@whiskeysockets/baileys', () => ({
    __esModule: true,
    default: jest.fn(),
    makeCacheableSignalKeyStore: jest.fn((pass, _) => pass),
}))

jest.mock('../src/api/helper/baileysAuthState', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('../src/config/logging', () => {
    const logger = {
        error: jest.fn(),
    }
    return {
        __esModule: true,
        default: jest.fn((name) => logger),
        getWaLogger: jest.fn(() => logger),
        getWaCacheLogger: jest.fn(() => logger),
    }
})

const useAuthStateMock = useAuthState as jest.Mock
const makeWASocketMock = makeWASocket as jest.Mock

describe('WhatsAppInstance', () => {
    let app: Application
    let instance: WhatsAppInstance
    let logger: ReturnType<typeof getLogger>

    beforeEach(() => {
        jest.clearAllMocks()
        app = express()
        instance = new WhatsAppInstance(app)
        logger = getLogger('')
    })

    describe('init', () => {
        it('should initialize correctly', async () => {
            const state = {
                creds: 'someCreds',
                keys: 'keys',
            }

            const mockState = {
                readState: jest.fn().mockReturnValue(state),
            }
            useAuthStateMock.mockResolvedValue(mockState)

            const sock = {
                ev: {
                    on: jest.fn(),
                },
                ws: {
                    on: jest.fn(),
                },
            }
            makeWASocketMock.mockReturnValue(sock)

            const result = await instance.init()

            expect(useAuthState).toHaveBeenCalledWith(app, instance.key)

            expect(makeWASocket).toHaveBeenCalledWith(
                expect.objectContaining({
                    auth: state,
                    ...instance.socketConfig,
                })
            )

            expect(result).toBeInstanceOf(WhatsAppInstance)
            expect(result.key).toBe(instance.key)
            expect(result.sock).toMatchObject(expect.objectContaining(sock))
            expect(sock.ev.on).toBeCalled()
            expect(sock.ws.on).toBeCalled()
        })

        it('should handle exceptions from makeWASocket', async () => {
            useAuthStateMock.mockResolvedValue({
                readState: jest.fn().mockReturnValue({
                    creds: 'someCreds',
                    keys: 'keys',
                }),
            })

            makeWASocketMock.mockImplementation(() => {
                throw new Error('Intentional error from makeWASocket for testing')
            })

            await expect(instance.init()).rejects.toThrow('Error when creating instance')

            expect(logger.error).toHaveBeenCalledWith(
                expect.any(Error),
                'Error when creating instance'
            )
        })
    })

    describe('_getWhatsAppId', () => {
        it('should return the same ID if it already contains @g.us', () => {
            const id = '12345678@g.us'
            const result = instance._getWhatsAppId(id)
            expect(result).toBe(id)
        })

        it('should return the same ID if it already contains @s.whatsapp.net', () => {
            const id = '12345678@s.whatsapp.net'
            const result = instance._getWhatsAppId(id)
            expect(result).toBe(id)
        })

        it('should append @g.us if the ID contains a -', () => {
            const id = '1234-5678'
            const expected = '1234-5678@g.us'
            const result = instance._getWhatsAppId(id)
            expect(result).toBe(expected)
        })

        it('should append @s.whatsapp.net for all other IDs', () => {
            const id = '12345678'
            const expected = '12345678@s.whatsapp.net'
            const result = instance._getWhatsAppId(id)
            expect(result).toBe(expected)
        })
    })

    describe('onWhatsApp', () => {
        const testId = 'test'
        const testIdDomain = `${testId}@s.whatsapp.net`
        const errorMsg = 'Unable to verify if user is on whatsapp'
        const noAccountExistsError = new Error('no account exists')
        const randomError = new Error('random error')

        beforeEach(async () => {
            instance._getWhatsAppId = jest.spyOn(instance, '_getWhatsAppId') as any
        })

        it('should return data when _verifyId is successful', async () => {
            instance._verifyId = jest.fn().mockResolvedValue(true)

            const result = await instance.onWhatsApp(testId)

            expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
            expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
            expect(result).toBe(true)
        })

        it('should return false when _verifyId throws "no account exists" error', async () => {
            instance._verifyId = jest.fn().mockRejectedValue(noAccountExistsError)

            const result = await instance.onWhatsApp(testId)

            expect(result).toBe(false)
        })

        it('should throw an error with correct message when _verifyId throws a different error', async () => {
            instance._verifyId = jest.fn().mockRejectedValue(randomError)

            await expect(instance.onWhatsApp(testId)).rejects.toThrow(errorMsg)

            expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
        })
    })

    describe('getUserOrGroupById', () => {
        const mockGroup = { _id: '0', id: '12345678', name: 'Test Group' }
        const groupId = '12345678'
        const groupIdDomain = `${groupId}@s.whatsapp.net`
        const errorMsg = 'Error get group failed'
        const dbError = new Error('DB Error')

        beforeEach(() => {
            const groupState = {
                findGroupChat: jest.fn().mockResolvedValue(mockGroup),
            }
            instance.groupState = (groupState as any) as typeof instance['groupState']
            instance._getWhatsAppId = jest.spyOn(instance, '_getWhatsAppId') as any
        })

        it('should successfully get a group by ID', async () => {
            const result = await instance.getUserOrGroupById(groupId)

            expect(instance._getWhatsAppId).toHaveBeenCalledWith(groupId)
            expect(instance?.groupState?.findGroupChat).toHaveBeenCalledWith(
                groupIdDomain
            )
            expect(result).toEqual(mockGroup)
        })

        it('should return undefined if groupState is not initialized', async () => {
            instance.groupState = null

            const result = await instance.getUserOrGroupById(groupId)

            expect(result).toBeUndefined()
        })

        it('should throw an error if group not found', async () => {
            jest.spyOn(instance.groupState!, 'findGroupChat').mockResolvedValue(null)

            await expect(instance.getUserOrGroupById(groupId)).rejects.toThrow(errorMsg)

            expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
        })

        it('should throw a general error when findGroupChat throws an error', async () => {
            jest.spyOn(instance.groupState!, 'findGroupChat').mockRejectedValue(dbError)

            await expect(instance.getUserOrGroupById(groupId)).rejects.toThrow(errorMsg)

            expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
        })
    })

    describe('_parseParticipants', () => {
        const users = ['user1', 'user2', 'user3']
        const expectedOutput = [
            'user1@s.whatsapp.net',
            'user2@s.whatsapp.net',
            'user3@s.whatsapp.net',
        ]

        beforeEach(() => {
            instance._getWhatsAppId = jest.fn((user) => `${user}@s.whatsapp.net`)
        })

        it('should transform a list of users to their WhatsApp IDs', () => {
            const result = instance._parseParticipants(users)

            expect(result).toEqual(expectedOutput)
            users.forEach((user) => {
                expect(instance._getWhatsAppId).toHaveBeenCalledWith(user)
            })
        })

        it('should handle single user in the array', () => {
            const result = instance._parseParticipants([users[0]])

            expect(result).toEqual([expectedOutput[0]])
            expect(instance._getWhatsAppId).toHaveBeenCalledWith(users[0])
        })

        it('should return an empty array if provided with an empty user list', () => {
            const result = instance._parseParticipants([])

            expect(result).toEqual([])
            expect(instance._getWhatsAppId).not.toHaveBeenCalled()
        })
    })

    describe('getAllGroups', () => {
        const errorMsg = 'Unable to list all chats'
        const sampleGroups = [
            { id: 'group1@s.whatsapp.net', name: 'Group 1' },
            { id: 'group2@s.whatsapp.net', name: 'Group 2' },
        ]
        const fetchError = new Error('Fetch failed')

        beforeEach(() => {
            const groupState = {
                findGroupChats: jest.fn().mockResolvedValue(sampleGroups),
            }
            instance.groupState = (groupState as any) as typeof instance['groupState']
        })

        it('should return all group chats when groupState is available', async () => {
            const result = await instance.getAllGroups()

            expect(instance.groupState?.findGroupChats).toHaveBeenCalledTimes(1)
            expect(result).toEqual(sampleGroups)
        })

        it('should return null if groupState is not available', async () => {
            jest.spyOn(instance.groupState!, 'findGroupChats').mockResolvedValue(null)

            const result = await instance.getAllGroups()

            expect(result).toBeNull()
        })

        it('should throw an error if findGroupChats fails', async () => {
            jest.spyOn(instance.groupState!, 'findGroupChats').mockRejectedValue(
                fetchError
            )

            await expect(instance.getAllGroups()).rejects.toThrow(errorMsg)

            expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
        })
    })

    describe('<sock functions>', () => {
        const prepInstance = async (sock: any) => {
            useAuthStateMock.mockResolvedValue({
                readState: jest.fn().mockReturnValue({
                    creds: 'someCreds',
                    keys: 'keys',
                }),
            })
            makeWASocketMock.mockReturnValue({
                ev: {
                    on: jest.fn(),
                },
                ws: {
                    on: jest.fn(),
                },
                ...sock,
            })
            await instance.init()
        }

        beforeEach(async () => {
            instance._verifyId = jest.spyOn(instance, '_verifyId') as any
            instance._getWhatsAppId = jest.spyOn(instance, '_getWhatsAppId') as any
            instance._parseParticipants = jest.spyOn(
                instance,
                '_parseParticipants'
            ) as any
            ;(instance._verifyId as jest.Mock).mockResolvedValue(true)
        })

        describe('_verifyId', () => {
            const testId = 'test'
            const errorMsg = 'no account exists'

            beforeEach(async () => {
                ;(instance._verifyId as jest.Mock).mockRestore()
            })

            it('should return true when id includes "@g.us"', async () => {
                await prepInstance({
                    onWhatsApp: jest.fn(),
                })

                const result = await instance._verifyId(`${testId}@g.us`)

                expect(result).toBe(true)
                expect(instance?.sock?.onWhatsApp).not.toHaveBeenCalled()
            })

            it('should return true when sock onWhatsApp returns an exists value', async () => {
                await prepInstance({
                    onWhatsApp: jest.fn().mockResolvedValue([{ exists: true }]),
                })

                const result = await instance._verifyId(testId)

                expect(result).toBe(true)
                expect(instance?.sock?.onWhatsApp).toHaveBeenCalledWith(testId)
            })

            it('should throw an error when sock onWhatsApp does not return an exists value', async () => {
                await prepInstance({
                    onWhatsApp: jest.fn().mockResolvedValue([{}]),
                })

                await expect(instance._verifyId(testId)).rejects.toThrow(errorMsg)
            })
        })

        describe('sendTextMessage', () => {
            const message = 'Hello'
            const response = 'MessageSentResponse'
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const testIdGroup = `1234-5678`
            const testIdGroupDomain = `${testIdGroup}@g.us`
            const testIdFixed = 'some-id@s.whatsapp.net'
            const errorMsg = 'Unable to send text message'
            const verificationError = new Error('Verification failed')
            const sendError = new Error('Sending failed')

            beforeEach(async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully send a text message for regular ID', async () => {
                const result = await instance.sendTextMessage(testId, message)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(testIdDomain, {
                    text: message,
                })
                expect(result).toBe(response)
            })

            it('should successfully send a text message for group ID', async () => {
                const result = await instance.sendTextMessage(testIdGroup, message)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testIdGroup)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdGroupDomain)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(
                    testIdGroupDomain,
                    {
                        text: message,
                    }
                )
                expect(result).toBe(response)
            })

            it('should not modify the ID if it already has @s.whatsapp.net', async () => {
                const result = await instance.sendTextMessage(testIdFixed, message)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testIdFixed)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdFixed)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(testIdFixed, {
                    text: message,
                })
                expect(result).toBe(response)
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(instance.sendTextMessage(testId, message)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if sendMessage fails', async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockRejectedValue(sendError),
                })

                await expect(instance.sendTextMessage(testId, message)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('sendUrlMediaFile', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const url = 'example.com'
            const title = 'Caption'
            const image = { type: 'image' as MediaType, mime: 'image/jpeg' }
            const audio = { type: 'audio' as MediaType, mime: 'audio/mpeg' }
            const video = { type: 'video' as MediaType, mime: 'video/mp4' }
            const pdf = {
                type: 'document' as MediaType,
                mime: 'application/pdf',
                file: 'Sample.pdf',
            }
            const response = 'MessageSentResponse'
            const errorMsg = 'Unable to send url media file'
            const verificationError = new Error('Verification failed')
            const sendError = new Error('Sending failed')

            beforeEach(async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockResolvedValue(response),
                })
            })

            const sendUrlMediaFileTestHelper = async (
                type: MediaType,
                mimeType: string,
                caption: string | null,
                fileName: string | null,
                expected: object
            ) => {
                const result = await instance.sendUrlMediaFile(
                    testId,
                    url,
                    type,
                    mimeType,
                    caption ?? undefined,
                    fileName ?? undefined
                )

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(
                    testIdDomain,
                    expected
                )
                expect(result).toBe(response)
            }

            it('should successfully send an image without caption', async () => {
                await sendUrlMediaFileTestHelper(image.type, image.mime, null, null, {
                    image: { url: url },
                    mimetype: image.mime,
                })
            })

            it('should successfully send an image with caption', async () => {
                await sendUrlMediaFileTestHelper(image.type, image.mime, title, null, {
                    image: { url: url },
                    mimetype: image.mime,
                    caption: title,
                })
            })

            it('should successfully send an audio ', async () => {
                await sendUrlMediaFileTestHelper(audio.type, audio.mime, title, null, {
                    audio: { url: url },
                    mimetype: audio.mime,
                    // caption: title, //ignored
                    ptt: true,
                })
            })

            it('should successfully send a video ', async () => {
                await sendUrlMediaFileTestHelper(video.type, video.mime, title, null, {
                    video: { url: url },
                    mimetype: video.mime,
                    caption: title,
                })
            })

            it('should successfully send a document with filename', async () => {
                await sendUrlMediaFileTestHelper(pdf.type, pdf.mime, title, pdf.file, {
                    document: { url: url },
                    mimetype: pdf.mime,
                    fileName: pdf.file,
                    // caption: title, //ignored
                })
            })

            it('should successfully send a document with no filename', async () => {
                await sendUrlMediaFileTestHelper(pdf.type, pdf.mime, title, null, {
                    document: { url: url },
                    mimetype: pdf.mime,
                    // caption: title, //ignored
                })
            })

            it('should successfully send a sticker', async () => {
                await sendUrlMediaFileTestHelper('sticker', image.mime, title, null, {
                    sticker: { url: url },
                    mimetype: image.mime,
                    // caption: title, //ignored
                })
            })

            it('should throw an error for unsupported media type', async () => {
                await expect(
                    instance.sendUrlMediaFile(
                        testId,
                        url,
                        'unsupportedType' as any,
                        'mime'
                    )
                ).rejects.toThrow(errorMsg)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendMessage).not.toHaveBeenCalled()
                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(
                    instance.sendUrlMediaFile(testId, url, image.type, image.mime)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if sendMessage fails', async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockRejectedValue(sendError),
                })

                await expect(
                    instance.sendUrlMediaFile(testId, url, image.type, image.mime)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('downloadProfile', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const mockProfilePicURL = 'https://example.com/profilepic.jpg'
            const errorMsg = 'Unable to download user profile picture'
            const verificationError = new Error('Verification failed')
            const fetchError = new Error('Fetching profile pic failed')

            beforeEach(async () => {
                await prepInstance({
                    profilePictureUrl: jest.fn().mockResolvedValue(mockProfilePicURL),
                })
            })

            it('should successfully download profile picture for a given ID', async () => {
                const result = await instance.downloadProfile(testId)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.profilePictureUrl).toHaveBeenCalledWith(
                    testIdDomain,
                    'image'
                )
                expect(result).toBe(mockProfilePicURL)
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(instance.downloadProfile(testId)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if profilePictureUrl fails', async () => {
                await prepInstance({
                    profilePictureUrl: jest.fn().mockRejectedValue(fetchError),
                })

                await expect(instance.downloadProfile(testId)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('getUserStatus', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const userStatus = 'Online'
            const errorMsg = 'Unable to get user status'
            const verificationError = new Error('Verification failed')
            const fetchError = new Error('Fetching status failed')

            beforeEach(async () => {
                await prepInstance({
                    fetchStatus: jest.fn().mockResolvedValue(userStatus),
                })
            })

            it('should successfully fetch user status for a given ID', async () => {
                const result = await instance.getUserStatus(testId)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.fetchStatus).toHaveBeenCalledWith(testIdDomain)
                expect(result).toBe(userStatus)
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(instance.getUserStatus(testId)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if fetchStatus fails', async () => {
                await prepInstance({
                    fetchStatus: jest.fn().mockRejectedValue(fetchError),
                })

                await expect(instance.getUserStatus(testId)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('blockUnblock', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const blockErrorMsg = 'Unable to block user'
            const unblockErrorMsg = 'Unable to unblock user'
            const verificationError = new Error('Verification failed')
            const blockFailedError = new Error('Blocking failed')

            beforeEach(async () => {
                await prepInstance({
                    updateBlockStatus: jest.fn().mockResolvedValue(true),
                })
            })

            it('should successfully block the user', async () => {
                const result = await instance.blockUnblock(testId, 'block')

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.updateBlockStatus).toHaveBeenCalledWith(
                    testIdDomain,
                    'block'
                )
                expect(result).toBe(true)
            })

            it('should successfully unblock the user', async () => {
                const result = await instance.blockUnblock(testId, 'unblock')

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.updateBlockStatus).toHaveBeenCalledWith(
                    testIdDomain,
                    'unblock'
                )
                expect(result).toBe(true)
            })

            it('should throw an error if ID verification fails while blocking', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(instance.blockUnblock(testId, 'block')).rejects.toThrow(
                    blockErrorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(
                    expect.any(Error),
                    blockErrorMsg
                )
            })

            it('should throw an error if ID verification fails while unblocking', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(instance.blockUnblock(testId, 'unblock')).rejects.toThrow(
                    unblockErrorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(
                    expect.any(Error),
                    unblockErrorMsg
                )
            })

            it('should throw an error if updateBlockStatus fails', async () => {
                await prepInstance({
                    updateBlockStatus: jest.fn().mockRejectedValue(blockFailedError),
                })

                await expect(instance.blockUnblock(testId, 'block')).rejects.toThrow(
                    blockErrorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(
                    expect.any(Error),
                    blockErrorMsg
                )
            })
        })

        describe('sendButtonMessage', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const title = 'ButtonTitle'
            const url = 'example.com'
            const phone = '+1234567890'
            const buttons = {
                url: {
                    s: {
                        type: 'urlButton',
                        title: title,
                        payload: url,
                    },
                    e: {
                        urlButton: {
                            displayText: title,
                            url: url,
                        },
                    },
                },
                call: {
                    s: {
                        type: 'callButton',
                        title: title,
                        payload: phone,
                    },
                    e: {
                        callButton: {
                            displayText: title,
                            phoneNumber: phone,
                        },
                    },
                },
                reply: {
                    s: {
                        type: 'replyButton',
                        title: title,
                        payload: 'ReplyPayload',
                    },
                    e: {
                        quickReplyButton: {
                            displayText: title,
                        },
                    },
                },
            }
            const buttonText = 'sampleText'
            const buttonFooterText = 'sampleFooter'
            const response = 'ButtonMessageResponse'
            const errorMsg = 'Unable to send button message'
            const verificationError = new Error('Verification failed')
            const sendError = new Error('Sending failed')

            beforeEach(async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockResolvedValue(response),
                })
            })

            const sendButtonMessageTestHelper = async (
                button = [buttons.url, buttons.call, buttons.reply],
                text = true,
                footer = true
            ) => {
                const result = await instance.sendButtonMessage(testId, {
                    buttons: button.map((b) => b.s),
                    text: text ? buttonText : undefined,
                    footerText: footer ? buttonFooterText : undefined,
                })

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(testIdDomain, {
                    templateButtons: button.map((b) => b.e),
                    text: text ? buttonText : '',
                    footer: footer ? buttonFooterText : '',
                    viewOnce: true,
                })
                expect(result).toBe(response)
            }

            it('should successfully send a replyButton message', async () => {
                await sendButtonMessageTestHelper([buttons.reply])
            })

            it('should successfully send a callButton message', async () => {
                await sendButtonMessageTestHelper([buttons.call])
            })

            it('should successfully send a urlButton message', async () => {
                await sendButtonMessageTestHelper([buttons.url])
            })

            it('should successfully send a button message without text', async () => {
                await sendButtonMessageTestHelper([buttons.url], false)
            })

            it('should successfully send a button message without footer', async () => {
                await sendButtonMessageTestHelper([buttons.url], undefined, false)
            })

            it('should successfully send a button message with more than one button', async () => {
                await sendButtonMessageTestHelper()
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(
                    instance.sendButtonMessage(testId, {
                        buttons: [buttons.url.s],
                    })
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if sendMessage fails', async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockRejectedValue(sendError),
                })

                await expect(
                    instance.sendButtonMessage(testId, {
                        buttons: [buttons.url.s],
                    })
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('sendContactMessage', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const data: VCardData = {
                fullName: 'John Doe',
                organization: 'Tech Corp',
                phoneNumber: testId,
            }
            const vcardData = generateVC(data)
            const response = 'ContactMessageResponse'
            const errorMsg = 'Unable to send contact message'
            const verificationError = new Error('Verification failed')
            const sendError = new Error('Sending failed')

            beforeEach(async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully send a contact message', async () => {
                const result = await instance.sendContactMessage(testId, data)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(testIdDomain, {
                    contacts: {
                        displayName: data.fullName,
                        contacts: [{ displayName: data.fullName, vcard: vcardData }],
                    },
                })
                expect(result).toBe(response)
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(instance.sendContactMessage(testId, data)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if sendMessage fails', async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockRejectedValue(sendError),
                })

                await expect(instance.sendContactMessage(testId, data)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('sendListMessage', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const response = 'ListMessageSentResponse'
            const errorMsg = 'Unable to send list message'
            const verificationError = new Error('Verification failed')
            const sendError = new Error('Sending failed')
            const sampleData: ListMessage = {
                text: 'Sample List Message',
                sections: [{ title: 'Section 1', rows: [{ title: 'Row 1' }] }],
                buttonText: 'Click Me',
                description: 'Sample Description',
                title: 'Sample Title',
            }

            beforeEach(async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully send a list message', async () => {
                const result = await instance.sendListMessage(testId, sampleData)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(testIdDomain, {
                    text: sampleData.text,
                    sections: sampleData.sections,
                    buttonText: sampleData.buttonText,
                    footer: sampleData.description,
                    title: sampleData.title,
                    viewOnce: true,
                })
                expect(result).toBe(response)
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(
                    instance.sendListMessage(testId, sampleData)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if sendMessage fails', async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockRejectedValue(sendError),
                })

                await expect(
                    instance.sendListMessage(testId, sampleData)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('sendMediaButtonMessage', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const title = 'ButtonTitle'
            const url = 'example.com'
            const phone = '+1234567890'
            const buttons = {
                url: {
                    s: {
                        type: 'urlButton',
                        title: title,
                        payload: url,
                    },
                    e: {
                        urlButton: {
                            displayText: title,
                            url: url,
                        },
                    },
                },
                call: {
                    s: {
                        type: 'callButton',
                        title: title,
                        payload: phone,
                    },
                    e: {
                        callButton: {
                            displayText: title,
                            phoneNumber: phone,
                        },
                    },
                },
                reply: {
                    s: {
                        type: 'replyButton',
                        title: title,
                        payload: 'ReplyPayload',
                    },
                    e: {
                        quickReplyButton: {
                            displayText: title,
                        },
                    },
                },
            }
            const buttonText = 'sampleText'
            const buttonFooterText = 'sampleFooter'
            const response = 'MediaButtonMessageSentResponse'
            const errorMsg = 'Unable to send media button message'
            const verificationError = new Error('Verification failed')
            const sendError = new Error('Sending failed')
            const image = 'http://example.com/sample.jpg'
            const mimeType = 'image/jpeg'

            beforeEach(async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockResolvedValue(response),
                })
            })

            const sendButtonMessageTestHelper = async (
                button = [buttons.url, buttons.call, buttons.reply],
                text = true,
                footer = true
            ) => {
                const result = await instance.sendMediaButtonMessage(testId, {
                    image: image,
                    mediaType: 'image',
                    mimeType: mimeType,
                    buttons: button.map((b) => b.s),
                    text: text ? buttonText : undefined,
                    footerText: footer ? buttonFooterText : undefined,
                })

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendMessage).toHaveBeenCalledWith(testIdDomain, {
                    image: { url: image },
                    mimetype: mimeType,
                    viewOnce: true,
                    caption: text ? buttonText : '',
                    footer: footer ? buttonFooterText : '',
                    templateButtons: button.map((b) => b.e),
                })
                expect(result).toBe(response)
            }

            it('should successfully send a replyButton message', async () => {
                await sendButtonMessageTestHelper([buttons.reply])
            })

            it('should successfully send a callButton message', async () => {
                await sendButtonMessageTestHelper([buttons.call])
            })

            it('should successfully send a urlButton message', async () => {
                await sendButtonMessageTestHelper([buttons.url])
            })

            it('should successfully send a button message without text', async () => {
                await sendButtonMessageTestHelper([buttons.url], false)
            })

            it('should successfully send a button message without footer', async () => {
                await sendButtonMessageTestHelper([buttons.url], undefined, false)
            })

            it('should successfully send a button message with more than one button', async () => {
                await sendButtonMessageTestHelper()
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(
                    instance.sendMediaButtonMessage(testId, {
                        image: image,
                        mediaType: 'image',
                        mimeType: mimeType,
                        buttons: [buttons.url.s],
                    })
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if sendMessage fails', async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockRejectedValue(sendError),
                })

                await expect(
                    instance.sendMediaButtonMessage(testId, {
                        image: image,
                        mediaType: 'image',
                        mimeType: mimeType,
                        buttons: [buttons.url.s],
                    })
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('setStatus', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const errorMsg = 'Unable to set user status'
            const verificationError = new Error('Verification failed')
            const setStatusError = new Error('Setting status failed')

            beforeEach(async () => {
                await prepInstance({
                    sendPresenceUpdate: jest.fn().mockResolvedValue(true),
                })
            })

            it('should successfully set user status for a given ID', async () => {
                await instance.setStatus('unavailable', testId)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._verifyId).toHaveBeenCalledWith(testIdDomain)
                expect(instance?.sock?.sendPresenceUpdate).toHaveBeenCalledWith(
                    'unavailable',
                    testIdDomain
                )
            })

            it('should throw an error if ID verification fails', async () => {
                instance._verifyId = jest.fn().mockRejectedValue(verificationError)

                await expect(instance.setStatus('available', testId)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if sendPresenceUpdate fails', async () => {
                await prepInstance({
                    sendPresenceUpdate: jest.fn().mockRejectedValue(setStatusError),
                })

                await expect(instance.setStatus('unavailable', testId)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('updateProfilePicture', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const imgData = Buffer.from([1, 2, 3, 4])
            const url = 'https://example.com/profile.jpg'
            const errorMsg = 'Unable to update profile picture'
            const fetchError = new Error('Fetching image failed')
            const updateError = new Error('Updating profile picture failed')

            beforeEach(async () => {
                axios.get = jest.fn().mockResolvedValue({ data: imgData })
                await prepInstance({
                    updateProfilePicture: jest.fn().mockResolvedValue(true),
                })
            })

            it('should successfully update profile picture for a given ID and URL', async () => {
                const res = await instance.updateProfilePicture(testId, url)

                expect(axios.get).toHaveBeenCalledWith(url, {
                    responseType: 'arraybuffer',
                })
                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance?.sock?.updateProfilePicture).toHaveBeenCalledWith(
                    testIdDomain,
                    imgData
                )
                expect(res).toBeTruthy()
            })

            it('should throw an error if fetching the image via axios fails', async () => {
                axios.get = jest.fn().mockRejectedValue(fetchError)

                await expect(instance.updateProfilePicture(testId, url)).rejects.toThrow(
                    errorMsg
                )

                expect(instance?.sock?.updateProfilePicture).not.toHaveBeenCalled()
                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if updateProfilePicture fails', async () => {
                await prepInstance({
                    updateProfilePicture: jest.fn().mockRejectedValue(updateError),
                })

                await expect(instance.updateProfilePicture(testId, url)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('createNewGroup', () => {
            const groupName = 'Test Group'
            const users = ['12345678', '87654321']
            const parsedUsers = users.map((user) => `${user}@s.whatsapp.net`)
            const group = { id: 'mockGroupId', name: groupName }
            const errorMsg = 'Error create new group failed'
            const groupCreationError = new Error('Group creation failed')

            beforeEach(async () => {
                await prepInstance({
                    groupCreate: jest.fn().mockResolvedValue(group),
                })
            })

            it('should successfully create a new group with given name and users', async () => {
                const result = await instance.createNewGroup(groupName, users)

                expect(instance._parseParticipants).toHaveBeenCalledWith(users)
                expect(instance.sock!.groupCreate).toHaveBeenCalledWith(
                    groupName,
                    parsedUsers
                )
                expect(result).toEqual(group)
            })

            it('should throw an error if groupCreate fails', async () => {
                await prepInstance({
                    groupCreate: jest.fn().mockRejectedValue(groupCreationError),
                })

                await expect(instance.createNewGroup(groupName, users)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('addNewParticipant', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const users = ['12345678', '87654321']
            const parsedUsers = users.map((user) => `${user}@s.whatsapp.net`)
            const response = 'GroupParticipantUpdateResponse'
            const errorMsg =
                'Unable to add participant, you must be an admin in this group'
            const updateError = new Error('Update failed')

            beforeEach(async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully add new participants', async () => {
                const result = await instance.addNewParticipant(testId, users)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._parseParticipants).toHaveBeenCalledWith(users)
                expect(instance?.sock?.groupParticipantsUpdate).toHaveBeenCalledWith(
                    testIdDomain,
                    parsedUsers,
                    'add'
                )
                expect(result).toBe(response)
            })

            it('should throw an error if groupParticipantsUpdate fails', async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockRejectedValue(updateError),
                })

                await expect(instance.addNewParticipant(testId, users)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('makeAdmin', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const users = ['12345678', '87654321']
            const parsedUsers = users.map((user) => `${user}@s.whatsapp.net`)
            const response = 'GroupParticipantPromoteResponse'
            const errorMsg =
                'Unable to promote some participants, check if you are admin in group ' +
                'or participants exists'
            const updateError = new Error('Update failed')

            beforeEach(async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully promote participants to admin', async () => {
                const result = await instance.makeAdmin(testId, users)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._parseParticipants).toHaveBeenCalledWith(users)
                expect(instance?.sock?.groupParticipantsUpdate).toHaveBeenCalledWith(
                    testIdDomain,
                    parsedUsers,
                    'promote'
                )
                expect(result).toBe(response)
            })

            it('should throw an error if groupParticipantsUpdate fails', async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockRejectedValue(updateError),
                })

                await expect(instance.makeAdmin(testId, users)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('demoteAdmin', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const users = ['12345678', '87654321']
            const parsedUsers = users.map((user) => `${user}@s.whatsapp.net`)
            const response = 'GroupParticipantDemoteResponse'
            const errorMsg =
                'Unable to demote some participants, check if you are admin in group ' +
                'or participants exists'
            const updateError = new Error('Update failed')

            beforeEach(async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully demote participants from admin', async () => {
                const result = await instance.demoteAdmin(testId, users)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._parseParticipants).toHaveBeenCalledWith(users)
                expect(instance?.sock?.groupParticipantsUpdate).toHaveBeenCalledWith(
                    testIdDomain,
                    parsedUsers,
                    'demote'
                )
                expect(result).toBe(response)
            })

            it('should throw an error if groupParticipantsUpdate fails', async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockRejectedValue(updateError),
                })

                await expect(instance.demoteAdmin(testId, users)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('leaveGroup', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const sampleGroup = { id: testId, name: 'Sample Group' }
            const response = 'LeaveGroupResponse'
            const errorMsg = 'Error leave group failed'
            const leaveError = new Error('Leave failed')

            beforeEach(async () => {
                const groupState = {
                    findGroupChat: jest.fn().mockResolvedValue(sampleGroup),
                }
                instance.groupState = (groupState as any) as typeof instance['groupState']
                await prepInstance({
                    groupLeave: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully leave the group if it exists', async () => {
                const result = await instance.leaveGroup(testId)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance.groupState?.findGroupChat).toHaveBeenCalledWith(
                    testIdDomain
                )
                expect(instance.sock?.groupLeave).toHaveBeenCalledWith(testIdDomain)
                expect(result).toBe(response)
            })

            it('should throw an error if groupState is not initialized', async () => {
                instance.groupState = null

                await expect(instance.leaveGroup(testId)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if no group exists with the provided ID', async () => {
                jest.spyOn(instance.groupState!, 'findGroupChat').mockResolvedValue(null)

                await expect(instance.leaveGroup(testId)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if groupLeave call fails', async () => {
                await prepInstance({
                    groupLeave: jest.fn().mockRejectedValue(leaveError),
                })

                await expect(instance.leaveGroup(testId)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('getInviteCodeGroup', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const sampleGroup = { id: testId, name: 'Sample Group' }
            const response = 'GroupInviteCode'
            const errorMsg = 'Error get invite group failed'
            const inviteCodeError = new Error('Invite code fetch failed')

            beforeEach(async () => {
                const groupState = {
                    findGroupChat: jest.fn().mockResolvedValue(sampleGroup),
                }
                instance.groupState = (groupState as any) as typeof instance['groupState']
                await prepInstance({
                    groupInviteCode: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully get the invite code for the group if it exists', async () => {
                const result = await instance.getInviteCodeGroup(testId)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance.groupState?.findGroupChat).toHaveBeenCalledWith(
                    testIdDomain
                )
                expect(instance.sock?.groupInviteCode).toHaveBeenCalledWith(testIdDomain)
                expect(result).toBe(response)
            })

            it('should throw an error if groupState is not initialized', async () => {
                instance.groupState = null

                await expect(instance.getInviteCodeGroup(testId)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if no group exists with the provided ID', async () => {
                jest.spyOn(instance.groupState!, 'findGroupChat').mockResolvedValue(null)

                await expect(instance.getInviteCodeGroup(testId)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })

            it('should throw an error if groupInviteCode call fails', async () => {
                await prepInstance({
                    groupInviteCode: jest.fn().mockRejectedValue(inviteCodeError),
                })

                await expect(instance.getInviteCodeGroup(testId)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('getInstanceInviteCodeGroup', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const response = 'InstanceGroupInviteCode'
            const errorMsg = 'Error get instance invite code group failed'
            const inviteCodeError = new Error('Invite code fetch for instance failed')

            beforeEach(async () => {
                await prepInstance({
                    groupInviteCode: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully get the instance invite code for the group', async () => {
                const result = await instance.getInstanceInviteCodeGroup(testId)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance.sock?.groupInviteCode).toHaveBeenCalledWith(testIdDomain)
                expect(result).toBe(response)
            })

            it('should throw an error if groupInviteCode call fails', async () => {
                await prepInstance({
                    groupInviteCode: jest.fn().mockRejectedValue(inviteCodeError),
                })

                await expect(instance.getInstanceInviteCodeGroup(testId)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('groupFetchAllParticipating', () => {
            const sampleGroups = [
                { id: '12345678@s.whatsapp.net', name: 'Group A' },
                { id: '87654321@s.whatsapp.net', name: 'Group B' },
            ]
            const errorMsg = 'Error group fetch all participating failed'
            const fetchAllError = new Error('Fetch all participating groups failed')

            beforeEach(async () => {
                await prepInstance({
                    groupFetchAllParticipating: jest.fn().mockResolvedValue(sampleGroups),
                })
            })

            it('should successfully fetch all participating groups', async () => {
                const result = await instance.groupFetchAllParticipating()

                expect(instance.sock?.groupFetchAllParticipating).toHaveBeenCalled()
                expect(result).toEqual(sampleGroups)
            })

            it('should throw an error if groupFetchAllParticipating call fails', async () => {
                await prepInstance({
                    groupFetchAllParticipating: jest
                        .fn()
                        .mockRejectedValue(fetchAllError),
                })

                await expect(instance.groupFetchAllParticipating()).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('groupParticipantsUpdate', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const users = ['12345678', '87654321']
            const parsedUsers = users.map((user) => `${user}@s.whatsapp.net`)
            const action = 'add'
            const response = 'GroupParticipantsUpdateResponse'
            const errorMsg = `Unable to ${action} some participants, check if you are admin in group or participants exists`
            const updateError = new Error('Update participants failed')

            beforeEach(async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully update group participants', async () => {
                const result = await instance.groupParticipantsUpdate(
                    testId,
                    users,
                    action
                )

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance._parseParticipants).toHaveBeenCalledWith(users)
                expect(instance.sock?.groupParticipantsUpdate).toHaveBeenCalledWith(
                    testIdDomain,
                    parsedUsers,
                    action
                )
                expect(result).toEqual(response)
            })

            it('should throw an error if groupParticipantsUpdate call fails', async () => {
                await prepInstance({
                    groupParticipantsUpdate: jest.fn().mockRejectedValue(updateError),
                })

                await expect(
                    instance.groupParticipantsUpdate(testId, users, action)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('groupSettingUpdate', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const action = 'announcement'
            const response = 'GroupSettingUpdateResponse'
            const errorMsg = `Unable to ${action} check if you are admin in group`
            const updateError = new Error('Update setting failed')

            beforeEach(async () => {
                await prepInstance({
                    groupSettingUpdate: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully update group settings', async () => {
                const result = await instance.groupSettingUpdate(testId, action)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance.sock?.groupSettingUpdate).toHaveBeenCalledWith(
                    testIdDomain,
                    action
                )
                expect(result).toEqual(response)
            })

            it('should throw an error if groupSettingUpdate call fails', async () => {
                await prepInstance({
                    groupSettingUpdate: jest.fn().mockRejectedValue(updateError),
                })

                await expect(instance.groupSettingUpdate(testId, action)).rejects.toThrow(
                    errorMsg
                )

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('groupUpdateSubject', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const subject = 'New Group Subject'
            const response = 'GroupSubjectUpdateResponse'
            const errorMsg = 'Unable to update subject check if you are admin in group'
            const updateError = new Error('Update subject failed')

            beforeEach(async () => {
                await prepInstance({
                    groupUpdateSubject: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully update group subject', async () => {
                const result = await instance.groupUpdateSubject(testId, subject)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance.sock?.groupUpdateSubject).toHaveBeenCalledWith(
                    testIdDomain,
                    subject
                )
                expect(result).toEqual(response)
            })

            it('should throw an error if groupUpdateSubject call fails', async () => {
                await prepInstance({
                    groupUpdateSubject: jest.fn().mockRejectedValue(updateError),
                })

                await expect(
                    instance.groupUpdateSubject(testId, subject)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('groupUpdateDescription', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const description = 'Test Description'
            const response = 'GroupUpdateDescriptionResponse'
            const errorMsg =
                'Unable to update description check if you are admin in group'
            const updateError = new Error('Update description error')

            beforeEach(async () => {
                await prepInstance({
                    groupUpdateDescription: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully update group description', async () => {
                const result = await instance.groupUpdateDescription(testId, description)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance.sock?.groupUpdateDescription).toHaveBeenCalledWith(
                    testIdDomain,
                    description
                )
                expect(result).toEqual(response)
            })

            it('should successfully remove group description', async () => {
                const result = await instance.groupUpdateDescription(testId)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(testId)
                expect(instance.sock?.groupUpdateDescription).toHaveBeenCalledWith(
                    testIdDomain,
                    undefined
                )
                expect(result).toEqual(response)
            })

            it('should throw an error if groupUpdateDescription call fails', async () => {
                await prepInstance({
                    groupUpdateDescription: jest.fn().mockRejectedValue(updateError),
                })

                await expect(
                    instance.groupUpdateDescription(testId, description)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('readMessage', () => {
            const nonGroupMsgKey = {
                remoteJid: '12345678',
                id: 'messageID',
            }
            const messageKey = {
                ...nonGroupMsgKey,
                participant: '87654321',
            }
            const remoteJidDomain = `${messageKey.remoteJid}@s.whatsapp.net`
            const participantDomain = `${messageKey.participant}@s.whatsapp.net`
            const response = 'ReadMessageResponse'
            const errorMsg = 'Error read message failed'
            const readError = new Error('Read message error')

            beforeEach(async () => {
                await prepInstance({
                    readMessages: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully read a message', async () => {
                const result = await instance.readMessage(messageKey)

                expect(instance._getWhatsAppId).toHaveBeenNthCalledWith(
                    1,
                    messageKey.remoteJid
                )
                expect(instance._getWhatsAppId).toHaveBeenNthCalledWith(
                    2,
                    messageKey.participant
                )
                expect(instance.sock?.readMessages).toHaveBeenCalledWith([
                    {
                        ...messageKey,
                        remoteJid: remoteJidDomain,
                        participant: participantDomain,
                    },
                ])
                expect(result).toEqual(response)
            })

            it('should successfully read a non-group message', async () => {
                await instance.readMessage(nonGroupMsgKey)

                expect(instance._getWhatsAppId).toHaveBeenCalledWith(messageKey.remoteJid)
                expect(instance.sock?.readMessages).toHaveBeenCalledWith([
                    {
                        ...nonGroupMsgKey,
                        remoteJid: remoteJidDomain,
                    },
                ])
            })

            it('should throw an error if readMessages call fails', async () => {
                await prepInstance({
                    readMessages: jest.fn().mockRejectedValue(readError),
                })

                await expect(instance.readMessage(messageKey)).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('reactMessage', () => {
            const testId = '12345678'
            const testIdDomain = `${testId}@s.whatsapp.net`
            const messageKey = {
                remoteJid: '87654321',
                id: 'messageID',
            }
            const testEmoji = '👍'
            const reactionMessage = {
                react: {
                    text: testEmoji,
                    key: {
                        remoteJid: `${messageKey.remoteJid}@s.whatsapp.net`,
                        id: messageKey.id,
                    },
                },
            }
            const response = 'ReactMessageResponse'
            const errorMsg = 'Error react message failed'
            const reactError = new Error('React message error')

            beforeEach(async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully react to a message', async () => {
                const result = await instance.reactMessage(testId, messageKey, testEmoji)

                expect(instance._getWhatsAppId).toHaveBeenNthCalledWith(
                    1,
                    messageKey.remoteJid
                )
                expect(instance._getWhatsAppId).toHaveBeenNthCalledWith(2, testId)
                expect(instance.sock?.sendMessage).toHaveBeenCalledWith(
                    testIdDomain,
                    reactionMessage
                )
                expect(result).toEqual(response)
            })

            it('should successfully remove react to a message', async () => {
                const result = await instance.reactMessage(testId, messageKey, null)

                expect(instance.sock?.sendMessage).toHaveBeenCalledWith(testIdDomain, {
                    react: {
                        text: null,
                        key: reactionMessage.react.key,
                    },
                })
                expect(result).toEqual(response)
            })

            it('should throw an error if reactMessage call fails', async () => {
                await prepInstance({
                    sendMessage: jest.fn().mockRejectedValue(reactError),
                })

                await expect(
                    instance.reactMessage(testId, messageKey, testEmoji)
                ).rejects.toThrow(errorMsg)

                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })

        describe('logout', () => {
            const response = 'LogoutResponse'
            const errorMsg = 'Error logout failed'
            const logoutError = new Error('Logout error')

            beforeEach(async () => {
                await prepInstance({
                    logout: jest.fn().mockResolvedValue(response),
                })
            })

            it('should successfully logout', async () => {
                const result = await instance.logout()

                expect(instance.sock?.logout).toHaveBeenCalled()

                expect(result).toEqual(response)
            })

            it('should throw an error if logout call fails', async () => {
                await prepInstance({
                    logout: jest.fn().mockRejectedValue(logoutError),
                })

                await expect(instance.logout()).rejects.toThrow(errorMsg)
                expect(logger.error).toHaveBeenCalledWith(expect.any(Error), errorMsg)
            })
        })
    })
})
