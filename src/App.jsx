import { useState, useMemo } from "react";
import "./App.css";

const NAV = [
  { label: "Dashboard", icon: "⊞" },
  { label: "Website", icon: "◻" },
  { label: "Courses", icon: "▤" },
  { label: "Batches", icon: "⬡" },
  { label: "Content", icon: "◈" },
  { label: "Your App", icon: "⬕" },
  { label: "Landing Pages", icon: "⊡" },
  { label: "1:1 Sessions", icon: "⊙" },
  { label: "Chats", icon: "◯" },
  { label: "Analytics", icon: "⊿" },
  { label: "Integrations", icon: "⊕" },
  { label: "Campaigns", icon: "⊛" },
];

const ALL_BATCHES = [
  { id: 1, name: "CHAMPIONS FACULTY", subjects: [], students: 105 },
  { id: 2, name: "SCHOLARS FACULTY", subjects: [], students: 199 },
  { id: 3, name: "OLYMPIAD FACULTY", subjects: [], students: 486 },
  { id: 4, name: "ASPIRANTS FACULTY", subjects: [], students: 576 },
  { id: 5, name: "10TH GRADE - JUNIOR OLYMPIADS", subjects: [], students: 25 },
  { id: 6, name: "9TH GRADE - JUNIOR OLYMPIADS", subjects: [], students: 219 },
  { id: 7, name: "8TH GRADE - JUNIOR OLYMPIADS", subjects: [], students: 250 },
  { id: 8, name: "7TH GRADE - JUNIOR OLYMPIADS", subjects: [], students: 300 },
  { id: 9, name: "6TH GRADE - JUNIOR OLYMPIADS", subjects: [], students: 331 },
  { id: 10, name: "5TH GRADE - JUNIOR OLYMPIADS", subjects: ["reasoning", "English", "Science"], students: 4226, joinRequest: true },
  { id: 11, name: "4TH GRADE - JUNIOR OLYMPIADS", subjects: [], students: 4020, joinRequest: true },
  { id: 12, name: "3RD GRADE - JUNIOR OLYMPIADS", subjects: [], students: 3882, joinRequest: true },
  { id: 13, name: "2ND GRADE - JUNIOR OLYMPIADS", subjects: [], students: 1100 },
  { id: 14, name: "1ST GRADE - JUNIOR OLYMPIADS", subjects: [], students: 860 },
  { id: 15, name: "PRE-PRIMARY BATCH", subjects: ["Math", "Art"], students: 420 },
  { id: 16, name: "FOUNDATION COURSE", subjects: ["Physics", "Chemistry"], students: 750 },
  { id: 17, name: "ADVANCED JEE", subjects: ["Physics", "Math", "Chemistry"], students: 2100, joinRequest: true },
  { id: 18, name: "NEET MASTERS", subjects: ["Biology", "Chemistry"], students: 1980 },
];

const SORT_OPTIONS = ["Recently Created", "Oldest First", "Most Students", "A - Z"];
const FILTER_OPTIONS = ["Active Batches", "Inactive Batches", "All Batches"];

function ProgressRing({ pct }) {
  const r = 18, cx = 23, cy = 23, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="progress-ring">
      <svg width="46" height="46">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8f0fe" strokeWidth="4" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a73e8" strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="pct">{pct}%</div>
    </div>
  );
}

function BatchCard({ batch, onMenu }) {
  const subjectText = batch.subjects.slice(0, 3);
  const extra = batch.subjects.length > 3 ? batch.subjects.length - 3 : 0;
  return (
    <div className="batch-card">
      <div className="card-header">
        <div className="card-title">{batch.name}</div>
        <div className="menu-btn" onClick={(e) => { e.stopPropagation(); onMenu(batch.id); }}>⋮</div>
      </div>
      <div className="card-subjects">
        {batch.subjects.length === 0
          ? "No Subjects"
          : (<>{subjectText.map((s, i) => <span key={i} className="subject-tag">{s}{i < subjectText.length - 1 ? ", " : ""}</span>)}{extra > 0 && <span className="more-tag"> +{extra} others</span>}</>)}
      </div>
      <div className="card-footer">
        <div className="student-count">
          <div className="plus-icon">+</div>
          <span>{batch.students.toLocaleString()} Students</span>
        </div>
        {batch.joinRequest && (
          <div className="badge-join">
            <div className="dot"></div>
            New Join Request
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Recently Created");
  const [filter, setFilter] = useState("Active Batches");
  const [activeNav, setActiveNav] = useState("Batches");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const batches = useMemo(() => {
    let b = ALL_BATCHES.filter((x) => x.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === "Most Students") b = [...b].sort((a, z) => z.students - a.students);
    if (sort === "A - Z") b = [...b].sort((a, z) => a.name.localeCompare(z.name));
    if (sort === "Oldest First") b = [...b].reverse();
    return b;
  }, [search, sort]);

  const closeDropdowns = () => { setSortOpen(false); setFilterOpen(false); };

  return (
    <div className="app-wrapper" onClick={closeDropdowns}>
      <div className="sidebar">
        <div className="logo-area">
          <div className="logo">
            <div className="logo-diamond"></div>
            <span className="logo-class">Class</span><span className="logo-plus">plus</span>
          </div>
        </div>
        <div className="nav-list">
          {NAV.map((n) => (
            <div key={n.label} className={`nav-item ${activeNav === n.label ? "active" : ""}`} onClick={() => setActiveNav(n.label)}>
              <span className="nav-icon-char">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
        <button className="help-btn">? Help &amp; Support</button>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Your Batches ({batches.length})</h1>
            <p>Add / view batches of your institute</p>
          </div>
          <div className="topbar-right">
            <ProgressRing pct={54} />
            <div className="institute-badge">
              <div className="inst-avatar">AI</div>
              <span>APEX IIT/NEET</span>
            </div>
          </div>
        </div>

        <div className="toolbar" onClick={(e) => e.stopPropagation()}>
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Name" />
          </div>

          <div className="dropdown-wrap">
            <div className="dropdown" onClick={() => { setSortOpen((p) => !p); setFilterOpen(false); }}>
              <span>{sort}</span><span className="caret">▾</span>
            </div>
            {sortOpen && (
              <div className="dropdown-menu">
                {SORT_OPTIONS.map((o) => (
                  <div key={o} className={`dropdown-item ${sort === o ? "selected" : ""}`} onClick={() => { setSort(o); setSortOpen(false); }}>{o}</div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown-wrap">
            <div className="dropdown" onClick={() => { setFilterOpen((p) => !p); setSortOpen(false); }}>
              <span>{filter}</span><span className="caret">▾</span>
            </div>
            {filterOpen && (
              <div className="dropdown-menu">
                {FILTER_OPTIONS.map((o) => (
                  <div key={o} className={`dropdown-item ${filter === o ? "selected" : ""}`} onClick={() => { setFilter(o); setFilterOpen(false); }}>{o}</div>
                ))}
              </div>
            )}
          </div>

          <button className="create-btn" onClick={() => alert("Create Batch clicked!")}>+ Create Batch</button>
        </div>

        <div className="cards-grid">
          {batches.length === 0
            ? <div className="empty-msg">No batches match your search.</div>
            : batches.map((b) => <BatchCard key={b.id} batch={b} onMenu={(id) => alert(`Menu for batch #${id}`)} />)}
        </div>
      </div>
    </div>
  );
}
