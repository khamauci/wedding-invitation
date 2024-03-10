import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

var firebaseConfig = {
    apiKey: "AIzaSyC_cyVUFdJ21XBm8Da_Z049lH6y2xr8r20",
    authDomain: "hauciwedding.firebaseapp.com",
    databaseURL: "https://hauciwedding-default-rtdb.firebaseio.com",
    projectId: "hauciwedding",
    storageBucket: "hauciwedding.appspot.com",
    messagingSenderId: "647170940749",
    appId: "1:647170940749:web:16981dbe082adc579e2104",
    measurementId: "G-L5EX6759SG"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const buttonBatal = document.getElementById('batal');
const buttonBalas = document.getElementById('balas');
const buttonUbah = document.getElementById('ubah');
const buttonKirim = document.getElementById('kirim');

const formKehadiran = document.getElementById('form-kehadiran');
const formNama = document.getElementById('form-nama');
const formPesan = document.getElementById('form-pesan');
const loader = `<span class="spinner-border spinner-border-sm me-1"></span>Loading...`;
let lastDoc = null;
let pageNow = 0;

const storage = (table) => {

    if (!localStorage.getItem(table)) {
        localStorage.setItem(table, JSON.stringify({}));
    }

    const get = (key = null) => {
        let data = JSON.parse(localStorage.getItem(table));
        return key ? data[key] : data;
    };

    const set = (key, value) => {
        let storage = get();
        storage[key] = value;
        localStorage.setItem(table, JSON.stringify(storage));
    };

    const unset = (key) => {
        let storage = get();
        delete storage[key];
        localStorage.setItem(table, JSON.stringify(storage));
    };

    const has = (key) => Object.keys(get()).includes(key);

    return {
        get,
        set,
        unset,
        has,
    };
};

const owns = storage('owns');
const likes = storage('likes');

async function simpanData() {
    var nama = formNama.value;
    var kehadiran = formKehadiran.value;
    var pesan = formPesan.value;
    let docRef;

    formNama.disabled = true;
    formKehadiran.disabled = true;
    formPesan.disabled = true;
    // buttonKirim.style.display = 'none';

    let tmp = buttonKirim.innerHTML;
    buttonKirim.innerHTML = loader;

    try {
        const created_at = new Date().toLocaleString();
        // Add data to Firestore collection
        const docRef = await addDoc(collection(db, "daftar-ucapan"), {
            uuid: "",
            nama: nama,
            hadir: parseInt(kehadiran),
            komentar: pesan,
            created_at: created_at,
            comments: [],
            like: {
                love: 0
            }
        });

        await updateDoc(doc(db, "daftar-ucapan", docRef.id), {
            uuid: docRef.id
        });
        owns.set(docRef.id, true);
        console.log("Document written with ID: ", docRef.id);

        tampilkanData();
    } catch (error) {
        console.error("Error adding document: ", error);
    }
    document.getElementById('daftar-ucapan').scrollIntoView({ behavior: 'smooth' });
    resetForm();
    buttonKirim.style.display = 'block';
    buttonKirim.innerHTML = tmp;
    formNama.disabled = false;
    formKehadiran.disabled = false;
    formPesan.disabled = false;
}

document.getElementById('kirim').addEventListener('click', function () {
    simpanData();
});

function generateUniqueId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}

async function tampilkanData() {
    const ucapanContainer = document.getElementById('daftar-ucapan');

    try {
        // const querySnapshot = await getDocs(collection(db, 'daftar-ucapan'));
        const querySnapshot = await getDocs(
            query(collection(db, 'daftar-ucapan'), orderBy('created_at', 'desc'))
        );
        ucapanContainer.innerHTML = "";

        if (querySnapshot.size === 0) {
            ucapanContainer.innerHTML = "<p>Tidak ada data</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Membuat elemen untuk menampilkan data
            const cardElement = document.createElement('div');
            cardElement.className = 'card mb-2 comment-card';

            cardElement.innerHTML = `
            <div class="card-body bg-light shadow p-3 m-0 rounded-4" data-parent="true" id="${data.uuid}">
            <div class="d-flex flex-wrap justify-content-between align-items-center">
                <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                    <strong class="me-1">${escapeHtml(data.nama)}</strong><i class="fa-solid ${data.hadir ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>
                </p>
                <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${data.created_at}</small>
            </div>
            <hr class="text-dark my-1">
            <p class="text-dark mt-0 mb-1 mx-0 p-0" style="white-space: pre-line">${convertMarkdownToHTML(escapeHtml(data.komentar))}</p>
            ${innerComment(data)}
            </div>`;

            // Menambahkan elemen ke dalam kontainer
            ucapanContainer.appendChild(cardElement);
        });
    } catch (error) {
        console.error('Error fetching documents: ', error);
    }
}

