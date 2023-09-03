import { proto } from '@whiskeysockets/baileys/WAProto'

export interface ReceiptType extends proto.IUserReceipt {

export interface ReceiptType extends proto.IUserReceipt {
    /** UserReceipt userJid */
    userJid: string

    /** UserReceipt receiptTimestamp */
    receiptTimestamp?: number | Long | null

    /** UserReceipt readTimestamp */
    readTimestamp?: number | Long | null

    /** UserReceipt playedTimestamp */
    playedTimestamp?: number | Long | null

    /** UserReceipt pendingDeviceJid */
    pendingDeviceJid?: string[] | null

    /** UserReceipt deliveredDeviceJid */
    deliveredDeviceJid?: string[] | null
}

export interface ButtonsResponseMessageType
    extends proto.Message.IButtonsResponseMessage {
    /** ButtonsResponseMessage selectedButtonId */
    selectedButtonId?: string | null

    /** ButtonsResponseMessage contextInfo */
    contextInfo?: any | null

    /** ButtonsResponseMessage type */
    type?: number | null

    /** ButtonsResponseMessage selectedDisplayText */
    selectedDisplayText?: string | null
}

export interface ButtonTextType extends proto.Message.ButtonsMessage.Button.IButtonText {
    /** ButtonText displayText */
    displayText?: string | null
}

export namespace ButtonType {
    export enum Type {
        UNKNOWN = 0,
        RESPONSE = 1,
        NATIVE_FLOW = 2,
    }
}

export interface ButtonType extends proto.Message.ButtonsMessage.IButton {
    /*********** Inherited ***********/

    /** Button buttonId */
    buttonId?: string | null

    /** Button buttonText */
    buttonText?: ButtonTextType | null

    /** Button type */
    type?: ButtonType.Type | null

    /** Button nativeFlowInfo */
    nativeFlowInfo?: any | null
}

export namespace ButtonsMessageType {
    export enum HeaderType {
        UNKNOWN = 0,
        EMPTY = 1,
        TEXT = 2,
        DOCUMENT = 3,
        IMAGE = 4,
        VIDEO = 5,
        LOCATION = 6,
    }
}

export interface ButtonsMessageType extends proto.Message.IButtonsMessage {
    /** ButtonsMessage contentText */
    contentText?: string | null

    /** ButtonsMessage footerText */
    footerText?: string | null

    /** ButtonsMessage contextInfo */
    contextInfo?: any | null

    /** ButtonsMessage buttons */
    buttons?: ButtonType[] | null

    /** ButtonsMessage headerType */
    headerType?: ButtonsMessageType.HeaderType | null

    /** ButtonsMessage text */
    text?: string | null

    /** ButtonsMessage documentMessage */
    documentMessage?: DocumentMessageType | null

    /** ButtonsMessage imageMessage */
    imageMessage?: ImageMessageType | null

    /** ButtonsMessage videoMessage */
    videoMessage?: VideoMessageType | null

    /** ButtonsMessage locationMessage */
    locationMessage?: LocationMessageType | null
}

export interface ContainedMessageType extends proto.Message.IFutureProofMessage {
    /** FutureProofMessage message */
    message?: proto.IMessage | null
}

export namespace ListMessageType {
    export enum ListType {
        UNKNOWN = 0,
        SINGLE_SELECT = 1,
        PRODUCT_LIST = 2,
    }
}

export interface ListMessageType extends proto.Message.IListMessage {
    /** ListMessage title */
    title?: string | null

    /** ListMessage description */
    description?: string | null

    /** ListMessage buttonText */
    buttonText?: string | null

    /** ListMessage listType */
    listType?: ListMessageType.ListType | null

    /** ListMessage sections */
    sections?: any[] | null

    /** ListMessage productListInfo */
    productListInfo?: any | null

    /** ListMessage footerText */
    footerText?: string | null

    /** ListMessage contextInfo */
    contextInfo?: any | null
}

export interface TemplateMessageType extends proto.Message.ITemplateButtonReplyMessage {
    /** TemplateButtonReplyMessage selectedId */
    selectedId?: string | null

    /** TemplateButtonReplyMessage selectedDisplayText */
    selectedDisplayText?: string | null

    /** TemplateButtonReplyMessage contextInfo */
    contextInfo?: any | null

