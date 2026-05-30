// js/table-core.js
console.log("table-core.js: Φορτώθηκε επιτυχώς.");

/**
 * Δημιουργεί ένα δυναμικό textarea με auto-resize.
 * Υποστηρίζει Read-Only λειτουργία με γκριζάρισμα για τους μαθητές.
 */
function createFlexibleTextarea(readOnly = false, value = '') {
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.readOnly = readOnly;
  ta.rows = 1;
  
  // Αν το κελί είναι κλειδωμένο (π.χ. Label για μαθητή)
  if (readOnly) {
    ta.style.fontWeight = 'bold';
    ta.style.color = '#333';
    ta.style.backgroundColor = '#f5f5f5'; // Οπτική ένδειξη
    ta.style.cursor = 'not-allowed';
  }

  const autoResize = () => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  };
  
  ta.addEventListener('input', () => {
    autoResize();
    // Ειδοποιούμε το table-graasp.js ότι υπήρξε πληκτρολόγηση για να κάνει auto-save
    window.dispatchEvent(new CustomEvent('tableDataChanged'));
  });
  
  // Αρχικός υπολογισμός ύψους
  setTimeout(autoResize, 50);
  return ta;
}

/**
 * Προσθέτει μια γραμμή στον πίνακα.
 */
function addRow(initialValues = null, isTeacher = false) {
  const tbody = document.getElementById('table-body');
  const tr = document.createElement('tr');
  const headersCount = document.querySelectorAll('#table-header th').length || 2;

  for (let i = 0; i < headersCount; i++) {
    const td = document.createElement('td');
    const val = initialValues && initialValues[i] ? initialValues[i] : "";
    
    // Το κελί κλειδώνει ΜΟΝΟ αν: 
    // είναι η 1η στήλη (i === 0) ΚΑΙ έχει κείμενο (val !== "") ΚΑΙ δεν είσαι ο εκπαιδευτικός
    const isReadOnly = (i === 0 && val !== "" && !isTeacher);
    
    td.appendChild(createFlexibleTextarea(isReadOnly, val));
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

/**
 * Διαβάζει τον πίνακα από το DOM (Οθόνη) και επιστρέφει Headers & Rows
 * για να τα στείλει στο Excel ή στο Graasp.
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