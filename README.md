# 🌿 Registre Familial — سجل العائلة

> Application web de gestion des relations familiales · تطبيق ويب لإدارة العلاقات العائلية

🔗 **Lien / الرابط:** [family-registry-p4j8.vercel.app](https://family-registry-p4j8.vercel.app)

---

## 🇫🇷 Description

**Registre Familial** est une application web collaborative permettant à tous les membres d'une famille d'enregistrer leurs informations personnelles et de visualiser leurs liens de parenté automatiquement.

### ✨ Fonctionnalités

- 📋 **Liste des membres** — Consultez tous les membres enregistrés
- ➕ **Ajout de membre** — Formulaire simple avec CIN marocaine (ex: A123456)
- 🌳 **Arbre généalogique** — Visualisation hiérarchique de la famille, triée par âge
- 👁 **Fiche détaillée** — Voir les relations familiales détectées automatiquement
- 🔒 **Suppression protégée** — Mot de passe requis pour supprimer un membre
- ☁️ **Données partagées** — Toutes les données sont synchronisées en temps réel

### 👨‍👩‍👧‍👦 Relations détectées automatiquement

| Relation | Détection |
|---|---|
| Père / Mère | Champ "Nom du père/mère" |
| Époux / Épouse | Relation déclarée + lien direct |
| Fils / Fille | Lien direct (parentId) |
| Frère / Sœur | Même père ou même mère |
| Neveu / Nièce | Enfant d'un frère/sœur |
| Oncle / Tante | Frère/sœur d'un parent |
| Grand-père / Grand-mère | Parent d'un parent |
| Cousin / Cousine | Enfant d'un oncle/tante |

---

## 🇲🇦 الوصف بالعربية

**سجل العائلة** هو تطبيق ويب تشاركي يمكّن جميع أفراد العائلة من تسجيل بياناتهم الشخصية ومشاهدة روابطهم العائلية تلقائياً.

### ✨ المميزات

- 📋 **قائمة الأعضاء** — عرض جميع المسجلين
- ➕ **إضافة عضو** — نموذج بسيط مع رقم البطاقة الوطنية المغربية
- 🌳 **شجرة العائلة** — عرض هرمي مرتب من الأكبر سناً
- 👁 **الفيش التفصيلي** — عرض العلاقات العائلية المكتشفة تلقائياً
- 🔒 **الحذف محمي** — يتطلب كلمة سر للحذف
- ☁️ **بيانات مشتركة** — تزامن فوري بين جميع المستخدمين

---

## 📖 Guide d'utilisation · دليل الاستخدام

### 1. Accueil · الصفحة الرئيسية
Affiche le nombre total de membres enregistrés.
يعرض العدد الإجمالي للأعضاء المسجلين.

### 2. Ajouter un membre · إضافة عضو
Remplissez les champs suivants · املأ الحقول التالية:

| Champ | مطلوب | ملاحظة |
|---|---|---|
| Nom complet | ✅ | الاسم الكامل |
| N° CIN | ✅ | حرف + 6 أرقام (A123456) |
| Lien de parenté | ✅ | الصلة بالعائلة |
| Année de naissance | ❌ | لترتيب الشجرة |
| Nom du père | ❌ | لاكتشاف العلاقات |
| Nom de la mère | ❌ | لاكتشاف العلاقات |
| Filiation / Lignée | ❌ | القبيلة أو الفخذ |
| Rattaché à | ❌ | لبناء الشجرة الهرمية |

### 3. Voir les relations · عرض العلاقات
Cliquez sur **👁 Voir** pour afficher la fiche complète et tous les membres liés.
اضغط **👁 Voir** لعرض الفيش الكامل وجميع الأعضاء المرتبطين.

### 4. Supprimer un membre · حذف عضو
Cliquez sur 🗑 et entrez le mot de passe administrateur.
اضغط 🗑 وأدخل كلمة سر المسؤول.

---

## 🛠️ Informations techniques · المعلومات التقنية

| Technologie | Usage |
|---|---|
| **React 18** | Interface utilisateur |
| **Firebase Firestore** | Base de données temps réel (eur3) |
| **Vercel** | Hébergement & déploiement continu |
| **GitHub** | Gestion du code source |

### Architecture
```
family-registry/
├── public/
│   └── index.html
├── src/
│   ├── App.js        ← Composant principal
│   └── index.js      ← Point d'entrée React
└── package.json      ← Dépendances (React + Firebase)
```

### Déploiement · النشر
Tout commit sur la branche `main` déclenche un déploiement automatique sur Vercel.
أي تحديث على فرع `main` يُشغّل نشراً تلقائياً على Vercel.

---

## 📝 Notes importantes · ملاحظات مهمة

- 🔐 **Confidentialité** : Les données sont publiques — ne partagez le lien qu'avec la famille.
  البيانات عامة — شارك الرابط مع أفراد العائلة فقط.
- 🇲🇦 **CIN marocaine** : Format obligatoire — 1 lettre + 6 chiffres (ex: A123456).
- ⚠️ **Suppression** : Action irréversible, protégée par mot de passe.
  الحذف لا يمكن التراجع عنه، محمي بكلمة سر.

---

*Développé avec ❤️ pour la famille Boukacheni · أُنجز بـ ❤️ لعائلة بوكاشني*
