import { Analysis } from "../models/analysis.js";
import { analyzeSeoData } from "../service/geminiService.js";
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
                const aiResult = await analyzeSeoData(scrapResult?.data)
                if (!aiResult) {
                    Analysis.status = "failed"
                    await Analysis.save()
                    return
                }
                Analysis.overallScore = aiResult.data.overallScore || 0
                Analysis.categories = aiResult.data.overallScore || {}
                Analysis.metaData = scrapResult.data.metaData || {}
                Analysis.headings = scrapResult.data.headings || {}
                Analysis.links = scrapResult.data.links || {}
                Analysis.images = scrapResult.data.images || {}
                Analysis.keywords = aiResult.data.keywords || []
                Analysis.pageSize = scrapResult.data.pageSize || 0
                Analysis.wordCount = scrapResult.data.wordCount || 0
                Analysis.status = "completed"
                await Analysis.save()
                return res.status(200).json({ success: true, message: "Successfully Analyzed the website" })

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
    try {
        const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.userId })
        if (!analysis) return res.status(404).json({ success: false, message: "Analysis not found" })
        res.status(200).json({ success: true, data: analysis })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message || "Get Analysis error" })
    }
}

// Get all analysis of any user 
export async function getAnalysis(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit
        const analysis = await Analysis.find({
            userId: req.userId
        }).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-issues -keywords")
        const total = await Analysis.countDocuments({ userId: req.userId })
        res.status(200).json({ success: true, data: analysis, pageination: { page, limit, total, page: Math.ceil(total / limit) } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error?.response.message || `Get all analysis of ${req.userId} error` })
    }
}
export async function deleteAnalysis(req, res) {
    try {
        
    } catch (error) {
        
    }
}   
