let data = JSON.parse(localStorage.getItem("setlists")) || [];
let currentSetlistIndex = null;
let currentSongIndex = null;
let currentLineIndex = null;

const viewHome = document.getElementById("view-home");
const viewSetlist = document.getElementById("view-setlist");
const viewSong = document.getElementById("view-song");
const popup = document.getElementById("status-popup");

function saveData() {
    localStorage.setItem("setlists", JSON.stringify(data));
}

function showView(view) {
    viewHome.classList.add("hidden");
    viewSetlist.classList.add("hidden");
    viewSong.classList.add("hidden");
    view.classList.remove("hidden");
}

// HOME
function renderHome() {
    const container = document.getElementById("setlist-list");
    container.innerHTML = "";

    data.forEach((setlist, index) => {
        const div = document.createElement("div");
        div.className = "setlist";
        div.onclick = () => openSetlist(index);

        // Cálculo do progresso geral
        let totalLinhas = 0, decorado = 0, cantarVendo = 0;

        setlist.songs.forEach(song => {
            song.lyrics.forEach(line => {
                if (!line.line.trim()) return; // ignora linha vazia no cálculo
                totalLinhas++;
                if (line.status === "decorado") decorado++;
                else if (line.status === "cantar_vendo") cantarVendo++;
            });
        });



        const total = totalLinhas || 1;
        const p1 = Math.round((decorado / total) * 100);
        const p2 = Math.round((cantarVendo / total) * 100);
        const p3 = 100 - p1 - p2;

        div.innerHTML = `
      <strong>${setlist.name}</strong>
      <div class="progress-bar">
        <div class="progress decorado" style="width: ${p1}%;"></div>
        <div class="progress cantar_vendo" style="width: ${p2}%;"></div>
        <div class="progress preciso_aprender" style="width: ${p3}%;"></div>
      </div>
      <small>${p1}% memorizado | ${p2}% cantando com letra | ${p3}% a aprender</small>
    `;

        container.appendChild(div);
    });
    document.getElementById("setlist-count").textContent = `Total de setlists: ${data.length}`;
}


function createSetlist() {
    const name = prompt("Nome do Setlist:");
    if (!name) return;
    data.push({ name, songs: [] });
    saveData();
    renderHome();
}

function goHome() {
    showView(viewHome);
    renderHome();
}

// SETLIST
function openSetlist(index) {
    currentSetlistIndex = index;
    document.getElementById("setlist-title").textContent = data[index].name;
    renderSetlistSongs();
    showView(viewSetlist);
}

function renderSetlistSongs() {
    const container = document.getElementById("song-list");
    container.innerHTML = "";

    const songs = data[currentSetlistIndex].songs;

    songs.forEach((song, i) => {
        const div = document.createElement("div");
        div.className = "song";
        div.onclick = () => openSong(i);

        const total = song.lyrics.filter(l => l.line.trim() !== "").length || 1;
        const decorado = song.lyrics.filter(l => l.status === "decorado" && l.line.trim() !== "").length;
        const cantarVendo = song.lyrics.filter(l => l.status === "cantar_vendo" && l.line.trim() !== "").length;

        // const restante = total - decorado - cantarVendo;

        const p1 = Math.round((decorado / total) * 100);
        const p2 = Math.round((cantarVendo / total) * 100);
        const p3 = 100 - p1 - p2;

        div.innerHTML = `
      <strong>${song.title}</strong>
      <div class="progress-bar">
        <div class="progress decorado" style="width: ${p1}%;"></div>
        <div class="progress cantar_vendo" style="width: ${p2}%;"></div>
        <div class="progress preciso_aprender" style="width: ${p3}%;"></div>
      </div>
      <small>${p1}% memorizado | ${p2}% cantando com a letra | ${p3}% a aprender</small>
    `;

        container.appendChild(div);
    });
    document.getElementById("song-count").textContent = `Músicas neste setlist: ${songs.length}`;
}

function createSong() {
    const title = prompt("Título da música:");
    const rawLyrics = prompt("Cole a letra da música (uma linha por verso):");
    if (!title || !rawLyrics) return;
    const lyrics = rawLyrics.split("\n").map(line => ({ line, status: null }));
    data[currentSetlistIndex].songs.push({ title, lyrics });
    saveData();
    renderSetlistSongs();
}

function goBackToSetlist() {
    showView(viewSetlist);
    renderSetlistSongs();
}

// SONG VIEW
function openSong(index) {
    currentSongIndex = index;
    const song = data[currentSetlistIndex].songs[index];
    document.getElementById("song-title").textContent = song.title;
    renderLyrics();
    showView(viewSong);
}

function renderLyrics() {
    const container = document.getElementById("lyrics-container");
    container.innerHTML = "";

    const lyrics = data[currentSetlistIndex].songs[currentSongIndex].lyrics;

    lyrics.forEach((lineObj, i) => {
        const div = document.createElement("div");
        div.className = "lyric-line";
        div.textContent = lineObj.line;

        if (lineObj.status) {
            div.classList.add(lineObj.status);
        }

        // Só permite clique se a linha tiver texto
        if (lineObj.line.trim()) {
            div.addEventListener("click", (e) => {
                if (currentLineIndex === i) {
                    // Clicou na mesma linha: fecha o popup
                    closePopup();
                    currentLineIndex = null;
                } else {
                    // Clicou em outra linha: abre popup
                    currentLineIndex = i;
                    const rect = div.getBoundingClientRect();
                    openPopup(rect.left + window.scrollX + 10, rect.top + window.scrollY + 30);
                }
            });
        }

        container.appendChild(div);
    });
}

function setLineStatus(status) {
    const song = data[currentSetlistIndex].songs[currentSongIndex];
    song.lyrics[currentLineIndex].status = status;
    saveData();
    closePopup();
    renderLyrics();
}

function openPopup(x, y) {
    const popup = document.getElementById("status-popup");
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.classList.remove("hidden");
}

function closePopup() {
    document.getElementById("status-popup").classList.add("hidden");
}

function deleteSetlist() {
    if (confirm("Tem certeza que deseja excluir este setlist?")) {
        data.splice(currentSetlistIndex, 1);
        currentSetlistIndex = -1;
        currentSongIndex = -1;

        saveData();
        renderSetlists();
        showView("view-home"); // <- volta para home
    }
}

function deleteSong() {
    const setlist = data[currentSetlistIndex];
    if (!setlist || setlist.songs.length === 0) return;

    if (confirm("Tem certeza que deseja excluir esta música?")) {
        setlist.songs.splice(currentSongIndex, 1);

        if (setlist.songs.length === 0) {
            currentSongIndex = -1;
            saveData();
            renderSongs();
            showView("view-setlist"); // <- volta ao setlist
        } else {
            currentSongIndex = 0;
            saveData();
            renderSongs();
            openSong(currentSongIndex); // <- abre nova música válida
        }

        updateSetlistProgress();
    }
}

renderHome();
showView(viewHome);