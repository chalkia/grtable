// js/table-core.js
console.log("table-core.js: Φορτώθηκε επιτυχώς.");

// Σύνδεση του Click Event για την εισαγωγή νέας γραμμής
document.getElementById('btn-add-row').addEventListener('click', () => addRow());

/**
 * Δημιουργεί ένα δυναμικό textarea με auto-resize
 */
function createFlexibleTextarea(readOnly = false, value = '') {
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.readOnly = readOnly;
  ta.rows = 1;
  
  if (readOnly) {
    ta.style.fontWeight = 'bold';
    ta.style.color = '#333';
  }

  // Λειτουργία αυτόματης προσαρμογής ύψους
  const autoResize = () => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  };
  
  // Ενημέρωση ύψους και trigger event για αποθήκευση στο Graasp
  ta.addEventListener('input', () => {
    autoResize();
    window.dispatchEvent(new CustomEvent('tableDataChanged'));
  });
  
  // Μικρή καθυστέρηση για σωστό υπολογισμό κατά το αρχικό rendering
  setTimeout(autoResize, 50);
  return ta;
}

/**
 * Προσθέτει μια γραμμή στον πίνακα. Αν περαστούν τιμές, τις συμπληρώνει.
 */
function addRow(initialValues = null) {
  const tbody = document.getElementById('table-body');
  const tr = document.createElement('tr');
  const headersCount = document.querySelectorAll('#table-header th').length || 2;

  for (let i = 0; i < headersCount; i++) {
    const td = document.createElement('td');
    const val = initialValues && initialValues[i] ? initialValues[i] : "";
    
    // Η πρώτη στήλη κλειδώνει αν περιέχει προκαθορισμένα labels από τη γεννήτρια
    const isReadOnly = (i === 0 && initialValues !== null && initialValues[0] !== "");
    
    td.appendChild(createFlexibleTextarea(isReadOnly, val));
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

/**
 * Διαβάζει τον πίνακα από το DOM και επιστρέφει τη δομή και τις τιμές
 */
function getTableDataStructure() {
  const headers = Array.from(document.querySelectorAll('#table-header th')).map(th => th.innerText);
  const rows = [];
  
  document.querySelectorAll('#table-body tr').forEach(tr => {
    const rowCells = Array.from(tr.querySelectorAll('td textarea')).map(ta => ta.value);
    rows.push(rowCells);
  });
  
  return { headers, rows };
}