    /** TemplateButtonReplyMessage selectedIndex */
    selectedIndex?: number | null
}

export interface MessageChatType extends proto.Message.IChat {
    /** Chat displayName */
    displayName?: string | null

    /** Chat id */
    id?: string | null
}

export interface VideoMessageType extends proto.Message.IVideoMessage {
    /** VideoMessage url */
    url?: string | null

    /** VideoMessage mimetype */
    mimetype?: string | null

    /** VideoMessage fileSha256 */
    fileSha256?: Uint8Array | null

    /** VideoMessage fileLength */
    fileLength?: number | Long | null

    /** VideoMessage seconds */
    seconds?: number | null

    /** VideoMessage mediaKey */
    mediaKey?: Uint8Array | null

    /** VideoMessage caption */
    caption?: string | null

    /** VideoMessage gifPlayback */
    gifPlayback?: boolean | null

    /** VideoMessage height */
    height?: number | null

    /** VideoMessage width */
    width?: number | null

    /** VideoMessage fileEncSha256 */
    fileEncSha256?: Uint8Array | null

    /** VideoMessage interactiveAnnotations */
    interactiveAnnotations?: any[] | null

    /** VideoMessage directPath */
    directPath?: string | null

    /** VideoMessage mediaKeyTimestamp */
    mediaKeyTimestamp?: number | Long | null

    /** VideoMessage jpegThumbnail */
    jpegThumbnail?: Uint8Array | null

    /** VideoMessage contextInfo */
    contextInfo?: any | null

    /** VideoMessage streamingSidecar */
    streamingSidecar?: Uint8Array | null

    /** VideoMessage gifAttribution */
    gifAttribution?: number | null

    /** VideoMessage viewOnce */
    viewOnce?: boolean | null

    /** VideoMessage thumbnailDirectPath */
    thumbnailDirectPath?: string | null

    /** VideoMessage thumbnailSha256 */
    thumbnailSha256?: Uint8Array | null

    /** VideoMessage thumbnailEncSha256 */
    thumbnailEncSha256?: Uint8Array | null

    /** VideoMessage staticUrl */
    staticUrl?: string | null
}

export interface AudioMessageType extends proto.Message.IAudioMessage {
    /** AudioMessage url */
    url?: string | null

    /** AudioMessage mimetype */
    mimetype?: string | null

    /** AudioMessage fileSha256 */
    fileSha256?: Uint8Array | null

    /** AudioMessage fileLength */
    fileLength?: number | Long | null

    /** AudioMessage seconds */
    seconds?: number | null

    /** AudioMessage ptt */
    ptt?: boolean | null

    /** AudioMessage mediaKey */
    mediaKey?: Uint8Array | null

    /** AudioMessage fileEncSha256 */
    fileEncSha256?: Uint8Array | null

    /** AudioMessage directPath */
    directPath?: string | null

    /** AudioMessage mediaKeyTimestamp */
    mediaKeyTimestamp?: number | Long | null

    /** AudioMessage contextInfo */
    contextInfo?: any | null

    /** AudioMessage streamingSidecar */
    streamingSidecar?: Uint8Array | null

    /** AudioMessage waveform */
    waveform?: Uint8Array | null

    /** AudioMessage backgroundArgb */
    backgroundArgb?: number | null

    /** AudioMessage viewOnce */
    viewOnce?: boolean | null
}

export interface DocumentMessageType extends proto.Message.IDocumentMessage {
    /** DocumentMessage url */
    url?: string | null

    /** DocumentMessage mimetype */
    mimetype?: string | null

    /** DocumentMessage title */
    title?: string | null

    /** DocumentMessage fileSha256 */
    fileSha256?: Uint8Array | null

    /** DocumentMessage fileLength */
    fileLength?: number | Long | null

    /** DocumentMessage pageCount */
    pageCount?: number | null

    /** DocumentMessage mediaKey */
    mediaKey?: Uint8Array | null

    /** DocumentMessage fileName */
    fileName?: string | null

    /** DocumentMessage fileEncSha256 */
    fileEncSha256?: Uint8Array | null

    /** DocumentMessage directPath */
    directPath?: string | null

    /** DocumentMessage mediaKeyTimestamp */
    mediaKeyTimestamp?: number | Long | null

    /** DocumentMessage contactVcard */
    contactVcard?: boolean | null

