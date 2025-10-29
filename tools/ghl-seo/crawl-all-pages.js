const puppeteer = require('puppeteer');
const fs = require('fs');

async function crawlSite() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const visited = new Set();
  const toVisit = new Set(['https://maxaiassistant.com']);
  const pages = [];
  
  console.log('🔍 Starting site crawl...\n');
  
  while (toVisit.size > 0) {
    const url = toVisit.values().next().value;
    toVisit.delete(url);
    
    if (visited.has(url)) continue;
    if (!url.startsWith('https://maxaiassistant.com')) continue;
    
    visited.add(url);
    
    try {
      console.log(`📄 Crawling: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const title = await page.$eval('title', el => el.textContent).catch(() => '');
      const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
      const h1 = await page.$eval('h1', el => el.textContent).catch(() => '');
      
      const links = await page.$$eval('a[href]', links => 
        links.map(l => l.href).filter(href => href && !href.includes('#'))
      );
      
      pages.push({
        url,
        title,
        description,
        h1,
        links: [...new Set(links)].filter(l => l.startsWith('https://maxaiassistant.com'))
      });
      
      // Add new links to visit
      links.forEach(link => {
        if (link.startsWith('https://maxaiassistant.com') && !visited.has(link)) {
          toVisit.add(link);
        }
      });
      
    } catch (err) {
      console.error(`❌ Error crawling ${url}: ${err.message}`);
    }
  }
  
  await browser.close();
  
  console.log(`\n✅ Found ${pages.length} pages\n`);
  
  // Save results
  fs.writeFileSync(
    'scraped-data/all-pages-crawl.json',
    JSON.stringify(pages, null, 2)
  );
  
  // Print summary
  console.log('📋 PAGES FOUND:');
  pages.forEach((p, i) => {
    console.log(`${i + 1}. ${p.url}`);
    console.log(`   Title: ${p.title || '(empty)'}`);
    console.log(`   H1: ${p.h1 || '(empty)'}`);
    console.log('');
  });
  
  return pages;
}

crawlSite().catch(console.error);
