const callBackFilters = {
    'connection:close': ['all', 'connection', 'connection.update', 'connection:close'],
    'connection:open': ['all', 'connection', 'connection.update', 'connection:open'],
    'presence': ['all', 'presence', 'presence.update'],
    'message': ['all', 'messages', 'messages.upsert'],
    'call_offer': ['all', 'call', 'CB:call', 'call:offer'],
    'call_terminate': ['all', 'call', 'call:terminate'],
    'group_created': ['all', 'groups', 'groups.upsert'],
    'group_updated': ['all', 'groups', 'groups.update'],
    'group_participants_updated': [
        'all',
        'groups',
        'group_participants',
        'group-participants',
        'group-participants.update',
    ],
}

export type CallBackType = keyof typeof callBackFilters

export type CallBackBody = string | object

export class Callback {
    serviceName: string = ''
    enabled: boolean = false
    address: string | null = null
    filters: string | null = null
    filterList: string[] = []

    constructor (
        serviceName: string,
        enabled: boolean,
        address: string | null,
        filters: string | null
    ) {
        this.serviceName = serviceName
        this.enabled = enabled
        this.address = address
        this.filterList = filters?.split(',') || ['all']
    }

    async sendCallback (type: CallBackType, body: CallBackBody, key: string) {
        if (!this.enabled) return
        if (callBackFilters[type].some((e) => this.filterList.includes(e))) {
            const cb = type.split(':')[0]
            this.coreSendCallback(cb, body, key)
        }
    }

    async coreSendCallback (type: string, body: CallBackBody, key: string) {
        throw new Error('Method not implemented.')
    }

    enable (address: string | null | undefined): Callback {
        const addr = address ?? this.address
        return this.coreEnable(addr)
    }

    coreEnable (address: string | null): Callback {
        throw new Error('Method not implemented.')
    }
}
