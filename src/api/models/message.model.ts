import { proto } from '@whiskeysockets/baileys/WAProto'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

/** Properties of a UserReceipt. */
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

/** Properties of an ExtendedTextMessageWithParentKey. */
export interface ExtendedTextParentMessageType
    extends proto.Message.IExtendedTextMessageWithParentKey {
    /** ExtendedTextMessageWithParentKey key */
    key?: KeyType | null

    /** ExtendedTextMessageWithParentKey extendedTextMessage */
    extendedTextMessage?: ExtendedTextMessageType | null
}

/** Properties of a CommentMessage. */
export interface CommentMessageType extends proto.Message.ICommentMessage {
    /** CommentMessage message */
    message?: MessageType | null

    /** CommentMessage targetMessageKey */
    targetMessageKey?: KeyType | null
}

/** Properties of an EventMessage. */
export interface EventMessageType extends proto.Message.IEventMessage {
    /** EventMessage contextInfo */
    contextInfo?: proto.IContextInfo | null

    /** EventMessage isCanceled */
    isCanceled?: boolean | null

    /** EventMessage name */
    name?: string | null

    /** EventMessage description */
    description?: string | null

    /** EventMessage location */
    location?: LocationMessageType | null

    /** EventMessage joinLink */
    joinLink?: string | null

