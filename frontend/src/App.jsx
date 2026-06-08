import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import axios from 'axios';
import {
  LogOut, Clock, Calendar, User, Shield, CheckCircle, XCircle, Users,
  LayoutDashboard, FileText, Briefcase, UserPlus, FileSpreadsheet,
  ListTodo, Activity, FolderGit2, DollarSign, Printer
} from 'lucide-react';
import LandingPage from './LandingPage';
import { AdminSalaryPanel, EmployeePayslipPanel } from './SalaryPanel';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Existing state definitions continue...

  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminLeaves, setAdminLeaves] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [leaveForm, setLeaveForm] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'employee', department: 'General', baseSalary: 30000 });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', internId: '' });
  const [feedbackForm, setFeedbackForm] = useState('');
  const [workLinkForm, setWorkLinkForm] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setShowLanding(false);
    } catch { setError('Invalid email or password'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveTab('dashboard');
    setShowLanding(true);
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      const [attRes, leavesRes] = await Promise.all([
        axios.get(`${API_BASE}/attendance/${user.id}`),
        axios.get(`${API_BASE}/leaves/${user.id}`).catch(() => ({ data: [] }))
      ]);
      setAttendance(attRes.data);
      setLeaves(leavesRes.data);

      if (['admin', 'hr', 'team_lead'].includes(user.role)) {
        const statsRes = await axios.get(`${API_BASE}/admin/stats`);
        const leavesAllRes = await axios.get(`${API_BASE}/admin/leaves`);
        const usersRes = await axios.get(`${API_BASE}/users`);
        setAdminStats(statsRes.data);
        setAdminLeaves(leavesAllRes.data);
        setAllUsers(usersRes.data);
      }
      if (user.role === 'team_lead') {
        const tsks = await axios.get(`${API_BASE}/tasks?teamLeadId=${user.id}`);
        setTasks(tsks.data);
      } else if (user.role === 'intern') {
        const tsks = await axios.get(`${API_BASE}/tasks?internId=${user.id}`);
        setTasks(tsks.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) { setUser(JSON.parse(savedUser)); setShowLanding(false); }
  }, []);

  useEffect(() => { if (user) fetchData(); }, [user, activeTab]);

  const handleCheck = async (type) => {
    try {
      await axios.post(`${API_BASE}/attendance/check`, { userId: user.id, type });
      alert(`Successfully clocked ${type}!`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error occurred'); }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/leaves/request`, { ...leaveForm, userId: user.id });
      setLeaveForm({ type: 'sick', startDate: '', endDate: '', reason: '' });
      alert('Leave requested successfully'); fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error occurred'); }
  };

  const handleLeaveAction = async (id, status) => {
    try { await axios.put(`${API_BASE}/leaves/${id}/status`, { status }); fetchData(); }
    catch { alert('Failed updating leave'); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/users`, userForm);
      alert('User added!');
      setUserForm({ name: '', email: '', password: '', role: 'employee', department: 'General', baseSalary: 30000 });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Failed creating user'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete user?')) return;
    try { await axios.delete(`${API_BASE}/users/${id}`); fetchData(); }
    catch { alert('Failed to delete'); }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/tasks`, { ...taskForm, teamLeadId: user.id });
      alert('Task Assigned!');
      setTaskForm({ title: '', description: '', internId: '' }); fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleUpdateTaskStatus = async (id, payload) => {
    try {
      await axios.put(`${API_BASE}/tasks/${id}`, payload);
      alert('Task updated!');
      setWorkLinkForm(''); setFeedbackForm(''); fetchData();
    } catch { alert('Error updating task'); }
  };

  // ── SHOW LANDING PAGE ──
  if (showLanding && !user) {
    return <LandingPage onLoginClick={() => setShowLanding(false)} />;
  }

  // ── LOGIN FORM ──
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="glass-card animate-fade" style={{ width: 420, padding: '48px 40px' }}>
          <button onClick={() => setShowLanding(true)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 24, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Home
          </button>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo1.jpg" alt="Novahamotechnologies" style={{ width: 64, height: 64, borderRadius: '16px', objectFit: 'cover', marginBottom: '16px' }} />
            <div style={{ fontWeight: 900, fontSize: '1.5rem', background: 'linear-gradient(135deg,#a5b4fc,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>Novahamotechnologies EMS</div>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Sign in to your workspace</p>
          </div>
          {error && <div style={{ color: '#ef4444', marginBottom: 16, textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: 8 }}>{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="admin@attendance.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-premium" disabled={loading} style={{ width: '100%', padding: 14, fontSize: '1rem', marginTop: 8 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: '12px', color: '#475569', lineHeight: 1.7 }}>
            Demo: <strong>admin@ · hr@</strong>
          </div>
        </div>
      </div>
    );
  }

  // ── SIDEBAR BUTTON ──
  const SidebarBtn = ({ tab, icon, label }) => (
    <button onClick={() => setActiveTab(tab)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', width: '100%', background: activeTab === tab ? 'linear-gradient(135deg,#6366f1,#c084fc)' : 'transparent', color: activeTab === tab ? 'white' : '#64748b', cursor: 'pointer', marginBottom: 4, padding: '12px 16px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', textAlign: 'left' }}>
      {icon} <span>{label}</span>
    </button>
  );

  // ── MAIN DASHBOARD ──
  return (
    <div className="dashboard-layout">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Toggle navigation">
        <Menu size={24} color="var(--text-primary)" />
      </button>
      {/* Sidebar */}
      <aside className={`sidebar glass-card ${sidebarOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '28px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo1.jpg" alt="Logo" style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', background: 'linear-gradient(135deg,#a5b4fc,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Novahamotechnologies</div>
            <div style={{ fontSize: '0.65rem', color: '#334155', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>EMS Platform</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          {user.role === 'admin' && (<>
            <SidebarBtn tab="dashboard" icon={<Shield size={18} />} label="Admin Hub" />
            <SidebarBtn tab="users" icon={<Users size={18} />} label="Manage Users" />
            <SidebarBtn tab="leaves_admin" icon={<FileText size={18} />} label="Leave Board" />
            <SidebarBtn tab="salary" icon={<DollarSign size={18} />} label="Salary & Payroll" />
            <SidebarBtn tab="activity" icon={<Activity size={18} />} label="System Logs" />
          </>)}
          {user.role === 'hr' && (<>
            <SidebarBtn tab="dashboard" icon={<Shield size={18} />} label="HR Dashboard" />
            <SidebarBtn tab="users" icon={<Users size={18} />} label="Employee Records" />
            <SidebarBtn tab="leaves_admin" icon={<FileText size={18} />} label="Leave Approvals" />
            <SidebarBtn tab="salary" icon={<DollarSign size={18} />} label="Salary & Payroll" />
            <SidebarBtn tab="activity" icon={<CheckCircle size={18} />} label="Attendance Log" />
          </>)}
          {user.role === 'team_lead' && (<>
            <SidebarBtn tab="dashboard" icon={<Briefcase size={18} />} label="Lead Center" />
            <SidebarBtn tab="assign_tasks" icon={<UserPlus size={18} />} label="Assign Tasks" />
            <SidebarBtn tab="team_progress" icon={<FolderGit2 size={18} />} label="Team Progress" />
            <SidebarBtn tab="leaves_me" icon={<Calendar size={18} />} label="My Leaves" />
            <SidebarBtn tab="payslip" icon={<Printer size={18} />} label="My Payslip" />
          </>)}
          {user.role === 'intern' && (<>
            <SidebarBtn tab="dashboard" icon={<LayoutDashboard size={18} />} label="Intern Portal" />
            <SidebarBtn tab="my_tasks" icon={<ListTodo size={18} />} label="Assigned Tasks" />
            <SidebarBtn tab="leaves_me" icon={<Calendar size={18} />} label="My Leaves" />
            <SidebarBtn tab="payslip" icon={<Printer size={18} />} label="My Payslip" />
          </>)}
          {user.role === 'employee' && (<>
            <SidebarBtn tab="dashboard" icon={<LayoutDashboard size={18} />} label="My Dashboard" />
            <SidebarBtn tab="leaves_me" icon={<Calendar size={18} />} label="My Leaves" />
            <SidebarBtn tab="payslip" icon={<Printer size={18} />} label="My Payslip" />
          </>)}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color="white" /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, margin: '0 0 4px' }}>Welcome, {user.name}!</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="glass-card" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} color="#a5b4fc" />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        {/* ─── DASHBOARD ─── */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade">
            <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 16px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Attendance</h3>
              <div style={{ display: 'flex', gap: 16 }}>
                <button onClick={() => handleCheck('in')} className="btn-premium" style={{ flex: 1, padding: 20, fontSize: '1rem' }}>Clock <span style={{ color: '#10b981' }}>IN</span></button>
                <button onClick={() => handleCheck('out')} className="btn-premium" style={{ flex: 1, padding: 20, fontSize: '1rem', background: 'rgba(255,255,255,0.04)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>Clock <span style={{ color: '#ef4444' }}>OUT</span></button>
              </div>
            </div>
            {['admin', 'hr', 'team_lead'].includes(user.role) ? (
              <div className="stats-grid">
                {[
                  { icon: <Users size={24} />, label: 'Total Staff', val: adminStats?.totalUsers || 0, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                  { icon: <CheckCircle size={24} />, label: 'Present Today', val: adminStats?.presentToday || 0, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                  { icon: <FileSpreadsheet size={24} />, label: 'Pending Leaves', val: adminStats?.pendingLeaves || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                  { icon: <DollarSign size={24} />, label: 'Pending Salary', val: `₹${Number(adminStats?.totalSalaryPending || 0).toLocaleString('en-IN')}`, color: '#a5b4fc', bg: 'rgba(165,180,252,0.1)' },
                ].map((s, i) => (
                  <div key={i} className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ fontSize: typeof s.val === 'string' ? '1.4rem' : '2rem' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}><Calendar size={24} /></div>
                  <div className="stat-label">Days Present (Month)</div>
                  <div className="stat-value">{attendance.length}</div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><FileText size={24} /></div>
                  <div className="stat-label">Leave Requests</div>
                  <div className="stat-value">{leaves.length}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── USER MANAGEMENT ─── */}
        {activeTab === 'users' && ['admin', 'hr'].includes(user.role) && (
          <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
            <div className="glass-card" style={{ padding: 32, height: 'max-content' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Add Employee</h3>
              <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['name', 'email', 'password'].map(field => (
                  <div key={field} className="input-group">
                    <label style={{ textTransform: 'capitalize' }}>{field === 'name' ? 'Full Name' : field === 'email' ? 'Email ID' : 'Password'}</label>
                    <input type={field === 'email' ? 'email' : field === 'password' ? 'password' : 'text'} required value={userForm[field]} onChange={e => setUserForm({ ...userForm, [field]: e.target.value })} />
                  </div>
                ))}
                <div className="input-group">
                  <label>Role</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                    <option value="employee" style={{ color: 'black' }}>Employee</option>
                    <option value="intern" style={{ color: 'black' }}>Intern</option>
                    {user.role === 'admin' && <><option value="team_lead" style={{ color: 'black' }}>Team Lead</option><option value="hr" style={{ color: 'black' }}>HR Manager</option></>}
                  </select>
                </div>
                <div className="input-group">
                  <label>Base Salary (₹/month)</label>
                  <input type="number" value={userForm.baseSalary} onChange={e => setUserForm({ ...userForm, baseSalary: e.target.value })} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 16px', borderRadius: 8 }} />
                </div>
                <button type="submit" className="btn-premium">Register User</button>
              </form>
            </div>
            <div className="glass-card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>All Employees</h3>
              <table style={{ width: '100%' }}>
                <thead><tr>{['Name', 'Email', 'Role', 'Dept', 'Base Salary', 'Action'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {allUsers.map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 14 }}>{u.name}</td>
                      <td style={{ padding: 14, color: '#64748b', fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ padding: 14, textTransform: 'capitalize' }}>{u.role?.replace('_', ' ')}</td>
                      <td style={{ padding: 14 }}>{u.department}</td>
                      <td style={{ padding: 14, color: '#a5b4fc', fontWeight: 600 }}>₹{Number(u.baseSalary || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: 14 }}>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── SALARY (Admin / HR) ─── */}
        {activeTab === 'salary' && ['admin', 'hr'].includes(user.role) && (
          <AdminSalaryPanel currentUser={user} />
        )}

        {/* ─── PAYSLIP (Employee self-service) ─── */}
        {activeTab === 'payslip' && (
          <EmployeePayslipPanel currentUser={user} />
        )}

        {/* ─── TASKS (Team Lead: Assign) ─── */}
        {activeTab === 'assign_tasks' && user.role === 'team_lead' && (
          <div className="animate-fade glass-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Assign Task to Intern</h3>
            <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
              <div className="input-group">
                <label>Assign to Intern</label>
                <select required value={taskForm.internId} onChange={e => setTaskForm({ ...taskForm, internId: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                  <option value="" style={{ color: 'black' }}>-- Select Intern --</option>
                  {allUsers.filter(u => u.role === 'intern').map(intr => <option key={intr.id} value={intr.id} style={{ color: 'black' }}>{intr.name}</option>)}
                </select>
              </div>
              <div className="input-group"><label>Task Title</label><input type="text" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
              <div className="input-group">
                <label>Description</label>
                <textarea rows="3" required value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, resize: 'none' }} />
              </div>
              <button type="submit" className="btn-premium">Assign Task 🚀</button>
            </form>
          </div>
        )}

        {/* ─── TASKS VIEW (Intern / Team Lead) ─── */}
        {(activeTab === 'my_tasks' || activeTab === 'team_progress') && ['team_lead', 'intern'].includes(user.role) && (
          <div className="animate-fade glass-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>{user.role === 'team_lead' ? 'Team Workflows' : 'My Tasks'}</h3>
            <table style={{ width: '100%' }}>
              <thead><tr>{['Task', user.role === 'team_lead' ? 'Intern' : null, 'Status', 'Link', 'Feedback', 'Action'].filter(Boolean).map(h => <th key={h} style={{ padding: '12px 16px' }}>{h}</th>)}</tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px' }}><strong>{t.title}</strong><br /><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.description}</span></td>
                    {user.role === 'team_lead' && <td style={{ padding: '14px 16px' }}>{t.Intern?.name}</td>}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: '0.78rem', background: t.status === 'Completed' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: t.status === 'Completed' ? '#10b981' : '#a5b4fc' }}>{t.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{t.workLink ? <a href={t.workLink} target="_blank" style={{ color: '#a5b4fc' }}>View</a> : '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{t.feedback || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {user.role === 'intern' && t.status !== 'Completed' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input type="text" placeholder="GitHub URL" value={workLinkForm} onChange={e => setWorkLinkForm(e.target.value)} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem' }} />
                          <button onClick={() => handleUpdateTaskStatus(t.id, { workLink: workLinkForm, status: 'Submitted' })} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontSize: '0.8rem' }}>Submit</button>
                        </div>
                      )}
                      {user.role === 'team_lead' && t.status === 'Submitted' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input type="text" placeholder="Feedback" value={feedbackForm} onChange={e => setFeedbackForm(e.target.value)} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem' }} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => handleUpdateTaskStatus(t.id, { feedback: feedbackForm, status: 'Completed' })} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Accept</button>
                            <button onClick={() => handleUpdateTaskStatus(t.id, { feedback: feedbackForm, status: 'Revision needed' })} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Revise</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No tasks found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── LEAVES (Self-apply) ─── */}
        {activeTab === 'leaves_me' && (
          <div className="animate-fade glass-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Apply for Leave</h3>
            <form onSubmit={submitLeave} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560, marginBottom: 40 }}>
              <div className="input-group">
                <label>Leave Type</label>
                <select required value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                  <option value="sick" style={{ color: 'black' }}>Sick Leave</option>
                  <option value="casual" style={{ color: 'black' }}>Casual Leave</option>
                  <option value="vacation" style={{ color: 'black' }}>Vacation</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-group" style={{ flex: 1 }}><label>From</label><input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ colorScheme: 'dark' }} /></div>
                <div className="input-group" style={{ flex: 1 }}><label>To</label><input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ colorScheme: 'dark' }} /></div>
              </div>
              <div className="input-group"><label>Reason</label><textarea required rows="2" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, resize: 'none' }} /></div>
              <button type="submit" className="btn-premium">Submit Leave Request</button>
            </form>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Leave History</h3>
            <table style={{ width: '100%' }}>
              <tbody>
                {leaves.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 12, textTransform: 'capitalize' }}>{l.type}</td>
                    <td style={{ padding: 12, color: '#64748b' }}>{l.startDate} → {l.endDate}</td>
                    <td style={{ padding: 12 }}><span style={{ color: l.status === 'approved' ? '#10b981' : l.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{l.status?.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── LEAVES ADMIN ─── */}
        {activeTab === 'leaves_admin' && ['admin', 'hr'].includes(user.role) && (
          <div className="animate-fade glass-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Leave Authorization Queue</h3>
            <table style={{ width: '100%' }}>
              <thead><tr>{['Employee', 'Type', 'Duration', 'Status', 'Action'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 16px' }}>{h}</th>)}</tr></thead>
              <tbody>
                {adminLeaves.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{l.User?.name}</td>
                    <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>{l.type}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{l.startDate} → {l.endDate}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ color: l.status === 'approved' ? '#10b981' : l.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{l.status?.toUpperCase()}</span></td>
                    <td style={{ padding: '14px 16px' }}>
                      {l.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleLeaveAction(l.id, 'approved')} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                          <button onClick={() => handleLeaveAction(l.id, 'rejected')} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Reject</button>
                        </div>
                      ) : <span style={{ color: '#475569' }}>Processed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── ACTIVITY LOGS ─── */}
        {activeTab === 'activity' && ['admin', 'hr'].includes(user.role) && (
          <div className="animate-fade glass-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Attendance Logs</h3>
            <table style={{ width: '100%' }}>
              <thead><tr>{['Employee', 'Date', 'Clock In', 'Clock Out'].map(h => <th key={h} style={{ padding: '12px 16px' }}>{h}</th>)}</tr></thead>
              <tbody>
                {adminStats?.records?.map((rec, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px' }}>{rec.User?.name}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{rec.date}</td>
                    <td style={{ padding: '14px 16px' }}>{rec.clockIn}</td>
                    <td style={{ padding: '14px 16px', color: rec.clockOut ? '#f8fafc' : '#f59e0b' }}>{rec.clockOut || 'Still Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
