import { analysis } from "../models/analysis.js";

export async function analyseUrl(req, res) {
    try {
        const { url } = req.body
        if (url) {
            return res.status(400).json({ success: false, message: "Please provide url for analysis" })
        }
        // validate url format
        let validURL;
        try {
            validURL = new URL(url.startsWith("http") ? url : `https://${url}`)
            const analysis = await analysis.create({ userId: req.userId, url: validURL.href, status: "processing" })
            res.json({ success: true, message: "Analysis started", analysis: analysis._id })
            

        } catch (error) {
            return res.status(400).json({ success: false, message: error.message || "Invalid URL format" })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message || "Analysis URL error" })
    }
}
// Get Analysis by ID
export async function getAnalysisById(req, res) {

}

// Get all analysis of any user 
export async function getAnalysis(req, res) {

}
export async function deleteAnalysis(req, res) {

}
