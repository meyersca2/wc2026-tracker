#!/usr/bin/env node
// CommonJS script — runs in GitHub Actions to fetch real RSS news
'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

const SEARCH_OVERRIDES = {
  "USA":                  "USMNT soccer World Cup 2026",
  "South Korea":          "Korea Republic football World Cup 2026",
  "Bosnia & Herzegovina": "Bosnia football World Cup 2026",
  "Ivory Coast":          "Ivory Coast football World Cup 2026",
  "DR Congo":             "DR Congo football World Cup 2026",
  "Türkiye":              "Turkey football World Cup 2026",
  "Curaçao":              "Curacao football World Cup 2026",
};

function getSearchTerm(name) {
  return SEARCH_OVERRIDES[name] || (name + " football World Cup 2026");
}

function fetchURL(url, method) {
  method = method || 'GET';
  return new Promise(function(resolve, reject) {
    var lib = url.startsWith('https') ? https : http;
    var req = lib.request(url, {
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WC2026Tracker/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      timeout: 12000,
    }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        var loc = res.headers.location;
        if (!loc.startsWith('http')) loc = new URL(loc, url).href;
        return fetchURL(loc, method).then(resolve).catch(reject);
      }
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() { resolve({ status: res.statusCode, body: data, headers: res.headers }); });
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(); reject(new Error('Timeout: ' + url)); });
    req.end();
  });
}

function resolveUrl(url) {
  if (!url || !url.includes('news.google.com')) return Promise.resolve(url);
  return fetchURL(url, 'HEAD').then(function(r) { return url; }).catch(function() { return url; });
}

