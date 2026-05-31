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
const DELETE_PASSWORD = "Delete2026";

// Trouve tous les membres liés à un membre donné
function getRelated(member, allMembers) {
  const related = [];
  allMembers.forEach(m => {
    if (m.id === member.id) return;
    // Rattaché directement (parentId)
    if (m.parentId === member.id) {
      related.push({ member: m, link: "Enfant enregistre" });
      return;
    }
    if (member.parentId && member.parentId === m.id) {
      related.push({ member: m, link: "Parent enregistre" });
      return;
    }
    // Meme parent (freres/soeurs)
    if (member.parentId && m.parentId && member.parentId === m.parentId) {
      related.push({ member: m, link: "Meme parent" });
      return;
    }
    // Nom du pere ou de la mere correspond
    const mn = member.name.toLowerCase();
    if (m.fatherName && m.fatherName.toLowerCase() === mn) {
      related.push({ member: m, link: "Vous etes le pere de " + m.name });
      return;
    }
    if (m.motherName && m.motherName.toLowerCase() === mn) {
      related.push({ member: m, link: "Vous etes la mere de " + m.name });
      return;
    }
    // Son pere ou sa mere correspond a un autre membre
    if (member.fatherName) {
      const fn = member.fatherName.toLowerCase();
      if (m.name.toLowerCase() === fn) {
        related.push({ member: m, link: "Votre pere" });
        return;
      }
      if (m.fatherName && m.fatherName.toLowerCase() === fn && m.id !== member.id) {
        related.push({ member: m, link: "Meme pere (" + member.fatherName + ")" });
        return;
      }
    }
    if (member.motherName) {
      const mn2 = member.motherName.toLowerCase();
      if (m.name.toLowerCase() === mn2) {
        related.push({ member: m, link: "Votre mere" });
        return;
      }
      if (m.motherName && m.motherName.toLowerCase() === mn2 && m.id !== member.id) {
        related.push({ member: m, link: "Meme mere (" + member.motherName + ")" });
        return;
      }
    }
  });
  // Dédoublonnage
  const seen = new Set();
  return related.filter(r => { if (seen.has(r.member.id)) return false; seen.add(r.member.id); return true; });
}

function TreeNode({ member, members, depth }) {
  const children = members.filter(m => m.parentId === member.id);
  return (
    <div style={{ paddingLeft: depth > 0 ? 24 : 0, position: "relative" }}>
      {depth > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "#3a5a9a" }} />}
      <div style={{ background: "#0d0f1e", border: "1.5px solid #222740", borderRadius: 10, padding: "10px 16px", marginBottom: 8, marginLeft: depth > 0 ? 10 : 0, position: "relative" }}>
        {depth > 0 && <div style={{ position: "absolute", left: -12, top: "50%", width: 12, height: 2, background: "#3a5a9a" }} />}
        <div style={{ fontWeight: 600, color: "#dce8ff" }}>{member.name}</div>
        <div style={{ color: "#6c8ebf", fontSize: 12 }}>{member.relation}{member.birthYear ? " - " + member.birthYear : ""}</div>
      </div>
      {children.map(c => <TreeNode key={c.id} member={c} members={members} depth={depth + 1} />)}
    </div>
  );
}