    /** DocumentMessage thumbnailDirectPath */
    thumbnailDirectPath?: string | null

    /** DocumentMessage thumbnailSha256 */
    thumbnailSha256?: Uint8Array | null

    /** DocumentMessage thumbnailEncSha256 */
    thumbnailEncSha256?: Uint8Array | null

    /** DocumentMessage jpegThumbnail */
    jpegThumbnail?: Uint8Array | null

    /** DocumentMessage contextInfo */
    contextInfo?: any | null

    /** DocumentMessage thumbnailHeight */
    thumbnailHeight?: number | null

    /** DocumentMessage thumbnailWidth */
    thumbnailWidth?: number | null

    /** DocumentMessage caption */
    caption?: string | null
}

export namespace ExtendedTextMessageType {
    export enum InviteLinkGroupType {
        DEFAULT = 0,
        PARENT = 1,
        SUB = 2,
        DEFAULT_SUB = 3,
    }

    export enum PreviewType {
        NONE = 0,
        VIDEO = 1,
    }

    export enum FontType {
        SANS_SERIF = 0,
        SERIF = 1,
        NORICAN_REGULAR = 2,
        BRYNDAN_WRITE = 3,
        BEBASNEUE_REGULAR = 4,
        OSWALD_HEAVY = 5,
        SYSTEM_BOLD = 6,
        MORNINGBREEZE_REGULAR = 7,
        CALISTOGA_REGULAR = 8,
        EXO2_EXTRABOLD = 9,
        COURIERPRIME_BOLD = 10,
    }
}

export interface ExtendedTextMessageType extends proto.Message.IExtendedTextMessage {
    /** ExtendedTextMessage text */
    text?: string | null

    /** ExtendedTextMessage matchedText */
    matchedText?: string | null

    /** ExtendedTextMessage canonicalUrl */
    canonicalUrl?: string | null

    /** ExtendedTextMessage description */
    description?: string | null

    /** ExtendedTextMessage title */
    title?: string | null

    /** ExtendedTextMessage textArgb */
    textArgb?: number | null

    /** ExtendedTextMessage backgroundArgb */
    backgroundArgb?: number | null

    /** ExtendedTextMessage font */
    font?: ExtendedTextMessageType.FontType | null

    /** ExtendedTextMessage previewType */
    previewType?: ExtendedTextMessageType.PreviewType | null

    /** ExtendedTextMessage jpegThumbnail */
    jpegThumbnail?: Uint8Array | null

    /** ExtendedTextMessage contextInfo */
    contextInfo?: any | null

    /** ExtendedTextMessage doNotPlayInline */
    doNotPlayInline?: boolean | null

    /** ExtendedTextMessage thumbnailDirectPath */
    thumbnailDirectPath?: string | null

    /** ExtendedTextMessage thumbnailSha256 */
    thumbnailSha256?: Uint8Array | null

    /** ExtendedTextMessage thumbnailEncSha256 */
    thumbnailEncSha256?: Uint8Array | null

    /** ExtendedTextMessage mediaKey */
    mediaKey?: Uint8Array | null

    /** ExtendedTextMessage mediaKeyTimestamp */
    mediaKeyTimestamp?: number | Long | null

    /** ExtendedTextMessage thumbnailHeight */
    thumbnailHeight?: number | null

    /** ExtendedTextMessage thumbnailWidth */
    thumbnailWidth?: number | null

    /** ExtendedTextMessage inviteLinkGroupType */
    inviteLinkGroupType?: ExtendedTextMessageType.InviteLinkGroupType | null

    /** ExtendedTextMessage inviteLinkParentGroupSubjectV2 */
    inviteLinkParentGroupSubjectV2?: string | null

    /** ExtendedTextMessage inviteLinkParentGroupThumbnailV2 */
    inviteLinkParentGroupThumbnailV2?: Uint8Array | null

    /** ExtendedTextMessage inviteLinkGroupTypeV2 */
    inviteLinkGroupTypeV2?: ExtendedTextMessageType.InviteLinkGroupType | null

    /** ExtendedTextMessage viewOnce */
    viewOnce?: boolean | null
}

export interface LocationMessageType extends proto.Message.ILocationMessage {
    /** LocationMessage degreesLatitude */
    degreesLatitude?: number | null

    /** LocationMessage degreesLongitude */
    degreesLongitude?: number | null

    /** LocationMessage name */
    name?: string | null

