import { keyWord } from "../models/keywordtrack.js"
import { keywordTracking } from "../service/keywordTrackingService.js"

export async function addKeyword(req, res) {
    try {
        const { url, keyword } = req.body
        if (!keyword || !url) {
            return res.status(400).json({ success: false, message: "Keyword and url are missing" })
        }
        // Extract domain from URL
        let domain
        const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
        domain = urlObj.hostname.replace("www.", "")

        // checking if already exits
        const existing = await keyWord.findOne({ userId: req.userId, keyword: keyword.toLowerCase().trim(), domain })
        if (existing) {
            return res.status(400).json({ success: false, message: "Already tracking this keyword for this domain" })
        }
        // create tracking entry
        const tracking = await keyWord.create({
            userId: req.userId,
            keyword: keyword.toLowerCase().trim(),
            url: url.startsWith("http") ? url : `https://${url}`,
            domain,
            status: "checking"
        })

        res.status(201).json({ success: true, tracking, message: "Keyword tracking started" })
        keywordTracking(tracking)
    } catch (error) {
        console.log("Add keyword error : " + error)
        return res.status(500).json({ sucess: false, message: error.message || "Failed to execute URL" })
    }
}
export async function getAllKeyWords(req, res) {
    try {
        const keywords = await keyWord.find({ userId: req.userId }).sort({ createdAt: -1 }).select("-rankHistory")
        res.status(200).json({ success: true, keywords })
    } catch (error) {
        console.log("Get Keyword Error : " + error)
        return res.status(500).json({ sucess: false, message: error.message || "Failed to GET URL" })
    }
}
export async function getSingleKeyWord(req, res) {
    try {
        const tracking = await keyWord.findOne({ _id: req.params.id, userId: req.userId })
        if (!tracking) {
            return res.status(400).json({ success: false, message: "Keyword tracking not found" })
        }
        res.status(200).json({ success: true, tracking })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message || "Failed to get Single Keyword" })
    }

}
export async function refreshKeyWord(req, res) {
    try {
        const tracking = await keyWord.findOne({ _id: req.params.id, userId: req.userId })
        if (!tracking) return res.status(400).json({ success: false, message: "No tracking found" })
        tracking.status = "checking"
        await tracking.save()
        res.status(200).json({ success: true, message: "Rank Check Started" })
        keywordTracking(tracking)
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to execute refresh Keyword" })
    }
}
export async function deleteKeyWord(req, res) {
    try {
        const tracking = await keyWord.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!tracking) return res.status(400).json({ success: false, message: "No tracking found to delete" })
        res.status(200).json({ success: true, message: `Keyword tracking deleted ${tracking.id || ""}` })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to delete tracking" })
    }

}
export async function toggleKeyWord(req, res) {
    try {
        const tracking = await keyWord.findOne({ _id: req.params.id, userId: req.userId })
        if (!tracking) return res.status(400).json({ success: false, message: `Tracking doesn't exist ${req.params.id}` || "No tracking found" })
        tracking.active = !tracking.active;
        await tracking.save()
        res.status(200).json({ success: true, tracking })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "toggle tracking error" })
    }
}