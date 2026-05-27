import React, { useState, useEffect } from "react";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCyrUJDFnVvjGeP9Lw4AnmJVax47rECvko",
  authDomain: "family-46ffc.firebaseapp.com",
  projectId: "family-46ffc",
  storageBucket: "family-46ffc.firebasestorage.app",
  messagingSenderId: "1029225975028",
  appId: "1:1029225975028:web:fc01b52d7f9a1ae6c9e2a1"
};

const RELATIONS = ["Pere","Mere","Fils","Fille","Frere","Soeur","Grand-pere","Grand-mere","Oncle paternel","Tante paternelle","Oncle maternel","Tante maternelle","Cousin","Cousine","Epoux","Epouse","Petit-fils","Petite-fille","Neveu","Niece","Beau-pere","Belle-mere","Beau-frere","Belle-soeur","Gendre","Bru","Autre"];

const EMPTY = { name:"", idNumber:"", relation:"", lineage:"", birthYear:"", fatherName:"", motherName:"", notes:"", parentId:"" };
const CY = new Date().getFullYear();

let _db = null, _ready = false, _cbs = [];
function onReady(cb){ if(_ready){ cb(_db); return; } _cbs.push(cb); }
async function loadFB(){
  try {
    const {initializeApp} = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const {getFirestore,collection,addDoc,deleteDoc,doc,onSnapshot,serverTimestamp} = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const app = initializeApp(FIREBASE_CONFIG);
    _db = {db:getFirestore(app),collection,addDoc,deleteDoc,doc,onSnapshot,serverTimestamp};
    _ready = true;
    _cbs.forEach(c => c(_db));
    _cbs = [];
  } catch(e) { console.error(e); }
}
loadFB();

function TreeNode({member, members, depth}){
  const children = members.filter(m => m.parentId === member.id);
  const age = member.birthYear ? CY - parseInt(member.birthYear) : null;
  return (
    React.createElement("div", {style:{paddingLeft:depth>0?24:0,position:"relative"}},
      depth > 0 && React.createElement("div", {style:{position:"absolute",left:0,top:0,bottom:0,width:2,background:"#3a5a9a"}}),
      React.createElement("div", {style:{background:"#0d0f1e",border:"1.5px solid #222740",borderRadius:10,padding:"10px 16px",marginBottom:8,marginLeft:depth>0?10:0,position:"relative"}},
        depth > 0 && React.createElement("div", {style:{position:"absolute",left:-12,top:"50%",width:12,height:2,background:"#3a5a9a"}}),
        React.createElement("div", {style:{fontWeight:600,color:"#dce8ff"}},
          member.name,
          age !== null && React.createElement("span", {style:{color:"#6c8ebf",fontSize:12,marginLeft:6}}, "("+age+"ans)")
        ),
        React.createElement("div", {style:{color:"#6c8ebf",fontSize:12}}, member.relation+(member.birthYear?" - "+member.birthYear:""))
      ),
      children.map(c => React.createElement(TreeNode, {key:c.id, member:c, members:members, depth:depth+1}))
    )
  );
}