    /** LocationMessage address */
    address?: string | null

    /** LocationMessage url */
    url?: string | null

    /** LocationMessage isLive */
    isLive?: boolean | null

    /** LocationMessage accuracyInMeters */
    accuracyInMeters?: number | null

    /** LocationMessage speedInMps */
    speedInMps?: number | null

    /** LocationMessage degreesClockwiseFromMagneticNorth */
    degreesClockwiseFromMagneticNorth?: number | null

    /** LocationMessage comment */
    comment?: string | null

    /** LocationMessage jpegThumbnail */
    jpegThumbnail?: Uint8Array | null

    /** LocationMessage contextInfo */
    contextInfo?: any | null
}

export interface ContactMessageType extends proto.Message.IContactMessage {
    /** ContactMessage displayName */
    displayName?: string | null

    /** ContactMessage vcard */
    vcard?: string | null

    /** ContactMessage contextInfo */
    contextInfo?: any | null
}

export interface ImageMessageType extends proto.Message.IImageMessage {
    /** ImageMessage url */
    url?: string | null

    /** ImageMessage mimetype */
    mimetype?: string | null

    /** ImageMessage caption */
    caption?: string | null

    /** ImageMessage fileSha256 */
    fileSha256?: Uint8Array | null

    /** ImageMessage fileLength */
    fileLength?: number | Long | null

    /** ImageMessage height */
    height?: number | null

    /** ImageMessage width */
    width?: number | null

    /** ImageMessage mediaKey */
    mediaKey?: Uint8Array | null

    /** ImageMessage fileEncSha256 */
    fileEncSha256?: Uint8Array | null

    /** ImageMessage interactiveAnnotations */
    interactiveAnnotations?: any[] | null

    /** ImageMessage directPath */
    directPath?: string | null

    /** ImageMessage mediaKeyTimestamp */
    mediaKeyTimestamp?: number | Long | null

    /** ImageMessage jpegThumbnail */
    jpegThumbnail?: Uint8Array | null

    /** ImageMessage contextInfo */
    contextInfo?: any | null

    /** ImageMessage firstScanSidecar */
    firstScanSidecar?: Uint8Array | null

    /** ImageMessage firstScanLength */
    firstScanLength?: number | null

    /** ImageMessage experimentGroupId */
    experimentGroupId?: number | null

    /** ImageMessage scansSidecar */
    scansSidecar?: Uint8Array | null

    /** ImageMessage scanLengths */
    scanLengths?: number[] | null

    /** ImageMessage midQualityFileSha256 */
    midQualityFileSha256?: Uint8Array | null

    /** ImageMessage midQualityFileEncSha256 */
    midQualityFileEncSha256?: Uint8Array | null

    /** ImageMessage viewOnce */
    viewOnce?: boolean | null

    /** ImageMessage thumbnailDirectPath */
    thumbnailDirectPath?: string | null

    /** ImageMessage thumbnailSha256 */
    thumbnailSha256?: Uint8Array | null

    /** ImageMessage thumbnailEncSha256 */
    thumbnailEncSha256?: Uint8Array | null

    /** ImageMessage staticUrl */
    staticUrl?: string | null
}

export interface MessageType extends proto.IMessage {
    /** Message conversation */
    conversation?: string | null

    /** Message senderKeyDistributionMessage */
    senderKeyDistributionMessage?: any | null

    /** Message imageMessage */
    imageMessage?: ImageMessageType | null

    /** Message contactMessage */
    contactMessage?: ContactMessageType | null

    /** Message locationMessage */
    locationMessage?: LocationMessageType | null

    /** Message extendedTextMessage */
    extendedTextMessage?: ExtendedTextMessageType | null

    /** Message documentMessage */
    documentMessage?: DocumentMessageType | null

    /** Message audioMessage */
    audioMessage?: AudioMessageType | null

    /** Message videoMessage */
    videoMessage?: VideoMessageType | null

    /** Message call */
    call?: any | null

    /** Message chat */
    chat?: MessageChatType | null

    /** Message protocolMessage */
    protocolMessage?: any | null

    /** Message contactsArrayMessage */
    contactsArrayMessage?: any | null

    /** Message highlyStructuredMessage */
    highlyStructuredMessage?: any | null