    /** EventMessage startTime */
    startTime?: number | Long | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ButtonsResponseMessageType {
    /** Type enum. */
    export enum Type {
        UNKNOWN = 0,
        DISPLAY_TEXT = 1,
    }
}

/** Properties of a ButtonsResponseMessage. */
export interface ButtonsResponseMessageType
    extends proto.Message.IButtonsResponseMessage {
    /** ButtonsResponseMessage selectedButtonId */
    selectedButtonId?: string | null

    /** ButtonsResponseMessage contextInfo */
    contextInfo?: any | null

    /** ButtonsResponseMessage type */
    type?: ButtonsResponseMessageType.Type | null

    /** ButtonsResponseMessage selectedDisplayText */
    selectedDisplayText?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ButtonsMessageType {
    /** HeaderType enum. */
    export enum HeaderType {
        UNKNOWN = 0,
        EMPTY = 1,
        TEXT = 2,
        DOCUMENT = 3,
        IMAGE = 4,
        VIDEO = 5,
        LOCATION = 6,
    }

    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace Button {
        /** Type enum. */
        export enum Type {
            UNKNOWN = 0,
            RESPONSE = 1,
            NATIVE_FLOW = 2,
        }

        /** Properties of a ButtonText. */
        export interface ButtonText
            extends proto.Message.ButtonsMessage.Button.IButtonText {
            /** ButtonText displayText */
            displayText?: string | null
        }
    }

    /** Properties of a Button. */
    export interface Button extends proto.Message.ButtonsMessage.IButton {
        /** Button buttonId */
        buttonId?: string | null

        /** Button buttonText */
        buttonText?: Button.ButtonText | null

        /** Button type */
        type?: Button.Type | null

        /** Button nativeFlowInfo */
        nativeFlowInfo?: any | null
    }
}

/** Properties of a ButtonsMessage. */
export interface ButtonsMessageType extends proto.Message.IButtonsMessage {
    /** ButtonsMessage contentText */
    contentText?: string | null

    /** ButtonsMessage footerText */
    footerText?: string | null

    /** ButtonsMessage contextInfo */
    contextInfo?: any | null

    /** ButtonsMessage buttons */
    buttons?: ButtonsMessageType.Button[] | null

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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ListResponseMessageType {
    /** Properties of a SingleSelectReply. */
    export interface SingleSelectReply
        extends proto.Message.ListResponseMessage.ISingleSelectReply {
        /** SingleSelectReply selectedRowId */
        selectedRowId?: string | null
    }

    /** ListType enum. */
    export enum ListType {
        UNKNOWN = 0,
        SINGLE_SELECT = 1,
    }
}

/** Properties of a ListResponseMessage. */
export interface ListResponseMessageType extends proto.Message.IListResponseMessage {
    /** ListResponseMessage title */
    title?: string | null

    /** ListResponseMessage listType */
    listType?: ListResponseMessageType.ListType | null

    /** ListResponseMessage singleSelectReply */
    singleSelectReply?: ListResponseMessageType.SingleSelectReply | null

    /** ListResponseMessage contextInfo */
    contextInfo?: any | null

    /** ListResponseMessage description */
    description?: string | null
}

/** Properties of a FutureProofMessage. */
export interface ContainedMessageType extends proto.Message.IFutureProofMessage {
    /** FutureProofMessage message */
    message?: MessageType | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ListMessageType {
    /** Properties of a ProductListHeaderImage. */
    export interface ProductListHeaderImage
        extends proto.Message.ListMessage.IProductListHeaderImage {
        /** ProductListHeaderImage productId */
        productId?: string | null

        /** ProductListHeaderImage jpegThumbnail */
        jpegThumbnail?: Uint8Array | null
    }

    /** Properties of a Product. */
    export interface Product extends proto.Message.ListMessage.IProduct {
        /** Product productId */
        productId?: string | null
    }

    /** Properties of a ProductSection. */
    export interface ProductSection extends proto.Message.ListMessage.IProductSection {
        /** ProductSection title */
        title?: string | null

        /** ProductSection products */
        products?: Product[] | null
    }

    /** Properties of a ProductListInfo. */
    export interface ProductListInfo extends proto.Message.ListMessage.IProductListInfo {
        /** ProductListInfo productSections */
        productSections?: ProductSection[] | null

        /** ProductListInfo headerImage */
        headerImage?: ProductListHeaderImage | null

        /** ProductListInfo businessOwnerJid */
        businessOwnerJid?: string | null
    }

    /** Properties of a Row. */
    export interface Row extends proto.Message.ListMessage.IRow {
        /** Row title */
        title?: string | null

        /** Row description */
        description?: string | null

        /** Row rowId */
        rowId?: string | null
    }

    /** Properties of a Section. */
    export interface Section extends proto.Message.ListMessage.ISection {
        /** Section title */
        title?: string | null

        /** Section rows */
        rows?: Row[] | null
    }

    /** ListType enum. */
    export enum ListType {
        UNKNOWN = 0,
        SINGLE_SELECT = 1,
        PRODUCT_LIST = 2,
    }
}

/** Properties of a ListMessage. */
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
    sections?: ListMessageType.Section[] | null

    /** ListMessage productListInfo */
    productListInfo?: ListMessageType.ProductListInfo | null

    /** ListMessage footerText */
    footerText?: string | null

    /** ListMessage contextInfo */
    contextInfo?: any | null
}

/** Properties of a TemplateButtonReplyMessage. */
export interface TemplateButtonMessageType
    extends proto.Message.ITemplateButtonReplyMessage {
    /** TemplateButtonReplyMessage selectedId */
    selectedId?: string | null

    /** TemplateButtonReplyMessage selectedDisplayText */
    selectedDisplayText?: string | null

    /** TemplateButtonReplyMessage contextInfo */
    contextInfo?: any | null

    /** TemplateButtonReplyMessage selectedIndex */
    selectedIndex?: number | null

    /** TemplateButtonReplyMessage selectedCarouselCardIndex */
    selectedCarouselCardIndex?: number | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TemplateButtonType {
    /** Properties of a CallButton. */
    export interface CallButton extends proto.TemplateButton.ICallButton {
        /** CallButton displayText */
        displayText?: HighlyStructuredMessageType | null

        /** CallButton phoneNumber */
        phoneNumber?: HighlyStructuredMessageType | null
    }

    /** Properties of a URLButton. */
    export interface URLButton extends proto.TemplateButton.IURLButton {
        /** URLButton displayText */
        displayText?: HighlyStructuredMessageType | null

        /** URLButton url */
        url?: HighlyStructuredMessageType | null
    }

    /** Properties of a QuickReplyButton. */
    export interface QuickReplyButton extends proto.TemplateButton.IQuickReplyButton {
        /** QuickReplyButton displayText */
        displayText?: HighlyStructuredMessageType | null

        /** QuickReplyButton id */
        id?: string | null
    }
}

/** Properties of a TemplateButton. */
interface TemplateButtonType extends proto.ITemplateButton {
    /** TemplateButton index */
    index?: number | null

    /** TemplateButton quickReplyButton */
    quickReplyButton?: TemplateButtonType.QuickReplyButton | null

    /** TemplateButton urlButton */
    urlButton?: TemplateButtonType.URLButton | null

    /** TemplateButton callButton */
    callButton?: TemplateButtonType.CallButton | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace HydratedTemplateButtonType {
    /** Properties of a HydratedCallButton. */
    export interface HydratedCallButton
        extends proto.HydratedTemplateButton.IHydratedCallButton {
        /** HydratedCallButton displayText */
        displayText?: string | null

        /** HydratedCallButton phoneNumber */
        phoneNumber?: string | null
    }

    /** Properties of a HydratedURLButton. */
    export interface HydratedURLButton
        extends proto.HydratedTemplateButton.IHydratedURLButton {
        /** HydratedURLButton displayText */
        displayText?: string | null

        /** HydratedURLButton url */
        url?: string | null

        /** HydratedURLButton consentedUsersUrl */
        consentedUsersUrl?: string | null

        /** HydratedURLButton webviewPresentation */
        webviewPresentation?: proto.HydratedTemplateButton.HydratedURLButton.WebviewPresentationType | null
    }

    /** Properties of a HydratedQuickReplyButton. */
    export interface HydratedQuickReplyButton
        extends proto.HydratedTemplateButton.IHydratedQuickReplyButton {
        /** HydratedQuickReplyButton displayText */
        displayText?: string | null

        /** HydratedQuickReplyButton id */
        id?: string | null
    }
}

/** Properties of a HydratedTemplateButton. */
export interface HydratedTemplateButtonType extends proto.IHydratedTemplateButton {
    /** HydratedTemplateButton index */
    index?: number | null

    /** HydratedTemplateButton quickReplyButton */
    quickReplyButton?: HydratedTemplateButtonType.HydratedQuickReplyButton | null

    /** HydratedTemplateButton urlButton */
    urlButton?: HydratedTemplateButtonType.HydratedURLButton | null

    /** HydratedTemplateButton callButton */
    callButton?: HydratedTemplateButtonType.HydratedCallButton | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TemplateMessageType {
    /** Properties of a FourRowTemplate. */
    export interface FourRowTemplate
        extends proto.Message.TemplateMessage.IFourRowTemplate {
        /** FourRowTemplate content */
        content?: HighlyStructuredMessageType | null

        /** FourRowTemplate footer */
        footer?: HighlyStructuredMessageType | null

        /** FourRowTemplate buttons */
        buttons?: TemplateButtonType[] | null

        /** FourRowTemplate documentMessage */
        documentMessage?: DocumentMessageType | null

        /** FourRowTemplate highlyStructuredMessage */
        highlyStructuredMessage?: HighlyStructuredMessageType | null

        /** FourRowTemplate imageMessage */
        imageMessage?: ImageMessageType | null

        /** FourRowTemplate videoMessage */
        videoMessage?: VideoMessageType | null

        /** FourRowTemplate locationMessage */
        locationMessage?: LocationMessageType | null
    }

    /** Properties of a HydratedFourRowTemplate. */
    export interface HydratedFourRowTemplate
        extends proto.Message.TemplateMessage.IHydratedFourRowTemplate {
        /** HydratedFourRowTemplate hydratedContentText */
        hydratedContentText?: string | null

        /** HydratedFourRowTemplate hydratedFooterText */
        hydratedFooterText?: string | null

        /** HydratedFourRowTemplate hydratedButtons */
        hydratedButtons?: HydratedTemplateButtonType[] | null

        /** HydratedFourRowTemplate templateId */
        templateId?: string | null

        /** HydratedFourRowTemplate maskLinkedDevices */
        maskLinkedDevices?: boolean | null

        /** HydratedFourRowTemplate documentMessage */
        documentMessage?: DocumentMessageType | null

        /** HydratedFourRowTemplate hydratedTitleText */
        hydratedTitleText?: string | null

        /** HydratedFourRowTemplate imageMessage */
        imageMessage?: ImageMessageType | null

        /** HydratedFourRowTemplate videoMessage */
        videoMessage?: VideoMessageType | null

        /** HydratedFourRowTemplate locationMessage */
        locationMessage?: LocationMessageType | null
    }
}

/** Properties of a TemplateMessage. */
export interface TemplateMessageType extends proto.Message.ITemplateMessage {
    /** TemplateMessage contextInfo */
    contextInfo?: any | null

    /** TemplateMessage hydratedTemplate */
    hydratedTemplate?: TemplateMessageType.HydratedFourRowTemplate | null

    /** TemplateMessage templateId */
    templateId?: string | null

    /** TemplateMessage fourRowTemplate */
    fourRowTemplate?: TemplateMessageType.FourRowTemplate | null

    /** TemplateMessage hydratedFourRowTemplate */
    hydratedFourRowTemplate?: TemplateMessageType.HydratedFourRowTemplate | null

    /** TemplateMessage interactiveMessageTemplate */
    interactiveMessageTemplate?: any | null
}

/** Properties of a LiveLocationMessage. */
export interface LiveLocationMessageType extends proto.Message.ILiveLocationMessage {
    /** LiveLocationMessage degreesLatitude */
    degreesLatitude?: number | null

    /** LiveLocationMessage degreesLongitude */
    degreesLongitude?: number | null

    /** LiveLocationMessage accuracyInMeters */
    accuracyInMeters?: number | null

    /** LiveLocationMessage speedInMps */
    speedInMps?: number | null

    /** LiveLocationMessage degreesClockwiseFromMagneticNorth */
    degreesClockwiseFromMagneticNorth?: number | null

    /** LiveLocationMessage caption */
    caption?: string | null

    /** LiveLocationMessage sequenceNumber */
    sequenceNumber?: number | Long | null

    /** LiveLocationMessage timeOffset */
    timeOffset?: number | null

    /** LiveLocationMessage jpegThumbnail */
    jpegThumbnail?: Uint8Array | null

    /** LiveLocationMessage contextInfo */
    contextInfo?: any | null
}

/** Properties of a HighlyStructuredMessage. */
export interface HighlyStructuredMessageType
    extends proto.Message.IHighlyStructuredMessage {
    /** HighlyStructuredMessage namespace */
    namespace?: string | null

    /** HighlyStructuredMessage elementName */
    elementName?: string | null

    /** HighlyStructuredMessage params */
    params?: string[] | null

    /** HighlyStructuredMessage fallbackLg */
    fallbackLg?: string | null

    /** HighlyStructuredMessage fallbackLc */
    fallbackLc?: string | null

    /** HighlyStructuredMessage localizableParams */
    localizableParams?: any[] | null

    /** HighlyStructuredMessage deterministicLg */
    deterministicLg?: string | null

    /** HighlyStructuredMessage deterministicLc */
    deterministicLc?: string | null

    /** HighlyStructuredMessage hydratedHsm */
    hydratedHsm?: TemplateMessageType | null
}

/** Properties of a ContactsArrayMessage. */
export interface ContactsArrayMessageType extends proto.Message.IContactsArrayMessage {
    /** ContactsArrayMessage displayName */
    displayName?: string | null

    /** ContactsArrayMessage contacts */
    contacts?: ContactMessageType[] | null

    /** ContactsArrayMessage contextInfo */
    contextInfo?: any | null
}

/** Properties of a Chat. */
export interface ChatMessageType extends proto.Message.IChat {
    /** Chat displayName */
    displayName?: string | null

    /** Chat id */
    id?: string | null
}

/** Properties of a VideoMessage. */
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

    /** VideoMessage annotations */
    annotations?: any[] | null
}

/** Properties of an AudioMessage. */
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

/** Properties of a DocumentMessage. */
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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ExtendedTextMessageType {
    /** InviteLinkGroupType enum. */
    export enum InviteLinkGroupType {
        DEFAULT = 0,
        PARENT = 1,
        SUB = 2,
        DEFAULT_SUB = 3,
    }

    /** PreviewType enum. */
    export enum PreviewType {
        NONE = 0,
        VIDEO = 1,
        PLACEHOLDER = 4,
        IMAGE = 5,
    }

    /** FontType enum. */
    export enum FontType {
        SYSTEM = 0,
        SYSTEM_TEXT = 1,
        FB_SCRIPT = 2,
        SYSTEM_BOLD = 6,
        MORNINGBREEZE_REGULAR = 7,
        CALISTOGA_REGULAR = 8,
        EXO2_EXTRABOLD = 9,
        COURIERPRIME_BOLD = 10,
    }
}

/** Properties of an ExtendedTextMessage. */
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

/** Properties of a LocationMessage. */
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

/** Properties of a ContactMessage. */
export interface ContactMessageType extends proto.Message.IContactMessage {
    /** ContactMessage displayName */
    displayName?: string | null

    /** ContactMessage vcard */
    vcard?: string | null

    /** ContactMessage contextInfo */
    contextInfo?: any | null
}

/** Properties of an ImageMessage. */
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

    /** ImageMessage annotations */
    annotations?: any[] | null
}

/** Properties of a Message. */
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
    chat?: ChatMessageType | null

    /** Message protocolMessage */
    protocolMessage?: any | null

    /** Message contactsArrayMessage */
    contactsArrayMessage?: ContactsArrayMessageType | null

    /** Message highlyStructuredMessage */
    highlyStructuredMessage?: HighlyStructuredMessageType | null

    /** Message fastRatchetKeySenderKeyDistributionMessage */
    fastRatchetKeySenderKeyDistributionMessage?: any | null

    /** Message sendPaymentMessage */
    sendPaymentMessage?: any | null

    /** Message liveLocationMessage */
    liveLocationMessage?: LiveLocationMessageType | null

    /** Message requestPaymentMessage */
    requestPaymentMessage?: any | null

    /** Message declinePaymentRequestMessage */
    declinePaymentRequestMessage?: any | null

    /** Message cancelPaymentRequestMessage */
    cancelPaymentRequestMessage?: any | null

    /** Message templateMessage */
    templateMessage?: TemplateMessageType | null

    /** Message stickerMessage */
    stickerMessage?: any | null

    /** Message groupInviteMessage */
    groupInviteMessage?: any | null

    /** Message templateButtonReplyMessage */
    templateButtonReplyMessage?: TemplateButtonMessageType | null

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
    listResponseMessage?: ListResponseMessageType | null

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

    /** Message callLogMesssage */
    callLogMesssage?: any | null

    /** Message messageHistoryBundle */
    messageHistoryBundle?: any | null

    /** Message encCommentMessage */
    encCommentMessage?: any | null

    /** Message bcallMessage */
    bcallMessage?: any | null

    /** Message lottieStickerMessage */
    lottieStickerMessage?: ContainedMessageType | null

    /** Message eventMessage */
    eventMessage?: EventMessageType | null

    /** Message commentMessage */
    commentMessage?: CommentMessageType | null

    /** Message newsletterAdminInviteMessage */
    newsletterAdminInviteMessage?: any | null

    /** Message extendedTextMessageWithParentKey */
    extendedTextMessageWithParentKey?: ExtendedTextParentMessageType | null

    /** Message placeholderMessage */
    placeholderMessage?: any | null

    /** Message encEventUpdateMessage */
    encEventUpdateMessage?: any | null
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

/** Properties of a MessageKey. */
export interface KeyType extends proto.IMessageKey {
    /** MessageKey remoteJid */
    remoteJid?: string | null

    /** MessageKey fromMe */
    fromMe?: boolean | null

    /** MessageKey id */
    id?: string | null

    /** MessageKey participant */
    participant?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-namespace
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

/** Properties of a WebMessageInfo. */
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
    finalLiveLocation?: LiveLocationMessageType | null

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

    /** WebMessageInfo premiumMessageInfo */
    premiumMessageInfo?: any | null

    /** WebMessageInfo is1PBizBotMessage */
    is1PBizBotMessage?: boolean | null

    /** WebMessageInfo isGroupHistoryMessage */
    isGroupHistoryMessage?: boolean | null

    /** WebMessageInfo botMessageInvokerJid */
    botMessageInvokerJid?: string | null

    /** WebMessageInfo commentMetadata */
    commentMetadata?: any | null

    /** WebMessageInfo eventResponses */
    eventResponses?: any[] | null

    /** WebMessageInfo reportingTokenInfo */
    reportingTokenInfo?: any | null

    /** WebMessageInfo newsletterServerId */
    newsletterServerId?: number | Long | null
}