function parseRSS(xml) {
  var items = [];
  var blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  blocks.forEach(function(block) {
    function getText(tag) {
      var m = block.match(new RegExp('<' + tag + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + tag + '>|<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>'));
      return m ? (m[1] || m[2] || '').trim() : '';
    }
    var title = getText('title');
    var desc = getText('description');
    var pubDate = getText('pubDate');
    // Get the link — it appears between </title> and <guid>
    var linkM = block.match(/<link\s*\/?>(https?[^<]+)<\/link>/) ||
                block.match(/<link>(https?[^<]+)/);
    var url = linkM ? linkM[1].trim() : '';
    var srcM = block.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/);
    var sourceName = srcM ? (srcM[2] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    var sourceUrl  = srcM ? srcM[1] : '';
    if (!title || !url) return;
    var dateStr = 'Recent';
    if (pubDate) {
      var d = new Date(pubDate);
      if (!isNaN(d)) dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    items.push({
      headline:  title.replace(/\s*[-|]\s*[^-|]+$/, '').trim(),
      summary: (function(d) {
        if (!d) return '';
        if (/^\s*<a\s/i.test(d) || /^\s*a href/i.test(d)) return '';
        return d.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .replace(/&[a-z#0-9]+;/gi, ' ')
          .replace(/\s+/g, ' ').trim().slice(0, 200);
      })(desc),
      source:    sourceName || 'News',
      sourceUrl: sourceUrl,
      url:       url,
      date:      dateStr,
      pubDate:   pubDate,
      category:  'Other',
    });
  });
  return items;
}

function categorize(h) {
  h = h.toLowerCase();
  if (/injur|hurt|doubt|miss|ruled.?out|fitness|hamstring|knee|ankle/.test(h)) return 'Injury';
  if (/squad|call.?up|named|roster|selection/.test(h)) return 'Squad';
  if (/coach|manager|appoint|sack|resign/.test(h)) return 'Manager';
  if (/win|beat|defeat|draw|lost|score|goal|result/.test(h)) return 'Result';
  if (/transfer|sign|join|contract|deal/.test(h)) return 'Transfer';
  if (/visa|cbp|customs|border|entry|state department|passport/.test(h)) return 'Entry';
  if (/preview|predict|face|clash|vs\.? |against|upcoming/.test(h)) return 'Preview';
  if (/form|rank|performance|season/.test(h)) return 'Form';
  return 'Other';
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function fetchTeamNews(teamName) {
  var q = encodeURIComponent(getSearchTerm(teamName));
  var rssUrl = 'https://news.google.com/rss/search?q=' + q + '&hl=en-US&gl=US&ceid=US:en';
  return fetchURL(rssUrl).then(function(r) {
    if (r.status !== 200) {
      console.warn('  ' + teamName + ': HTTP ' + r.status);
      return [];
    }
    var raw = parseRSS(r.body).slice(0, 5);
    return raw.map(function(item) {
      return Object.assign({}, item, { category: categorize(item.headline) });
    });
  }).catch(function(e) {
    console.warn('  ' + teamName + ': ' + e.message);
    return [];
  });
}

function fetchEntryNews(teamName) {
  // Search specifically for real reports of entry/visa/CBP/border issues for this team
  var entryQuery = teamName + ' World Cup 2026 visa entry border customs';
  var q = encodeURIComponent(entryQuery);
  var rssUrl = 'https://news.google.com/rss/search?q=' + q + '&hl=en-US&gl=US&ceid=US:en';
  return fetchURL(rssUrl).then(function(r) {
    if (r.status !== 200) return null;
    var items = parseRSS(r.body);
    // Only keep items that actually mention entry/visa/border/customs/CBP in headline or summary
    var relevant = items.filter(function(item) {
      var text = (item.headline + ' ' + item.summary).toLowerCase();
      return /visa|border|customs|cbp|entry|denied|detained|passport|security.?check|frisk|search|immigration/.test(text);
    });
    if (relevant.length === 0) return null;
    var item = relevant[0];
    return Object.assign({}, item, { category: 'Entry' });
  }).catch(function() { return null; });
}

async function main() {
  console.log('Fetching real news for ' + TEAMS.length + ' teams...');
  var allNews = {};
  var overviewItems = [];

  for (var i = 0; i < TEAMS.length; i++) {
    var team = TEAMS[i];
    process.stdout.write('[' + (i+1) + '/' + TEAMS.length + '] ' + team.name + '... ');
    var items = await fetchTeamNews(team.name);
    // Try to fetch a real entry/visa story
    var entryItem = await fetchEntryNews(team.name);
    if (entryItem) {
      items.unshift(entryItem);
      process.stdout.write('(+entry) ');
    }
    allNews[team.name] = items;
    console.log(items.length + ' articles');
    if (items.length > 0) overviewItems.push(Object.assign({ team: team.name }, items[0]));
    if (i < TEAMS.length - 1) await sleep(500);
  }

  overviewItems.sort(function(a, b) {
    var ta = new Date(a.pubDate || 0).getTime();
    var tb = new Date(b.pubDate || 0).getTime();
    return tb - ta;
  });
  var overview = overviewItems.slice(0, 14);

  var teamList = TEAMS.map(function(t) {
    return '  { name: ' + JSON.stringify(t.name) + ', flag: ' + JSON.stringify(t.flag) +
           ', group: ' + JSON.stringify(t.group) + ', confederation: ' + JSON.stringify(t.confederation) + ' }';
  }).join(',\n');

  var output = '// AUTO-GENERATED by GitHub Actions — do not edit manually\n' +
    '// Last updated: ' + new Date().toISOString() + '\n\n' +
    'const NEWS_DATA = ' + JSON.stringify(allNews, null, 2) + ';\n\n' +
    'const OVERVIEW_NEWS = ' + JSON.stringify(overview, null, 2) + ';\n\n' +
    'const TEAMS = [\n' + teamList + ',\n];\n\n' +
    'export { NEWS_DATA, OVERVIEW_NEWS, TEAMS };\n';

  var outPath = path.join(__dirname, '../src/newsData.js');
  fs.writeFileSync(outPath, output, 'utf8');
  var total = Object.values(allNews).reduce(function(s, a) { return s + a.length; }, 0);
  console.log('\n✅ Done — ' + total + ' articles across ' + TEAMS.length + ' teams');
}

main().catch(function(e) { console.error(e); process.exit(1); });