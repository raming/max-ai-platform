const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugCSS() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    console.log('Navigating to localhost:3004...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle2' });

    console.log('Analyzing page...');

    // Check if CSS files are loaded
    const cssResources = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.map(link => ({
            href: link.href,
            loaded: link.sheet !== null
        }));
    });

    // Check computed styles for specific elements
    const svgStyles = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('svg'));
        return svgs.map((svg, index) => ({
            index,
            width: window.getComputedStyle(svg).width,
            height: window.getComputedStyle(svg).height,
            classes: svg.className.baseVal || svg.className
        }));
    });

    // Check if Tailwind classes exist in the DOM
    const hasTailwindClasses = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const tailwindClasses = ['w-8', 'h-8', 'text-green-600', 'p-6', 'max-w-4xl'];

        const foundClasses = {};
        tailwindClasses.forEach(cls => {
            foundClasses[cls] = allElements.some(el => el.classList.contains(cls));
        });

        return foundClasses;
    });

    // Check the actual CSS content
    const cssContent = await page.evaluate(() => {
        const styleSheets = Array.from(document.styleSheets);
        let totalRules = 0;
        styleSheets.forEach(sheet => {
            try {
                if (sheet.cssRules) {
                    totalRules += sheet.cssRules.length;
                }
            } catch (e) {
                // CORS or other issues
            }
        });
        return { styleSheets: styleSheets.length, totalRules };
    });

    // Check for specific Tailwind rules
    const tailwindRules = await page.evaluate(() => {
        const rules = {};
        const styleSheets = Array.from(document.styleSheets);

        styleSheets.forEach(sheet => {
            try {
                if (sheet.cssRules) {
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule.selectorText && (
                            rule.selectorText.includes('.w-8') ||
                            rule.selectorText.includes('.h-8') ||
                            rule.selectorText.includes('.text-green-600')
                        )) {
                            rules[rule.selectorText] = rule.cssText.substring(0, 100) + '...';
                        }
                    });
                }
            } catch (e) {
                // CORS or other issues
            }
        });

        return rules;
    });

    const title = await page.title();

    await browser.close();

    // Output results
    const results = {
        title,
        cssResources,
        svgStyles,
        hasTailwindClasses,
        cssContent,
        tailwindRules
    };

    fs.writeFileSync('debug-results.json', JSON.stringify(results, null, 2));
    console.log('Debug results saved to debug-results.json');
}

debugCSS().catch(console.error);