    /** Message fastRatchetKeySenderKeyDistributionMessage */
    fastRatchetKeySenderKeyDistributionMessage?: any | null

    /** Message sendPaymentMessage */
    sendPaymentMessage?: any | null

    /** Message liveLocationMessage */
    liveLocationMessage?: any | null

    /** Message requestPaymentMessage */
    requestPaymentMessage?: any | null

    /** Message declinePaymentRequestMessage */
    declinePaymentRequestMessage?: any | null

    /** Message cancelPaymentRequestMessage */
    cancelPaymentRequestMessage?: any | null

    /** Message templateMessage */
    templateMessage?: any | null

    /** Message stickerMessage */
    stickerMessage?: any | null

    /** Message groupInviteMessage */
    groupInviteMessage?: any | null

    /** Message templateButtonReplyMessage */
    templateButtonReplyMessage?: TemplateMessageType | null

    /** Message productMessage */
    productMessage?: any | null

    /** Message deviceSentMessage */
    deviceSentMessage?: any | null

    /** Message messageContextInfo */
    messageContextInfo?: any | null

    /** Message listMessage */
    listMessage?: ListMessageType | null

    /** Message viewOnceMessage */
    viewOnceMessage?: ContainedMessageType | null

    /** Message orderMessage */
    orderMessage?: any | null

    /** Message listResponseMessage */
    listResponseMessage?: any | null

    /** Message ephemeralMessage */
    ephemeralMessage?: ContainedMessageType | null

    /** Message invoiceMessage */
    invoiceMessage?: any | null

    /** Message buttonsMessage */
    buttonsMessage?: ButtonsMessageType | null

    /** Message buttonsResponseMessage */
    buttonsResponseMessage?: ButtonsResponseMessageType | null

    /** Message paymentInviteMessage */
    paymentInviteMessage?: any | null

    /** Message interactiveMessage */
    interactiveMessage?: any | null

    /** Message reactionMessage */
    reactionMessage?: any | null

    /** Message stickerSyncRmrMessage */
    stickerSyncRmrMessage?: any | null

    /** Message interactiveResponseMessage */
    interactiveResponseMessage?: any | null

    /** Message pollCreationMessage */
    pollCreationMessage?: any | null

    /** Message pollUpdateMessage */
    pollUpdateMessage?: any | null

    /** Message keepInChatMessage */
    keepInChatMessage?: any | null

    /** Message documentWithCaptionMessage */
    documentWithCaptionMessage?: ContainedMessageType | null

    /** Message requestPhoneNumberMessage */
    requestPhoneNumberMessage?: any | null

    /** Message viewOnceMessageV2 */
    viewOnceMessageV2?: ContainedMessageType | null

    /** Message encReactionMessage */
    encReactionMessage?: any | null

    /** Message editedMessage */
    editedMessage?: ContainedMessageType | null

    /** Message viewOnceMessageV2Extension */
    viewOnceMessageV2Extension?: ContainedMessageType | null

    /** Message pollCreationMessageV2 */
    pollCreationMessageV2?: any | null

    /** Message scheduledCallCreationMessage */
    scheduledCallCreationMessage?: any | null

    /** Message groupMentionedMessage */
    groupMentionedMessage?: ContainedMessageType | null

    /** Message pinInChatMessage */
    pinInChatMessage?: any | null

    /** Message pollCreationMessageV3 */
    pollCreationMessageV3?: any | null

    /** Message scheduledCallEditMessage */
    scheduledCallEditMessage?: any | null

    /** Message ptvMessage */
    ptvMessage?: VideoMessageType | null

    /** Message botInvokeMessage */
    botInvokeMessage?: ContainedMessageType | null
}

export interface ReceiptType extends proto.IUserReceipt {
    /** UserReceipt userJid */
    userJid: string

    /** UserReceipt receiptTimestamp */
    receiptTimestamp?: number | Long | null

    /** UserReceipt readTimestamp */
    readTimestamp?: number | Long | null

    /** UserReceipt playedTimestamp */
    playedTimestamp?: number | Long | null

    /** UserReceipt pendingDeviceJid */
    pendingDeviceJid?: string[] | null

    /** UserReceipt deliveredDeviceJid */
    deliveredDeviceJid?: string[] | null
}

export interface KeyType extends proto.IMessageKey {
    /** MessageKey remoteJid */
    remoteJid?: string | null

