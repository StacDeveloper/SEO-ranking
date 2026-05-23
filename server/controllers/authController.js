import User from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const generatetoken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" })
}


export async function register(req, res) {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.json({ success: false, message: "All fields are required" })
        }
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" })
        }
        const gensalt = await bcrypt.genSalt(10)

        const hashpassword = await bcrypt.hash(password, gensalt)
        const user = await User.create({
            name,
            email,
            password: hashpassword
        })
        const token = generatetoken(user._id)
        return res.status(200).json({ success: true, token, user })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
export async function login(req, res) {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.json({ success: false, message: "All fields are required" })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "password do not match" })
        }
        const token = generatetoken(user._id)

        return res.status(200).json({ success: true, token, user })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
export async function getUser(req, res) {
    try {
        const user = await User.findById(req.userId).select("-password")
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" })
        }
        return res.status(200).json({ success: true, user })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

