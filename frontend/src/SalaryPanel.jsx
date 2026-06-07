import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Calculator, CheckCircle, FileText, Printer, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

/* ────────────────────────────────────────────────
   PAYSLIP MODAL  – printable overlay
──────────────────────────────────────────────── */
function PayslipModal({ slip, onClose }) {
  if (!slip) return null;
  const user = slip.User || {};
  const handlePrint = () => window.print();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div id="payslip-box" style={{ background: '#fff', color: '#1e293b', borderRadius: 16, padding: '40px', width: 560, maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid #6366f1' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#6366f1' }}>Novahamotech</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px' }}>EMPLOYEE PAY SLIP</div>
          </div>
          <button onClick={onClose} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={22} /></button>
        </div>

        {/* Employee Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, background: '#f8fafc', borderRadius: 10, padding: 16 }}>
          {[['Employee Name', user.name], ['Department', user.department], ['Role', (user.role || '').replace('_', ' ')], ['Pay Month', slip.month], ['Pay Date', slip.paidDate || 'Pending'], ['Status', slip.status?.toUpperCase()]].map(([k, v], i) => (
            <div key={i}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
              <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2, textTransform: 'capitalize' }}>{v || '—'}</div>
            </div>
          ))}
        </div>

        {/* Earnings / Deductions */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#6366f1', color: 'white' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Description</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Base Salary', `₹${Number(slip.baseSalary || 0).toLocaleString('en-IN')}`, '#059669'],
              ['Bonus', `+₹${Number(slip.bonus || 0).toLocaleString('en-IN')}`, '#2563eb'],
              ['Deductions (Absent)', `-₹${Number(slip.deductions || 0).toLocaleString('en-IN')}`, '#dc2626'],
            ].map(([label, val, color], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 14px', color: '#475569' }}>{label}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color }}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Net Salary */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#c084fc)', borderRadius: 12, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>NET SALARY</span>
          <span style={{ fontWeight: 900, fontSize: '1.6rem' }}>₹{Number(slip.netSalary || 0).toLocaleString('en-IN')}</span>
        </div>

        {/* Attendance summary */}
        <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[['Days Present', slip.presentDays], ['Working Days', slip.totalWorkingDays], ['Absent Days', (slip.totalWorkingDays || 26) - (slip.presentDays || 0)]].map(([k, v], i) => (
            <div key={i}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1' }}>{v}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{k}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', marginBottom: 20 }}>
          This is a computer-generated payslip. No signature required.
        </div>

        <button onClick={handlePrint} className="no-print" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#c084fc)', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
          <Printer size={18} /> Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   ADMIN / HR SALARY PANEL
──────────────────────────────────────────────── */
export function AdminSalaryPanel({ currentUser }) {
  const [salaries, setSalaries] = useState([]);
  const [calcMonth, setCalcMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [viewSlip, setViewSlip] = useState(null);

  const fetchSalaries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/salaries`);
      setSalaries(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSalaries(); }, []);

  const autoCalculate = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/salary/calculate`, { month: calcMonth });
      alert('✅ Salaries calculated based on attendance!');
      fetchSalaries();
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const markPaid = async (id) => {
    try {
      await axios.put(`${API_BASE}/salary/${id}/pay`);
      fetchSalaries();
    } catch (e) { alert('Error marking paid'); }
  };

  const filtered = salaries.filter(s => s.month === calcMonth);

  return (
    <div className="animate-fade">
      <PayslipModal slip={viewSlip} onClose={() => setViewSlip(null)} />

      {/* Controls */}
      <div className="glass-card" style={{ padding: '24px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <DollarSign size={22} color="#a5b4fc" />
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Salary Management</h3>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <input type="month" value={calcMonth} onChange={e => setCalcMonth(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 8, colorScheme: 'dark' }} />
          </div>
          <button onClick={autoCalculate} disabled={loading} className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px' }}>
            <Calculator size={16} /> {loading ? 'Calculating...' : 'Auto-Calculate'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={18} color="#a5b4fc" />
          <span style={{ fontWeight: 600 }}>Payroll — {calcMonth}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>{filtered.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                {['Employee', 'Dept', 'Base (₹)', 'Present', 'Deductions', 'Bonus', 'Net Pay (₹)', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>No records for {calcMonth}. Click Auto-Calculate to generate.</td></tr>
              )}
              {filtered.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{s.User?.name}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{s.User?.department}</td>
                  <td style={{ padding: '14px 16px' }}>₹{Number(s.baseSalary || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600 }}>
                      {s.presentDays}/{s.totalWorkingDays}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#ef4444' }}>-₹{Number(s.deductions || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', color: '#10b981' }}>+₹{Number(s.bonus || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#a5b4fc', fontSize: '1.05rem' }}>₹{Number(s.netSalary || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700, background: s.status === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: s.status === 'paid' ? '#10b981' : '#f59e0b' }}>
                      {s.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {s.status !== 'paid' && (
                        <button onClick={() => markPaid(s.id)} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} /> Pay
                        </button>
                      )}
                      <button onClick={() => setViewSlip(s)} style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileText size={14} /> Slip
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   EMPLOYEE PAYSLIP VIEW  (self-service)
──────────────────────────────────────────────── */
export function EmployeePayslipPanel({ currentUser }) {
  const [salaries, setSalaries] = useState([]);
  const [viewSlip, setViewSlip] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/salary/${currentUser.id}`)
      .then(r => setSalaries(r.data))
      .catch(console.error);
  }, [currentUser]);

  return (
    <div className="animate-fade">
      <PayslipModal slip={viewSlip ? { ...viewSlip, User: currentUser } : null} onClose={() => setViewSlip(null)} />
      <div className="glass-card" style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={22} color="#a5b4fc" /></div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>My Payslips</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Download or print your monthly payslips</p>
          </div>
        </div>

        {salaries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>No salary records yet. Contact HR.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {salaries.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(192,132,252,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="#a5b4fc" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Payslip — {s.month}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{s.presentDays}/{s.totalWorkingDays} days present</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#a5b4fc' }}>₹{Number(s.netSalary || 0).toLocaleString('en-IN')}</div>
                  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700, background: s.status === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: s.status === 'paid' ? '#10b981' : '#f59e0b' }}>{s.status?.toUpperCase()}</span>
                </div>
                <button onClick={() => setViewSlip(s)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  <Printer size={15} /> View Slip
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
