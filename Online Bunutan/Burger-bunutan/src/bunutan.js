import { db } from "./firebase.js";
import {
  ref,
  onValue,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const ADMIN_PASSWORD = "burgeradmin";
let isAdmin = false;
let hasSeenResult = false;
let cooldownActive = false;

const bunutanRef = ref(db, "bunutan");

/* ---------------- INIT ---------------- */

export function initBunutan() {
  const pass = prompt("Admin password (leave blank if viewer):");

  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById("adminPanel").classList.remove("hidden");
  }

  runTransaction(bunutanRef, data => {
    if (!data) {
      return {
        names: [],
        picked: [],
        lastResult: "",
        isDrawing: false
      };
    }

    return {
      names: Array.isArray(data.names) ? data.names : [],
      picked: Array.isArray(data.picked) ? data.picked : [],
      lastResult: data.lastResult || "",
      isDrawing: false
    };
  });
}

/* ---------------- REALTIME LISTENER ---------------- */

onValue(bunutanRef, snapshot => {
  const data = snapshot.val() || {};
  const resultEl = document.getElementById("result");

  if (hasSeenResult && data.lastResult) {
    resultEl.textContent = data.lastResult;
  } else {
    resultEl.textContent = "Tap the burger 🍔";
  }

  const burger = document.getElementById("burger");
  burger.style.pointerEvents =
    data.isDrawing || cooldownActive ? "none" : "auto";
  burger.style.opacity =
    data.isDrawing || cooldownActive ? "0.6" : "1";

  renderLists(data.names || [], data.picked || []);
});

/* ---------------- ADMIN ACTIONS ---------------- */

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

export function drawName() {
  if (cooldownActive) return;

  hasSeenResult = true;

  const burger = document.getElementById("burger");

  try {
    new Audio("/bite.mp3").play();
  } catch {}

  burger.classList.add("wiggle");

  let noNamesLeft = false;

  runTransaction(bunutanRef, data => {
    if (!data || data.isDrawing) return data;

    if (!data.names || data.names.length === 0) {
      data.lastResult = "🍔 Bunutan completed 🍔";
      noNamesLeft = true;
      return data;
    }

    data.isDrawing = true;

    const index = Math.floor(Math.random() * data.names.length);
    const selected = data.names.splice(index, 1)[0];

    data.picked = data.picked || [];
    data.picked.push(selected);
    data.lastResult = `🍔 ${selected} 🍔`;

    // ✅ SAVE PICKED NAME FOR WAIT OVERLAY
    window.__lastPickedName = selected;

    data.isDrawing = false;
    return data;
  });

  setTimeout(() => burger.classList.remove("wiggle"), 400);

  // ✅ SHOW DONE IMAGE INSTEAD OF COOLDOWN
  if (noNamesLeft) {
    showDoneOverlay();
    return;
  }

  cooldownActive = true;
  startCooldown();
}


/* ---------------- COOLDOWN UI ---------------- */

function startCooldown() {
  const waitOverlay = document.getElementById("cooldownOverlay");
  const danceOverlay = document.getElementById("danceOverlay");
  const timerText = document.getElementById("timerText");
  const overlayResult = document.getElementById("overlayResult");

    // ✅ SHOW PICKED NAME
  overlayResult.innerHTML = `
    <div class="picked-label">You have picked</div>
    <div class="picked-name">${window.__lastPickedName} 🎄</div>
  `;

  let timeLeft = 15;

  waitOverlay.classList.remove("hidden");
  timerText.textContent = timeLeft;

  const interval = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(interval);

      waitOverlay.classList.add("hidden");
      danceOverlay.classList.remove("hidden");

      setTimeout(() => {
        danceOverlay.classList.add("hidden");
        cooldownActive = false;
      }, 3000);
    }
  }, 1000);
}

function showDoneOverlay() {
  const done = document.getElementById("doneOverlay");

  done.classList.remove("hidden");

  setTimeout(() => {
    done.classList.add("hidden");
  }, 2000);
}


/* ---------------- RENDER LISTS ---------------- */

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
