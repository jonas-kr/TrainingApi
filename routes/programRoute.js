const router = require('express').Router()
const { getPublicPrograms, getTopRatedPrograms, addProgram, updateProgram, deleteProgram,
    rateProgram, getProgram, addWorkout, updateWorkout, deleteWorkout } = require('../controllers/programController')
const authMiddleware = require('../middlewares/authMiddleware')

// Route   /api/program
router.get("/", getPublicPrograms) //get public programs
router.get("/top", getTopRatedPrograms) //get top rated programs
router.post("/add", authMiddleware, addProgram) //add a new program

router.post('/workout', authMiddleware, addWorkout)//add workout to program
router.put('/workout', authMiddleware, updateWorkout)//update workout on program
router.delete('/workout', authMiddleware, deleteWorkout)//delete workout from program

router.put("/rate/:programId", authMiddleware, rateProgram)//rate a program

router.get("/:programId", getProgram) //update a program
router.put("/:programId", authMiddleware, updateProgram) //update a program
router.delete("/:programId", authMiddleware, deleteProgram) //delete a program





module.exports = router