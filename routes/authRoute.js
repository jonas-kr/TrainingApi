const router = require('express').Router()
const { Register, Login, Google, verifyUserEmail, resetPassword, verifyUserResetCode
} = require("../controllers/authContoller")

router.post('/register', Register)
router.post('/login', Login)
router.post('/google', Google)
router.post('/verifyUserEmail', verifyUserEmail)
router.post('/verifyUserResetCode', verifyUserResetCode)
router.put('/resetPassword', resetPassword)




module.exports = router