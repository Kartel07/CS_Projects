'use strict';

const uId = sessionStorage.getItem('apex_user_id');
const activeHandle = sessionStorage.getItem('apex_username');
const clientCurrencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

if(!uId) { window.location.href = '../Login/login.html'; }
document.getElementById('userDisplayHandle').textContent = activeHandle || 'User Profile Node';

let primaryAccountsStateCache = [];
let primaryTransactionsStateCache = [];
let identityDetailsMaskedState = true;
let targetedActiveCycleMonthString = '';

// Main dashboard bootloader initialization point
async function loadDashboardData(targetMonth = '') {
  try {
    let endpointUrlPath = `http://127.0.0.1:5000/api/accounts/dashboard/${uId}`;
    if(targetMonth) { endpointUrlPath += `?month=${targetMonth}`; }

    const res = await fetch(endpointUrlPath, { credentials: 'include' });
    const data = await res.json();
    if(!res.ok) { console.error(data.message); return; }

    primaryAccountsStateCache = data.accounts || [];
    primaryTransactionsStateCache = data.transactions || [];
    targetedActiveCycleMonthString = data.selectedMonth;

    renderAccountsPanel(primaryAccountsStateCache);
    renderTransactionsHistoryList(primaryTransactionsStateCache);
    repopulateDeskSelectors(primaryAccountsStateCache);
    repopulateMonthTimelineSelector(data.availableMonths, data.selectedMonth);
  } catch (err) { console.error("Dashboard core exception trace:", err); }
}

function switchStatementTimelineCycle(chosenMonthString) {
    loadDashboardData(chosenMonthString);
}

function repopulateMonthTimelineSelector(availableMonthsArr, selectedMonth) {
    const selectWidget = document.getElementById('monthFilterSelect');
    if(!selectWidget) return;

    // If a brand new user logs in and has no transaction records yet, generate the current month as the default choice
    if(!availableMonthsArr || availableMonthsArr.length === 0) {
        const defaultDate = new Date();
        const currentTag = `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}`;
        availableMonthsArr = [currentTag];
    }

    selectWidget.innerHTML = availableMonthsArr.map(mStr => {
        const formatOptions = { month: 'long', year: 'numeric' };
        const prettyReadableMonthLabel = new Date(mStr + "-02").toLocaleDateString('en-IN', formatOptions);
        const isActiveSelected = (mStr === selectedMonth) ? 'selected' : '';
        return `<option value="${mStr}" ${isActiveSelected}>${prettyReadableMonthLabel}</option>`;
    }).join('');
}

function togglePrivateAccountDetails() {
  identityDetailsMaskedState = !identityDetailsMaskedState;
  document.getElementById('toggleDetailsBtn').textContent = identityDetailsMaskedState ? "Reveal Hidden Account Numbers" : "Mask Account Privacy Details";
  renderAccountsPanel(primaryAccountsStateCache);
}

function renderAccountsPanel(arr) {
  const wrapper = document.getElementById('accountsWrapper');
  if(arr.length === 0) { wrapper.innerHTML = `<div style='color:#666;'>No active portfolios assigned.</div>`; return; }

  wrapper.innerHTML = arr.map(a => {
    const activeAccountDisplayString = identityDetailsMaskedState ? "•••• •••• ••••" : a.account_number;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border:1px solid #e2e8f0; border-radius:6px; background:#f8fafc;">
         <div>
            <span style="text-transform:uppercase; font-size:10px; font-weight:bold; background:#e2e8f0; padding:2px 6px; border-radius:4px; color:#475569;">${a.account_type} Portfolio Line</span>
            <div style="font-size:14px; font-weight:bold; font-family:monospace; margin-top:6px; color:#1e293b;">Account Number: ${activeAccountDisplayString}</div>
            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Interest Parameter: ${a.interest_rate}% p.a. ${a.tenure_months ? `| Duration: ${a.tenure_months} Months` : ''}</div>
         </div>
         <div style="font-size:20px; font-weight:bold; color:#1e293b;">${clientCurrencyFormatter.format(a.balance)}</div>
    </div>`;
  }).join('');
}

function renderTransactionsHistoryList(arr) {
  const wrapper = document.getElementById('transactionsWrapper');
  if(arr.length === 0) { 
      wrapper.innerHTML = `<div style='color:#64748b; font-size:13px; text-align:center; padding:30px; background:#f8fafc; border-radius:6px; border:1px dashed #cbd5e1;'>No structural ledger transactions recorded during this specific calendar statement cycle window.</div>`; 
      return; 
  }

  wrapper.innerHTML = arr.map(t => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; font-size:13px;">
       <div>
          <div style="font-weight:bold; color:#334155;">${t.description}</div>
          <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Account Ref: #${String(t.account_id).padStart(6,'0')} | Timestamp: ${new Date(t.created_at).toLocaleString('en-IN')}</div>
       </div>
       <div style="font-weight:bold; font-size:14px; color:${t.txn_type === 'credit' ? '#10b981' : '#f43f5e'};">
          ${t.txn_type === 'credit' ? '+' : '−'} ${clientCurrencyFormatter.format(t.amount)}
       </div>
    </div>
  `).join('');
}

function repopulateDeskSelectors(arr) {
  const select = document.getElementById('deskTargetId');
  if(select) { select.innerHTML = arr.map(a => `<option value="${a.id}">${a.account_type.toUpperCase()} Account Line Reference ID — Ref: #${String(a.id).padStart(6,'0')}</option>`).join(''); }
}

async function executeDeskAction() {
  const account_id = document.getElementById('deskTargetId').value;
  const action_type = document.getElementById('deskActionType').value;
  const amount = document.getElementById('deskAmount').value;
  if(!account_id || !amount) { alert("Please complete all transactional metric data inputs."); return; }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/transactions/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ account_id, user_id: uId, action_type, amount, description: `Manual transaction desk processing — ${action_type.toUpperCase()}` })
    });
    const data = await res.json();
    alert(data.message);
    document.getElementById('deskAmount').value = '';
    loadDashboardData(targetedActiveCycleMonthString); // Refreshes explicitly within the user's currently selected cycle window
  } catch (err) { alert("Ledger balancing pipeline network failure."); }
}

