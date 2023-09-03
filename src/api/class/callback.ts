const callBackFilters = {
    'connection:close': ['all', 'connection', 'connection.update', 'connection:close'],
    'connection:open': ['all', 'connection', 'connection.update', 'connection:open'],
    presence: ['all', 'presence', 'presence.update'],
    message: ['all', 'messages', 'messages.upsert'],
    call_offer: ['all', 'call', 'CB:call', 'call:offer'],
    call_terminate: ['all', 'call', 'call:terminate'],
    group_created: ['all', 'groups', 'groups.upsert'],
    group_updated: ['all', 'groups', 'groups.update'],
    group_participants_updated: [
        'all',
        'groups',
        'group_participants',
        'group-participants',
        'group-participants.update',
    ],
}

export type CallBackType = keyof typeof callBackFilters

export class Callback {
    enabled: boolean = false
    filters: string | null = null
    filterList: string[] = []

    constructor(enabled: boolean, filters: string | null) {
        this.enabled = enabled
        this.filterList = filters?.split(',') || ['all']
    }

    async sendCallback(type: CallBackType, body: any, key: string) {
        if (!this.enabled) return
        if (callBackFilters[type].some((e) => this.filterList.includes(e))) {
            const cb = type.split(':')[0]
            this.coreSendCallback(cb, body, key)
        }
    }

    async coreSendCallback(type: string, body: any, key: string) {}
}
