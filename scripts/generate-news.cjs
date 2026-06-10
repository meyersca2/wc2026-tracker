// Runs in GitHub Actions — fetches real news via RSS, writes src/newsData.js
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const TEAMS = [
  { name: "Mexico",               flag: "🇲🇽", group: "A", confederation: "CONCACAF" },
  { name: "South Africa",         flag: "🇿🇦", group: "A", confederation: "CAF" },
  { name: "South Korea",          flag: "🇰🇷", group: "A", confederation: "AFC" },
  { name: "Czechia",              flag: "🇨🇿", group: "A", confederation: "UEFA" },
  { name: "Switzerland",          flag: "🇨🇭", group: "B", confederation: "UEFA" },
  { name: "Canada",               flag: "🇨🇦", group: "B", confederation: "CONCACAF" },
  { name: "Qatar",                flag: "🇶🇦", group: "B", confederation: "AFC" },
  { name: "Bosnia & Herzegovina", flag: "🇧🇦", group: "B", confederation: "UEFA" },
  { name: "Brazil",               flag: "🇧🇷", group: "C", confederation: "CONMEBOL" },
  { name: "Morocco",              flag: "🇲🇦", group: "C", confederation: "CAF" },
  { name: "Scotland",             flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", confederation: "UEFA" },
  { name: "Haiti",                flag: "🇭🇹", group: "C", confederation: "CONCACAF" },
  { name: "USA",                  flag: "🇺🇸", group: "D", confederation: "CONCACAF" },
  { name: "Australia",            flag: "🇦🇺", group: "D", confederation: "AFC" },
  { name: "Türkiye",              flag: "🇹🇷", group: "D", confederation: "UEFA" },
  { name: "Paraguay",             flag: "🇵🇾", group: "D", confederation: "CONMEBOL" },
  { name: "Germany",              flag: "🇩🇪", group: "E", confederation: "UEFA" },
  { name: "Ecuador",              flag: "🇪🇨", group: "E", confederation: "CONMEBOL" },
  { name: "Ivory Coast",          flag: "🇨🇮", group: "E", confederation: "CAF" },
  { name: "Curaçao",              flag: "🇨🇼", group: "E", confederation: "CONCACAF" },
  { name: "Netherlands",          flag: "🇳🇱", group: "F", confederation: "UEFA" },
  { name: "Japan",                flag: "🇯🇵", group: "F", confederation: "AFC" },
  { name: "Sweden",               flag: "🇸🇪", group: "F", confederation: "UEFA" },
  { name: "Tunisia",              flag: "🇹🇳", group: "F", confederation: "CAF" },
  { name: "Belgium",              flag: "🇧🇪", group: "G", confederation: "UEFA" },
  { name: "Iran",                 flag: "🇮🇷", group: "G", confederation: "AFC" },
  { name: "Egypt",                flag: "🇪🇬", group: "G", confederation: "CAF" },
  { name: "New Zealand",          flag: "🇳🇿", group: "G", confederation: "OFC" },
  { name: "Spain",                flag: "🇪🇸", group: "H", confederation: "UEFA" },
  { name: "Uruguay",              flag: "🇺🇾", group: "H", confederation: "CONMEBOL" },
  { name: "Saudi Arabia",         flag: "🇸🇦", group: "H", confederation: "AFC" },
  { name: "Cape Verde",           flag: "🇨🇻", group: "H", confederation: "CAF" },
  { name: "France",               flag: "🇫🇷", group: "I", confederation: "UEFA" },
  { name: "Senegal",              flag: "🇸🇳", group: "I", confederation: "CAF" },
  { name: "Norway",               flag: "🇳🇴", group: "I", confederation: "UEFA" },
  { name: "Iraq",                 flag: "🇮🇶", group: "I", confederation: "AFC" },
  { name: "Argentina",            flag: "🇦🇷", group: "J", confederation: "CONMEBOL" },
  { name: "Austria",              flag: "🇦🇹", group: "J", confederation: "UEFA" },
  { name: "Algeria",              flag: "🇩🇿", group: "J", confederation: "CAF" },
  { name: "Jordan",               flag: "🇯🇴", group: "J", confederation: "AFC" },
  { name: "Portugal",             flag: "🇵🇹", group: "K", confederation: "UEFA" },
  { name: "Colombia",             flag: "🇨🇴", group: "K", confederation: "CONMEBOL" },
  { name: "DR Congo",             flag: "🇨🇩", group: "K", confederation: "CAF" },
  { name: "Uzbekistan",           flag: "🇺🇿", group: "K", confederation: "AFC" },
  { name: "England",              flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", confederation: "UEFA" },
  { name: "Croatia",              flag: "🇭🇷", group: "L", confederation: "UEFA" },
  { name: "Panama",               flag: "🇵🇦", group: "L", confederation: "CONCACAF" },
  { name: "Ghana",                flag: "🇬🇭", group: "L", confederation: "CAF" },
];

// Search term overrides for teams whose name alone is ambiguous
const SEARCH_OVERRIDES = {
  "USA":                  "USMNT World Cup 2026",
  "South Korea":          "Korea Republic World Cup 2026",
  "Bosnia & Herzegovina": "Bosnia football World Cup 2026",
  "Ivory Coast":          "Ivory Coast football World Cup 2026",
  "DR Congo":             "DR Congo football World Cup 2026",
  "Türkiye":              "Turkey football World Cup 2026",
  "Curaçao":              "Curacao football World Cup 2026",
  "Scotland":             "Scotland football World Cup 2026",
};

function getSearchTerm(teamName) {
  return SEARCH_OVERRIDES[teamName] || `${teamName} football World Cup 2026`;
}

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WC2026Tracker/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// Resolve a Google News redirect URL to the actual article URL
function resolveArticleUrl(url) {
  return new Promise((resolve) => {
    if (!url.includes("news.google.com")) return resolve(url);
    const lib = url.startsWith("https") ? https : http;
    const req = lib.request(url, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WC2026Tracker/1.0)" },
      timeout: 6000,
    }, (res) => {
      const loc = res.headers.location;
      if (loc && loc.startsWith("http") && !loc.includes("news.google.com")) {
        resolve(loc);
      } else if (loc && loc.startsWith("http")) {
        resolveArticleUrl(loc).then(resolve);
      } else {
        resolve(url);
      }
    });
    req.on("error", () => resolve(url));
    req.on("timeout", () => { req.destroy(); resolve(url); });
    req.end();
  });
}

