// ===== VARIABLES GLOBALES =====
let trades = JSON.parse(localStorage.getItem('trades')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let chart;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    loadTrades();
    loadNotes();
    updateStats();
    initChart();
});

// ===== GESTIÓN DE TRADES =====
function addTrade() {
    const form = document.getElementById('tradeForm');
    
    if (!form.checkValidity()) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }
    
    const trade = {
        id: Date.now(),
        date: new Date().toLocaleDateString('es-ES'),
        symbol: document.getElementById('symbol').value,
        direction: document.getElementById('direction').value,
        entryPrice: parseFloat(document.getElementById('entryPrice').value),
        exitPrice: parseFloat(document.getElementById('exitPrice').value),
        lotSize: parseFloat(document.getElementById('lotSize').value),
        pnl: parseFloat(document.getElementById('pnl').value),
        strategy: document.getElementById('strategy').value || '',
        timeframe: document.getElementById('timeframe').value
    };
    
    trades.push(trade);
    localStorage.setItem('trades', JSON.stringify(trades));
    
    loadTrades();
    updateStats();
    updateChart();
    form.reset();
}

function loadTrades() {
    const tbody = document.getElementById('tradesBody');
    tbody.innerHTML = '';
    
    trades.forEach(trade => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${trade.date}</td>
            <td>${trade.symbol}</td>
            <td>${trade.direction}</td>
            <td>${trade.entryPrice}</td>
            <td>${trade.exitPrice}</td>
            <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}">$${trade.pnl.toFixed(2)}</td>
            <td>${trade.strategy}</td>
            <td>${trade.timeframe}</td>
        `;
    });
}

// ===== ESTADÍSTICAS =====
function updateStats() {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgTrade = totalTrades > 0 ? (totalPnL / totalTrades).toFixed(2) : 0;
    
    document.getElementById('totalTrades').textContent = totalTrades;
    document.getElementById('winRate').textContent = winRate + '%';
    document.getElementById('totalPnL').textContent = '$' + totalPnL.toFixed(2);
    document.getElementById('totalPnL').className = `stat-value ${totalPnL >= 0 ? 'profit' : 'loss'}`;
    document.getElementById('avgTrade').textContent = '$' + avgTrade;
}

// ===== GRÁFICO =====
function initChart() {
    const ctx = document.getElementById('pnlChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'P&L Acumulado',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3498db',
                pointBorderColor: '#2980b9',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución del P&L Acumulado',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#ecf0f1' },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                },
                x: {
                    grid: { color: '#ecf0f1' }
                }
            }
        }
    });
    updateChart();
}

function updateChart() {
    if (!chart) return;
    
    let cumulativePnL = 0;
    const labels = [];
    const data = [];
    
    trades.forEach((trade, index) => {
        cumulativePnL += trade.pnl;
        labels.push(`#${index + 1}`);
        data.push(cumulativePnL);
    });
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// ===== DIARIO DE NOTAS =====
function addNote() {
    const noteText = document.getElementById('journalNote').value.trim();
    if (!noteText) {
        alert('Por favor escribe una nota');
        return;
    }
    
    const note = {
        id: Date.now(),
        date: new Date().toLocaleString('es-ES'),
        text: noteText
    };
    
    notes.unshift(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    loadNotes();
    document.getElementById('journalNote').value = '';
}

function loadNotes() {
    const notesSection = document.getElementById('notesSection');
    notesSection.innerHTML = '';
    
    notes.forEach(note => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-entry';
        noteDiv.innerHTML = `
            <div class="note-date">${note.date}</div>
            <div class="note-text">${note.text}</div>
        `;
        notesSection.appendChild(noteDiv);
    });
}

// ===== EXPORT/IMPORT SISTEMA =====
function exportData() {
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            version: "2.0",
            source: "Trading Journal Demo"
        },
        statistics: calculateStats(),
        trades: trades,
        notes: notes
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    
    downloadFile(blob, `trading-journal-${getDateString()}.json`);
    alert(`Datos exportados: ${trades.length} trades, ${notes.length} notas`);
}