export default function App() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [view, setView] = useState("home");
  const [search, setSearch] = useState("");
  const [profileMember, setProfileMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePass, setDeletePass] = useState("");
  const [deleteError, setDeleteError] = useState("");

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

  const confirmDelete = async () => {
    if (deletePass !== DELETE_PASSWORD) { setDeleteError("Mot de passe incorrect!"); return; }
    try {
      await deleteDoc(doc(db, "members", deleteTarget));
      if (profileMember && profileMember.id === deleteTarget) setProfileMember(null);
      showToast("Membre supprime");
    } catch (err) { showToast("Erreur!"); }
    setDeleteTarget(null); setDeletePass(""); setDeleteError("");
  };

  const filtered = members.filter(m =>
    [m.name, m.idNumber, m.relation, m.lineage, m.fatherName, m.motherName, m.birthYear]
      .some(v => (v || "").toLowerCase().includes(search.toLowerCase()))
  );

  const S = { bg: "#070810", card: "#0d0f1e", border: "#222740", text: "#dce8ff", sub: "#6c8ebf" };
  const inp = f => ({ width: "100%", padding: "11px 14px", background: "#0a0c1a", border: "1.5px solid " + (errors[f] ? "#f87171" : S.border), borderRadius: 8, color: S.text, fontFamily: "sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" });

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#0d0f1e", borderBottom: "1px solid " + S.border, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ cursor: "pointer" }} onClick={() => setView("home")}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Registre Familial</div>
            <div style={{ color: S.sub, fontSize: 13, marginTop: 4 }}>{members.length} membres enregistres</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["home", "Accueil"], ["list", "Liste"], ["form", "Ajouter"], ["tree", "Arbre"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid " + (view === v ? S.sub : S.border), background: view === v ? "#1a1f3a" : "transparent", color: view === v ? S.text : S.sub, cursor: "pointer", fontSize: 13 }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>

        {/* HOME */}
        {view === "home" && (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
            <div style={{ fontSize: 72, fontWeight: 700, color: S.sub }}>{members.length}</div>
            <div style={{ fontSize: 22, color: S.text, marginBottom: 8 }}>membres enregistres</div>
            <div style={{ color: "#3a4a7a", fontSize: 14, marginBottom: 40 }}>Bienvenue dans le Registre Familial</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setView("form")} style={{ padding: "14px 28px", background: "linear-gradient(135deg,#2a3a7a,#3a52a8)", border: "none", borderRadius: 12, color: S.text, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>+ Ajouter un membre</button>
              <button onClick={() => setView("list")} style={{ padding: "14px 28px", background: "transparent", border: "1.5px solid " + S.sub, borderRadius: 12, color: S.sub, fontSize: 16, cursor: "pointer" }}>Voir la liste</button>
            </div>
            {members.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}>
                {[["Lignees", new Set(members.map(m => m.lineage).filter(Boolean)).size], ["Types de liens", new Set(members.map(m => m.relation)).size]].map(([label, val]) => (
                  <div key={label} style={{ minWidth: 140, background: "#0d0f1e", border: "1.5px solid " + S.border, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ color: S.sub, fontSize: 26, fontWeight: 700 }}>{val}</div>
                    <div style={{ color: "#3a4a7a", fontSize: 12 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEARCH */}
        {(view === "list" || view === "tree") && (
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inp(""), marginBottom: 20, padding: "13px 16px", borderRadius: 12, width: "100%", boxSizing: "border-box" }} />
        )}

        {/* FORM */}
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

        {/* LIST */}
        {view === "list" && (
          <div>
            {filtered.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0", color: S.border, fontSize: 18 }}>{members.length === 0 ? "Aucun membre. Ajoutez le premier!" : "Aucun resultat."}</div>
              : filtered.map(m => {
                const parent = members.find(p => p.id === m.parentId);
                const related = getRelated(m, members);
                return (
                  <div key={m.id} style={{ background: "#0d0f1e", border: "1.5px solid " + S.border, borderRadius: 14, padding: "16px 20px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{m.name}</div>
                        <div style={{ color: S.sub, fontSize: 12, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span>{m.idNumber}</span>
                          <span>{m.relation}</span>
                          {parent && <span>- {parent.name}</span>}
                        </div>
                        {(m.fatherName || m.motherName) && (
                          <div style={{ color: "#4a6a9a", fontSize: 11, marginTop: 3 }}>
                            {m.fatherName && "Pere: " + m.fatherName + "  "}
                            {m.motherName && "Mere: " + m.motherName}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        <button onClick={() => setProfileMember(m)}
                          style={{ background: "#1a1f3a", border: "1px solid " + S.sub, color: S.sub, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                          👁 Voir
                        </button>
                        <button onClick={() => { setDeleteTarget(m.id); setDeletePass(""); setDeleteError(""); }}
                          style={{ background: "#2a0f1a", border: "1px solid #7f1d3a", color: "#fca5a5", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                          🗑
                        </button>
                      </div>
                    </div>
                    {related.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #181c35" }}>
                        <div style={{ color: "#3a4a7a", fontSize: 11, marginBottom: 4 }}>Liens familiaux detectes: {related.length}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {related.slice(0, 3).map(r => (
                            <span key={r.member.id} style={{ background: "#111835", border: "1px solid #2a3a6a", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: S.sub }}>
                              {r.member.name}
                            </span>
                          ))}
                          {related.length > 3 && <span style={{ color: "#3a4a7a", fontSize: 11, padding: "2px 6px" }}>+{related.length - 3} autres</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* TREE */}
        {view === "tree" && (
          <div style={{ background: "#0a0c1a", border: "1.5px solid " + S.border, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: S.text }}>Arbre Genealogique</div>
            {members.filter(m => !m.parentId || !members.find(p => p.id === m.parentId)).map(root => <TreeNode key={root.id} member={root} members={members} depth={0} />)}
            {members.length === 0 && <div style={{ color: S.border, textAlign: "center", padding: "40px 0" }}>Ajoutez des membres d'abord</div>}
          </div>
        )}
      </div>

      {/* PROFILE MODAL — fiche + relations */}
      {profileMember && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, overflowY: "auto" }}>
          <div style={{ background: "#0d0f1e", border: "1.5px solid " + S.sub, borderRadius: 18, padding: 24, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>

            {/* Entete */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{profileMember.name}</div>
                <div style={{ color: S.sub, fontSize: 13, marginTop: 2 }}>{profileMember.relation} · {profileMember.idNumber}</div>
              </div>
              <button onClick={() => setProfileMember(null)} style={{ background: "none", border: "none", color: S.sub, fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>

            {/* Fiche */}
            <div style={{ background: "#070810", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ color: S.sub, fontSize: 11, marginBottom: 12, fontWeight: 700, letterSpacing: 1 }}>FICHE PERSONNELLE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                {[["Nom", profileMember.name], ["CIN", profileMember.idNumber], ["Lien", profileMember.relation], ["Naissance", profileMember.birthYear || "-"], ["Pere", profileMember.fatherName || "-"], ["Mere", profileMember.motherName || "-"], ["Lignee", profileMember.lineage || "-"], ["Notes", profileMember.notes || "-"]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: "#3a4a7a", fontSize: 11 }}>{k}</div>
                    <div style={{ color: S.text, fontSize: 13, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Relations */}
            {(() => {
              const related = getRelated(profileMember, members);
              return related.length > 0 ? (
                <div>
                  <div style={{ color: S.sub, fontSize: 11, marginBottom: 12, fontWeight: 700, letterSpacing: 1 }}>
                    MEMBRES LIES ({related.length})
                  </div>
                  {related.map(r => (
                    <div key={r.member.id}
                      onClick={() => setProfileMember(r.member)}
                      style={{ background: "#070810", border: "1px solid #222740", borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer", transition: "border .2s" }}
                      onMouseOver={e => e.currentTarget.style.borderColor = S.sub}
                      onMouseOut={e => e.currentTarget.style.borderColor = "#222740"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{r.member.name}</div>
                          <div style={{ color: S.sub, fontSize: 12, marginTop: 2 }}>{r.member.relation} · {r.member.idNumber}</div>
                          {(r.member.fatherName || r.member.motherName) && (
                            <div style={{ color: "#3a4a7a", fontSize: 11, marginTop: 2 }}>
                              {r.member.fatherName && "Pere: " + r.member.fatherName + "  "}
                              {r.member.motherName && "Mere: " + r.member.motherName}
                            </div>
                          )}
                        </div>
                        <div style={{ background: "#111835", border: "1px solid #2a3a6a", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#8aafd4", whiteSpace: "nowrap", marginLeft: 8 }}>
                          {r.link}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#3a4a7a", fontSize: 14 }}>
                  Aucun lien familial detecte avec d'autres membres
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: 20 }}>
          <div style={{ background: "#0d0f1e", border: "1.5px solid " + S.border, borderRadius: 16, padding: 28, maxWidth: 340, width: "100%" }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirmer la suppression</div>
            <div style={{ color: S.sub, fontSize: 13, marginBottom: 20 }}>Entrez le mot de passe administrateur.</div>
            <input type="password" value={deletePass} onChange={e => { setDeletePass(e.target.value); setDeleteError(""); }} placeholder="Mot de passe" style={{ ...inp(""), marginBottom: 8 }} autoFocus />
            {deleteError && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>{deleteError}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={confirmDelete} style={{ flex: 1, padding: "12px", background: "#7f1d1d", border: "none", borderRadius: 10, color: "#fca5a5", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Supprimer</button>
              <button onClick={() => { setDeleteTarget(null); setDeletePass(""); setDeleteError(""); }} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid " + S.border, borderRadius: 10, color: S.sub, cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", color: "#a8c0e8", padding: "12px 24px", borderRadius: 10, border: "1px solid #3a4a7a", zIndex: 9999, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}

