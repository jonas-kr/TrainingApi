const calcHeatmap = (performedExercises) => {
    const muscleLoads = {};


    performedExercises.forEach((exerciseDetails) => {
        const { primaryMuscle, secondaryMuscles } = exerciseDetails.exercise;

        exerciseDetails.sets.forEach((set) => {
            const load = set.weight * set.reps;

            // primary * 1
            if (!muscleLoads[primaryMuscle]) muscleLoads[primaryMuscle] = 0;
            muscleLoads[primaryMuscle] += load * 1;

            // secondary * 0.5
            secondaryMuscles.forEach((muscle) => {
                if (!muscleLoads[muscle]) muscleLoads[muscle] = 0;
                muscleLoads[muscle] += load * 0.5;
            });
        });
    });

    let maxLoad = Math.max(...Object.values(muscleLoads));

    const normalizedLoads = {};
    for (const muscle in muscleLoads) {
        normalizedLoads[muscle] = +(muscleLoads[muscle] / maxLoad).toFixed(2);
    }

    return normalizedLoads

}

module.exports = { calcHeatmap }