// Panggil fungsi untuk menampilkan data saat halaman dimuat
document.addEventListener('DOMContentLoaded', function () {
    tampilkanData();
});

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function convertMarkdownToHTML(input) {
    return input
        .replace(/\*(?=\S)(.*?)(?<!\s)\*/s, '<strong class="text-dark">$1</strong>')
        .replace(/\_(?=\S)(.*?)(?<!\s)\_/s, '<em class="text-dark">$1</em>')
        .replace(/\~(?=\S)(.*?)(?<!\s)\~/s, '<del class="text-dark">$1</del>')
        .replace(/\`\`\`(?=\S)(.*?)(?<!\s)\`\`\`/s, '<code class="font-monospace text-dark">$1</code>');
}

const innerComment = (data) => {
    const docidAttribute = data.docid ? `data-docid="${data.docid}"` : 'data-docid=""';
    return `
    <div class="d-flex flex-wrap justify-content-between align-items-center">
        <div class="d-flex flex-wrap justify-content-start align-items-center">
            <button style="font-size: 0.8rem;" id="btnBalas-${data.uuid}" data-uuid="${data.uuid}" ${docidAttribute} class="btn btn-sm btn-outline-dark rounded-3 py-0">reply</button>
            ${owns.has(data.uuid)
            ? `
            <button style="font-size: 0.8rem;" id="btnUbah-${data.uuid}" data-uuid="${data.uuid}" ${docidAttribute} class="btn btn-sm btn-outline-dark rounded-3 py-0 ms-1">edit</button>
            <button style="font-size: 0.8rem;" id="btnHapus-${data.uuid}" data-uuid="${data.uuid}" ${docidAttribute} class="btn btn-sm btn-outline-dark rounded-3 py-0 ms-1">delete</button>`
            : ''}
        </div>
        <button style="font-size: 0.8rem;" onclick="window.like('${data.uuid}', ${data.docid ? `'${data.docid}'` : null})" id="btnLike-${data.uuid}" data-uuid="${data.uuid}" ${docidAttribute} class="btn btn-sm btn-outline-dark rounded-2 py-0 px-0">
            <div class="d-flex justify-content-start align-items-center">
                <p class="my-0 mx-1" data-suka="${data.like.love}">${data.like.love} like</p>
                <i class="py-1 me-1 p-0 ${likes.has(data.uuid) ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>
            </div>
        </button>
    </div>
    ${innerCard(data.comments)}`;
};

const innerCard = (comment) => {
    let result = '';

    comment.forEach((data) => {
        result += `
        <div class="card-body border-start bg-light py-2 ps-2 pe-0 my-2 ms-2 me-0" id="${data.uuid}">
            <div class="d-flex flex-wrap justify-content-between align-items-center">
                <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                    <strong>${escapeHtml(data.nama)}</strong>
                </p>
                <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${data.created_at}</small>
            </div>
            <hr class="text-dark my-1">
            <p class="text-dark mt-0 mb-1 mx-0 p-0" style="white-space: pre-line">${convertMarkdownToHTML(escapeHtml(data.komentar))}</p>
            ${innerComment(data)}
        </div>`;
    });

    return result;
};

const renderLoading = (num) => {
    let result = '';

    for (let index = 0; index < num; index++) {
        result += `
        <div class="mb-3">
            <div class="card-body bg-light shadow p-3 m-0 rounded-4">
                <div class="d-flex flex-wrap justify-content-between align-items-center placeholder-glow">
                    <span class="placeholder bg-secondary col-5"></span>
                    <span class="placeholder bg-secondary col-3"></span>
                </div>
                <hr class="text-dark my-1">
                <p class="card-text placeholder-glow">
                    <span class="placeholder bg-secondary col-6"></span>
                    <span class="placeholder bg-secondary col-5"></span>
                    <span class="placeholder bg-secondary col-12"></span>
                </p>
            </div>
        </div>`;
    }

    return result;
};

document.addEventListener('click', (event) => {
    if (event.target.matches('[id^="btnBalas-"]')) {
        const uuid = event.target.getAttribute('data-uuid');
        const docid = event.target.getAttribute('data-docid') || null;
        balasan(uuid, docid);
    }
});

document.addEventListener('click', (event) => {
    if (event.target.matches('[id^="btnUbah-"]')) {
        const uuid = event.target.getAttribute('data-uuid');
        const docid = event.target.getAttribute('data-docid') || null;
        edit(uuid, docid);
    }
});

document.addEventListener('click', (event) => {
    if (event.target.matches('[id^="btnHapus-"]')) {
        const uuid = event.target.getAttribute('data-uuid');
        const docid = event.target.getAttribute('data-docid') || null;
        hapus(uuid, docid);
    }
});

const like = async (id, docid) => {
    console.log('Like function called:', id, docid);
    const likes = storage('likes');
    try {
        const button = document.getElementById(`btnLike-${id}`);
        let heart = button.firstElementChild.lastElementChild;
        let info = button.firstElementChild.firstElementChild;

        button.disabled = true;
        info.innerText = 'Loading..';

        let docRef;
        if (docid) {
            docRef = doc(db, "daftar-ucapan", docid);
        } else {
            docRef = doc(db, "daftar-ucapan", id);
        }
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const existingData = docSnap.data();

            if (docid !== null) {
                const existingComment = findCommentDataRecursive(existingData.comments, docid, id);
                if (likes.has(id)) {
                    likes.unset(id);

                    heart.classList.remove('fa-solid', 'text-danger');
                    heart.classList.add('fa-regular');

                    existingComment.like.love -= 1;
                } else {
                    console.log(existingComment.uuid);
                    likes.set(id, existingComment.uuid);

                    heart.classList.remove('fa-regular');
                    heart.classList.add('fa-solid', 'text-danger');

                    existingComment.like.love += 1;
                }
                await updateDoc(docRef, existingData);
                info.setAttribute('data-suka', existingComment.like.love.toString());
                info.innerText = `${existingComment.like.love} like`;
            } else {
                if (likes.has(id)) {
                    likes.unset(id);

                    heart.classList.remove('fa-solid', 'text-danger');
                    heart.classList.add('fa-regular');

                    existingData.like.love -= 1;
                } else {
                    console.log(existingData.uuid);
                    likes.set(id, existingData.uuid);

                    heart.classList.remove('fa-regular');
                    heart.classList.add('fa-solid', 'text-danger');

                    existingData.like.love += 1;
                }
                await updateDoc(docRef, existingData);
                info.setAttribute('data-suka', existingData.like.love.toString());
                info.innerText = `${existingData.like.love} like`;
            }
            button.disabled = false;
        } else {
            alert('Data tidak ditemukan.');
        }
    } catch (error) {
        alert(`Terdapat kesalahan: ${error}`);
    }
};

window.like = like;

const balasan = async (id, docid) => {
    resetForm();

    const button = document.getElementById(`btnBalas-${id}`);
    button.style.display = 'none';
    let tmp = button.innerText;
    button.innerText = 'Loading...';

    document.getElementById('balasan').innerHTML = renderLoading(1);
    formKehadiran.style.display = 'none';
    document.getElementById('label-kehadiran').style.display = 'none';

    try {
        let docRef;
        if (docid) {
            docRef = doc(db, "daftar-ucapan", docid);
        } else {
            docRef = doc(db, "daftar-ucapan", id);
        }

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const existingData = docSnap.data();
            console.log("existing data: ", existingData);

            if (docid) {
                const commentData = findCommentDataRecursive(existingData.comments, docid, id);
                console.log("commentData:", commentData.uuid);
                if (commentData) {
                    buttonKirim.style.display = 'none';
                    buttonBatal.style.display = 'block';
                    buttonBalas.style.display = 'block';

                    document.getElementById('balasan').innerHTML = `
                    <div class="my-3">
                        <h6>Balasan</h6>
                        <div id="id-balasan" data-uuid="${commentData.uuid}" data-docid="${commentData.docid}" class="card-body bg-light shadow p-3 rounded-4">
                            <div class="d-flex flex-wrap justify-content-between align-items-center">
                                <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                                    <strong>${escapeHtml(commentData.nama)}</strong>
                                </p>
                                <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${commentData.created_at.toLocaleString()}</small>
                            </div>
                            <hr class="text-dark my-1">
                            <p class="text-dark m-0 p-0" style="white-space: pre-line">${convertMarkdownToHTML(escapeHtml(commentData.komentar))}</p>
                        </div>
                    </div>`;
                } else {
                    console.log("docid ga kosong dan ini dijalankan")
                    alert('Data tidak ditemukan.');
                }
            } else {
                // Jika docid kosong, lanjutkan seperti sebelumnya
                buttonKirim.style.display = 'none';
                buttonBatal.style.display = 'block';
                buttonBalas.style.display = 'block';

                document.getElementById('balasan').innerHTML = `
                    <div class="my-3">
                        <h6>Balasan</h6>
                        <div id="id-balasan" data-uuid="${id}" data-docid="${docid}" class="card-body bg-light shadow p-3 rounded-4">
                            <div class="d-flex flex-wrap justify-content-between align-items-center">
                                <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                                    <strong>${escapeHtml(existingData.nama)}</strong>
                                </p>
                                <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${existingData.created_at.toLocaleString()}</small>
                            </div>
                            <hr class="text-dark my-1">
                            <p class="text-dark m-0 p-0" style="white-space: pre-line">${convertMarkdownToHTML(escapeHtml(existingData.komentar))}</p>
                        </div>
                    </div>`;
            }
        } else {
            console.log("docid kosong dan ini dijalankan")
            alert('Data tidak ditemukan.');
        }
    } catch (error) {
        resetForm();
        alert(`Terdapat kesalahan: ${error}`);
    }

    document.getElementById('ucapan').scrollIntoView({ behavior: 'smooth' });
    button.disabled = false;
    button.style.display = 'block';
    button.innerText = tmp;
};

function findCommentDataRecursive(comments, targetDocId, targetUuid) {
    for (const comment of comments) {
        if (comment.docid === targetDocId && comment.uuid === targetUuid) {
            return comment;
        } else {
            const nestedResult = findCommentDataRecursive(comment.comments, targetDocId, targetUuid);
            if (nestedResult) {
                return nestedResult;
            }
        }
    }
    // Jika tidak ditemukan, kembalikan null
    return null;
}

const resetForm = () => {

    buttonBatal.style.display = 'none';
    buttonBalas.style.display = 'none';
    buttonUbah.style.display = 'none';
    buttonKirim.style.display = 'block';

    document.getElementById('label-kehadiran').style.display = 'block';
    document.getElementById('balasan').innerHTML = null;
    formKehadiran.style.display = 'block';

    formNama.value = null;
    formKehadiran.value = '-';
    formPesan.value = null;

    formNama.disabled = false;
    formKehadiran.disabled = false;
    formPesan.disabled = false;
};

const balas = async () => {
    let nama = formNama.value;
    // let kehadiran = document.getElementById('form-kehadiran').value;
    let pesan = formPesan.value;
    let id = document.getElementById('id-balasan').getAttribute('data-uuid');
    let docid = document.getElementById('id-balasan').getAttribute('data-docid') || null;

    formNama.disabled = true;
    formPesan.disabled = true;
    // buttonBatal.style.display = 'none';
    // buttonBalas.style.display = 'none';
    let tmp = buttonBalas.innerHTML;
    buttonBalas.innerHTML = loader;

    if (!nama || !pesan) {
        alert('Nama dan pesan tidak boleh kosong');
        return;
    }

    try {
        const created_at = new Date().toLocaleString();

        let docRef;
        if (docid === "null") {
            docRef = doc(db, "daftar-ucapan", id);
        } else {
            docRef = doc(db, "daftar-ucapan", docid);
        }

        // Membaca dokumen dari Firestore
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Mendapatkan data dokumen
            const existingData = docSnap.data();

            // Menambahkan komentar baru ke dalam array comments
            const newComment = {
                docid: docSnap.id,
                uuid: generateUniqueId(10), // Membuat UUID baru
                nama: nama,
                // hadir: parseInt(kehadiran),
                komentar: pesan,
                created_at: created_at,
                comments: [],
                like: {
                    love: 0
                }  // Komentar baru dapat memiliki komentar bersarang
            };

            // Jika docid tidak kosong, cari data dengan uuid yang sesuai dalam comments
            if (docid !== "null") {
                const existingComment = findCommentDataRecursive(existingData.comments, docid, id);
                if (existingComment) {
                    existingComment.comments.push(newComment);
                }
            } else {
                existingData.comments.push(newComment);
            }

            // Memperbarui dokumen di Firestore
            await updateDoc(docRef, existingData);
            owns.set(newComment.uuid, true);
            console.log("docref uuid: ", newComment.uuid)

            // Clear form after successful submission
            document.getElementById('form-nama').value = "";
            document.getElementById('form-kehadiran').value = "0";
            document.getElementById('form-pesan').value = "";

            await tampilkanData();
        } else {
            console.log("Dokumen tidak ditemukan");
        }
    } catch (error) {
        console.error("Error updating document: ", error);
        alert(`Terdapat kesalahan: ${error.message}`);
    } finally {

    }
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'center' });
    resetForm();

    buttonBatal.style.display = 'none';
    buttonBalas.style.display = 'none';
    buttonBalas.innerHTML = tmp;
    formNama.disabled = false;
    formPesan.disabled = false;
};

document.getElementById('balas').addEventListener('click', balas);

const edit = async (id, docid) => {
    resetForm()

    const button = document.getElementById(`btnUbah-${id}`);
    button.disabled = true;
    let tmp = button.innerText;
    button.innerText = 'Loading...';

    try {
        let docRef;
        if (docid) {
            docRef = doc(db, "daftar-ucapan", docid);
        } else {
            docRef = doc(db, "daftar-ucapan", id);
        }

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const existingData = docSnap.data();
            console.log("existing data: ", existingData);

            if (docid) {
                const commentData = findCommentDataRecursive(existingData.comments, docid, id);
                console.log("commentData:", commentData.uuid);
                if (commentData) {
                    buttonBatal.style.display = 'block';
                    buttonUbah.style.display = 'block';
                    buttonKirim.style.display = 'none';
                    buttonUbah.setAttribute('data-uuid', id);
                    buttonUbah.setAttribute('data-docid', docid);

                    formPesan.value = commentData.komentar;
                    formNama.value = commentData.nama;
                    formNama.disabled = true;

                    if (document.getElementById(id).getAttribute('data-parent') !== 'true') {
                        document.getElementById('label-kehadiran').style.display = 'none';
                        formKehadiran.style.display = 'none';
                    } else {
                        formKehadiran.value = commentData.hadir ? 1 : 0;
                        document.getElementById('label-kehadiran').style.display = 'block';
                        formKehadiran.style.display = 'block';
                    }

                    document.getElementById('ucapan').scrollIntoView({ behavior: 'smooth' });
                } else {
                    console.log("docid ga kosong dan ini dijalankan")
                    alert('Data tidak ditemukan.');
                }
            } else {
                buttonBatal.style.display = 'block';
                buttonUbah.style.display = 'block';
                buttonKirim.style.display = 'none';
                buttonUbah.setAttribute('data-uuid', id);
                buttonUbah.setAttribute('data-docid', null);

                formPesan.value = existingData.komentar;
                formNama.value = existingData.nama;
                formNama.disabled = true;

                if (document.getElementById(id).getAttribute('data-parent') !== 'true') {
                    document.getElementById('label-kehadiran').style.display = 'none';
                    formKehadiran.style.display = 'none';
                } else {
                    formKehadiran.value = existingData.hadir ? 1 : 0;
                    document.getElementById('label-kehadiran').style.display = 'block';
                    formKehadiran.style.display = 'block';
                }

                document.getElementById('ucapan').scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            console.log("docid kosong dan ini dijalankan")
            alert('Data tidak ditemukan.');
        }
    } catch (error) {
        resetForm();
        alert(`Terdapat kesalahan: ${error}`);
    }

    button.disabled = false;
    button.innerText = tmp;
}

const ubah = async () => {
    let nama = formNama.value;
    let id = buttonUbah.getAttribute('data-uuid');
    let hadir = formKehadiran.value;
    let komentar = formPesan.value;
    let docid = buttonUbah.getAttribute('data-docid') || null;

    if (document.getElementById(id).getAttribute('data-parent') === 'true' && hadir == null) {
        alert('silahkan pilih kehadiran');
        return;
    }

    if (komentar.length == 0) {
        alert('pesan tidak boleh kosong');
        return;
    }

    formKehadiran.disabled = true;
    formPesan.disabled = true;
    buttonUbah.disabled = true;
    buttonBatal.disabled = true;
    let tmp = buttonUbah.innerHTML;
    buttonUbah.innerHTML = loader;

    try {
        const created_at = new Date().toLocaleString();

        let docRef;
        if (docid === "null") {
            docRef = doc(db, "daftar-ucapan", id);
        } else {
            docRef = doc(db, "daftar-ucapan", docid);
        }

        // Membaca dokumen dari Firestore
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const existingData = docSnap.data();

            if (docid !== "null") {
                const existingComment = findCommentDataRecursive(existingData.comments, docid, id);
                if (existingComment) {
                    existingComment.hadir = parseInt(hadir) === 1;
                    existingComment.komentar = komentar;
                }
            } else {
                existingData.hadir = parseInt(hadir) === 1;
                existingData.komentar = komentar;
            }

            // Memperbarui dokumen di Firestore
            await updateDoc(docRef, existingData);

            await tampilkanData();
        } else {
            console.log("Dokumen tidak ditemukan");
        }
    } catch (error) {
        console.error("Error updating document: ", error);
        alert(`Terdapat kesalahan: ${error.message}`);
    } finally {

    }
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'center' });
    resetForm();

    buttonUbah.innerHTML = tmp;
    buttonUbah.disabled = false;
    buttonBatal.disabled = false;
    formKehadiran.disabled = false;
    formPesan.disabled = false;
}
document.getElementById('ubah').addEventListener('click', ubah);

const hapus = async (id, docid) => {
    if (!confirm('Kamu yakin ingin menghapus?')) {
        return;
    }

    resetForm();

    const button = document.getElementById(`btnHapus-${id}`);
    button.disabled = true;
    let tmp = button.innerText;
    button.innerText = 'Loading..';

    let docRef;
    if (docid) {
        docRef = doc(db, "daftar-ucapan", docid);
    } else {
        docRef = doc(db, "daftar-ucapan", id);
    }

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const existingData = docSnap.data();

        if (docid) {
            const commentData = findCommentDataRecursive(existingData.comments, docid, id);
            if (commentData) {
                const updatedComments = removeComment(existingData.comments, commentData);
                existingData.comments = updatedComments;
                await updateDoc(docRef, existingData);
                owns.unset(id);
            } else {
                alert('Komentar tidak ditemukan.');
            }
        } else {
            await deleteDoc(docRef);
            owns.unset(id);
        }
    } else {
        console.log("docid kosong dan ini dijalankan")
        alert('Data tidak ditemukan.');
    }
    await tampilkanData();

    button.innerText = tmp;
    button.disabled = false;
};

function removeComment(comments, targetComment) {
    return comments.filter(comment => {
        if (comment === targetComment) {
            return false; // Remove the target comment
        } else if (comment.comments && comment.comments.length > 0) {
            // Recursively remove from nested comments
            comment.comments = removeComment(comment.comments, targetComment);
        }
        return true;
    });
}