function parseRSS(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  
  for (const block of itemBlocks) {
    const getText = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };

    // Get link — Google RSS wraps the real URL in a redirect
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/) ||
                      block.match(/<link\s+href="([^"]+)"/);
    const rawLink = linkMatch ? linkMatch[1].trim() : "";

    // Extract real URL from Google redirect if present
    let url = rawLink;
    const urlMatch = rawLink.match(/url=([^&]+)/);
    if (urlMatch) {
      try { url = decodeURIComponent(urlMatch[1]); } catch {}
    }

    const sourceMatch = block.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/);
    const sourceUrl  = sourceMatch ? sourceMatch[1] : "";
    const sourceName = sourceMatch ? (sourceMatch[2] || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";

    const pubDate = getText("pubDate");
    const title   = getText("title");
    const desc    = getText("description");

    if (!title || !url) continue;

    // Parse date
    let dateStr = "Recent";
    if (pubDate) {
      const d = new Date(pubDate);
      if (!isNaN(d)) {
        dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    }

    items.push({
      headline:  title.replace(/\s*-\s*[^-]+$/, "").trim(),
      summary:   desc.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim().slice(0, 200),
      source:    sourceName || "News",
      sourceUrl: sourceUrl || "",
      url:       url,   // may still be google redirect — resolved below
      date:      dateStr,
      category:  "Other",
      pubDate:   pubDate,
    });
  }

  return items;
}

