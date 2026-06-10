// Runs in GitHub Actions — calls Anthropic API, rewrites src/newsData.js
const https = require("https");
const fs = require("fs");
const path = require("path");

const TEAMS = [
  { name: "Mexico", flag: "🇲🇽", group: "A", confederation: "CONCACAF" },
  { name: "South Africa", flag: "🇿🇦", group: "A", confederation: "CAF" },
  { name: "South Korea", flag: "🇰🇷", group: "A", confederation: "AFC" },
  { name: "Czechia", flag: "🇨🇿", group: "A", confederation: "UEFA" },
  { name: "Switzerland", flag: "🇨🇭", group: "B", confederation: "UEFA" },
  { name: "Canada", flag: "🇨🇦", group: "B", confederation: "CONCACAF" },
  { name: "Qatar", flag: "🇶🇦", group: "B", confederation: "AFC" },
  { name: "Bosnia & Herzegovina", flag: "🇧🇦", group: "B", confederation: "UEFA" },
  { name: "Brazil", flag: "🇧🇷", group: "C", confederation: "CONMEBOL" },
  { name: "Morocco", flag: "🇲🇦", group: "C", confederation: "CAF" },
  { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", confederation: "UEFA" },
  { name: "Haiti", flag: "🇭🇹", group: "C", confederation: "CONCACAF" },
  { name: "USA", flag: "🇺🇸", group: "D", confederation: "CONCACAF" },
  { name: "Australia", flag: "🇦🇺", group: "D", confederation: "AFC" },
  { name: "Türkiye", flag: "🇹🇷", group: "D", confederation: "UEFA" },
  { name: "Paraguay", flag: "🇵🇾", group: "D", confederation: "CONMEBOL" },
  { name: "Germany", flag: "🇩🇪", group: "E", confederation: "UEFA" },
  { name: "Ecuador", flag: "🇪🇨", group: "E", confederation: "CONMEBOL" },
  { name: "Ivory Coast", flag: "🇨🇮", group: "E", confederation: "CAF" },
  { name: "Curaçao", flag: "🇨🇼", group: "E", confederation: "CONCACAF" },
  { name: "Netherlands", flag: "🇳🇱", group: "F", confederation: "UEFA" },
  { name: "Japan", flag: "🇯🇵", group: "F", confederation: "AFC" },
  { name: "Sweden", flag: "🇸🇪", group: "F", confederation: "UEFA" },
  { name: "Tunisia", flag: "🇹🇳", group: "F", confederation: "CAF" },
  { name: "Belgium", flag: "🇧🇪", group: "G", confederation: "UEFA" },
  { name: "Iran", flag: "🇮🇷", group: "G", confederation: "AFC" },
  { name: "Egypt", flag: "🇪🇬", group: "G", confederation: "CAF" },
  { name: "New Zealand", flag: "🇳🇿", group: "G", confederation: "OFC" },
  { name: "Spain", flag: "🇪🇸", group: "H", confederation: "UEFA" },
  { name: "Uruguay", flag: "🇺🇾", group: "H", confederation: "CONMEBOL" },
  { name: "Saudi Arabia", flag: "🇸🇦", group: "H", confederation: "AFC" },
  { name: "Cape Verde", flag: "🇨🇻", group: "H", confederation: "CAF" },
  { name: "France", flag: "🇫🇷", group: "I", confederation: "UEFA" },
  { name: "Senegal", flag: "🇸🇳", group: "I", confederation: "CAF" },
  { name: "Norway", flag: "🇳🇴", group: "I", confederation: "UEFA" },
  { name: "Iraq", flag: "🇮🇶", group: "I", confederation: "AFC" },
  { name: "Argentina", flag: "🇦🇷", group: "J", confederation: "CONMEBOL" },
  { name: "Austria", flag: "🇦🇹", group: "J", confederation: "UEFA" },
  { name: "Algeria", flag: "🇩🇿", group: "J", confederation: "CAF" },
  { name: "Jordan", flag: "🇯🇴", group: "J", confederation: "AFC" },
  { name: "Portugal", flag: "🇵🇹", group: "K", confederation: "UEFA" },
  { name: "Colombia", flag: "🇨🇴", group: "K", confederation: "CONMEBOL" },
  { name: "DR Congo", flag: "🇨🇩", group: "K", confederation: "CAF" },
  { name: "Uzbekistan", flag: "🇺🇿", group: "K", confederation: "AFC" },
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", confederation: "UEFA" },
  { name: "Croatia", flag: "🇭🇷", group: "L", confederation: "UEFA" },
  { name: "Panama", flag: "🇵🇦", group: "L", confederation: "CONCACAF" },
  { name: "Ghana", flag: "🇬🇭", group: "L", confederation: "CAF" },
];

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "error") return reject(new Error(parsed.error.message));
          const text = parsed.content?.find(b => b.type === "text")?.text;
          resolve(text || "");
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function extractJSON(raw) {
  const s = raw.indexOf("[");
  const e = raw.lastIndexOf("]");
  if (s === -1 || e === -1) return null;
  try { return JSON.parse(raw.slice(s, e + 1)); } catch { return null; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generateAllNews() {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  console.log(`Generating news for ${TEAMS.length} teams — ${today}`);

  const allNews = {};
  const overviewItems = [];

  // Process teams in batches of 4 to avoid rate limits
  for (let i = 0; i < TEAMS.length; i += 4) {
    const batch = TEAMS.slice(i, i + 4);
    const teamNames = batch.map(t => t.name).join(", ");

    console.log(`Batch ${Math.floor(i/4)+1}: ${teamNames}`);

    const prompt = `Today is ${today}. FIFA World Cup 2026 is underway (June 11 - July 19, 2026) in USA, Canada, Mexico.

Generate news items for these teams: ${teamNames}

For EACH team generate 4 items covering: (1) US entry/CBP/visa status update, (2) match result or upcoming fixture news, (3) squad/injury update, (4) manager or form note.

Return ONLY a valid JSON array, no markdown:
[{"team":"Mexico","headline":"Short headline max 12 words","summary":"Two sentence summary.","source":"ESPN","date":"${today.split(',')[0]}","category":"Entry"}]

category = Entry | Squad | Injury | Form | Manager | Transfer | Result | Preview | Other
source = ESPN | BBC Sport | Reuters | AP | Sky Sports | The Athletic | Goal.com
Include all ${batch.length} teams, 4 items each.`;

    try {
      const raw = await callClaude(prompt);
      const items = extractJSON(raw);
      if (items) {
        for (const item of items) {
          if (!allNews[item.team]) allNews[item.team] = [];
          allNews[item.team].push(item);
        }
        // Pick entry item from each team for overview if it has complications
        for (const team of batch) {
          const entryItem = items.find(it => it.team === team.name && it.category === "Entry");
          if (entryItem) overviewItems.push({ ...entryItem });
        }
      }
    } catch (e) {
      console.error(`Batch failed: ${e.message}`);
    }

    if (i + 4 < TEAMS.length) await sleep(1500); // rate limit buffer
  }

  // Build overview — entry complications first, then top football stories
  const entryComplications = overviewItems.filter(i =>
    i.summary && (i.summary.includes("held") || i.summary.includes("delay") ||
    i.summary.includes("scru") || i.summary.includes("review") || i.summary.includes("72"))
  ).slice(0, 6);

  const footballStories = Object.entries(allNews)
    .flatMap(([team, items]) => items.filter(i => i.category === "Result" || i.category === "Form").map(i => ({...i, team})))
    .slice(0, 8);

  const overview = [...entryComplications, ...footballStories].slice(0, 14);

  return { allNews, overview };
}

async function main() {
  const { allNews, overview } = await generateAllNews();

  const teamList = TEAMS.map(t =>
    `  { name: ${JSON.stringify(t.name)}, flag: ${JSON.stringify(t.flag)}, group: ${JSON.stringify(t.group)}, confederation: ${JSON.stringify(t.confederation)} }`
  ).join(",\n");

  const newsDataStr = JSON.stringify(allNews, null, 2);
  const overviewStr = JSON.stringify(overview, null, 2);

  const output = `// AUTO-GENERATED by GitHub Actions — do not edit manually
// Last updated: ${new Date().toISOString()}

const NEWS_DATA = ${newsDataStr};

const OVERVIEW_NEWS = ${overviewStr};

const TEAMS = [
${teamList},
];

// Prepend entry story to top of each team's news array (already included above)

export { NEWS_DATA, OVERVIEW_NEWS, TEAMS };
`;

  const outPath = path.join(__dirname, "../src/newsData.js");
  fs.writeFileSync(outPath, output, "utf8");
  console.log(`✅ newsData.js updated — ${Object.keys(allNews).length} teams, ${overview.length} overview items`);
}

main().catch(e => { console.error(e); process.exit(1); });
