import express from 'express'
import * as controller from '../controllers/misc.controller'
import keyVerify from '../middlewares/keyCheck'
import loginVerify from '../middlewares/loginCheck'

const router = express.Router()

const r = router.route
const k = keyVerify
const l = loginVerify

r('/onwhatsapp').get(k, l, controller.onWhatsapp)
r('/downProfile').get(k, l, controller.downProfile)
r('/getStatus').get(k, l, controller.getStatus)
r('/blockUser').get(k, l, controller.blockUser)
r('/updateProfilePicture').post(k, l, controller.updateProfilePicture)
r('/getuserorgroupbyid').get(k, l, controller.getUserOrGroupById)

export default router
