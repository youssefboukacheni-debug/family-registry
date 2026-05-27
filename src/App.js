import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCyrUJDFnVvjGeP9Lw4AnmJVax47rECvko",
  authDomain: "family-46ffc.firebaseapp.com",
  projectId: "family-46ffc",
  storageBucket: "family-46ffc.firebasestorage.app",
  messagingSenderId: "1029225975028",
  appId: "1:1029225975028:web:fc01b52d7f9a1ae6c9e2a1"
});
const db = getFirestore(app);

const RELATIONS = ["Pere","Mere","Fils","Fille","Frere","Soeur","Grand-pere","Grand-mere","Oncle paternel","Tante paternelle","Oncle maternel","Tante maternelle","Cousin","Cousine","Epoux","Epouse","Petit-fils","Petite-fille","Neveu","Niece","Beau-pere","Belle-mere","Beau-frere","Belle-soeur","Gendre","Bru","Autre"];
const EMPTY = { name:"", idNumber:"", relation:"", lineage:"", birthYear:"", fatherName:"", motherName:"", notes:"", parentId:"" };
const CY = new Date().getFullYear();

function TreeNode({ member, members, depth }) {
  const children = members.filter(m => m.parentId === member.id);
  const age = member.birthYear ? CY - parseInt(member.birthYear) : null;
  return (
    <div style={{ paddingLeft: depth > 0 ? 24 : 0, position: "relative" }}>
      {depth > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "#3a5a9a" }} />}
      <div style={{ background: "#0d0f1e", border: "1.5px solid #222740", borderRadius: 10, padding: "10px 16px", marginBottom: 8, marginLeft: depth > 0 ? 10 : 0, position: "relative" }}>
        {depth > 0 && <div style={{ position: "absolute", left: -12, top: "50%", width: 12, height: 2, background: "#3a5a9a" }} />}
        <div style={{ fontWeight: 600, color: "#dce8ff" }}>
          {member.name} {age !== null && <span style={{ color: "#6c8ebf", fontSize: 12 }}>({age} ans)</span>}
        </div>
        <div style={{ color: "#6c8ebf", fontSize: 12 }}>{member.relation}{member.birthYear ? " - " + member.birthYear : ""}</div>
      </div>
      {children.map(c => <TreeNode key={c.id} member={c} members={members} depth={depth + 1} />)}
    </div>
  );
}

