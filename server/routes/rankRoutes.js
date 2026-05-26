import express from "express"
import auth from "../middleware/auth.js"
import { addKeyword, deleteKeyWord, getAllKeyWords, getSingleKeyWord, refreshKeyWord, toggleKeyWord } from "../controllers/rankController.js"

const rankRoutes = express.Router()


rankRoutes.post("/add", auth, addKeyword)
rankRoutes.get("/list", auth, getAllKeyWords)
rankRoutes.get("/list/:id", auth, getSingleKeyWord)
rankRoutes.get("/:id/refresh", auth, refreshKeyWord)
rankRoutes.get("/:id/toggle", auth, toggleKeyWord)
rankRoutes.delete("/:id/delete", auth, deleteKeyWord)

export default rankRoutes