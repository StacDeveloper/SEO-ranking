import { rankTracker } from "./rankTrackerService.js"

export const keywordTracking = async (tracking) => {
    console.log("🔍 keywordTracking started:", tracking.keyword, tracking.domain)
    try {
        let results
        for (let attempt = 1; attempt <= 2; attempt++) {
            results = await rankTracker(tracking.keyword, tracking.domain)

            // ✅ Fixed typo: totalResultsScanned (capital R)
            if (results.success && results.data.totalResultsScanned > 0) break

            if (attempt < 2) await new Promise((res) =>
                setTimeout(res, results.success ? 3000 : 5000)
            )
        }

        if (results.success) {
            const prev = tracking.currentPosition
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            tracking.currentPosition = results.data.position
            tracking.currentPage = results.data.page
            tracking.competitors = results.data.competitors
            tracking.lastChecked = new Date()
            tracking.status = "completed"
            tracking.positionChange = prev && results.data.position ? prev - results.data.position : 0

            if (results.data.position && (!tracking.bestPosition || results.data.position < tracking.bestPosition)) {
                tracking.bestPosition = results.data.position
            }

            const historyEntry = {
                date: today,
                position: results.data.position,
                page: results.data.page,
                title: results.data.title,
                snippet: results.data.snippet
            }

            const idx = tracking.rankHistory.findIndex(
                (hist) => hist.date.toDateString() === today.toDateString()
            )
            if (idx !== -1) tracking.rankHistory[idx] = historyEntry
            else tracking.rankHistory.push(historyEntry)

        } else {
            tracking.status = "failed"
        }

        await tracking.save()
        return results

    } catch (error) {
        console.log(error)
        tracking.status = "failed"
        await tracking.save().catch((err) => console.log(err))
        return { success: false, message: error.message || "Failed to execute keyword tracking" }
    }
}