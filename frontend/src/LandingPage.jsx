import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Globe, LogIn, Building2, Users, Clock, Menu, X } from 'lucide-react';

const TN_HOLIDAYS_2026 = [
  { date: 'Jan 1', name: "New Year's Day" },
  { date: 'Jan 14', name: 'Pongal' },
  { date: 'Jan 15', name: 'Thiruvalluvar Day' },
  { date: 'Jan 16', name: 'Uzhavar Thirunal' },
  { date: 'Jan 26', name: 'Republic Day' },
  { date: 'Feb 19', name: 'Maha Shivaratri' },
  { date: 'Mar 31', name: 'Id-ul-Fitr (Ramzan)' },
  { date: 'Apr 10', name: 'Good Friday' },
  { date: 'Apr 14', name: 'Tamil New Year / Dr. Ambedkar Jayanti' },
  { date: 'May 1', name: 'May Day' },
  { date: 'Jun 7', name: 'Id-ul-Adha (Bakrid)' },
  { date: 'Aug 15', name: 'Independence Day' },
  { date: 'Aug 26', name: 'Muharram' },
  { date: 'Sep 4', name: 'Vinayagar Chaturthi' },
  { date: 'Oct 2', name: 'Gandhi Jayanti / Vijaya Dasami' },
  { date: 'Oct 20', name: "Milad-un-Nabi (Prophet's Birthday)" },
  { date: 'Nov 1', name: 'Deepavali' },
  { date: 'Dec 25', name: 'Christmas' },
];

const SG_HOLIDAYS_2026 = [
  { date: 'Jan 1', name: "New Year's Day" },
  { date: 'Feb 17', name: 'Chinese New Year (Day 1)' },
  { date: 'Feb 18', name: 'Chinese New Year (Day 2)' },
  { date: 'Mar 31', name: 'Hari Raya Puasa' },
  { date: 'Apr 3', name: 'Good Friday' },
  { date: 'May 1', name: 'Labour Day' },
  { date: 'May 12', name: 'Vesak Day' },
  { date: 'Jun 7', name: 'Hari Raya Haji' },
  { date: 'Aug 9', name: 'National Day' },
  { date: 'Oct 28', name: 'Deepavali' },
  { date: 'Dec 25', name: 'Christmas Day' },
];

