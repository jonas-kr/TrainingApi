function getDifficulty(equipment) {
    const beginner = [
        "body weight", "resistance band", "stability ball", "bosu ball", "assisted"
    ];

    const intermediate = [
        "dumbbell", "kettlebell", "medicine ball", "cable", "ez barbell", "roller"
    ];

    const advanced = [
        "barbell", "smith machine", "sled machine", "leverage machine",
        "trap bar", "tire", "olympic barbell", "hammer", "skierg machine",
        "stationary bike", "elliptical machine", "stepmill machine", "upper body ergometer"
    ];

    equipment = equipment.toLowerCase().trim();

    if (beginner.includes(equipment)) return "beginner";
    if (intermediate.includes(equipment)) return "intermediate";
    if (advanced.includes(equipment)) return "advanced";

    return "unknown";
}

const isCompound = (secondaryMuscles) => {
    return secondaryMuscles.length > 1 ? 'compound' : 'isolation';
};
router.get("/insertExercises", async (req, res) => {
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
            const { bodyPart, equipment, gifUrl, name, target, secondaryMuscles, instructions } = data[index];

            const difficult = getDifficulty(equipment)
            const isCoumpound = isCompound(secondaryMuscles)

            const exercise = await Exercise.create({
                exerciseName: name, bodyPart, equipment, difficulty: difficult, type: isCoumpound, primaryMuscle: target, secondaryMuscles,
                instructions, imageUrl: gifUrl
            })
        }
        res.json({ message: "Data inserted succesfully", data })
    } catch (error) {
        console.error("Error fetching exercises:", error);
    }

})


