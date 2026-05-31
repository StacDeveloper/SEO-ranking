import { chromium } from "playwright-core"
import Browserbase from "@browserbasehq/sdk"
import dotenv from "dotenv"
dotenv.config()

const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY
})

export const scrapURL = async (url) => {
    let browser
    try {
        const session = await bb.sessions.create({ browserSettings: { blockAds: true } })
        browser = await chromium.connectOverCDP(session.connectUrl)
        const defaultContext = browser.contexts()[0]
        const page = defaultContext.pages()[0]
        page.setDefaultNavigationTimeout(30000)
        const startTime = Date.now()
        let response;
        try {
            response = await page.goto(url, { waitUntil: "domcontentloaded" })
        } catch (navError) {
            await browser.close().catch((err) => { console.log(err.message || err.response.message || "Error in closing the browser") })
            browser = null
            return { success: false, error: navError.message }
        }
        const loadTime = Date.now() - startTime
        await page.waitForTimeout(20000)
        // Extract all SEO-relevant data from rendered page
        const scrapData = await page.evaluate(() => {
            const getMata = (name) => {
                const element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property = "${name}"]`)
                return element ? element.getAttribute("content") || "" : ""
            }
            const title = document.title || ""
            const description = getMeta("description")
            const canonical = document.querySelector(`link[rel="canonical"]`)?.href || ""
            const robot = getMeta("robots")
            const ogTitle = getMata("og:title")
            const ogDescription = getMeta("og:description")
            const ogImage = getMeta("og:image")
            const twitterCard = getMeta("twitter:card")
            const viewPort = getMeta("viewport")
            const charsetMeta = document.querySelector("meta[charset]")
            const charset = charsetMeta ? charsetMeta.getAttribute("charset") || "" : ""
            const h1Elements = document.querySelectorAll("h1")
            const h1Texts = Array.from(h1Elements).map((h1) => h1.textContent?.trim() || "")
            const headings = {
                h1: document.querySelectorAll("h1").length,
                h2: document.querySelectorAll("h2").length,
                h3: document.querySelectorAll("h3").length,
                h4: document.querySelectorAll("h4").length,
                h5: document.querySelectorAll("h5").length,
                h6: document.querySelectorAll("h6").length,
                h1Texts
            }
            const allLinks = Array.from(document.querySelectorAll("a[href]"))
            const currentHost = window.location.hostname
            let internalLink = 0
            let externalLink = 0
            allLinks.forEach((link) => {
                try {
                    const href = link.href
                    if (href.startsWith("mailto:") || href.startsWith("tel:")) return
                    const linkUrl = new URL(href)
                    if (linkUrl.hostname === currentHost) internalLink++
                    else externalLink++
                } catch (error) {
                    console.log(error)
                    return { sucess: false, message: error.message || "Failed to get links from allLinks" }
                }
            })
            const allImages = Array.from(document.querySelectorAll("img"))
            const missingUlt = allImages.filter((img) => !img.alt || img.alt.trim() === "").length
            const bodyText = document.body?.innerText || ""
            const wordCount = bodyText.split(/\s+/).filter((word) => word.length > 0).length
            const pageSize = document.documentElement.outerHTML.length
            return {
                metaData: { title, description, canonical, robots, ogTitle, ogDescription, ogImage, twitterCard, viewPort, charset },
                headings,
                links: { internal: internalLink, external: externalLink, total: allLinks.length },
                images: { total: allImages.length, missingUlt, withUlt: allImages.length - missingUlt },
                wordCount,
                pageSize,
                bodyText: bodyText.substring(0, 3000)
            }
        })
        const statusCode = response?.status() || 0
        await page.close()
        await browser.close()
        return {
            success: true,
            data: { ...scrapData, loadTime, statusCode, url }
        }
    } catch (error) {
        console.log(error)
        if (browser) {
            try {
                await browser.close()
            } catch (browserError) {
                console.error(browserError?.response?.message || browserError.message || "Scrapper console failed")
                return
            }
        }
        return {
            success: false,
            message: error.message || error?.response?.message
        }
    }
}