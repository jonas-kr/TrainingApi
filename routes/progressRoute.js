const router = require('express').Router()
const { getProgress, getExerciseHistory } = require('../controllers/progressController')
const authMiddleware = require('../middlewares/authMiddleware')

//router.get("/", authMiddleware, getExercisesProgress) //get exercise progress

router.get("/:exerciseId", authMiddleware, getProgress) //get exercise progress

router.get("/history/:exerciseId", authMiddleware, getExerciseHistory) //get exercise history




module.exports = router