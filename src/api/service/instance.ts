import WhatsAppInstance from '../class/instance'
import { AppType, ReqType } from '../helper/types'

type Callback = (instance: WhatsAppInstance) => void;

class Instance {
    private instances: Record<string, WhatsAppInstance> = {}
    private onRegisterCallbacks: Callback[] = [];
    private onUnregisterCallbacks: Callback[] = [];

    register(instance: WhatsAppInstance) {
        this.instances[instance.key] = instance
        this.onRegisterCallbacks.forEach(callback => callback(instance));
    }

    unregister(instance: WhatsAppInstance) {
        delete this.instances[instance.key]
        this.onUnregisterCallbacks.forEach(callback => callback(instance));
    }

    get(key: string): WhatsAppInstance {
        return this.instances[key]
    }

    list(): string[] {
        return Object.keys(this.instances)
    }

    onRegister(callback: Callback) {
        this.onRegisterCallbacks.push(callback);
    }

    onUnregister(callback: Callback) {
        this.onUnregisterCallbacks.push(callback);
    }
}

export async function initInstanceService(app: AppType) {
    app.set('InstanceService', new Instance())
}

export function getInstanceService(app: AppType): Instance {
    const instanceService: Instance = app.get('instanceService')
    return instanceService
}

export default function getInstanceForReq(req: ReqType): WhatsAppInstance {
    return getInstanceService(req.app).get(<string>req.query.key)
}
