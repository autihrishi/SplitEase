// Generates name input fields based on number of people
function generateNameInputs() {
    const numPeople = parseInt(document.getElementById('numPeople').value);
    const errorMsg = document.getElementById('errorMsg');
    const nameInputsDiv = document.getElementById('nameInputs');
    const tableContainer = document.getElementById('tableContainer');

    errorMsg.textContent = '';
    nameInputsDiv.innerHTML = '';
    tableContainer.innerHTML = '';

    // Hide share buttons and clear previous results
    document.getElementById('shareButtons').style.display = 'none';
    document.getElementById('results').textContent = '';

    if (isNaN(numPeople) || numPeople < 1 || numPeople > 10) {
        errorMsg.textContent = 'Please enter a valid number between 1 and 10.';
        return;
    }

    // Label for name inputs
    const label = document.createElement('p');
    label.textContent = 'Optional: Enter names of participants below:';
    nameInputsDiv.appendChild(label);

    // Create text inputs for each participant name
    for (let i = 0; i < numPeople; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `nameInput${i}`;
        input.placeholder = `Person ${i + 1}`;
        // Update table when name changes
        input.addEventListener('input', () => createTable(numPeople));
        nameInputsDiv.appendChild(input);
    }

    createTable(numPeople);
}

// Creates the expense table based on number of people and their names
function createTable(numPeople) {
    const container = document.getElementById('tableContainer');
    container.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'expense-table';

    // Create header row with payer/payee and participant names
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

    // Create rows with name label and inputs for amounts
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

// Stores HTML and result text for PDF generation
let storedTableHTML = '';
let storedResultsText = '';

// Calculates the minimal transactions to settle debts
function calculate() {
    const inputs = document.querySelectorAll('.expense-table input[type="number"]');
    const rowHeaders = document.querySelectorAll('.expense-table tr td:first-child');

    if (inputs.length === 0) {
        alert('Please create the table first.');
        return;
    }

    const n = rowHeaders.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));

    // Fill matrix with input values
    inputs.forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        const val = parseFloat(input.value) || 0;
        matrix[row][col] = val;
    });

    // Calculate net balances for each person (paid - received)
    const balances = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            balances[i] += matrix[i][j];
            balances[i] -= matrix[j][i];
        }
    }

    const names = Array.from(rowHeaders).map(td => td.textContent || `Person`);

    // Separate creditors and debtors
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

    // Match debtors and creditors to minimize transactions
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

    // Store table and results for PDF (convert inputs to static text)
    const tempTable = document.getElementById('tableContainer').cloneNode(true);
    const tableInputs = tempTable.querySelectorAll("input[type='number']");

    tableInputs.forEach(input => {
        const textNode = document.createElement('span');
        textNode.textContent = input.value || "0";
        input.parentNode.replaceChild(textNode, input);
    });

    storedTableHTML = tempTable.innerHTML;
    storedResultsText = resultText;

    // Show share buttons after calculation
    document.getElementById('shareButtons').style.display = 'block';
}

// Downloads the current calculation and table as a PDF
function downloadPDF() {
    if (!storedTableHTML || !storedResultsText) {
        alert("No calculation found. Please calculate first before downloading the PDF.");
        return;
    }

    const element = document.createElement('div');
    element.style.width = '100%';

    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.padding = '5px';

    const tableContainer = document.createElement('div');
    tableContainer.innerHTML = storedTableHTML;
    tableContainer.style.marginBottom = '20px';
    // Removed any direct border styling here to keep CSS borders intact

    wrapper.appendChild(tableContainer);

    // Results section with proper styling
    const results = document.createElement('pre');
    results.textContent = storedResultsText;
    results.style.fontSize = '14px';
    results.style.textAlign = 'left';
    results.style.borderTop = '2px solid black';
    results.style.padding = '10px';

    wrapper.appendChild(results);
    element.appendChild(wrapper);
    document.body.appendChild(element);

    html2pdf().set({
        margin: [10, 20, 10, 10],  // extra right margin
        filename: 'Expense_Split.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(element).save().then(() => {document.body.removeChild(element);
    });
}
