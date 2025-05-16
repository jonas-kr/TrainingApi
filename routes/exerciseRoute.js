const router = require('express').Router()
const { getExercises, addExercise, getExerciseById, getFavExercises } = require('../controllers/exerciseController')
const Exercise = require("../models/Exercise")
const authMiddleware = require('../middlewares/authMiddleware')

//route is /api/exercise


const options = {
    method: "GET",
    headers: {
        "X-RapidAPI-Key": "45444fcb6fmsh1f661f4d7769ff4p1e9349jsn977501218ce6", // Replace with your API key
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
    },
};

router.get("/updateImage", async (req, res) => {
    try {
        const response = await fetch(
            "https://exercisedb.p.rapidapi.com/exercises?limit=2000",
            options
        );

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();


        for (let index = 0; index < data.length; index++) {
            const { id, gifUrl } = data[index];
            const exercise = await Exercise.findOne({ apiId: parseInt(id) });

            if (!exercise) {
                continue;
            }

            exercise.imageUrl = gifUrl;
            await exercise.save();
        }

        res.json({ message: "Data updated succesfully" })
    } catch (error) {
        console.error("Error fetching exercises:", error);
    }
})

router.get('/', getExercises)
router.get('/favorite', authMiddleware, getFavExercises)

router.post('/add', addExercise)

router.get('/:exerciseId', getExerciseById)




module.exports = router