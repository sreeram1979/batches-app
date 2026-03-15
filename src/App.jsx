import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import "./App.css";

// ─────────────────────────────────────────────────────────────
// API layer — calls Express backend
// ─────────────────────────────────────────────────────────────
const api = {
  get: (path) => fetch(path).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  post: (path, body) => fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  put:  (path, body) => fetch(path, { method:'PUT',  headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  del:  (path)       => fetch(path, { method:'DELETE' }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
};

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
const NAV = [
  { label:"Dashboard",icon:"⊞" },{ label:"Website",icon:"◻" },
  { label:"Courses",icon:"▤" },  { label:"Batches",icon:"⬡" },
  { label:"Content",icon:"◈" },  { label:"Your App",icon:"⬕" },
  { label:"Landing Pages",icon:"⊡" },{ label:"1:1 Sessions",icon:"⊙" },
  { label:"Chats",icon:"◯" },   { label:"Analytics",icon:"⊿" },
  { label:"Integrations",icon:"⊕" },{ label:"Campaigns",icon:"⊛" },
];
function Sidebar({ activeNav, setActiveNav, onBatchesClick }) {
  return (
    <div className="sidebar">
      <div className="logo-area">
        <div className="logo">
          <div className="logo-diamond"/>
          <span className="logo-class">Class</span><span className="logo-plus">plus</span>
        </div>
      </div>
      <div className="nav-list">
        {NAV.map(n => (
          <div key={n.label}
            className={`nav-item ${activeNav===n.label?"active":""}`}
            onClick={() => { setActiveNav(n.label); if (n.label==="Batches") onBatchesClick(); }}>
            <span className="nav-icon-char">{n.icon}</span>
            <span>{n.label}</span>
          </div>
        ))}
      </div>
      <button className="help-btn">? Help &amp; Support</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress Ring
// ─────────────────────────────────────────────────────────────
function ProgressRing({ pct=54 }) {
  const r=18, cx=23, cy=23, circ=2*Math.PI*r, dash=(pct/100)*circ;
  return (
    <div className="progress-ring">
      <svg width="46" height="46"><circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8f0fe" strokeWidth="4"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a73e8" strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>
      </svg>
      <div className="pct">{pct}%</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Batch List View
// ─────────────────────────────────────────────────────────────
function BatchCard({ batch, onOpen, onMenu }) {
  return (
    <div className="batch-card" onClick={() => onOpen(batch)}>
      <div className="card-accent" style={{ background: batch.color }}/>
      <div className="card-body">
        <div className="card-header">
          <div className="card-title">{batch.name}</div>
          <div className="menu-btn" onClick={e => { e.stopPropagation(); onMenu(batch); }}>⋮</div>
        </div>
        <div className="card-desc">{batch.description || "No description"}</div>
        <div className="card-footer">
          <div className="student-count">
            <span className="plus-icon">+</span>
            <span>{(batch.student_count||0).toLocaleString()} Students</span>
          </div>
          <div className="batch-status active">Active</div>
        </div>
      </div>
    </div>
  );
}

function BatchList() {
  const { batches, loadBatches } = useApp();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("A – Z");
  const [showCreate, setShowCreate] = useState(false);
  const [menuBatch, setMenuBatch] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const { setView, setCurrentBatch } = useApp();

  const filtered = batches
    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,z) => sort==="A – Z" ? a.name.localeCompare(z.name)
                 : sort==="Most Students" ? z.student_count - a.student_count
                 : a.id - z.id);

  return (
    <div className="main">
      <div className="topbar">
        <div className="topbar-left">
          <h1>Your Batches ({batches.length})</h1>
          <p>Manage your Olympiad preparation batches</p>
        </div>
        <div className="topbar-right">
          <ProgressRing/>
          <div className="institute-badge">
            <div className="inst-avatar">AI</div>
            <span>APEX IIT/NEET</span>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by Name"/>
        </div>
        <select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}>
          <option>A – Z</option><option>Most Students</option><option>Recently Created</option>
        </select>
        <button className="create-btn" onClick={()=>setShowCreate(true)}>+ Create Batch</button>
      </div>

      <div className="cards-grid">
        {filtered.length===0
          ? <div className="empty-msg">No batches found.</div>
          : filtered.map(b => (
              <BatchCard key={b.id} batch={b}
                onOpen={batch => { setCurrentBatch(batch); setView("batch"); }}
                onMenu={setMenuBatch}/>
            ))}
      </div>

      {showCreate && <BatchModal onClose={()=>setShowCreate(false)} onSave={loadBatches}/>}
      {editBatch  && <BatchModal batch={editBatch} onClose={()=>setEditBatch(null)} onSave={loadBatches}/>}
      {menuBatch  && (
        <ContextOverlay onClose={()=>setMenuBatch(null)}>
          <div className="ctx-menu">
            <div className="ctx-item" onClick={()=>{ setEditBatch(menuBatch); setMenuBatch(null); }}>✏️ Edit Batch</div>
            <div className="ctx-item open" onClick={()=>{ setCurrentBatch(menuBatch); setView("batch"); setMenuBatch(null); }}>📂 Open</div>
            <div className="ctx-item danger" onClick={async()=>{ if(confirm(`Delete "${menuBatch.name}"?`)) { await api.del(`/api/batches/${menuBatch.id}`); setMenuBatch(null); loadBatches(); } }}>🗑 Delete</div>
          </div>
        </ContextOverlay>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Batch Create / Edit Modal
// ─────────────────────────────────────────────────────────────
function BatchModal({ batch, onClose, onSave }) {
  const [name, setName] = useState(batch?.name||"");
  const [desc, setDesc] = useState(batch?.description||"");
  const [color, setColor] = useState(batch?.color||"#1a73e8");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return alert("Batch name required");
    setSaving(true);
    try {
      if (batch?.id) await api.put(`/api/batches/${batch.id}`, { name, description:desc, color });
      else await api.post("/api/batches", { name, description:desc, color });
      onSave(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <Modal title={batch ? "Edit Batch" : "Create New Batch"} onClose={onClose}>
      <label>Batch Name *</label>
      <input className="modal-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. 5th Grade – Olympiads"/>
      <label>Description</label>
      <textarea className="modal-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description" rows={3}/>
      <label>Color</label>
      <div className="color-row">
        {["#1a73e8","#34a853","#ea4335","#fbbc04","#9c27b0","#00acc1","#ff7043","#43a047","#5c6bc0","#ef5350"]
          .map(c => <div key={c} className={`color-swatch ${color===c?"selected":""}`} style={{background:c}} onClick={()=>setColor(c)}/>)}
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:32,height:32,border:"none",cursor:"pointer",borderRadius:6}}/>
      </div>
      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save Batch"}</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Batch Detail — Split view: folder tree + content viewer
// ─────────────────────────────────────────────────────────────
function BatchDetail() {
  const { currentBatch, setView } = useApp();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState(null);
  const [showAddContent, setShowAddContent] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [folderCtx, setFolderCtx] = useState(null);
  const [itemCtx, setItemCtx] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const loadFolders = useCallback(async () => {
    const data = await api.get(`/api/folders?batch_id=${currentBatch.id}`);
    setFolders(data);
  }, [currentBatch.id]);

  const loadItems = useCallback(async (folderId) => {
    if (!folderId) { setItems([]); return; }
    setLoadingItems(true);
    try { const data = await api.get(`/api/folder-items?folder_id=${folderId}`); setItems(data); }
    finally { setLoadingItems(false); }
  }, []);

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { loadItems(selectedFolder?.id); }, [selectedFolder, loadItems]);

  // Build breadcrumb path for selected folder
  function getBreadcrumb(folderId) {
    const path = [];
    let cur = folders.find(f => f.id === folderId);
    while (cur) { path.unshift(cur); cur = folders.find(f => f.id === cur.parent_id); }
    return path;
  }

  // Root-level folders
  const rootFolders = folders.filter(f => !f.parent_id);

  async function handleDeleteFolder(folder) {
    if (!confirm(`Delete "${folder.name}" and all its contents?`)) return;
    await api.del(`/api/folders/${folder.id}`);
    if (selectedFolder?.id === folder.id || isDescendant(folder.id, selectedFolder?.id))
      setSelectedFolder(null);
    loadFolders();
  }

  function isDescendant(parentId, childId) {
    if (!childId) return false;
    let cur = folders.find(f => f.id === childId);
    while (cur) {
      if (cur.parent_id === parentId) return true;
      cur = folders.find(f => f.id === cur.parent_id);
    }
    return false;
  }

  async function handleDeleteItem(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await api.del(`/api/folder-items/${item.id}`);
    if (selectedItem?.id === item.id) setSelectedItem(null);
    loadItems(selectedFolder?.id);
  }

  async function handleDropFolder(draggedId, targetParentId) {
    if (draggedId === targetParentId) return;
    await api.post(`/api/folders/${draggedId}/move`, { parent_id: targetParentId });
    loadFolders();
  }

  const breadcrumb = selectedFolder ? getBreadcrumb(selectedFolder.id) : [];

  return (
    <div className="batch-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={()=>setView("batches")}>← Back</button>
        <div className="breadcrumb">
          <span className="bc-batch" onClick={()=>setSelectedFolder(null)}
            style={{cursor:"pointer",color:"#1a73e8",fontWeight:600}}>{currentBatch.name}</span>
          {breadcrumb.map(f => (
            <span key={f.id}>
              <span className="bc-sep"> / </span>
              <span className="bc-item" onClick={()=>setSelectedFolder(f)}>{f.name}</span>
            </span>
          ))}
        </div>
        <div className="detail-actions">
          <button className="btn-outline" onClick={()=>{ setNewFolderParent(selectedFolder?.id||null); setShowNewFolder(true); }}>
            📁 New Folder
          </button>
          {selectedFolder && (
            <>
              <button className="btn-outline" onClick={()=>setShowAddContent({type:"video"})}>🎬 Video</button>
              <button className="btn-outline" onClick={()=>setShowAddContent({type:"pdf"})}>📄 PDF</button>
              <button className="btn-outline" onClick={()=>setShowAddContent({type:"quiz"})}>📝 Quiz</button>
              <button className="btn-primary" onClick={()=>setShowAddContent({type:""})}>+ Add Content</button>
            </>
          )}
        </div>
      </div>

      <div className="detail-body">
        {/* ── Folder Tree (Left) ── */}
        <div className="folder-panel">
          <div className="panel-title">
            <span>📚 Folders</span>
            <button className="icon-btn" title="New root folder"
              onClick={()=>{ setNewFolderParent(null); setShowNewFolder(true); }}>＋</button>
          </div>
          <div className="folder-tree">
            {rootFolders.length === 0
              ? <div className="tree-empty">No folders yet.<br/>Click + to create one.</div>
              : rootFolders.map(f => (
                  <FolderNode key={f.id} folder={f} allFolders={folders}
                    selected={selectedFolder?.id} depth={0}
                    onSelect={setSelectedFolder}
                    onNewChild={pid => { setNewFolderParent(pid); setShowNewFolder(true); }}
                    onRename={setRenameTarget}
                    onDelete={handleDeleteFolder}
                    onCtx={setFolderCtx}
                    onDrop={handleDropFolder}
                    dragOver={dragOver} setDragOver={setDragOver}/>
                ))}
          </div>
        </div>

        {/* ── Content Panel (Right) ── */}
        <div className="content-panel">
          {!selectedFolder ? (
            <div className="content-empty-state">
              <div className="empty-icon">📂</div>
              <h3>Select a folder to view content</h3>
              <p>Or create a new folder using the button above</p>
              {rootFolders.length === 0 && (
                <button className="btn-primary" onClick={()=>{ setNewFolderParent(null); setShowNewFolder(true); }}>
                  Create First Folder
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="content-header">
                <h2>📁 {selectedFolder.name}</h2>
                <span className="item-count">{items.length} item{items.length!==1?"s":""}</span>
              </div>
              {/* Sub-folders in content area */}
              <div className="subfolder-chips">
                {folders.filter(f=>f.parent_id===selectedFolder.id).map(sf=>(
                  <div key={sf.id} className="subfolder-chip" onClick={()=>setSelectedFolder(sf)}>
                    📁 {sf.name}
                  </div>
                ))}
              </div>
              {loadingItems
                ? <div className="loading">Loading…</div>
                : items.length===0
                  ? <div className="content-empty">
                      <p>No content yet in this folder.</p>
                      <button className="btn-primary" onClick={()=>setShowAddContent({type:""})}>+ Add Content</button>
                    </div>
                  : <div className="items-grid">
                      {items.map(item => (
                        <ContentCard key={item.id} item={item}
                          selected={selectedItem?.id===item.id}
                          onClick={()=>setSelectedItem(selectedItem?.id===item.id?null:item)}
                          onCtx={e=>{ e.preventDefault(); setItemCtx({item, x:e.clientX, y:e.clientY}); }}/>
                      ))}
                    </div>
              }
              {/* Content detail pane */}
              {selectedItem && <ContentDetail item={selectedItem} onClose={()=>setSelectedItem(null)}/>}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewFolder && (
        <FolderModal
          parentId={newFolderParent}
          batchId={currentBatch.id}
          onClose={()=>setShowNewFolder(false)}
          onSave={()=>{ loadFolders(); setShowNewFolder(false); }}/>
      )}
      {renameTarget && (
        <RenameModal
          name={renameTarget.name}
          onClose={()=>setRenameTarget(null)}
          onSave={async name=>{ await api.put(`/api/folders/${renameTarget.id}`,{name}); loadFolders(); setRenameTarget(null); }}/>
      )}
      {showAddContent && (
        <AddContentModal
          folderId={selectedFolder?.id}
          initialType={showAddContent.type}
          onClose={()=>setShowAddContent(false)}
          onSave={()=>{ loadItems(selectedFolder?.id); setShowAddContent(false); }}/>
      )}
      {folderCtx && (
        <ContextOverlay onClose={()=>setFolderCtx(null)}>
          <div className="ctx-menu" style={{top:folderCtx.y, left:folderCtx.x}}>
            <div className="ctx-item" onClick={()=>{ setRenameTarget(folderCtx.folder); setFolderCtx(null); }}>✏️ Rename</div>
            <div className="ctx-item" onClick={()=>{ setNewFolderParent(folderCtx.folder.id); setShowNewFolder(true); setFolderCtx(null); }}>📁 New Subfolder</div>
            <div className="ctx-item danger" onClick={()=>{ handleDeleteFolder(folderCtx.folder); setFolderCtx(null); }}>🗑 Delete</div>
          </div>
        </ContextOverlay>
      )}
      {itemCtx && (
        <ContextOverlay onClose={()=>setItemCtx(null)}>
          <div className="ctx-menu" style={{top:itemCtx.y, left:itemCtx.x}}>
            <div className="ctx-item danger" onClick={()=>{ handleDeleteItem(itemCtx.item); setItemCtx(null); }}>🗑 Delete</div>
          </div>
        </ContextOverlay>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Folder Tree Node
// ─────────────────────────────────────────────────────────────
function FolderNode({ folder, allFolders, selected, depth, onSelect, onNewChild, onRename, onDelete, onCtx, onDrop, dragOver, setDragOver }) {
  const [open, setOpen] = useState(depth < 1);
  const children = allFolders.filter(f => f.parent_id === folder.id);
  const hasChildren = children.length > 0;
  const isSelected = selected === folder.id;
  const isDragOver = dragOver === folder.id;

  return (
    <div className="tree-node">
      <div
        className={`tree-item ${isSelected?"active":""} ${isDragOver?"drag-over":""}`}
        style={{ paddingLeft: 12 + depth*16 }}
        draggable
        onDragStart={e => e.dataTransfer.setData("folderId", String(folder.id))}
        onDragOver={e => { e.preventDefault(); setDragOver(folder.id); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => { e.preventDefault(); setDragOver(null); const id = +e.dataTransfer.getData("folderId"); onDrop(id, folder.id); }}
        onContextMenu={e => { e.preventDefault(); onCtx({folder, x:e.clientX, y:e.clientY}); }}
        onClick={() => { setOpen(o=>!o); onSelect(folder); }}>
        <span className="tree-arrow" onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}>
          {hasChildren ? (open?"▾":"▸") : " "}
        </span>
        <span className="tree-icon">{isSelected?"📂":"📁"}</span>
        <span className="tree-name">{folder.name}</span>
        <span className="tree-actions">
          <button className="tree-btn" title="New subfolder"
            onClick={e=>{e.stopPropagation();onNewChild(folder.id);}}>＋</button>
          <button className="tree-btn" title="Rename"
            onClick={e=>{e.stopPropagation();onRename(folder);}}>✏</button>
          <button className="tree-btn danger" title="Delete"
            onClick={e=>{e.stopPropagation();onDelete(folder);}}>✕</button>
        </span>
      </div>
      {open && hasChildren && (
        <div className="tree-children">
          {children.map(c => (
            <FolderNode key={c.id} folder={c} allFolders={allFolders}
              selected={selected} depth={depth+1}
              onSelect={onSelect} onNewChild={onNewChild}
              onRename={onRename} onDelete={onDelete} onCtx={onCtx}
              onDrop={onDrop} dragOver={dragOver} setDragOver={setDragOver}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Content Card
// ─────────────────────────────────────────────────────────────
const TYPE_META = {
  video:      { icon:"🎬", label:"Video",      color:"#e3f2fd" },
  pdf:        { icon:"📄", label:"PDF",         color:"#fce4ec" },
  quiz:       { icon:"📝", label:"Quiz",        color:"#f3e5f5" },
  assignment: { icon:"📋", label:"Assignment",  color:"#e8f5e9" },
  image:      { icon:"🖼", label:"Image",       color:"#fff8e1" },
  link:       { icon:"🔗", label:"Link",        color:"#e0f2f1" },
};
function ContentCard({ item, selected, onClick, onCtx }) {
  const meta = TYPE_META[item.type] || TYPE_META.link;
  return (
    <div className={`content-card ${selected?"selected":""}`}
      onClick={onClick} onContextMenu={onCtx}>
      <div className="cc-icon" style={{background:meta.color}}>{meta.icon}</div>
      <div className="cc-body">
        <div className="cc-title">{item.title}</div>
        <div className="cc-type">{meta.label}</div>
        {item.description && <div className="cc-desc">{item.description}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Content Detail Panel
// ─────────────────────────────────────────────────────────────
function ContentDetail({ item, onClose }) {
  const meta = TYPE_META[item.type] || TYPE_META.link;
  const md = (() => { try { return typeof item.metadata==="string" ? JSON.parse(item.metadata) : item.metadata; } catch { return {}; } })();

  return (
    <div className="content-detail">
      <div className="detail-close" onClick={onClose}>✕</div>
      <div className="detail-type-badge" style={{background:meta.color}}>{meta.icon} {meta.label}</div>
      <h3 className="detail-title">{item.title}</h3>
      {item.description && <p className="detail-desc">{item.description}</p>}

      {item.type==="video" && item.url && (
        <div className="detail-media">
          {item.url.includes("youtube") || item.url.includes("youtu.be")
            ? <iframe width="100%" height="240"
                src={`https://www.youtube.com/embed/${extractYouTubeId(item.url)}`}
                frameBorder="0" allowFullScreen title={item.title}/>
            : <video controls width="100%" src={item.url}><track kind="captions"/></video>}
        </div>
      )}
      {item.type==="pdf" && item.url && (
        <a className="btn-primary" href={item.url} target="_blank" rel="noreferrer">📄 Open PDF</a>
      )}
      {item.type==="image" && item.url && (
        <img src={item.url} alt={item.title} className="detail-img"/>
      )}
      {item.type==="link" && item.url && (
        <a className="btn-outline" href={item.url} target="_blank" rel="noreferrer">🔗 Open Link</a>
      )}
      {item.type==="quiz" && (
        <div className="quiz-preview">
          <p>⏱ Time limit: {md.time_limit||0} mins,/p>
          <p>❓ Questions: {Array.isArray(md.questions)?md.questions.length:0}</p>
        </div>
      )}
      {item.type==="assignment" && (
        <div className="assignment-preview">
          <p>📅 Due: {md.due_date||"Not set"}</p>
          <p>📊 Max marks: {md.max_marks||"Not set"}</p>
        </div>
      )}
      <div className="detail-meta">
        <small>Added: {new Date(item.created_at).toLocaleDateString()}</small>
      </div>
    </div>
  );
}

function extractYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : "";
}

// ─────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function FolderModal({ parentId, batchId, onClose, onSave }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef();
  useEffect(()=>{ inputRef.current?.focus(); },[]);

  async function handleSave() {
    if (!name.trim()) return alert("Folder name required");
    setSaving(true);
    try {
      await api.post("/api/folders", { name, batch_id: batchId, parent_id: parentId });
      onSave();
    } finally { setSaving(false); }
  }

  return (
    <Modal title={`New Folder${parentId?" (Subfolder)":""}`} onClose={onClose}>
      <label>Folder Name *</label>
      <input ref={inputRef} className="modal-input" value={name}
        onChange={e=>setName(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&handleSave()}
        placeholder="e.g. Mathematics, Chapter 1…"/>
      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Creating…":"Create Folder"}</button>
      </div>
    </Modal>
  );
}

function RenameModal({ name: initial, onClose, onSave }) {
  const [name, setName] = useState(initial);
  const inputRef = useRef();
  useEffect(()=>{ inputRef.current?.focus(); inputRef.current?.select(); },[]);
  return (
    <Modal title="Rename Folder" onClose={onClose}>
      <label>New Name *</label>
      <input ref={inputRef} className="modal-input" value={name}
        onChange={e=>setName(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&onSave(name)}/>
      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={()=>onSave(name)}>Rename</button>
      </div>
    </Modal>
  );
}

const CONTENT_TYPES = [
  { value:"video",icon:"🎬",label:"Video Lesson" },
  { value:"pdf",icon:"📄",label:"PDF Notes" },
  { value:"quiz",icon:"📝",label:"Quiz / MCQ" },
  { value:"assignment",icon:"📋",label:"Assignment" },
  { value:"image",icon:"🖼",label:"Image" },
  { value:"link",icon:"🔗",label:"External Link" },
];

function AddContentModal({ folderId, initialType="", onClose, onSave }) {
  const [type, setType]       = useState(initialType||"video");
  const [title, setTitle]     = useState("");
  const [url, setUrl]         = useState("");
  const [desc, setDesc]       = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!title.trim()) return alert("Title required");
    if (!folderId) return alert("Please select a folder first");
    setSaving(true);
    try {
      const metadata = type==="assignment"
        ? { due_date: dueDate, max_marks: maxMarks }
        : type==="quiz"
        ? { time_limit: timeLimit, questions: [] }
        : {};
      await api.post("/api/folder-items", { folder_id: folderId, title, type, url, description: desc, metadata });
      onSave();
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Add Content" onClose={onClose}>
      <label>Content Type *</label>
      <div className="type-picker">
        {CONTENT_TYPES.map(t => (
          <div key={t.value} className={`type-chip ${type===t.value?"selected":""}`} onClick={()=>setType(t.value)}>
            {t.icon} {t.label}
          </div>
        ))}
      </div>

      <label>Title *</label>
      <input className="modal-input" value={title} onChange={e=>setTitle(e.target.value)}
        placeholder="e.g. Introduction to Fractions"/>

      {["video","pdf","image","link"].includes(type) && (
        <>
          <label>{type==="video"?"YouTube / Video URL":type==="pdf"?"PDF URL":"URL"}</label>
          <input className="modal-input" value={url} onChange={e=>setUrl(e.target.value)}
            placeholder={type==="video"?"https://youtube.com/watch?v=…":type==="pdf"?"https://drive.google.com/…":"https://…"}/>
        </>
      )}
      {type==="assignment" && (
        <>
          <label>Due Date</label>
          <input className="modal-input" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
          <label>Max Marks</label>
          <input className="modal-input" type="number" value={maxMarks} onChange={e=>setMaxMarks(e.target.value)} placeholder="100"/>
        </>
      )}
      {type==="quiz" && (
        <>
          <label>Time Limit (minutes)</label>
          <input className="modal-input" type="number" value={timeLimit} onChange={e=>setTimeLimit(e.target.value)} placeholder="30"/>
        </>
      )}

      <label>Description (optional)</label>
      <textarea className="modal-input" value={desc} onChange={e=>setDesc(e.target.value)} rows={2} placeholder="Brief description…"/>

      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Adding…":"Add Content"}</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Context Overlay (for right-click menus, etc.)
// ─────────────────────────────────────────────────────────────
function ContextOverlay({ onClose, children }) {
  return (
    <div className="ctx-overlay" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]               = useState("batches");
  const [batches, setBatches]         = useState([]);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [activeNav, setActiveNav]     = useState("Batches");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const loadBatches = useCallback(async () => {
    try {
      const data = await api.get("/api/batches");
      setBatches(data);
      setError(null);
    } catch (e) {
      setError("Cannot reach the API server. Make sure the backend is running on port 3001.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const ctx = { view, setView, batches, loadBatches, currentBatch, setCurrentBatch };

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app-wrapper">
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav}
          onBatchesClick={()=>setView("batches")}/>
        <div style={{flex:1,overflow:"hidden"}}>
          {loading ? (
            <div className="loading-screen">
              <div className="spinner"/>
              <p>Loading LMS…</p>
            </div>
          ) : error ? (
            <div className="error-screen">
              <div className="error-icon">⚠️</div>
              <h3>Connection Error</h3>
              <p>{error}</p>
              <button className="btn-primary" onClick={loadBatches}>Retry</button>
            </div>
          ) : view==="batches" ? (
            <BatchList/>
          ) : view==="batch" && currentBatch ? (
            <BatchDetail/>
          ) : (
            <BatchList/>
          )}
        </div>
      </div>
    </AppCtx.Provider>
  );
}