async function alterUsernameHandle() {
  const newName = document.getElementById('newUsernameInput').value.trim();
  if(!newName) { alert("Please input a valid username array match block."); return; }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/accounts/username', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: uId, new_username: newName })
    });
    const data = await res.json();
    alert(data.message);
    if(res.ok) { sessionStorage.setItem('apex_username', data.updatedUsername); location.reload(); }
  } catch (err) { alert("Failed to complete handle alteration."); }
}

async function provisionSubLine() {
  const type = document.getElementById('subType').value;
  const dep = document.getElementById('subDeposit').value;
  if(!type || !dep) { alert("Please complete initial funding values."); return; }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/accounts/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: uId, account_type: type, initial_deposit: dep })
    });
    const data = await res.json();
    alert(data.message);
    if(res.ok) { 
        document.getElementById('subDeposit').value = ''; 
        loadDashboardData(targetedActiveCycleMonthString); 
    }
  } catch (err) { alert("Network provisioning expansion tunnel failure."); }
}

function compilePrintPDF() {
  if (primaryTransactionsStateCache.length === 0) { alert("No transaction records found to export for this specific month cycle."); return; }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFont("Helvetica", "bold").setFontSize(18).setTextColor(30, 41, 59);
  pdf.text("APEX COMMERCIAL BANKING CORPORATION", 20, 20);
  pdf.setFontSize(10).setFont("Helvetica", "normal").setTextColor(100, 116, 139);
  
  const niceCycleLabel = new Date(targetedActiveCycleMonthString + "-02").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  pdf.text(`Statement Cycle Period: ${niceCycleLabel.toUpperCase()} | Generated: ${new Date().toLocaleString('en-IN')}`, 20, 28);
  pdf.setDrawColor(226, 232, 240).setLineWidth(0.5).line(20, 34, 190, 34);

  pdf.setFont("Helvetica", "bold").setFontSize(10).setTextColor(51, 65, 85);
  pdf.text("Account ID", 22, 42);
  pdf.text("Description Log Entry Summary", 55, 42);
  pdf.text("Type", 145, 42);
  pdf.text("Amount", 165, 42);
  pdf.line(20, 45, 190, 45);

  pdf.setFont("Helvetica", "normal").setFontSize(10);
  let yAxis = 52;

  primaryTransactionsStateCache.forEach((t) => {
    if(yAxis > 275) { pdf.addPage(); yAxis = 20; }
    pdf.text(`#${String(t.account_id).padStart(6,'0')}`, 22, yAxis);
    pdf.text(t.description.substring(0, 37), 55, yAxis);
    pdf.text(t.txn_type.toUpperCase(), 145, yAxis);
    const numericalAmount = parseFloat(t.amount) || 0;
    let printableValue = `${t.txn_type === 'credit' ? '+' : '-'}${numericalAmount.toFixed(2)}`;
    pdf.text(printableValue, 165, yAxis);
    yAxis += 8;
  });

  pdf.save(`Apex_Statement_${activeHandle}_${targetedActiveCycleMonthString}.pdf`);
}

window.addEventListener('DOMContentLoaded', () => loadDashboardData());