import { Analysis } from "../models/analysis.js";
import { scrapURL } from "../service/scraperService.js";

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
            const analysis = await Analysis.create({ userId: req.userId, url: validURL.href, status: "processing" })
            res.json({ success: true, message: "Analysis started", analysis: analysis._id })

            // run scrapping and analysis in background
            try {
                const scrapResult = await scrapURL(validURL.href)
                if (!scrapResult.success) {
                    analysis.status = "failed"
                    await analysis.save()
                    return
                }
                // analyse with gemini AI

            } catch (scrapError) {
                console.error("Analyse URL error" + scrapError)
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: "Server error" })
                }
            }

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
