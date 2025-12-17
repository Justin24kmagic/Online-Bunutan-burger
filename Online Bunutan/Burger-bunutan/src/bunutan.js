import { db } from "./firebase.js";
import {
  ref,
  onValue,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const ADMIN_PASSWORD = "burgeradmin";
let isAdmin = false;
let isDrawing = false;
let hasSeenResult = false;

const bunutanRef = ref(db, "bunutan");

export function initBunutan() {
  const pass = prompt("Admin password (leave blank if viewer):");

  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById("adminPanel").classList.remove("hidden");
  }

  // 🔒 FORCE INITIAL STRUCTURE
  runTransaction(bunutanRef, data => {
    if (!data) {
      return {
        names: [],
        picked: [],
        lastResult: "",
        isDrawing: false
      };
    }

    // Self-heal missing fields
    return {
      names: Array.isArray(data.names) ? data.names : [],
      picked: Array.isArray(data.picked) ? data.picked : [],
      lastResult: data.lastResult || "",
      isDrawing: false
    };
  });
}

  // 🔄 Realtime listener
onValue(bunutanRef, snapshot => {
  const data = snapshot.val() || {};

  const resultEl = document.getElementById("result");

  // 👀 Hide result unless user participated
  if (hasSeenResult && data.lastResult) {
    resultEl.textContent = data.lastResult;
  } else {
    resultEl.textContent = "Tap the burger 🍔";
  }

  // 🍔 Disable burger during draw (everyone)
  const burger = document.getElementById("burger");
  if (burger) {
    burger.style.pointerEvents = data.isDrawing ? "none" : "auto";
    burger.style.opacity = data.isDrawing ? "0.6" : "1";
  }

  // ✅ RENDER LISTS (THIS WAS MISSING)
  const names = data.names || [];
  const picked = data.picked || [];

  renderLists(names, picked);
});


export function addName() {
  if (!isAdmin) return;

  const input = document.getElementById("nameInput");
  const name = input.value.trim();
  if (!name) return;

  runTransaction(ref(db, "bunutan/names"), list => {
    list = list || [];
    list.push(name);
    return list;
  });

  input.value = "";
}

const burger = document.getElementById("burger");
burger.classList.add("wiggle");
setTimeout(() => burger.classList.remove("wiggle"), 400);


export function drawName() {

hasSeenResult = true;
  const burger = document.getElementById("burger");

try {
  const sound = new Audio("/bite.mp3");
  sound.play();
} 
catch (e) {
  console.warn("Sound failed:", e);
}


  // 🍔 Wiggle animation
  burger.classList.add("wiggle");

  // 🔥 Shared draw logic
  runTransaction(bunutanRef, data => {
    if (!data) return data;

    // 🔒 Prevent double draw across all devices
    if (data.isDrawing) return data;

    if (!data.names || data.names.length === 0) {
      data.lastResult = "🍔 No names left 🍔";
      return data;
    }

    data.isDrawing = true;

    const index = Math.floor(Math.random() * data.names.length);
    const selected = data.names.splice(index, 1)[0];

    data.picked = data.picked || [];
    data.picked.push(selected);
    data.lastResult = `🍔 ${selected} 🍔`;

    data.isDrawing = false;
    return data;
  });

  // 🎬 End animation
  setTimeout(() => {
    burger.classList.remove("wiggle");
  }, 400);
}



export function resetBunutan() {
  if (!isAdmin) return;
  if (!confirm("Reset bunutan?")) return;

    set(bunutanRef, {
    names: [],
    picked: [],
    lastResult: "",
    isDrawing: false
    });
}

function renderLists(names, picked) {
  const remainingList = document.getElementById("remainingList");
  const pickedList = document.getElementById("pickedList");

  if (!remainingList || !pickedList) return;

  remainingList.innerHTML = "";
  pickedList.innerHTML = "";

  names.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    remainingList.appendChild(li);
  });

  picked.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    pickedList.appendChild(li);
  });
}

