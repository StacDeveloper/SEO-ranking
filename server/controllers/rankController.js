import { keyWord } from "../models/keywordtrack"

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
        const trackng = await keyWord.create({
            userId: req.userId,
            keyword: keyword.toLowerCase().trim(),
            url: url.startsWith("http") ? url : `https://${url}`,
            domain,
            status: "checking"
        })

        res.status(201).json({ success: true, tracking, message: "Keyword tracking started" })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ sucess: false, message: error.message || "Failed to execute URL" })
    }
}
export async function getAllKeyWords(req, res) {

}
export async function getSingleKeyWord(req, res) {

}
export async function refreshKeyWord(req, res) {

}
export async function deleteKeyWord(req, res) {

}
export async function toggleKeyWord(req, res) {

}