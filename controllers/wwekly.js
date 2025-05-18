async (req, res) => {
    const { allTime = false, nbrWeeks = 2, userId } = req.query;

    try {
        let startDate = new Date();
        let numberOfWeeks = parseInt(nbrWeeks - 1 );

        if (allTime === "true" || allTime === true) {
            // Fetch earliest session to determine start date
            const firstSession = await Session.findOne({ user: userId }).sort({ createdAt: 1 });
            if (firstSession) {
                startDate = new Date(firstSession.createdAt);
            }
        } else {
            startDate.setDate(startDate.getDate() - 7 * numberOfWeeks);
        }

        const today = new Date();
        const allWeeks = generateWeekRange(startDate, today);

        const sessions = await Session.find({
            user: userId,
            createdAt: { $gte: startDate, $lte: today }
        });

        const weeksMap = new Map();

        // Group sessions into weeks
        sessions.forEach(session => {
            const [year, weekNumber] = getWeekNumber(new Date(session.createdAt));
            const key = `${year}-W${weekNumber}`;

            if (!weeksMap.has(key)) {
                weeksMap.set(key, {
                    totalSessions: 0,
                    totalMinutes: 0,
                    totalWeight: 0
                });
            }

            const data = weeksMap.get(key);
            data.totalSessions += 1;
            const duration = parseInt(session.duration) || 0;
            data.totalMinutes += duration;

            session.performedExercises.forEach(ex => {
                ex.sets.forEach(set => {
                    const weight = set.weight || 0;
                    const reps = set.reps || 0;
                    data.totalWeight += weight * reps;
                });
            });
        });

        // Build full list with zero-fill
        const weeklyStats = allWeeks.map(({ year, week, label }) => {
            const key = `${year}-W${week}`;
            const data = weeksMap.get(key) || {
                totalSessions: 0,
                totalMinutes: 0,
                totalWeight: 0
            };

            return {
                week: label,
                totalSessions: data.totalSessions,
                duration: {
                    hours: Math.floor(data.totalMinutes / 60),
                    minutes: data.totalMinutes % 60
                },
                totalWeight: data.totalWeight
            };
        });

        res.status(200).json({ weeklyStats : weeklyStats.reverse() });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};