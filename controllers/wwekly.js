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














async (req, res) => {
    const { allTime = false, nbrWeeks = 4, userId } = req.query;
    let MAX_WEEKS = parseInt(nbrWeeks) || 4;

    try {
        /* ------------------------------------------------------------------
           1. Decide the overall time span we have to cover
        ------------------------------------------------------------------ */
        const endDate = new Date();                         // “today”, last millisecond
        let startDate = new Date(endDate.getTime() - MS_IN_WEEK * MAX_WEEKS);

        if (allTime === "true" || allTime === true) {
            const first = await Session
                .findOne({ user: userId })
                .sort({ createdAt: 1 })
                .select("createdAt");

            if (first) {
                startDate = new Date(first.createdAt);            // go back to earliest data
                const spanInWeeks =
                    Math.ceil((endDate - startDate) / MS_IN_WEEK);
                // ensure we allocate enough buckets
                if (spanInWeeks > MAX_WEEKS) MAX_WEEKS = spanInWeeks;
            }
        }

        /* ------------------------------------------------------------------
           2. Pre‑build empty buckets for the required span
           buckets[0] == most‑recent 7 days, buckets[MAX_WEEKS‑1] == oldest
        ------------------------------------------------------------------ */
        const buckets = Array.from({ length: MAX_WEEKS }, (_, i) => ({
            // label example: "2025‑05‑09 → 2025‑05‑15"
            week: buildLabel(endDate, i),
            totalSessions: 0,
            totalMinutes: 0,
            totalWeight: 0,
        }));

        /* ------------------------------------------------------------------
           3. Fetch sessions inside the span and drop each one
              into the right 7‑day bucket
        ------------------------------------------------------------------ */
        const sessions = await Session.find({
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate },
        });

        sessions.forEach((session) => {
            const index = Math.floor((endDate - session.createdAt) / MS_IN_WEEK);
            if (index < 0 || index >= buckets.length) return;   // safety
            const b = buckets[index];

            b.totalSessions += 1;
            const mins = parseInt(session.duration) || 0;
            b.totalMinutes += mins;

            session.performedExercises.forEach((ex) =>
                ex.sets.forEach((s) => {
                    const w = s.weight || 0,
                        r = s.reps || 0;
                    b.totalWeight += w * r;
                })
            );
        });

        /* ------------------------------------------------------------------
           4. Convert minutes → h / m and send everything,
              zero buckets included
        ------------------------------------------------------------------ */
        const weeklyStats = buckets.map((b) => ({
            week: b.week,
            totalSessions: b.totalSessions,
            duration: {
                hours: Math.floor(b.totalMinutes / 60),
                minutes: b.totalMinutes % 60,
            },
            totalWeight: b.totalWeight,
        }));

        res.status(200).json({ weeklyStats });
    } catch (err) {
        res
            .status(500)
            .json({ message: `Server error: ${err.message}` });
    }
};