export default function App() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = m => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const sf = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: "" })); };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "members"), snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Requis";
    if (!form.idNumber.trim()) e.idNumber = "Requis";
    else if (!/^[A-Za-z]\d{6}$/.test(form.idNumber.trim())) e.idNumber = "Ex: A123456";
    if (!form.relation) e.relation = "Requis";
    if (form.birthYear && (isNaN(+form.birthYear) || +form.birthYear < 1900 || +form.birthYear > CY)) e.birthYear = "Invalide";
    return e;
  };

  const handleAdd = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (members.find(m => m.idNumber.trim() === form.idNumber.trim())) { showToast("CIN deja enregistre!"); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, "members"), { ...form, createdAt: new Date().toLocaleDateString("fr-FR"), ts: serverTimestamp() });
      setForm({ ...EMPTY }); setErrors({}); showToast("Membre ajoute!"); setView("list");
    } catch (err) { showToast("Erreur!"); }
    setSaving(false);
  };

  const handleDelete = async id => {
    try {
      await deleteDoc(doc(db, "members", id));
      if (selected && selected.id === id) setSelected(null);
      showToast("Supprime");
    } catch (err) { showToast("Erreur!"); }
  };

  const filtered = members.filter(m =>
    [m.name, m.idNumber, m.relation, m.lineage, m.fatherName, m.motherName, m.birthYear]
      .some(v => (v || "").toLowerCase().includes(search.toLowerCase()))
  );

  const S = { bg: "#070810", card: "#0d0f1e", border: "#222740", text: "#dce8ff", sub: "#6c8ebf" };
  const inp = f => ({ width: "100%", padding: "11px 14px", background: "#0a0c1a", border: "1.5px solid " + (errors[f] ? "#f87171" : S.border), borderRadius: 8, color: S.text, fontFamily: "sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" });

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "sans-serif" }}>
      <div style={{ background: "#0d0f1e", borderBottom: "1px solid " + S.border, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Registre Familial</div>
            <div style={{ color: S.sub, fontSize: 13, marginTop: 4 }}>{members.length} membres enregistres</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["list", "Liste"], ["form", "Ajouter"], ["tree", "Arbre"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid " + (view === v ? S.sub : S.border), background: view === v ? "#1a1f3a" : "transparent", color: view === v ? S.text : S.sub, cursor: "pointer", fontSize: 13 }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {view !== "form" && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inp(""), marginBottom: 20, padding: "13px 16px", borderRadius: 12, width: "100%", boxSizing: "border-box" }} />}

        {view === "form" && (
          <div style={{ background: "#0d0f1e", border: "1.5px solid " + S.border, borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Ajouter un membre</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              {[["name", "Nom complet", true], ["idNumber", "N CIN (ex: A123456)", true], ["birthYear", "Annee de naissance", false], ["fatherName", "Nom du pere", false], ["motherName", "Nom de la mere", false], ["lineage", "Filiation / Lignee", false]].map(([f, label, req]) => (
                <div key={f}>
                  <label style={{ color: S.sub, fontSize: 12, display: "block", marginBottom: 5 }}>{label}{req && " *"}</label>
                  <input value={form[f]} onChange={e => sf(f, f === "idNumber" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : f === "birthYear" ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value)} maxLength={f === "idNumber" ? 7 : f === "birthYear" ? 4 : undefined} style={inp(f)} />
                  {errors[f] && <div style={{ color: "#f87171", fontSize: 11, marginTop: 3 }}>{errors[f]}</div>}
                </div>
              ))}
              <div>
                <label style={{ color: S.sub, fontSize: 12, display: "block", marginBottom: 5 }}>Lien de parente *</label>
                <select value={form.relation} onChange={e => sf("relation", e.target.value)} style={{ ...inp("relation"), color: form.relation ? S.text : "#3a4060" }}>
                  <option value="">-- Choisir --</option>
                  {RELATIONS.map(r => <option key={r} value={r} style={{ background: "#0d0f1e" }}>{r}</option>)}
                </select>
                {errors.relation && <div style={{ color: "#f87171", fontSize: 11, marginTop: 3 }}>{errors.relation}</div>}
              </div>
              {members.length > 0 && (
                <div>
                  <label style={{ color: S.sub, fontSize: 12, display: "block", marginBottom: 5 }}>Rattache a</label>
                  <select value={form.parentId} onChange={e => sf("parentId", e.target.value)} style={{ ...inp(""), color: S.text }}>
                    <option value="">-- Aucun --</option>
                    {members.map(m => <option key={m.id} value={m.id} style={{ background: "#0d0f1e" }}>{m.name} ({m.relation})</option>)}
                  </select>
                </div>
              )}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ color: S.sub, fontSize: 12, display: "block", marginBottom: 5 }}>Notes</label>
                <textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} style={{ ...inp(""), resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={handleAdd} disabled={saving} style={{ flex: 1, padding: "13px", background: saving ? "#1a2a4a" : "linear-gradient(135deg,#2a3a7a,#3a52a8)", border: "none", borderRadius: 10, color: S.text, fontSize: 16, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button onClick={() => { setForm({ ...EMPTY }); setErrors({}); }} style={{ padding: "13px 20px", background: "transparent", border: "1.5px solid " + S.border, borderRadius: 10, color: S.sub, cursor: "pointer" }}>Effacer</button>
            </div>
          </div>
        )}

        {view === "list" && (
          <div>
            {filtered.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0", color: S.border, fontSize: 18 }}>{members.length === 0 ? "Aucun membre. Ajoutez le premier!" : "Aucun resultat."}</div>
              : filtered.map(m => {
                const parent = members.find(p => p.id === m.parentId);
                const age = m.birthYear ? CY - parseInt(m.birthYear) : null;
                const sel = selected && selected.id === m.id;
                return (
                  <div key={m.id} onClick={() => setSelected(sel ? null : m)} style={{ background: sel ? "#1a1f3a" : "#0d0f1e", border: (sel ? "2" : "1.5") + "px solid " + (sel ? S.sub : S.border), borderRadius: 14, padding: "16px 20px", marginBottom: 10, cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{m.name} {age !== null && <span style={{ color: S.sub, fontSize: 13, fontWeight: 400, marginLeft: 8 }}>({age} ans)</span>}</div>
                        <div style={{ color: S.sub, fontSize: 12, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span>{m.idNumber}</span><span>{m.relation}</span>
                          {m.birthYear && <span>{m.birthYear}</span>}
                          {parent && <span>- {parent.name}</span>}
                        </div>
                        {(m.fatherName || m.motherName) && <div style={{ color: "#4a6a9a", fontSize: 11, marginTop: 3 }}>{m.fatherName && "Pere: " + m.fatherName + "  "}{m.motherName && "Mere: " + m.motherName}</div>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} style={{ background: "#2a0f1a", border: "1px solid #7f1d3a", color: "#fca5a5", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>X</button>
                    </div>
                    {sel && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + S.border, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                        {[["Nom", m.name], ["CIN", m.idNumber], ["Lien", m.relation], ["Naissance", m.birthYear || "-"], ["Pere", m.fatherName || "-"], ["Mere", m.motherName || "-"], ["Lignee", m.lineage || "-"], ["Notes", m.notes || "-"]].map(([k, v]) => (
                          <div key={k}><div style={{ color: S.sub, fontSize: 11 }}>{k}</div><div style={{ fontSize: 13, marginTop: 2 }}>{v}</div></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {view === "tree" && (
          <div style={{ background: "#0a0c1a", border: "1.5px solid " + S.border, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: S.text }}>Arbre Genealogique</div>
            {members.filter(m => !m.parentId || !members.find(p => p.id === m.parentId)).map(root => <TreeNode key={root.id} member={root} members={members} depth={0} />)}
            {members.length === 0 && <div style={{ color: S.border, textAlign: "center", padding: "40px 0" }}>Ajoutez des membres d'abord</div>}
          </div>
        )}

        {members.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            {[["membres", members.length], ["lignees", new Set(members.map(m => m.lineage).filter(Boolean)).size], ["liens", new Set(members.map(m => m.relation)).size]].map(([label, val]) => (
              <div key={label} style={{ flex: 1, minWidth: 100, background: "#0d0f1e", border: "1.5px solid " + S.border, borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ color: S.sub, fontSize: 22, fontWeight: 700 }}>{val}</div>
                <div style={{ color: "#3a4a7a", fontSize: 11 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", color: "#a8c0e8", padding: "12px 24px", borderRadius: 10, border: "1px solid #3a4a7a", zIndex: 9999, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}
