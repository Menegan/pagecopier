const express = require('express');
const cors = require('cors');
const path = require('path');
const cheerio = require('cheerio');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Clone endpoint
app.post('/clone', async(req, res) => {
    let browser = null;
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL
        let targetUrl;
        try {
            targetUrl = new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        console.log(`🔄 Cloning page: ${url}`);
        console.log(`🌐 Launching browser...`);

        // Launch browser
        browser = await chromium.launch({
            headless: true
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();

        console.log(`📡 Loading page and executing JavaScript...`);

        // Navigate and wait for network to be idle
        await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        console.log(`⏱️  Waiting for dynamic content and lazy-loaded images...`);

        // Scroll to load lazy images
        await page.evaluate(async() => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        window.scrollTo(0, 0);
                        resolve();
                    }
                }, 100);
            });
        });

        // Wait a bit more for any delayed content
        await page.waitForTimeout(3000);

        console.log(`💾 Capturing rendered HTML...`);

        // Get the final HTML without excessive style inlining
        const renderedHtml = await page.content();

        console.log(`🧹 Cleaning up JavaScript...`);

        // Load with cheerio for cleanup
        const $ = cheerio.load(renderedHtml);

        // Remove all script tags
        $('script').remove();
        $('noscript').remove();

        // Remove all event handlers and JavaScript attributes
        $('*').each((i, elem) => {
            const attributes = elem.attribs || {};
            const attrsToRemove = [];

            for (let attr in attributes) {
                if (attr.startsWith('on') ||
                    attr.startsWith('data-') ||
                    attr === '__react' ||
                    attr === '__reactProps' ||
                    attr === '__reactInternalInstance' ||
                    attr === '__reactFiber' ||
                    attr === 'jsname' ||
                    attr === 'jsaction' ||
                    attr === 'jslog' ||
                    attr === 'data-js' ||
                    attr === 'data-bind' ||
                    attr === 'ng-' ||
                    attr.includes('click') ||
                    attr.includes('action')) {
                    attrsToRemove.push(attr);
                }
            }

            attrsToRemove.forEach(attr => $(elem).removeAttr(attr));
        });

        // Convert relative URLs to absolute
        const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`;

        const getAbsoluteUrl = (urlString, base) => {
            if (!urlString) return '';
            if (urlString.startsWith('//')) return `${targetUrl.protocol}${urlString}`;
            if (urlString.startsWith('/')) return `${baseUrl}${urlString}`;
            if (urlString.startsWith('http')) return urlString;
            if (urlString.startsWith('data:')) return urlString;
            try {
                return new URL(urlString, base).href;
            } catch (e) {
                return urlString;
            }
        };

        // Fix image sources (including srcset and loading attributes)
        $('img').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src) {
                $(elem).attr('src', getAbsoluteUrl(src, url));
            }

            // Fix srcset
            const srcset = $(elem).attr('srcset');
            if (srcset) {
                const fixedSrcset = srcset.split(',').map(item => {
                    const parts = item.trim().split(/\s+/);
                    const imagePath = parts[0];
                    const descriptor = parts.slice(1).join(' ');
                    return `${getAbsoluteUrl(imagePath, url)} ${descriptor}`.trim();
                }).join(', ');
                $(elem).attr('srcset', fixedSrcset);
            }

            // Remove lazy loading to ensure images display
            $(elem).removeAttr('loading');
            $(elem).removeAttr('data-lazy');
            $(elem).removeAttr('data-src');
            $(elem).removeAttr('data-lazy-src');
            $(elem).removeAttr('src-mini');
        });

        // Fix CSS links
        $('link[rel="stylesheet"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                $(elem).attr('href', getAbsoluteUrl(href, url));
            }
        });

        // Fix styles in <style> tags
        $('style').each((i, elem) => {
            let styleContent = $(elem).html();
            if (styleContent) {
                // Fix @import rules
                styleContent = styleContent.replace(/@import\s+(?:url\()?['"]?([^'"()]+)['"]?\)?/g, (match, importUrl) => {
                    return `@import url('${getAbsoluteUrl(importUrl, url)}')`;
                });

                // Fix url() in CSS
                styleContent = styleContent.replace(/url\(['"]?([^'"()]+)['"]?\)/g, (match, urlPath) => {
                    return `url('${getAbsoluteUrl(urlPath, url)}')`;
                });

                $(elem).html(styleContent);
            }
        });

        // Fix inline styles with URLs
        $('[style]').each((i, elem) => {
            let style = $(elem).attr('style');
            if (style && style.includes('url(')) {
                style = style.replace(/url\(['"]?([^'"()]+)['"]?\)/g, (match, urlPath) => {
                    return `url('${getAbsoluteUrl(urlPath, url)}')`;
                });
                $(elem).attr('style', style);
            }
        });

        // Fix source tags (video/audio)
        $('source').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src) {
                $(elem).attr('src', getAbsoluteUrl(src, url));
            }

            const srcset = $(elem).attr('srcset');
            if (srcset) {
                const parts = srcset.trim().split(/\s+/);
                const imagePath = parts[0];
                const descriptor = parts.slice(1).join(' ');
                $(elem).attr('srcset', `${getAbsoluteUrl(imagePath, url)} ${descriptor}`.trim());
            }
        });

        // Fix links
        $('a').each((i, elem) => {
            $(elem).removeAttr('onclick');
            $(elem).removeAttr('href', 'javascript:void(0)');
        });

        // Fix favicons
        $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                $(elem).attr('href', getAbsoluteUrl(href, url));
            }
        });

        // Disable all forms
        $('form').each((i, elem) => {
            $(elem).attr('onsubmit', 'return false;');
        });

        // Add base tag
        if (!$('base').length && $('head').length) {
            $('head').prepend(`<base href="${url}">`);
        }

        // Ensure proper viewport meta tag for responsive rendering
        if (!$('meta[name="viewport"]').length && $('head').length) {
            $('head').prepend(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
        }

        // Remove any width restrictions that might cause sidebar effect
        $('body').removeAttr('style');
        $('html').removeAttr('style');

        // Get final HTML
        let clonedHtml = $.html();

        // Ensure proper doctype
        if (!clonedHtml.includes('<!DOCTYPE')) {
            clonedHtml = '<!DOCTYPE html>\n' + clonedHtml;
        }

        const comment = `<!-- Cloned from: ${url} -->
<!-- Cloned on: ${new Date().toISOString()} -->
<!-- Note: JavaScript removed, UI rendered and captured -->
<!-- All interactive functions disabled -->

`;

        clonedHtml = comment + clonedHtml;

        console.log(`✅ Clone completed successfully!`);

        res.json({
            success: true,
            html: clonedHtml,
            originalUrl: url
        });

    } catch (error) {
        console.error('❌ Clone error:', error.message);

        let errorMessage = 'Failed to clone page';

        if (error.response) {
            errorMessage = `Failed to fetch page: ${error.response.status}`;
        } else if (error.message.includes('ENOTFOUND')) {
            errorMessage = 'Domain not found. Please check the URL.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. The page took too long to respond.';
        } else if (error.message.includes('net::ERR_')) {
            errorMessage = 'Network error: ' + error.message.split('net::')[1];
        } else {
            errorMessage = error.message;
        }

        res.status(500).json({ error: errorMessage });

    } finally {
        if (browser) {
            console.log(`🔴 Closing browser...`);
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Page Copier running on http://localhost:${PORT}`);
    console.log(`📋 Ready to clone website UIs!`);
    console.log(`ℹ️  Using Playwright browser to fully render JavaScript, then removing all JS\n`);
});