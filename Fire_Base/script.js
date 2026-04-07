//Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
//import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyCRcxJDIumS6abAnkXt9xilpDEshFxyBQM",
  authDomain: "gestion-etudiants-ed02a.firebaseapp.com",
  projectId: "gestion-etudiants-ed02a",
  storageBucket: "gestion-etudiants-ed02a.firebasestorage.app",
  messagingSenderId: "520969950437",
  appId: "1:520969950437:web:c6eb4d742956bf663e700c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getFirestore(app);


let etudiants = [];
let editingId = null;    
let pageCourante = 1;
const PAR_PAGE = 5;


async function chargerEtudiants() {
  const snapshot = await getDocs(collection(db, "etudiants"));
  etudiants = [];
  snapshot.forEach((docSnap) => {
    etudiants.push({ id: docSnap.id, ...docSnap.data() });
  });
  afficher(etudiants);
}


function afficher(liste) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  const debut = (pageCourante - 1) * PAR_PAGE;
  const fin = debut + PAR_PAGE;
  const pagineeListe = liste.slice(debut, fin);

  if (pagineeListe.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center p-6 text-[#DBC5A1]/30">Aucun étudiant trouvé.</td>
      </tr>
    `;
    return;
  }

  pagineeListe.forEach((e) => {
    tbody.innerHTML += `
      <tr class="hover:bg-white/5 transition border-b border-white/5">
        <td class="p-3">${e.prenom}</td>
        <td class="p-3 font-medium uppercase">${e.nom}</td>
        <td class="p-3">${e.age} ans</td>
        <td class="p-3 font-bold text-[#DBC5A1]">${e.moyenne}/20</td>
        <td class="p-3 flex flex-wrap gap-2">
          <button onclick="ouvrirModalModifier('${e.id}')" class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs transition">✏️ Modifier</button>
          <button onclick="voirDetails('${e.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs transition">👁️ Détails</button>
          <button onclick="supprimer('${e.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition">🗑️ Supprimer</button>
        </td>
      </tr>
    `;
  });

  afficherPagination(liste);
  afficherStats();
}


function afficherPagination(liste) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(liste.length / PAR_PAGE);
  if (totalPages <= 1) return;
  for (let i = 1; i <= totalPages; i++) {
    const actif = i === pageCourante ? "bg-[#DBC5A1] text-[#2C0F12] font-bold" : "bg-white/10 text-[#DBC5A1] border border-white/10";
    pagination.innerHTML += `
      <button onclick="changerPage(${i})" class="${actif} px-3 py-1 rounded-lg hover:bg-white/20 transition text-sm">${i}</button>
    `;
  }
}

function changerPage(num) {
  pageCourante = num;
  const texte = document.getElementById("recherche").value.toLowerCase();
  const filtre = etudiants.filter(e =>
    e.nom.toLowerCase().includes(texte) || e.prenom.toLowerCase().includes(texte)
  );
  afficher(filtre);
}


function afficherStats() {
  if (etudiants.length === 0) {
    document.getElementById("plusAge").textContent = "—";
    document.getElementById("meilleureAvg").textContent = "—";
    return;
  }
  const plusAge = etudiants.reduce((max, e) => e.age > max.age ? e : max, etudiants[0]);
  const meilleureAvg = etudiants.reduce((max, e) => e.moyenne > max.moyenne ? e : max, etudiants[0]);
  document.getElementById("plusAge").textContent = `${plusAge.prenom} ${plusAge.nom} — ${plusAge.age} ans`;
  document.getElementById("meilleureAvg").textContent = `${meilleureAvg.prenom} ${meilleureAvg.nom} — ${meilleureAvg.moyenne}/20`;
}


document.getElementById("recherche").addEventListener("input", function () {
  const texte = this.value.toLowerCase();
  pageCourante = 1;
  const filtre = etudiants.filter(e =>
    e.nom.toLowerCase().includes(texte) || e.prenom.toLowerCase().includes(texte)
  );
  afficher(filtre);
});


function ouvrirModalAjouter() {
  editingId = null;  
  document.getElementById("modalFormTitre").textContent = "Ajouter un étudiant";
  document.getElementById("formEtudiant").reset();
  document.getElementById("modalForm").classList.remove("hidden");
}

function ouvrirModalModifier(id) {
  editingId = id;     
  const e = etudiants.find(e => e.id === id); 
  document.getElementById("modalFormTitre").textContent = "Modifier l'étudiant";
  document.getElementById("champPrenom").value = e.prenom;
  document.getElementById("champNom").value = e.nom;
  document.getElementById("champAge").value = e.age;
  document.getElementById("champMoyenne").value = e.moyenne;
  document.getElementById("modalForm").classList.remove("hidden");
}

function fermerModalForm() {
  document.getElementById("modalForm").classList.add("hidden");
}


document.getElementById("formEtudiant").addEventListener("submit", async function (event) {
  event.preventDefault();
  const prenom = document.getElementById("champPrenom").value.trim();
  const nom = document.getElementById("champNom").value.trim();
  const age = parseInt(document.getElementById("champAge").value);
  const moyenne = parseFloat(document.getElementById("champMoyenne").value);

  if (moyenne < 0 || moyenne > 20) {
    alert("La moyenne doit être comprise entre 0 et 20 !");
    return;
  }
  if (age < 0 || age > 40) {
    alert("L'âge doit être compris entre 0 et 40 !");
    return;
  }

  if (editingId === null) {
    
    await addDoc(collection(db, "etudiants"), { prenom, nom, age, moyenne });
  } else {
    
    await updateDoc(doc(db, "etudiants", editingId), { prenom, nom, age, moyenne });
    editingId = null;
  }

  fermerModalForm();
  await chargerEtudiants(); 
});


function voirDetails(id) {
  const e = etudiants.find(e => e.id === id); 
  document.getElementById("detailPrenom").textContent = e.prenom;
  document.getElementById("detailNom").textContent = e.nom;
  document.getElementById("detailAge").textContent = e.age + " ans";
  document.getElementById("detailMoyenne").textContent = e.moyenne + "/20";
  document.getElementById("modalDetails").classList.remove("hidden");
}

function fermerModalDetails() {
  document.getElementById("modalDetails").classList.add("hidden");
}


async function supprimer(id) {
  if (!confirm("Confirmer la suppression ?")) return;
  await deleteDoc(doc(db, "etudiants", id));   
  const totalPages = Math.ceil((etudiants.length - 1) / PAR_PAGE);
  if (pageCourante > totalPages && pageCourante > 1) pageCourante--;
  await chargerEtudiants();
}

window.ouvrirModalAjouter = ouvrirModalAjouter;
window.ouvrirModalModifier = ouvrirModalModifier;
window.fermerModalForm = fermerModalForm;
window.voirDetails = voirDetails;
window.fermerModalDetails = fermerModalDetails;
window.supprimer = supprimer;
window.changerPage = changerPage;

chargerEtudiants();