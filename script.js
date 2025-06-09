function generateNameInputs() {
  const numPeople = parseInt(document.getElementById('numPeople').value);
  const errorMsg = document.getElementById('errorMsg');
  const nameInputsDiv = document.getElementById('nameInputs');
  const tableContainer = document.getElementById('tableContainer');
  errorMsg.textContent = '';
  nameInputsDiv.innerHTML = '';
  tableContainer.innerHTML = '';

  if (isNaN(numPeople) || numPeople < 1 || numPeople > 10) {
    errorMsg.textContent = 'Please enter a valid number between 1 and 10.';
    return;
  }

  const label = document.createElement('p');
  label.textContent = 'Optional: Enter names of participants below:';
  nameInputsDiv.appendChild(label);

  for (let i = 0; i < numPeople; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `nameInput${i}`;
    input.placeholder = `Person ${i + 1}`;
    input.addEventListener('input', () => createTable(numPeople));
    nameInputsDiv.appendChild(input);
  }

  createTable(numPeople);
}

function createTable(numPeople) {
  const container = document.getElementById('tableContainer');
  container.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'expense-table';

  const headerRow = document.createElement('tr');
  const topLeftCell = document.createElement('th');
  topLeftCell.textContent = 'Payer → Payee';
  topLeftCell.style.fontStyle = 'italic';
  headerRow.appendChild(topLeftCell);

  for (let i = 0; i < numPeople; i++) {
    const th = document.createElement('th');
    const name = document.getElementById(`nameInput${i}`)?.value || `Person ${i + 1}`;
    th.textContent = name;
    th.dataset.index = i;
    th.className = 'column-name';
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let i = 0; i < numPeople; i++) {
    const row = document.createElement('tr');
    const labelCell = document.createElement('td');
    const name = document.getElementById(`nameInput${i}`)?.value || `Person ${i + 1}`;
    labelCell.textContent = name;
    labelCell.className = 'row-name';
    labelCell.dataset.index = i;
    row.appendChild(labelCell);

    for (let j = 0; j < numPeople; j++) {
      const cell = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.dataset.row = i;
      input.dataset.col = j;
      cell.appendChild(input);
      row.appendChild(cell);
    }
    table.appendChild(row);
  }

  container.appendChild(table);
}

function calculate() {
    const inputs = document.querySelectorAll('.expense-table input[type="number"]');
    const rowHeaders = document.querySelectorAll('.expense-table tr td:first-child');

    if (inputs.length === 0) {
        alert('Please create the table first.');
        return;
    }

    const n = rowHeaders.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));

    inputs.forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        const val = parseFloat(input.value) || 0;
        matrix[row][col] = val;
    });

    const balances = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            balances[i] += matrix[i][j]; 
            balances[i] -= matrix[j][i]; 
        }
    }

    const names = Array.from(rowHeaders).map(td => td.textContent || `Person`);

    const creditors = [];
    const debtors = [];

    for (let i = 0; i < n; i++) {
        if (balances[i] > 0.01) {
            creditors.push({ index: i, amount: balances[i] });
        } else if (balances[i] < -0.01) {
            debtors.push({ index: i, amount: -balances[i] });
        }
    }

    let i = 0, j = 0;
    let resultText = 'Minimized transactions to settle debts:\n';

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(debtor.amount, creditor.amount);

        resultText += `${names[debtor.index]} pays ${names[creditor.index]}: ₹${amount.toFixed(2)}\n`;

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    if (resultText.trim() === 'Minimized transactions to settle debts:') {
        resultText = 'All settled up! No transactions needed.';
    }

    document.getElementById('results').textContent = resultText;

    // **Reveal the buttons after calculation**
    document.getElementById('shareButtons').style.display = 'block';
}
function copyToClipboard() {
  const text = document.getElementById('results').textContent;
  navigator.clipboard.writeText(text).then(() => alert('Result copied!'));
}

function downloadPDF() {
    const element = document.createElement('div');
    element.appendChild(document.getElementById('tableContainer').cloneNode(true));
    element.appendChild(document.getElementById('results').cloneNode(true));

    document.body.appendChild(element);

    // Calculate dimensions dynamically
    const contentWidth = element.scrollWidth + 20; // Add some padding
    const contentHeight = element.scrollHeight + 20;

    html2pdf().set({
        margin: 5,
        filename: 'Expense_Split.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0 },
        jsPDF: { unit: 'mm', format: [contentWidth, contentHeight], orientation: 'landscape' } // Dynamic format
    }).from(element).save().then(() => {
        document.body.removeChild(element); // Cleanup temporary elements
    });
}