export default function App() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({...EMPTY});
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = m => { setToast(m); setTimeout(()=>setToast(null),3000); };
  const sf = (f,v) => { setForm(p=>({...p,[f]:v})); setErrors(p=>({...p,[f]:""})); };

  useEffect(()=>{
    onReady(({db,collection,onSnapshot})=>{
      setStatus("online");
      onSnapshot(collection(db,"members"), snap=>{
        setMembers(snap.docs.map(d=>({id:d.id,...d.data()})));
      }, ()=>setStatus("offline"));
    });
    setTimeout(()=>setStatus(s=>s==="connecting"?"offline":s),8000);
  },[]);

  const validate = () => {
    const e={};
    if(!form.name.trim()) e.name="Requis";
    if(!form.idNumber.trim()) e.idNumber="Requis";
    else if(!/^[A-Za-z]\d{6}$/.test(form.idNumber.trim())) e.idNumber="Ex: A123456";
    if(!form.relation) e.relation="Requis";
    if(form.birthYear && (isNaN(+form.birthYear)||+form.birthYear<1900||+form.birthYear>CY)) e.birthYear="Invalide";
    return e;
  };

  const handleAdd = () => {
    const e=validate();
    if(Object.keys(e).length){ setErrors(e); return; }
    if(members.find(m=>m.idNumber.trim()===form.idNumber.trim())){ showToast("CIN deja enregistre!"); return; }
    if(status!=="online"){ showToast("Pas de connexion"); return; }
    setSaving(true);
    onReady(({db,collection,addDoc,serverTimestamp})=>{
      addDoc(collection(db,"members"),{...form,createdAt:new Date().toLocaleDateString("fr-FR"),ts:serverTimestamp()})
        .then(()=>{ setForm({...EMPTY}); setErrors({}); setSaving(false); showToast("Membre ajoute!"); setView("list"); })
        .catch(()=>{ showToast("Erreur!"); setSaving(false); });
    });
  };

  const handleDelete = id => {
    onReady(({db,doc,deleteDoc})=>{
      deleteDoc(doc(db,"members",id)).then(()=>{
        if(selected && selected.id===id) setSelected(null);
        showToast("Supprime");
      });
    });
  };

  const filtered = members.filter(m=>
    [m.name,m.idNumber,m.relation,m.lineage,m.fatherName,m.motherName,m.birthYear]
      .some(v=>(v||"").toLowerCase().includes(search.toLowerCase()))
  );

  const S = {bg:"#070810",card:"#0d0f1e",border:"#222740",text:"#dce8ff",sub:"#6c8ebf"};
  const inp = f => ({width:"100%",padding:"11px 14px",background:"#0a0c1a",border:"1.5px solid "+(errors[f]?"#f87171":S.border),borderRadius:8,color:S.text,fontFamily:"sans-serif",fontSize:14,outline:"none",boxSizing:"border-box"});
  const statusColor = {connecting:"#f59e0b",online:"#22c55e",offline:"#ef4444"}[status];

  return (
    React.createElement("div", {style:{minHeight:"100vh",background:S.bg,color:S.text,fontFamily:"sans-serif"}},

      React.createElement("div", {style:{background:"#0d0f1e",borderBottom:"1px solid "+S.border,padding:"20px 24px"}},
        React.createElement("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}},
          React.createElement("div", null,
            React.createElement("div", {style:{fontSize:22,fontWeight:700}}, "Registre Familial"),
            React.createElement("div", {style:{display:"flex",alignItems:"center",gap:6,marginTop:4}},
              React.createElement("div", {style:{width:8,height:8,borderRadius:"50%",background:statusColor}}),
              React.createElement("span", {style:{color:S.sub,fontSize:13}},
                status==="online"?"En ligne - "+members.length+" membres":status==="connecting"?"Connexion...":"Hors ligne"
              )
            )
          ),
          React.createElement("div", {style:{display:"flex",gap:8}},
            [["list","Liste"],["form","Ajouter"],["tree","Arbre"]].map(([v,l])=>
              React.createElement("button", {key:v,onClick:()=>setView(v),style:{padding:"8px 16px",borderRadius:8,border:"1.5px solid "+(view===v?S.sub:S.border),background:view===v?"#1a1f3a":"transparent",color:view===v?S.text:S.sub,cursor:"pointer",fontSize:13}}, l)
            )
          )
        )
      ),

      React.createElement("div", {style:{maxWidth:800,margin:"0 auto",padding:"24px 16px"}},

        status==="offline" && React.createElement("div", {style:{background:"#2a0f0f",border:"1px solid #7f1d1d",borderRadius:10,padding:"12px 16px",marginBottom:16,color:"#fca5a5",fontSize:14}},
          "Connexion impossible. Verifiez votre internet."
        ),

        view!=="form" && React.createElement("input", {value:search,onChange:e=>setSearch(e.target.value),placeholder:"Rechercher...",style:{...inp(""),marginBottom:20,padding:"13px 16px",borderRadius:12,width:"100%",boxSizing:"border-box"}}),

        view==="form" && React.createElement("div", {style:{background:"#0d0f1e",border:"1.5px solid "+S.border,borderRadius:16,padding:28}},
          React.createElement("div", {style:{fontSize:20,fontWeight:700,marginBottom:24}}, "Ajouter un membre"),
          React.createElement("div", {style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px 24px"}},
            [["name","Nom complet",true],["idNumber","N CIN (ex: A123456)",true],["birthYear","Annee de naissance",false],["fatherName","Nom du pere",false],["motherName","Nom de la mere",false],["lineage","Filiation / Lignee",false]].map(([f,label,req])=>
              React.createElement("div", {key:f},
                React.createElement("label", {style:{color:S.sub,fontSize:12,display:"block",marginBottom:5}}, label, req&&" *"),
                React.createElement("input", {value:form[f],onChange:e=>sf(f,f==="idNumber"?e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""):f==="birthYear"?e.target.value.replace(/\D/g,"").slice(0,4):e.target.value),maxLength:f==="idNumber"?7:f==="birthYear"?4:undefined,style:inp(f)}),
                errors[f] && React.createElement("div", {style:{color:"#f87171",fontSize:11,marginTop:3}}, errors[f])
              )
            ),
            React.createElement("div", null,
              React.createElement("label", {style:{color:S.sub,fontSize:12,display:"block",marginBottom:5}}, "Lien de parente *"),
              React.createElement("select", {value:form.relation,onChange:e=>sf("relation",e.target.value),style:{...inp("relation"),color:form.relation?S.text:"#3a4060"}},
                React.createElement("option", {value:""}, "-- Choisir --"),
                RELATIONS.map(r=>React.createElement("option", {key:r,value:r,style:{background:"#0d0f1e"}}, r))
              ),
              errors.relation && React.createElement("div", {style:{color:"#f87171",fontSize:11,marginTop:3}}, errors.relation)
            ),
            members.length > 0 && React.createElement("div", null,
              React.createElement("label", {style:{color:S.sub,fontSize:12,display:"block",marginBottom:5}}, "Rattache a"),
              React.createElement("select", {value:form.parentId,onChange:e=>sf("parentId",e.target.value),style:{...inp(""),color:S.text}},
                React.createElement("option", {value:""}, "-- Aucun --"),
                members.map(m=>React.createElement("option", {key:m.id,value:m.id,style:{background:"#0d0f1e"}}, m.name+" ("+m.relation+")"))
              )
            ),
            React.createElement("div", {style:{gridColumn:"1/-1"}},
              React.createElement("label", {style:{color:S.sub,fontSize:12,display:"block",marginBottom:5}}, "Notes"),
              React.createElement("textarea", {value:form.notes,onChange:e=>sf("notes",e.target.value),rows:2,style:{...inp(""),resize:"vertical"}})
            )
          ),
          React.createElement("div", {style:{display:"flex",gap:10,marginTop:20}},
            React.createElement("button", {onClick:handleAdd,disabled:saving||status!=="online",style:{flex:1,padding:"13px",background:saving?"#1a2a4a":"linear-gradient(135deg,#2a3a7a,#3a52a8)",border:"none",borderRadius:10,color:S.text,fontSize:16,fontWeight:700,cursor:saving?"not-allowed":"pointer",opacity:(saving||status!=="online")?0.6:1}},
              saving?"Enregistrement...":"Enregistrer"
            ),
            React.createElement("button", {onClick:()=>{setForm({...EMPTY});setErrors({});},style:{padding:"13px 20px",background:"transparent",border:"1.5px solid "+S.border,borderRadius:10,color:S.sub,cursor:"pointer"}}, "Effacer")
          )
        ),

        view==="list" && React.createElement("div", null,
          filtered.length===0
            ? React.createElement("div", {style:{textAlign:"center",padding:"60px 0",color:S.border,fontSize:18}},
                members.length===0?"Aucun membre. Ajoutez le premier!":"Aucun resultat."
              )
            : filtered.map(m=>{
                const parent = members.find(p=>p.id===m.parentId);
                const age = m.birthYear ? CY-parseInt(m.birthYear) : null;
                const sel = selected && selected.id===m.id;
                return React.createElement("div", {key:m.id,onClick:()=>setSelected(sel?null:m),style:{background:sel?"#1a1f3a":"#0d0f1e",border:(sel?"2":"1.5")+"px solid "+(sel?S.sub:S.border),borderRadius:14,padding:"16px 20px",marginBottom:10,cursor:"pointer"}},
                  React.createElement("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}},
                    React.createElement("div", null,
                      React.createElement("div", {style:{fontSize:17,fontWeight:700}},
                        m.name,
                        age!==null && React.createElement("span", {style:{color:S.sub,fontSize:13,fontWeight:400,marginLeft:8}}, "("+age+" ans)")
                      ),
                      React.createElement("div", {style:{color:S.sub,fontSize:12,marginTop:4,display:"flex",gap:12,flexWrap:"wrap"}},
                        React.createElement("span", null, m.idNumber),
                        React.createElement("span", null, m.relation),
                        m.birthYear && React.createElement("span", null, m.birthYear),
                        parent && React.createElement("span", null, "- "+parent.name)
                      ),
                      (m.fatherName||m.motherName) && React.createElement("div", {style:{color:"#4a6a9a",fontSize:11,marginTop:3}},
                        m.fatherName && React.createElement("span", null, "Pere: "+m.fatherName+"  "),
                        m.motherName && React.createElement("span", null, "Mere: "+m.motherName)
                      )
                    ),
                    React.createElement("button", {onClick:e=>{e.stopPropagation();handleDelete(m.id);},style:{background:"#2a0f1a",border:"1px solid #7f1d3a",color:"#fca5a5",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}, "X")
                  ),
                  sel && React.createElement("div", {style:{marginTop:14,paddingTop:14,borderTop:"1px solid "+S.border,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 24px"}},
                    [["Nom",m.name],["CIN",m.idNumber],["Lien",m.relation],["Naissance",m.birthYear||"-"],["Pere",m.fatherName||"-"],["Mere",m.motherName||"-"],["Lignee",m.lineage||"-"],["Notes",m.notes||"-"]].map(([k,v])=>
                      React.createElement("div", {key:k},
                        React.createElement("div", {style:{color:S.sub,fontSize:11}}, k),
                        React.createElement("div", {style:{fontSize:13,marginTop:2}}, v)
                      )
                    )
                  )
                );
              })
        ),

        view==="tree" && React.createElement("div", {style:{background:"#0a0c1a",border:"1.5px solid "+S.border,borderRadius:16,padding:24}},
          React.createElement("div", {style:{fontSize:20,fontWeight:700,marginBottom:20,color:S.text}}, "Arbre Genealogique"),
          members.filter(m=>!m.parentId||!members.find(p=>p.id===m.parentId)).map(root=>
            React.createElement(TreeNode, {key:root.id, member:root, members:members, depth:0})
          ),
          members.length===0 && React.createElement("div", {style:{color:S.border,textAlign:"center",padding:"40px 0"}}, "Ajoutez des membres d'abord")
        ),

        members.length > 0 && React.createElement("div", {style:{display:"flex",gap:10,marginTop:24,flexWrap:"wrap"}},
          [["membres",members.length],["lignees",new Set(members.map(m=>m.lineage).filter(Boolean)).size],["liens",new Set(members.map(m=>m.relation)).size]].map(([label,val])=>
            React.createElement("div", {key:label,style:{flex:1,minWidth:100,background:"#0d0f1e",border:"1.5px solid "+S.border,borderRadius:12,padding:"14px",textAlign:"center"}},
              React.createElement("div", {style:{color:S.sub,fontSize:22,fontWeight:700}}, val),
              React.createElement("div", {style:{color:"#3a4a7a",fontSize:11}}, label)
            )
          )
        )
      ),

      toast && React.createElement("div", {style:{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#1a1a2e",color:"#a8c0e8",padding:"12px 24px",borderRadius:10,border:"1px solid #3a4a7a",zIndex:9999,whiteSpace:"nowrap"}}, toast)
    )
  );
}
