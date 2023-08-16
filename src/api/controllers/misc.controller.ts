import { ReqHandler } from '../helper/types'
import getInstanceForReq from '../service/instance'

export const onWhatsapp: ReqHandler = async (req, res) => {
    const data = await getInstanceForReq(req)?.onWhatsApp(<string>req.query.id)
    return res.status(201).json({ error: false, data: data })
}

export const downProfile: ReqHandler = async (req, res) => {
    const data = await getInstanceForReq(req)?.downloadProfile(<string>req.query.id)
    return res.status(201).json({ error: false, data: data })
}

export const getStatus: ReqHandler = async (req, res) => {
    const data = await getInstanceForReq(req)?.getUserStatus(<string>req.query.id)
    return res.status(201).json({ error: false, data: data })
}

export const blockUser: ReqHandler = async (req, res) => {
    const _ = await getInstanceForReq(req)?.blockUnblock(
        <string>req.query.id,
        <'block' | 'unblock'>(<string>req.query.block_status)
    )
    if (req.query.block_status === 'block') {
        return res.status(201).json({ error: false, message: 'Contact Blocked' })
    } else {
        return res.status(201).json({ error: false, message: 'Contact Unblocked' })
    }
}

export const updateProfilePicture: ReqHandler = async (req, res) => {
    const data = await getInstanceForReq(req).updateProfilePicture(
        req.body.id,
        req.body.url
    )
    return res.status(201).json({ error: false, data: data })
}

export const getUserOrGroupById: ReqHandler = async (req, res) => {
    const data = await getInstanceForReq(req).getUserOrGroupById(<string>req.query.id)
    return res.status(201).json({ error: false, data: data })
}
