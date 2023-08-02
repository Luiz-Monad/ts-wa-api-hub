import WhatsAppInstance from '../class/instance'
import { AppType, ReqType } from '../helper/types'

interface Instance
{
    instances: Record<string, WhatsAppInstance>
}

export async function initInstanceService(app: AppType) {
    app.set('instanceService', { instances: {} } as Instance)
}

export function getInstanceService(app: AppType): Instance {
    const instanceService: Instance = app.get('instanceService')
    return instanceService
}

export default function getInstanceForReq(req: ReqType): WhatsAppInstance {
    return getInstanceService(req.app).instances[<string> req.query.key]
}
