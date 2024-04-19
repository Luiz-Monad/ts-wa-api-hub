import express from 'express'
import * as controller from '../controllers/group.controller'
import keyVerify from '../middlewares/keyCheck'
import loginVerify from '../middlewares/loginCheck'

const router = express.Router()

const r = router.route
const k = keyVerify
const l = loginVerify

r('/create').post(k, l, controller.create)
r('/listall').get(k, l, controller.listAll)
r('/leave').get(k, l, controller.leaveGroup)
r('/inviteuser').post(k, l, controller.addNewParticipant)
r('/makeadmin').post(k, l, controller.makeAdmin)
r('/demoteadmin').post(k, l, controller.demoteAdmin)
r('/getinvitecode').get(k, l, controller.getInviteCodeGroup)
r('/getinstanceinvitecode').get(k, l, controller.getInstanceInviteCodeGroup)
r('/getallgroups').get(k, l, controller.getAllGroups)
r('/participantsupdate').post(k, l, controller.groupParticipantsUpdate)
r('/settingsupdate').post(k, l, controller.groupSettingUpdate)
r('/updatesubject').post(k, l, controller.groupUpdateSubject)
r('/updatedescription').post(k, l, controller.groupUpdateDescription)
r('/inviteinfo').post(k, l, controller.groupInviteInfo)
r('/groupjoin').post(k, l, controller.groupJoin)

export default router
