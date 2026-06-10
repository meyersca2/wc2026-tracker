import { useState, useMemo } from "react";
import { NEWS_DATA, OVERVIEW_NEWS, TEAMS } from "./newsData.js";

const CONF_COLORS = {
  UEFA: "#003399", CONMEBOL: "#006600", CONCACAF: "#cc3300",
  CAF: "#cc9900", AFC: "#990099", OFC: "#006699",
};
const CATEGORY_COLORS = {
  Squad:    { bg: "#e8f4fd", text: "#1565c0", border: "#1565c0" },
  Injury:   { bg: "#fdecea", text: "#c62828", border: "#c62828" },
  Form:     { bg: "#e8f5e9", text: "#2e7d32", border: "#2e7d32" },
  Manager:  { bg: "#fff3e0", text: "#e65100", border: "#e65100" },
  Transfer: { bg: "#f3e5f5", text: "#6a1b9a", border: "#6a1b9a" },
  Result:   { bg: "#e0f2f1", text: "#00695c", border: "#00695c" },
  Preview:  { bg: "#fce4ec", text: "#880e4f", border: "#880e4f" },
  Entry:    { bg: "#fff8e1", text: "#7b4f00", border: "#f9a825" },
  Other:    { bg: "#f5f5f5", text: "#424242", border: "#9e9e9e" },
};

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: "3px", backgroundColor: c.bg, color: c.text,
      border: `1px solid ${c.border}`, whiteSpace: "nowrap",
    }}>{category || "Other"}</span>
  );
}

function NewsItem({ item }) {
  const articleUrl = item.url || null;
  const cleanSummary = item.summary ? item.summary.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim() : "";
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <CategoryBadge category={item.category} />
        <span style={{ fontSize: "11px", color: "#9e9e9e" }}>
          {item.date}{item.source ? " · " + item.source : ""}
        </span>
      </div>
      {articleUrl ? (
        <a href={articleUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "14px", fontWeight: 700, color: "#cc0000", lineHeight: 1.3, textDecoration: "none", display: "block" }}>
          {item.headline} ↗
        </a>
      ) : (
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{item.headline}</div>
      )}
      {cleanSummary && <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.5, fontFamily: "Georgia,serif" }}>{cleanSummary}</div>}
    </div>
  );
}