    /** MessageKey fromMe */
    fromMe?: boolean | null

    /** MessageKey id */
    id?: string

    /** MessageKey participant */
    participant?: string | null
}

export namespace MessageInfoType {
    /** Status enum. */
    export enum Status {
        ERROR = 0,
        PENDING = 1,
        SERVER_ACK = 2,
        DELIVERY_ACK = 3,
        READ = 4,
        PLAYED = 5,
    }
}

export default interface MessageInfoType extends proto.IWebMessageInfo {
    /** data store key */
    _id: string

    /** record deleted by the user */
    _deleted?: boolean

    /*********** Inherited ***********/

    /** WebMessageInfo key */
    key: KeyType

    /** WebMessageInfo message */
    message?: MessageType | null

    /** WebMessageInfo messageTimestamp */
    messageTimestamp?: number | Long | null

    /** WebMessageInfo status */
    status?: MessageInfoType.Status | null

    /** WebMessageInfo participant */
    participant?: string | null

    /** WebMessageInfo messageC2STimestamp */
    messageC2STimestamp?: number | Long | null

    /** WebMessageInfo ignore */
    ignore?: boolean | null

    /** WebMessageInfo starred */
    starred?: boolean | null

    /** WebMessageInfo broadcast */
    broadcast?: boolean | null

    /** WebMessageInfo pushName */
    pushName?: string | null

    /** WebMessageInfo mediaCiphertextSha256 */
    mediaCiphertextSha256?: Uint8Array | null

    /** WebMessageInfo multicast */
    multicast?: boolean | null

    /** WebMessageInfo urlText */
    urlText?: boolean | null

    /** WebMessageInfo urlNumber */
    urlNumber?: boolean | null

    /** WebMessageInfo messageStubType */
    messageStubType?: number | null

    /** WebMessageInfo clearMedia */
    clearMedia?: boolean | null

    /** WebMessageInfo messageStubParameters */
    messageStubParameters?: string[] | null

    /** WebMessageInfo duration */
    duration?: number | null

    /** WebMessageInfo labels */
    labels?: string[] | null

    /** WebMessageInfo paymentInfo */
    paymentInfo?: any | null

    /** WebMessageInfo finalLiveLocation */
    finalLiveLocation?: any | null

    /** WebMessageInfo quotedPaymentInfo */
    quotedPaymentInfo?: any | null

    /** WebMessageInfo ephemeralStartTimestamp */
    ephemeralStartTimestamp?: number | Long | null

    /** WebMessageInfo ephemeralDuration */
    ephemeralDuration?: number | null

    /** WebMessageInfo ephemeralOffToOn */
    ephemeralOffToOn?: boolean | null

    /** WebMessageInfo ephemeralOutOfSync */
    ephemeralOutOfSync?: boolean | null

    /** WebMessageInfo bizPrivacyStatus */
    bizPrivacyStatus?: number | null

    /** WebMessageInfo verifiedBizName */
    verifiedBizName?: string | null

    /** WebMessageInfo mediaData */
    mediaData?: any | null

    /** WebMessageInfo photoChange */
    photoChange?: any | null

    /** WebMessageInfo userReceipt */
    userReceipt?: ReceiptType[] | null

    /** WebMessageInfo reactions */
    reactions?: any[] | null

    /** WebMessageInfo quotedStickerData */
    quotedStickerData?: any | null

    /** WebMessageInfo futureproofData */
    futureproofData?: Uint8Array | null

    /** WebMessageInfo statusPsa */
    statusPsa?: any | null

    /** WebMessageInfo pollUpdates */
    pollUpdates?: any[] | null

    /** WebMessageInfo pollAdditionalMetadata */
    pollAdditionalMetadata?: any | null

    /** WebMessageInfo agentId */
    agentId?: string | null

    /** WebMessageInfo statusAlreadyViewed */
    statusAlreadyViewed?: boolean | null

    /** WebMessageInfo messageSecret */
    messageSecret?: Uint8Array | null

    /** WebMessageInfo keepInChat */
    keepInChat?: any | null

    /** WebMessageInfo originalSelfAuthorUserJidString */
    originalSelfAuthorUserJidString?: string | null

    /** WebMessageInfo revokeMessageTimestamp */
    revokeMessageTimestamp?: number | Long | null

    /** WebMessageInfo pinInChat */
    pinInChat?: any | null
}
