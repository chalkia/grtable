// js/table-export.js
console.log("table-export.js: Φορτώθηκε επιτυχώς.");

let exportMode = 'save';

// Event Listeners για τα κουμπιά εξαγωγής
document.getElementById('btn-export').addEventListener('click', () => prepareExport('save'));
document.getElementById('btn-share').addEventListener('click', () => prepareExport('share'));
document.getElementById('btn-confirm-export').addEventListener('click', finalizeExport);
document.getElementById('filename').addEventListener('keydown', (e) => { if(e.key === 'Enter') finalizeExport(); });

function prepareExport(mode) {
  exportMode = mode;
  document.getElementById('filename-container').style.display = 'block';
  document.getElementById('filename').focus();
}

function finalizeExport() {
  console.log("table-export.js: Εκτέλεση εξαγωγής. Mode:", exportMode);
  
  // Λήψη δεδομένων μέσω του core.js
  const dataStruct = getTableDataStructure();
  const excelData = [dataStruct.headers, ...dataStruct.rows];

  // Δημιουργία αρχείου Excel με τη SheetJS
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Μετρήσεις");

  const filenameInput = document.getElementById('filename').value.trim();
  const finalFilename = filenameInput ? filenameInput + '.xlsx' : 'TableData.xlsx';

  if (exportMode === 'save') {
    XLSX.writeFile(wb, finalFilename);
    console.log(`Το αρχείο ${finalFilename} αποθηκεύτηκε τοπικά.`);
  } else {
    // Διαμοιρασμός αρχείου (Web Share API για κινητά/τάμπλετ)
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([wbout], finalFilename, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        title: "Εξαγωγή Πίνακα grTable",
        text: "Δεδομένα και μετρήσεις από το grTable widget",
        files: [file]
      }).catch(error => console.error("Σφάλμα Web Share:", error));
    } else {
      alert("Η συσκευή ή ο browser δεν υποστηρίζει τον απευθείας διαμοιρασμό αρχείων.");
    }
  }
  
  // Κλείσιμο του UI filename container
  document.getElementById('filename-container').style.display = 'none';
  document.getElementById('filename').value = '';
}
