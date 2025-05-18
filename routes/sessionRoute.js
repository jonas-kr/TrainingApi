const router = require('express').Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { getSessions, getHomeFeed, addSession, editSession, deleteSession,
    likeUnlikeSession, addComment, getSessionDetails,getSessionLikes,getSessionComments } = require("../controllers/sessionController")


    
router.get("/", getSessions) //get user sessions

router.get("/homeFeed", authMiddleware, getHomeFeed) //get user home Feed sessions
router.post("/add", authMiddleware, addSession) //add a new session

router.put("/like/:sessionId", authMiddleware, likeUnlikeSession) //like unlike a session
router.put("/comment/:sessionId", authMiddleware, addComment) //comment on a session

router.get("/likes/:sessionId", getSessionLikes) //get a session details
router.get("/comments/:sessionId", getSessionComments) //get a session details

router.get("/:sessionId", getSessionDetails) //get a session details


router.put("/:sessionId", authMiddleware, editSession) //edit a session
router.delete("/:sessionId", authMiddleware, deleteSession) //delete a session








module.exports = router