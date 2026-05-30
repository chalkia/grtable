// js/table-graasp.js
console.log("table-graasp.js: Εκκίνηση διασύνδεσης.");

const urlParams = new URLSearchParams(window.location.search);
let graaspConnected = false;

// Λεξικό μεταφράσεων για το Widget
const widgetTranslations = {
  el: {
    add_row: "➕ Εισαγωγή γραμμής",
    export_excel: "📥 Αποθήκευση σε Excel",
    share_file: "⬆️ Διαμοιρασμός αρχείου",
    lbl_filename: "Όνομα αρχείου (χωρίς .xlsx):",
    btn_continue: "💾 Συνέχεια",
    warning: "<b>Προσοχή!</b> Τα περιεχόμενα αποθηκεύονται αυτόματα στο Graasp. Χρησιμοποιήστε την εξαγωγή για τοπικό αντίγραφο.",
    typing: "Πληκτρολόγηση...",
    saved: "Αποθηκεύτηκε στο Graasp!",
    err_save: "Σφάλμα αποθήκευσης.",
    default_col: "Στήλη"
  },
  en: {
    add_row: "➕ Add Row",
    export_excel: "📥 Save to Excel",
    share_file: "⬆️ Share File",
    lbl_filename: "Filename (without .xlsx):",
    btn_continue: "💾 Continue",
    warning: "<b>Notice:</b> Content is autosaved to Graasp. Use Excel export for a local copy.",
    typing: "Typing...",
    saved: "Saved to Graasp!",
    err_save: "Save error.",
    default_col: "Column"
  }
};

/**
 * Αλλάζει τη γλώσσα των στοιχείων του Widget
 */
function switchWidgetLang(langCode = null) {
  const lang = langCode || document.getElementById('widget-lang').value;
  document.getElementById('widget-lang').value = lang;
  
  const t = widgetTranslations[lang];
  document.getElementById('btn-add-row').innerText = t.add_row;
  document.getElementById('btn-export').innerText = t.export_excel;
  document.getElementById('btn-share').innerText = t.share_file;
  document.getElementById('lbl-filename').innerText = t.lbl_filename;
  document.getElementById('btn-confirm-export').innerText = t.btn_continue;
  document.getElementById('warning-msg').innerHTML = t.warning;
}

/**
 * Αρχικοποιεί και σχεδιάζει τον πίνακα στο DOM
 */
function initTable(title, headers, rows) {
  document.getElementById('table-title').textContent = title;
  
  const headerRow = document.getElementById('table-header');
  headerRow.innerHTML = "";
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = "";

  if (rows && rows.length > 0) {
    rows.forEach(r => addRow(r));
  } else {
    // Αν δεν υπάρχουν δεδομένα, φτιάξε 3 κενές γραμμές
    for (let i = 0; i < 3; i++) addRow();
  }
}

/**
 * Κατασκευάζει τον πίνακα από τις GET παραμέτρους του URL (Fallback ή Αρχικοποίηση)
 */
function buildFromUrl() {
  console.log("table-graasp.js: Ανάγνωση παραμέτρων από URL.");
  const lang = urlParams.get('lang') || 'el';
  switchWidgetLang(lang);

  const titleParam = urlParams.get('title');
  const title = titleParam ? decodeURIComponent(titleParam) : "Πίνακας";

  const headers = [];
  for (let i = 1; i <= 6; i++) {
    const col = urlParams.get(`col${i}`);
    if (col) headers.push(decodeURIComponent(col));
  }
  
  if (headers.length === 0) {
    const t = widgetTranslations[lang];
    headers.push(`${t.default_col} A`, `${t.default_col} B`);
  }

  const initialRowsLabels = [];
  for (let i = 1; i <= 20; i++) {
    const rowParam = urlParams.get(`row${i}`);
    if (rowParam) initialRowsLabels.push(decodeURIComponent(rowParam));
  }

  const rows = [];
  if (initialRowsLabels.length > 0) {
    initialRowsLabels.forEach(label => {
      const r = [label];
      for (let i = 1; i < headers.length; i++) r.push("");
      rows.push(r);
    });
  }

  initTable(title, headers, rows);
  
  // Αν βρισκόμαστε στο Graasp, αποθηκεύουμε τη δομή αμέσως
  if (graaspConnected) saveToGraasp();
}

// === Graasp SDK Ενσωμάτωση ===
if (window.graasp && window.graasp.boxData) {
  window.graasp.boxData.init().then(context => {
    graaspConnected = true;
    console.log("table-graasp.js: Επιτυχής σύνδεση με Graasp API Context:", context);
    
    // Προσπάθεια φόρτωσης αποθηκευμένων δεδομένων χρήστη
    window.graasp.boxData.get().then(savedData => {
      if (savedData && savedData.headers) {
        console.log("table-graasp.js: Ανάκτηση δεδομένων από το Graasp Cloud storage.", savedData);
        if(savedData.lang) switchWidgetLang(savedData.lang);
        initTable(savedData.title, savedData.headers, savedData.rows);
      } else {
        console.log("table-graasp.js: Το Graasp storage είναι άδειο. Χρήση URL.");
        buildFromUrl();
      }
    }).catch(err => {
      console.error("Σφάλμα κατά το graasp.boxData.get():", err);
      buildFromUrl();
    });
  }).catch(err => {
    console.error("Αποτυχία αρχικοποίησης Graasp SDK Context:", err);
    buildFromUrl();
  });
} else {
  console.log("table-graasp.js: Standalone λειτουργία εκτός Graasp.");
  buildFromUrl();
}

// === Autosave & Debouncing Λογική ===
let saveTimeout;
window.addEventListener('tableDataChanged', () => {
  if (!graaspConnected) return;
  const lang = document.getElementById('widget-lang').value;
  document.getElementById('save-status').innerText = widgetTranslations[lang].typing;

  // Debounce 1 δευτερολέπτου για αποφυγή spamming του API κατά την πληκτρολόγηση
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToGraasp, 1000);
});

function saveToGraasp() {
  const dataStruct = getTableDataStructure();
  const title = document.getElementById('table-title').textContent;
  const lang = document.getElementById('widget-lang').value;

  const payload = {
    title: title,
    headers: dataStruct.headers,
    rows: dataStruct.rows,
    lang: lang,
    time: new Date().toISOString()
  };

  console.log("table-graasp.js: Αποστολή δεδομένων στο Graasp...", payload);

  window.graasp.boxData.set(payload).then(() => {
    document.getElementById('save-status').innerText = widgetTranslations[lang].saved;
  }).catch(err => {
    console.error("Σφάλμα κατά το graasp.boxData.set():", err);
    document.getElementById('save-status').innerText = widgetTranslations[lang].err_save;
  });
}
