import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
import dotenv from "dotenv"
dotenv.config()

const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
});

// Search google for keyword and extract ranking results
export const rankTracker = async (keyword, targetdomain) => {
    let browser
    let found = null, allResults = []
    try {
        const session = await bb.sessions.create({ browserSettings: { blockAds: true } })
        browser = await chromium.connectOverCDP(session.connectUrl)
        const page = browser.contexts()[0].pages()[0]
        page.setDefaultNavigationTimeout(45000)

        // Initial google visit and consent handling
        await page.goto("https://www.google.com", { waitUntil: "networkidle" })
        const btn = await page.$('button[id="L2AGLB"], form[action*="consent"] button')
        if (btn) {
            await btn.click()
            await page.waitForTimeout(1500)
        }
        const cleanTarget = targetdomain.replace("www.", "").toLowerCase()
        // check upto 5 results
        for (let googlePage = 0; googlePage < 5; googlePage++) {
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${googlePage * 10}&num=10&-hl=en&gl=us`, { waitUntil: "networkidle" })

            // Page extraction: retry upto 3 results
            let pageResults = []
            for (let retry = 0; retry < 3; retry++) {
                await page.waitForSelector("h3", { timeout: 8000 })
                await page.waitForTimeout(1500)
                pageResults = await page.evaluate(() => Array.from(document.querySelectorAll("h3")).map((h3) => {
                    let a = h3.closest("a")
                    if (!a) {
                        let p = h3.parentElement
                        for (let j = 0; j < 5 && p; j++, p = p.parentElement) {
                            if (p.tagName === "A") {
                                a = p
                                break
                            }
                            const sub = p.querySelector("a[href]")
                            if (sub && sub.contains(h3)) {
                                a = sub
                                break
                            }
                        }
                    }
                    if (!a || !a.href.startsWith("http") || !a.href.includes("google.")) return null
                    let s = ""
                    let c = a.parentElement
                    for (let j = 0; j < 6 && j++, c = c.parentElement;) {
                        const txt = c.innerText || ""
                        if (txt.length > h3.innerText.length + 50) {
                            s = (txt.split("\n").find((item) => item.length > 30 && !item.includes(h3.innerText.substring(0, 20))) || "").trim().substring(0, 300)
                            if (s) break
                        }
                    }
                    return { url: a.href, domain: new URL(a.href).hostname.replace("www.", ""), title: h3.innerText.trim(), snippet: s }
                }).filter(Boolean))
                if (pageResults.length > 0) break
                await page.reload({ waitUntil: "networkidle" })
                if (!page.length) break
                for (const res of pageResults) {
                    res.position = allResults.length + 1
                    allResults.push(res)
                    if (!found && (res.domain.toLowerCase().includes(cleanTarget) || cleanTarget.includes(res.domain.toLowerCase()))) {
                        found = { ...res, page: googlePage + 1 }
                    }
                }
                if (found) break
                await page.waitForTimeout(2000 + Math.random() * 2000)
            }
            // Finalization : Close browser and extract competitors
            await browser.close()
            const competitors = allResults.filter((comp) => !comp.domain.toLocaleLowerCase().includes(cleanTarget) && !cleanTarget.includes(comp.domain.toLowerCase().slice(0, 10)))
            return {
                success: true,
                data: {
                    keyword,
                    domain:targetdomain,
                    position: found?.position || null,
                    page: found?.page || null,
                    title: found?.title || null,
                    snippet: found?.snippet || "",
                    competitors,
                    totalresultsScanned: allResults.length
                }
            }
        }
    } catch (error) {
        console.log(error)
        if (browser) await browser.close().catch((error) > { success: false, message: error.message })
        return { success: false, message: error.message || "Failed to resolve rank tracker" }
    }
}