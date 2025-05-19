const router = require('express').Router()
const { getProgress, getExerciseHistory,getAllProgresses } = require('../controllers/progressController')
const authMiddleware = require('../middlewares/authMiddleware')

//router.get("/", authMiddleware, getExercisesProgress) //get exercise progress
router.get("/", authMiddleware, getAllProgresses) //get exercise progress

router.get("/:exerciseId", authMiddleware, getProgress) //get exercise progress

router.get("/history/:exerciseId", authMiddleware, getExerciseHistory) //get exercise history




module.exports = router