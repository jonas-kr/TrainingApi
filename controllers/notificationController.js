const Notification = require("../models/Notification")


const getNotifications = async (req, res) => {
    const userId = req.user.userId;
    if (!userId) return res.status(400).json({ message: "No userId was provided" });

    const { page = 1, limit = 10, like, comment, save, follow } = req.query;
    let arr = []
    if (like == "true") arr.push("like")
    if (comment == "true") arr.push("comment")
    if (save == "true") arr.push("save")
    if (follow == "true") arr.push("follow")

    const query = {
        to: userId,
        notificationType: { $in: arr }
    }

    try {
        const count = await Notification.countDocuments(query);
        if (count === 0) {
            return res.status(200).json({ message: "There are no notifications" });
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit)).populate({
                path: 'from',
                model: 'User',
                localField: 'userId',
                foreignField: 'userId',
                select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following -createdAt -email -updatedAt -resetCode, -createdAt, -updatedAt -height -bio"
            }).exec();

        return res.status(200).json({
            notifications,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            count
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};



const readNotification = async (req, res) => {
    const { notificationId } = req.params
    const userId = req.user.userId

    try {
        const notification = await Notification.findOne({ notificationId });

        if (notification.to !== userId) return res.status(400).json({ message: "you can't update this notification" })

        notification.isSeen = true;

        await notification.save();

        res.status(200).json({ message: "notification updated successfully" });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const deleteNotification = async (req, res) => {
    const { notificationId } = req.params
    const userId = req.user.userId

    try {
        const notification = await Notification.findOne({ notificationId })

        if (notification.to !== userId) return res.status(400).json({ message: "you can't delete this notification" })

        await Notification.deleteOne({ notificationId });

        res.status(200).json({ message: "notification deleted successfully"});
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}
module.exports = { getNotifications, readNotification, deleteNotification };
