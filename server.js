const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const port = process.env.PORT || 4000
const { sendEmail } = require('./services/emailService')


const authRoute = require('./routes/authRoute')

const userRoute = require('./routes/userRoute')
const exerciseRoute = require('./routes/exerciseRoute')
const programRoute = require('./routes/programRoute')
const sessionRoute = require('./routes/sessionRoute')
const progressRoute = require('./routes/progressRoute')
const notificationRoute = require('./routes/notificationRoute')




//cros origines
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}))


//Accept json in req body
app.use(express.json())
app.use(cookieParser());

//API ROUTES
app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
app.use('/api/exercise', exerciseRoute)
app.use('/api/program', programRoute)
app.use('/api/session', sessionRoute)
app.use('/api/progress', progressRoute)
app.use('/api/notification', notificationRoute)



/* app.get("/", (req, res) => {
    res.status(200).send("This is my API")
})
 */

app.post("/sendEmail", async (req, res) => {
    const { to, subject, text } = req.body

    if (!to || !subject || !text) {
        return res.status(400).json({ message: "All fields must be filled" })
    }

    try {
        const response = await sendEmail(to, subject, text)
        if (!response.success) res.status(400).json({ message: response.message })
        res.status(201).json({ message: response.message })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
})




//Connect to database and start listening
mongoose.connect(process.env.DB_URI).then(() => {
    app.listen(port, () => {
        console.log("Database is connected");
        console.log("Listening on Port", port);
    })
}).catch((err) => { console.log(err); })