// js/table-graasp.js
console.log("table-graasp.js: Έναρξη έξυπνης διασύνδεσης.");

const urlParams = new URLSearchParams(window.location.search);
let graaspConnected = false;
let userPermission = 'read'; // Προεπιλογή: Μαθητής

// Εμπλουτισμένο λεξικό μεταφράσεων
const widgetTranslations = {
  el: {
    add_row: "➕ Εισαγωγή γραμμής",
    export_excel: "📥 Αποθήκευση σε Excel",
    share_file: "⬆️ Διαμοιρασμός αρχείου",
    lbl_filename: "Όνομα αρχείου (χωρίς .xlsx):",
    btn_continue: "💾 Συνέχεια",
    warning: "<b>Προσοχή!</b> Εκτός Graasp οι αλλαγές δεν αποθηκεύονται.",
    typing: "Πληκτρολόγηση...",
    saved: "Αποθηκεύτηκε στο Graasp!",
    err_save: "Σφάλμα αποθήκευσης.",
    default_col: "Στήλη",
    cfg_title: "Τίτλος Πίνακα:",
    cfg_cols: "Στήλες (διαχωρισμός με κόμμα ,):",
    cfg_rows: "Γραμμές / Labels πρώτης στήλης (διαχωρισμός με κόμμα ,):"
  },
  en: {
    add_row: "➕ Add Row",
    export_excel: "📥 Save to Excel",
    share_file: "⬆️ Share File",
    lbl_filename: "Filename (without .xlsx):",
    btn_continue: "💾 Continue",
    warning: "<b>Notice:</b> Outside Graasp, changes are not saved.",
    typing: "Typing...",
    saved: "Saved to Graasp!",
    err_save: "Save error.",
    default_col: "Column",
    cfg_title: "Table Title:",
    cfg_cols: "Columns (comma separated ,):",
    cfg_rows: "Rows / First column labels (comma separated ,):"
  }
};

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
  
  // Μεταφράσεις Panel
  document.getElementById('cfg-title-lbl').innerText = t.cfg_title;
  document.getElementById('cfg-cols-lbl').innerText = t.cfg_cols;
  document.getElementById('cfg-rows-lbl').innerText = t.cfg_rows;
}

function initTable(title, headers, rows) {
  document.getElementById('table-title').textContent = title || "grTable";
  
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
    for (let i = 0; i < 3; i++) addRow();
  }
}

/**
 * Καλούμενη όταν ο Εκπαιδευτικός πατάει "Αποθήκευση Δομής"
 */
function saveConfigurations() {
  const title = document.getElementById('cfg-title').value.trim() || "grTable";
  const colsInput = document.getElementById('cfg-cols').value;
  const rowsInput = document.getElementById('cfg-rows').value;
  const lang = document.getElementById('widget-lang').value;

  // Μετατροπή των comma-separated strings σε πίνακες
  let headers = colsInput.split(',').map(s => s.trim()).filter(s => s !== "");
  if (headers.length === 0) headers = [widgetTranslations[lang].default_col + " 1"];

  let rowLabels = rowsInput.split(',').map(s => s.trim()).filter(s => s !== "");
  
  let rows = [];
  if (rowLabels.length > 0) {
    rows = rowLabels.map(label => {
      const r = [label];
      for (let i = 1; i < headers.length; i++) r.push("");
      return r;
    });
  }

  initTable(title, headers, rows);
  
  if (graaspConnected) {
    saveToGraasp();
    alert(lang === 'el' ? "Η δομή αποθηκεύτηκε!" : "Structure saved successfully!");
  }
}

/**
 * Φόρτωση default τιμών ή ανάγνωση URL αν είμαστε εκτός Graasp
 */
function buildDefaults() {
  console.log("table-graasp.js: Εκτός περιβάλλοντος Graasp ή άδειο storage. Έλεγχος για URL παραμέτρους...");
  
  // Εμφάνιση του κόκκινου warning box μόνο αν είμαστε εντελώς εκτός Graasp
  if (!window.graasp || !window.graasp.boxData) {
    document.getElementById('warning-msg').style.display = 'block';
  }
  
  // Αν υπάρχουν παράμετροι στο URL (π.χ. από το index.html), φτιάξε τον πίνακα βάσει αυτών
  if (urlParams.has('title') || urlParams.has('col1')) {
    buildFromUrl();
  } else {
    // Αν δεν υπάρχει τίποτα, φτιάξε έναν απλό τυχαίο πίνακα
    const lang = urlParams.get('lang') || 'el';
    switchWidgetLang(lang);
    const t = widgetTranslations[lang];
    initTable("grTable", [`${t.default_col} A`, `${t.default_col} B`], [["", ""], ["", ""], ["", ""]]);
  }
}

// === Graasp SDK Ενσωμάτωση ===
if (window.graasp && window.graasp.boxData) {
  window.graasp.boxData.init().then(context => {
    graaspConnected = true;
    userPermission = context.permission; // Λήψη δικαιωμάτων ('write', 'admin', 'read')

    console.log("Δικαιώματα χρήστη στο Graasp:", userPermission);

    // Αν είναι καθηγητής, εμφάνισε το Panel Ρυθμίσεων
    if (userPermission === 'write' || userPermission === 'admin') {
      document.getElementById('teacher-settings').style.display = 'block';
    }

    window.graasp.boxData.get().then(savedData => {
      if (savedData && savedData.headers) {
        if(savedData.lang) switchWidgetLang(savedData.lang);
        initTable(savedData.title, savedData.headers, savedData.rows);
        
        // Γέμισμα των πεδίων του panel με τα τρέχοντα δεδομένα
        document.getElementById('cfg-title').value = savedData.title;
        document.getElementById('cfg-cols').value = savedData.headers.join(', ');
        // Πιάνουμε τα labels της 1ης στήλης
        const labels = savedData.rows.map(r => r[0]).filter(l => l !== "");
        document.getElementById('cfg-rows').value = labels.join(', ');
      } else {
        buildDefaults();
      }
    }).catch(() => buildDefaults());
  }).catch(() => buildDefaults());
} else {
  buildDefaults();
}

// === Autosave με Debounce ===
let saveTimeout;
window.addEventListener('tableDataChanged', () => {
  if (!graaspConnected) return;
  const lang = document.getElementById('widget-lang').value;
  document.getElementById('save-status').innerText = widgetTranslations[lang].typing;

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

  window.graasp.boxData.set(payload).then(() => {
    document.getElementById('save-status').innerText = widgetTranslations[lang].saved;
  }).catch(() => {
    document.getElementById('save-status').innerText = widgetTranslations[lang].err_save;
  });
}