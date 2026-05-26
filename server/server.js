import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { connectDB } from "./configs/db.js"
import authRouter from "./routes/authRoutes.js"
import rankRoutes from "./routes/rankRoutes.js"
dotenv.config()
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

await connectDB()

app.use("/api/auth", authRouter)
app.use("/api/rank", rankRoutes)
app.use("/", (req, res) => {
    res.json({ success: true, message: "Server is healthy" })
})
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`))