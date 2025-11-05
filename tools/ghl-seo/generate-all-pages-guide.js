const fs = require('fs');
const allPages = JSON.parse(fs.readFileSync('all-pages-crawl.json', 'utf8'));

// Filter out non-service pages
const servicePages = allPages.filter(p => {
  const url = p.url;
  // Exclude utility pages
  const excluded = ['contact', 'plans', 'privacy', 'terms', 'free-demo', 'schedule', 
                    'reviews', 'webchat', 'campaigns', 'conversations-ai', 'social-media', 
                    'local-seo', 'homepage', 'undefined'];
  return !excluded.some(ex => url.includes(ex));
});

// Category pages - keep for reference
const categoryPages = ['/home-services', '/pet-services', '/automotive-services'];
const categoryPageObjs = allPages.filter(p => categoryPages.some(cat => p.url.includes(cat)));

console.log(`\n📊 PAGE ANALYSIS:\n`);
console.log(`Total Pages Discovered: ${allPages.length}`);
console.log(`Service Pages: ${servicePages.length}`);
console.log(`Category Pages: ${categoryPageObjs.length}`);
console.log(`Utility/Nav Pages: ${allPages.length - servicePages.length - categoryPageObjs.length}`);

// Create summary
const summary = {
  totalPages: allPages.length,
  servicePages: servicePages.map(p => p.url),
  categoryPages: categoryPageObjs.map(p => p.url),
  utilityPages: allPages.filter(p => 
    !servicePages.includes(p) && !categoryPageObjs.includes(p)
  ).map(p => p.url),
  allPages: allPages.map(p => p.url)
};

fs.writeFileSync('scraped-data/page-inventory.json', JSON.stringify(summary, null, 2));

// Print services
console.log(`\n🔧 SERVICE PAGES (${servicePages.length}):\n`);
servicePages.forEach((p, i) => {
  console.log(`${i + 1}. ${p.url}`);
});

console.log(`\n📁 CATEGORY PAGES:\n`);
categoryPageObjs.forEach(p => {
  console.log(`• ${p.url}`);
});

console.log(`\n📋 OTHER PAGES:\n`);
allPages.filter(p => 
  !servicePages.includes(p) && !categoryPageObjs.includes(p)
).forEach(p => {
  console.log(`• ${p.url}`);
});

console.log(`\nPage inventory saved to: scraped-data/page-inventory.json`);