function TeamCard({ team, onClick, isSelected, topSummary }) {
  return (
    <div onClick={onClick} style={{
      border: isSelected ? "2px solid #cc0000" : "1px solid #e8e8e8",
      borderRadius: "6px", padding: "10px 12px", cursor: "pointer",
      backgroundColor: isSelected ? "#fff8f8" : "#fff",
      display: "flex", flexDirection: "column", gap: "4px", minHeight: "72px",
      boxShadow: isSelected ? "0 2px 8px rgba(204,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "20px" }}>{team.flag}</span>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{team.name}</div>
          <span style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>GRP {team.group}</span>
        </div>
      </div>
      {topSummary
        ? <div style={{ fontSize: "10px", color: "#444", lineHeight: 1.35, fontFamily: "Georgia,serif", borderTop: "1px solid #f0f0f0", paddingTop: "4px", marginTop: "2px" }}>{topSummary}</div>
        : <div style={{ fontSize: "10px", color: "#cc0000", fontStyle: "italic" }}>Click for news →</div>
      }
    </div>
  );
}

export default function App() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("grid");

  const filteredTeams = useMemo(() => TEAMS.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [searchQuery]);

  return (
    <div style={{ fontFamily: "'Helvetica Neue',Arial,sans-serif", backgroundColor: "#f9f9f7", minHeight: "100vh", maxWidth: "1100px", margin: "0 auto" }}>

      {/* HEADER */}
      <div style={{
        backgroundColor: "#cc0000", color: "#fff", padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "52px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>⚽</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>WC2026 NEWS TRACKER</div>
            <div style={{ fontSize: "10px", opacity: 0.8, letterSpacing: "0.06em" }}>ALL 48 NATIONAL TEAMS · JUNE 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setView("grid")} style={{
            backgroundColor: view === "grid" ? "#fff" : "transparent", color: view === "grid" ? "#cc0000" : "#fff",
            border: "1px solid rgba(255,255,255,0.5)", borderRadius: "4px", padding: "5px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer",
          }}>ALL TEAMS</button>
          {selectedTeam && (
            <button onClick={() => setView("team")} style={{
              backgroundColor: view === "team" ? "#fff" : "transparent", color: view === "team" ? "#cc0000" : "#fff",
              border: "1px solid rgba(255,255,255,0.5)", borderRadius: "4px", padding: "5px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer",
              maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{selectedTeam.flag} {selectedTeam.name.toUpperCase()}</button>
          )}
        </div>
      </div>

      {/* GRID VIEW */}
      {view === "grid" && (
        <div style={{ padding: "20px" }}>

          {/* Overview Panel */}
          <div style={{
            backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px",
            padding: "16px 20px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.06em", color: "#111" }}>🔴 LATEST ACROSS ALL TEAMS</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Click any headline to jump to that team's full coverage</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              {[...OVERVIEW_NEWS].sort((a, b) => {
                const toMs = s => { const d = new Date(`${s} 2026`); return isNaN(d) ? 0 : d.getTime(); };
                return toMs(b.date) - toMs(a.date);
              }).map((item, i) => {
                const team = TEAMS.find(t => t.name === item.team);
                return (
                  <div key={i} onClick={() => { if (team) { setSelectedTeam(team); setView("team"); } }}
                    style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 0", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
                      {team && <span style={{ fontSize: "14px" }}>{team.flag}</span>}
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#cc0000", letterSpacing: "0.04em", textTransform: "uppercase" }}>{item.team}</span>
                      <CategoryBadge category={item.category} />
                      <span style={{ fontSize: "10px", color: "#aaa" }}>{item.date}</span>
                    </div>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "12px", fontWeight: 700, color: "#cc0000", lineHeight: 1.35, textDecoration: "none", display: "block" }}
                        onClick={e => e.stopPropagation()}>
                        {item.headline} ↗
                      </a>
                    ) : (
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#111", lineHeight: 1.35 }}>{item.headline}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px" }}>
            <input placeholder="Search team..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ border: "1px solid #ddd", borderRadius: "5px", padding: "6px 12px", fontSize: "12px", outline: "none", width: "160px", backgroundColor: "#fff" }} />
            {searchQuery && <span style={{ fontSize: "11px", color: "#aaa" }}>{filteredTeams.length} results</span>}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
            {filteredTeams.map(team => {
              const firstStory = NEWS_DATA[team.name]?.[0];
              const rawSummary = firstStory?.summary || firstStory?.headline || "";
              const cleanSummary = rawSummary.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
              const firstSentence = cleanSummary.split(". ")?.[0];
              const topSummary = firstSentence ? firstSentence.slice(0, 100) + "." : null;
              return (
                <TeamCard
                  key={team.name} team={team}
                  topSummary={topSummary}
                  onClick={() => { setSelectedTeam(team); setView("team"); }}
                  isSelected={selectedTeam?.name === team.name && view === "team"}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* TEAM DETAIL VIEW */}
      {view === "team" && selectedTeam && (
        <div style={{ padding: "20px" }}>

          {/* Team Header */}
          <div style={{
            backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px",
            padding: "20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "52px", lineHeight: 1 }}>{selectedTeam.flag}</span>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>{selectedTeam.name}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", backgroundColor: CONF_COLORS[selectedTeam.confederation] || "#999", padding: "2px 8px", borderRadius: "3px" }}>{selectedTeam.confederation}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", backgroundColor: "#f0f0f0", padding: "2px 8px", borderRadius: "3px" }}>GROUP {selectedTeam.group}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setView("grid")} style={{
              backgroundColor: "#f0f0f0", color: "#444", border: "1px solid #ddd",
              borderRadius: "5px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer",
            }}>← All Teams</button>
          </div>

          {/* Group Nav */}
          <div style={{
            backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px",
            padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>GROUP {selectedTeam.group}:</span>
            {TEAMS.filter(t => t.group === selectedTeam.group).map(t => (
              <button key={t.name} onClick={() => setSelectedTeam(t)} style={{
                display: "flex", alignItems: "center", gap: "5px",
                border: t.name === selectedTeam.name ? "2px solid #cc0000" : "1px solid #e0e0e0",
                borderRadius: "5px", padding: "4px 10px", backgroundColor: t.name === selectedTeam.name ? "#fff8f8" : "#fff",
                cursor: "pointer", fontSize: "12px", fontWeight: t.name === selectedTeam.name ? 700 : 400,
                color: t.name === selectedTeam.name ? "#cc0000" : "#333",
              }}><span>{t.flag}</span><span>{t.name}</span></button>
            ))}
          </div>

          {/* News */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{
              fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", color: "#888",
              marginBottom: "12px", borderBottom: "2px solid #cc0000", paddingBottom: "8px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>LATEST NEWS</span>
              <span style={{ fontSize: "10px", fontWeight: 400, color: "#bbb" }}>ESPN · BBC Sport · Reuters · AP · Sky Sports</span>
            </div>
            {(NEWS_DATA[selectedTeam.name] || []).map((item, i) => <NewsItem key={i} item={item} />)}
            {!NEWS_DATA[selectedTeam.name] && (
              <div style={{ textAlign: "center", padding: "32px", color: "#aaa", fontSize: "13px" }}>No news available for this team.</div>
            )}
          </div>

          {/* Jump to Team */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#888", marginBottom: "10px" }}>JUMP TO ANOTHER TEAM</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
              {TEAMS.filter(t => t.name !== selectedTeam.name).map(team => (
                <button key={team.name} onClick={() => setSelectedTeam(team)} style={{
                  display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e8e8e8",
                  borderRadius: "5px", padding: "6px 10px", backgroundColor: "#fff",
                  cursor: "pointer", fontSize: "11px", color: "#333", textAlign: "left",
                }}>
                  <span style={{ fontSize: "14px" }}>{team.flag}</span>
                  <span style={{ fontWeight: 600 }}>{team.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