export default function LandingPage({ onLoginClick }) {
  const [activeCalendar, setActiveCalendar] = useState('tn');
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Keyboard navigation & Focus trap inside mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && menuOpen && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    if (menuOpen) {
      document.body.classList.add('scroll-locked');
      document.addEventListener('keydown', handleKeyDown);
      const focusable = drawerRef.current?.querySelectorAll('button, [href]');
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    } else {
      document.body.classList.remove('scroll-locked');
    }

    return () => {
      document.body.classList.remove('scroll-locked');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const scrollToSection = (id) => {
    setMenuOpen(false);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* NAVBAR */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/logo1.jpg" alt="Novahamotechnologies" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <a href="https://novahamotech.com" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', background: 'linear-gradient(135deg,#a5b4fc,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Novahamotech</div>
            </a>
            <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase' }}>Employee Management System</div>
          </div>
        </div>

        {/* Center menu links for desktop */}
        <div className="landing-nav-links">
          <button className="landing-nav-link" onClick={() => scrollToSection('home')}>Home</button>
          <button className="landing-nav-link" onClick={() => scrollToSection('holidays')}>Holiday Calendar</button>
          <a href="mailto:support@novahamotech.com" className="landing-nav-link" style={{ textDecoration: 'none' }}>Support</a>
        </div>

        {/* Right content for desktop */}
        <div className="landing-nav-right">
          <button onClick={onLoginClick} className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '0.95rem' }}>
            <LogIn size={18} /> Login to Portal
          </button>
        </div>

        {/* Mobile Hamburger menu trigger */}
        <button 
          ref={menuButtonRef}
          className="landing-hamburger" 
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
        >
          <Menu size={26} />
        </button>
      </nav>

      {/* Full-screen Drawer Menu for Mobile */}
      <div 
        ref={drawerRef}
        className={`landing-drawer ${menuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        <div className="landing-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo1.jpg" alt="Logo" style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }} />
            <div style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#a5b4fc,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Novahamotech</div>
          </div>
          <button 
            className="landing-drawer-close" 
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={26} />
          </button>
        </div>

        <div className="landing-drawer-content">
          <button className="landing-drawer-link" onClick={() => scrollToSection('home')}>Home</button>
          <button className="landing-drawer-link" onClick={() => scrollToSection('holidays')}>Holiday Calendar</button>
          <a href="mailto:support@novahamotech.com" className="landing-drawer-link" style={{ textDecoration: 'none' }}>Support / Contact</a>
          
          <button onClick={() => { setMenuOpen(false); onLoginClick(); }} className="btn-premium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 24px', fontSize: '1.1rem', marginTop: '24px', width: '100%', minHeight: '48px' }}>
            <LogIn size={20} /> Login to Portal
          </button>
        </div>
      </div>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '80px 40px 60px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '100px', padding: '6px 20px', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '24px', letterSpacing: '1px' }}>
          🚀 ENTERPRISE GRADE HR PLATFORM
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.2 }}>
          <span style={{ background: 'linear-gradient(135deg,#a5b4fc 0%,#c084fc 50%,#f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Novahamotechnologies</span>
          <br /><span style={{ color: '#f8fafc', fontSize: '2.5rem' }}>EMS — Unified Workforce Portal</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          Attendance tracking, leave management, salary processing & payslips — all in one powerful platform for your entire organization.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onLoginClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg,#6366f1,#c084fc)', color: 'white', border: 'none', borderRadius: '12px', padding: '16px 36px', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 8px 30px rgba(99,102,241,0.45)' }}>
            <LogIn size={22} /> Access Your Portal
          </button>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '60px', flexWrap: 'wrap' }}>
          {[{ icon: <Users size={28} />, val: '500+', lbl: 'Employees Managed' }, { icon: <Clock size={28} />, val: '99.9%', lbl: 'Uptime Guaranteed' }, { icon: <Globe size={28} />, val: '2', lbl: 'Countries Supported' }, { icon: <Calendar size={28} />, val: '2026', lbl: 'Holiday Calendars' }].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px 36px', minWidth: '150px', textAlign: 'center' }}>
              <div style={{ color: '#a5b4fc', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{s.val}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOLIDAY CALENDAR */}
      <section id="holidays" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>📅 Holiday Calendar 2026</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Official public holidays for your region</p>
        </div>
        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
          {[{ key: 'tn', label: '🇮🇳 Tamil Nadu, India' }, { key: 'sg', label: '🇸🇬 Singapore' }].map(t => (
            <button key={t.key} onClick={() => setActiveCalendar(t.key)} style={{ padding: '10px 28px', borderRadius: '100px', border: activeCalendar === t.key ? 'none' : '1px solid rgba(255,255,255,0.1)', background: activeCalendar === t.key ? 'linear-gradient(135deg,#6366f1,#c084fc)' : 'rgba(255,255,255,0.04)', color: activeCalendar === t.key ? 'white' : '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(192,132,252,0.2))', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={22} color="#a5b4fc" />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>{activeCalendar === 'tn' ? 'Tamil Nadu Public Holidays 2026' : 'Singapore Public Holidays 2026'}</span>
            <span style={{ marginLeft: 'auto', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', borderRadius: '100px', padding: '4px 14px', fontSize: '0.8rem', fontWeight: 600 }}>{(activeCalendar === 'tn' ? TN_HOLIDAYS_2026 : SG_HOLIDAYS_2026).length} Holidays</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            {(activeCalendar === 'tn' ? TN_HOLIDAYS_2026 : SG_HOLIDAYS_2026).map((h, i) => (
              <div key={i} style={{ background: '#0f172a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}>
                <div style={{ minWidth: '56px', background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(192,132,252,0.15))', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h.date.split(' ')[0]}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{h.date.split(' ')[1]}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{h.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>2026</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px', textAlign: 'center', color: '#334155', fontSize: '0.85rem' }}>
        © 2026 Novahamotechnologies · All Rights Reserved · Employee Management System
      </footer>
    </div>
  );
}