function categorize(headline) {
  const h = headline.toLowerCase();
  if (/injur|hurt|doubt|miss|ruled out|fitness|hamstring|knee|ankle/.test(h)) return "Injury";
  if (/squad|call.?up|named|roster|selection|squad list/.test(h)) return "Squad";
  if (/coach|manager|appoint|sack|resign|tactik|formation/.test(h)) return "Manager";
  if (/win|beat|defeat|draw|lost|score|goal|result|match/.test(h)) return "Result";
  if (/transfer|sign|join|contract|deal|move/.test(h)) return "Transfer";
  if (/preview|predict|preview|face|clash|vs|against|upcoming/.test(h)) return "Preview";
  if (/visa|cbp|customs|border|entry|state department|passport|travel/.test(h)) return "Entry";
  if (/form|rank|rating|performance|season|club/.test(h)) return "Form";
  return "Other";
}

async function fetchTeamNews(teamName) {
  const searchTerm = getSearchTerm(teamName);
  const query = encodeURIComponent(searchTerm);
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const { status, body } = await fetchURL(rssUrl);
    if (status !== 200) {
      console.warn(`  ${teamName}: HTTP ${status}`);
      return [];
    }
    const rawItems = parseRSS(body).slice(0, 5);

    // Resolve Google News redirect URLs to real article URLs in parallel
    const resolved = await Promise.all(
      rawItems.map(async (item) => {
        const realUrl = await resolveArticleUrl(item.url);
        return { ...item, url: realUrl, category: categorize(item.headline) };
      })
    );
    return resolved;
  } catch (e) {
    console.warn(`  ${teamName}: ${e.message}`);
    return [];
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`Fetching real news for ${TEAMS.length} teams from Google News RSS...`);
  const allNews = {};
  const overviewItems = [];

  for (let i = 0; i < TEAMS.length; i++) {
    const team = TEAMS[i];
    process.stdout.write(`[${i+1}/${TEAMS.length}] ${team.name}... `);
    const items = await fetchTeamNews(team.name);
    allNews[team.name] = items;
    console.log(`${items.length} articles`);

    // Add top story to overview
    if (items.length > 0) {
      overviewItems.push({ team: team.name, ...items[0] });
    }

    // Small delay to be polite
    if (i < TEAMS.length - 1) await sleep(300);
  }

  // Sort overview by most recent
  overviewItems.sort((a, b) => {
    const toMs = s => { const d = new Date(s); return isNaN(d) ? 0 : d.getTime(); };
    return toMs(b.pubDate) - toMs(a.pubDate);
  });
  const overview = overviewItems.slice(0, 14);

  // Write newsData.js
  const teamList = TEAMS.map(t =>
    `  { name: ${JSON.stringify(t.name)}, flag: ${JSON.stringify(t.flag)}, group: ${JSON.stringify(t.group)}, confederation: ${JSON.stringify(t.confederation)} }`
  ).join(",\n");

  const output = `// AUTO-GENERATED by GitHub Actions — do not edit manually
// Last updated: ${new Date().toISOString()}

const NEWS_DATA = ${JSON.stringify(allNews, null, 2)};

const OVERVIEW_NEWS = ${JSON.stringify(overview, null, 2)};

const TEAMS = [
${teamList},
];

export { NEWS_DATA, OVERVIEW_NEWS, TEAMS };
`;

  const outPath = path.join(__dirname, "../src/newsData.js");
  fs.writeFileSync(outPath, output, "utf8");

  const totalArticles = Object.values(allNews).reduce((s, a) => s + a.length, 0);
  console.log(`\n✅ Done — ${totalArticles} real articles across ${TEAMS.length} teams`);
}

main().catch(e => { console.error(e); process.exit(1); });
