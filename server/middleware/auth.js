import jwt from "jsonwebtoken"

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not authorized" })
        }
        const token = authHeader.split(" ")[1]
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decodeToken.id
        next()
    } catch (error) {
        
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default auth