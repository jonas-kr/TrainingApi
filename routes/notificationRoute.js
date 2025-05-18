const router = require('express').Router()
const { getNotifications, readNotification,deleteNotification } = require('../controllers/notificationController')
const authMiddleware = require('../middlewares/authMiddleware')


//route is /api/user

router.get('/', authMiddleware, getNotifications) //get user notfications
router.put('/:notificationId', authMiddleware, readNotification) //get popular users
router.delete('/:notificationId', authMiddleware, deleteNotification) //get popular users


module.exports = router