function exportTradesCSV() {
    if (trades.length === 0) {
        alert('No hay trades para exportar');
        return;
    }
    
    const headers = ['Fecha', 'Símbolo', 'Dirección', 'Entrada', 'Salida', 'Lotes', 'P&L', 'Estrategia', 'Timeframe'];
    const csvContent = [
        headers.join(','),
        ...trades.map(trade => [
            `"${trade.date}"`,
            trade.symbol,
            trade.direction,
            trade.entryPrice,
            trade.exitPrice,
            trade.lotSize,
            trade.pnl,
            `"${trade.strategy}"`,
            trade.timeframe
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `trades-${getDateString()}.csv`);
    alert(`${trades.length} trades exportados a CSV`);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.trades || !Array.isArray(importedData.trades)) {
                    throw new Error('Formato de archivo inválido');
                }
                
                const confirmImport = confirm(
                    `Archivo: ${importedData.trades.length} trades, ${importedData.notes?.length || 0} notas\n` +
                    `Fusionar con datos actuales (${trades.length} trades)?`
                );
                
                if (!confirmImport) return;
                
                const initialCount = trades.length;
                mergeTrades(importedData.trades);
                
                if (importedData.notes) {
                    mergeNotes(importedData.notes);
                }
                
                localStorage.setItem('trades', JSON.stringify(trades));
                localStorage.setItem('notes', JSON.stringify(notes));
                
                loadTrades();
                loadNotes();
                updateStats();
                updateChart();
                
                alert(`Importación exitosa!\nNuevos trades: ${trades.length - initialCount}`);
                
            } catch (error) {
                alert('Error al importar: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function generateReport() {
    if (trades.length === 0) {
        alert('No hay trades para generar reporte');
        return;
    }
    
    const report = {
        metadata: {
            reportDate: new Date().toISOString(),
            period: `${trades[0].date} - ${trades[trades.length-1].date}`,
            totalDays: Math.ceil((new Date() - new Date(trades[0].date)) / (1000*60*60*24))
        },
        summary: calculateStats(),
        performance: {
            bestSymbol: getBestSymbol(),
            worstSymbol: getWorstSymbol(),
            bestStrategy: getBestStrategy(),
            preferredTimeframe: getPreferredTimeframe()
        },

analysis: {
            consecutiveWins: getMaxConsecutive(true),
            consecutiveLosses: getMaxConsecutive(false),
            monthlyPerformance: getMonthlyPerformance(),
            riskReward: calculateRiskReward()
        },
        trades: trades
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
    });
    
    downloadFile(blob, `trading-report-${getDateString()}.json`);
    alert('Reporte generado exitosamente');
}

// ===== FUNCIONES AUXILIARES =====
function calculateStats() {
    if (trades.length === 0) {
        return {
            totalTrades: 0,
            winRate: 0,
            totalPnL: 0,
            avgTrade: 0,
            winningTrades: 0,
            losingTrades: 0,
            largestWin: 0,
            largestLoss: 0
        };
    }
    
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    
    return {
        totalTrades: trades.length,
        winRate: (winningTrades.length / trades.length * 100).toFixed(1),
        totalPnL: totalPnL.toFixed(2),
        avgTrade: (totalPnL / trades.length).toFixed(2),
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)).toFixed(2) : 0,
        largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)).toFixed(2) : 0
    };
}

function getBestSymbol() {
    const symbolPnL = {};
    trades.forEach(trade => {
        symbolPnL[trade.symbol] = (symbolPnL[trade.symbol] || 0) + trade.pnl;
    });
    
    return Object.keys(symbolPnL).reduce((best, symbol) => 
        symbolPnL[symbol] > (symbolPnL[best] || -Infinity) ? symbol : best, null
    );
}

function getWorstSymbol() {
    const symbolPnL = {};
    trades.forEach(trade => {
        symbolPnL[trade.symbol] = (symbolPnL[trade.symbol] || 0) + trade.pnl;
    });
    
    return Object.keys(symbolPnL).reduce((worst, symbol) => 
        symbolPnL[symbol] < (symbolPnL[worst] || Infinity) ? symbol : worst, null
    );
}

function getBestStrategy() {
    const strategyPnL = {};
    trades.forEach(trade => {
        if (trade.strategy) {
            strategyPnL[trade.strategy] = (strategyPnL[trade.strategy] || 0) + trade.pnl;
        }
    });
    
    return Object.keys(strategyPnL).reduce((best, strategy) => 
        strategyPnL[strategy] > (strategyPnL[best] || -Infinity) ? strategy : best, null
    );
}

function getPreferredTimeframe() {
    const timeframes = {};
    trades.forEach(trade => {
        timeframes[trade.timeframe] = (timeframes[trade.timeframe] || 0) + 1;
    });
    
    return Object.keys(timeframes).reduce((preferred, tf) => 
        timeframes[tf] > (timeframes[preferred] || 0) ? tf : preferred, null
    );
}

function getMaxConsecutive(isWin) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    trades.forEach(trade => {
        const isTradeWin = trade.pnl > 0;
        if (isTradeWin === isWin) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
            currentConsecutive = 0;
        }
    });
    
    return maxConsecutive;
}

function getMonthlyPerformance() {
    const monthly = {};
    trades.forEach(trade => {
        const month = trade.date.substring(0, 7); // YYYY-MM
        monthly[month] = (monthly[month] || 0) + trade.pnl;
    });
    
    return monthly;
}

function calculateRiskReward() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    if (losingTrades.length === 0) return 0;
    
    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length;
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length);
    
    return (avgWin / avgLoss).toFixed(2);
}

function mergeTrades(newTrades) {
    const existingIds = new Set(trades.map(t => t.id));
    const uniqueNewTrades = newTrades.filter(t => !existingIds.has(t.id));
    trades.push(...uniqueNewTrades);
    trades.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function mergeNotes(newNotes) {
    const existingIds = new Set(notes.map(n => n.id));
    const uniqueNewNotes = newNotes.filter(n => !existingIds.has(n.id));
    notes.push(...uniqueNewNotes);
    notes.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function getDateString() {
    return new Date().toISOString().split('T')[0];
}

