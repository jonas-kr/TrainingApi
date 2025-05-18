const router = require('express').Router()
const { getUserStats, getWeeklyUserStats } = require('../controllers/sessionController')
const { getUser, followUnfollowUser, getPopularUsers, updateProfile, updatePassword,
    removeUser, addWeight, addExerciseRemoveExercise, getUserFollowers, getUserFollowing, addLibraryProgram,
    getUserLibraryPrograms, getUserSharedPrograms, getUsers, removeFollower } = require('../controllers/userController')
const authMiddleware = require('../middlewares/authMiddleware')


//route is /api/user

router.get('/suggested', authMiddleware, getPopularUsers) //get popular users
router.get('/stats', getUserStats) //get stats users
router.get('/weeklyStats', getWeeklyUserStats) //get stats users

router.post('/addWeight', authMiddleware, addWeight) //add weight
router.put('/update', authMiddleware, updateProfile) //update user profile
router.put('/updatePassword', authMiddleware, updatePassword) //update user password
router.delete('/remove', authMiddleware, removeUser) //delete user account

router.get('/library', authMiddleware, getUserLibraryPrograms)//get user library programs
router.get('/sharedPrograms/:userId', getUserSharedPrograms)//get user Shared programs

router.get('/search/:username', getUsers)//get user profile

router.get('/followers/:userId', getUserFollowers)//get user followers
router.get('/following/:userId', getUserFollowing)//get user following
router.post('/library/:programId', authMiddleware, addLibraryProgram)//add a new library program

router.get('/:userId', getUser)//get user profile

router.post('/follow/:userId', authMiddleware, followUnfollowUser) //follow or unfollow
router.post('/removeFollower/:userId', authMiddleware, removeFollower) //follow or unfollow
router.post('/addRemoveExerciseToFavorites/:exerciseId', authMiddleware, addExerciseRemoveExercise) //add remove exercise to fav

// top 10 most followed users

//router.post('/update',authMiddleware, updateUserProfile)



module.exports = router