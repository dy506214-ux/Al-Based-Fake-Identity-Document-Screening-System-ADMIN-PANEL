import React, { useState, useEffect } from 'react'
import type { PageType, BackendUser } from '../types'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  AppNotification
} from '../services/notificationService'

interface LayoutProps {
  currentPage: PageType
  navSelection: string
  onNavigate: (p: PageType, nav: string) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onLogout: () => void
  currentUser: BackendUser | null
  children: React.ReactNode
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Officers',
  documents: 'Documents',
  verification: 'Document Verification',
  review: 'Document Review',
  history: 'Verification History',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'Admin Profile',
}

/* ── Ashoka Chakra icon ─────────────────────────── */
const ChakraIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" stroke="#FF9933" strokeWidth="1.5" opacity="0.55"/>
    <circle cx="24" cy="24" r="8" stroke="#FF9933" strokeWidth="1.5" opacity="0.75"/>
    {Array.from({length:24},(_,i)=>{
      const a=(i/24)*2*Math.PI, x1=24+10*Math.cos(a), y1=24+10*Math.sin(a), x2=24+22*Math.cos(a), y2=24+22*Math.sin(a)
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF9933" strokeWidth="0.7" opacity="0.45"/>
    })}
    <circle cx="24" cy="24" r="3" fill="#FF9933" opacity="0.8"/>
  </svg>
)

/* ── SVG nav icons ──────────────────────────────── */
const Icons: Record<string, React.ReactElement> = {
  dashboard: <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/></svg>,
  users:     <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><circle cx="5.5" cy="5" r="2.5"/><path d="M1 13c0-2.76 2.24-5 4.5-5s4.5 2.24 4.5 5"/><circle cx="11.5" cy="5" r="2" opacity=".55"/><path d="M11.5 9c1.66 0 3 1.34 3 3" opacity=".55"/></svg>,
  documents: <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M3 1.5h6l3 3v9H3V1.5z" opacity=".8"/><path d="M9 1.5v3h3" fill="none" stroke="currentColor" strokeWidth="1"/><line x1="5" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1" fill="none"/><line x1="5" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1" fill="none"/><line x1="5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1" fill="none"/></svg>,
  verification: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M7.5 1.5L9.5 6H14L10.5 8.5L12 13L7.5 10L3 13L4.5 8.5L1 6H5.5L7.5 1.5Z"/></svg>,
  history:   <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7.5" cy="7.5" r="5.5"/><polyline points="7.5,4 7.5,7.5 10,9.5"/></svg>,
  bell:      <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1A4.5 4.5 0 0 0 3 5.5v3L2 10v.5h11V10L12 8.5v-3A4.5 4.5 0 0 0 7.5 1z"/><path d="M6 11.5a1.5 1.5 0 0 0 3 0"/></svg>,
  settings:  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" opacity=".8"/><path d="M6.2 1.5H8.8l.5 1.5L11 2.4l1.8 1.8-.6 1.5L13.5 6v2.8l-1.5.5.6 1.5-1.8 1.8-1.5-.6-.5 1.5H6.2l-.5-1.5-1.5.6L2.4 11l.6-1.5L1.5 9V6.2l1.5-.5-.6-1.5 1.8-1.8 1.5.6z" opacity=".45"/></svg>,
  profile:   <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><circle cx="7.5" cy="5" r="3"/><path d="M1 14c0-3.31 2.94-6 6.5-6s6.5 2.69 6.5 6"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5.5 13H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2.5M10 11l3-3-3-3M13 7.5H6"/></svg>,
}

interface NavRow { navId: string; pageId: PageType; iconKey: string; label: string; group: 'MAIN'|'SYSTEM' }

const navRows: NavRow[] = [
  { navId:'dashboard',     pageId:'dashboard',     iconKey:'dashboard',      label:'Dashboard',            group:'MAIN' },
  { navId:'users',         pageId:'users',          iconKey:'users',          label:'Officers',             group:'MAIN' },
  { navId:'documents',     pageId:'documents',      iconKey:'documents',      label:'Documents',            group:'MAIN' },
  { navId:'verification',  pageId:'verification',   iconKey:'verification',   label:'Verification',         group:'MAIN' },
  { navId:'history',       pageId:'history',        iconKey:'history',        label:'Verification History', group:'MAIN' },
  { navId:'notifications', pageId:'notifications',  iconKey:'bell',           label:'Notifications',        group:'SYSTEM' },
  { navId:'settings',      pageId:'settings',       iconKey:'settings',       label:'Settings',             group:'SYSTEM' },
  { navId:'profile',       pageId:'profile',        iconKey:'profile',        label:'Profile',              group:'SYSTEM' },
]

/* ── Notifications panel ────────────────────────── */
const NotificationsPanel = ({ onClose, onNavigate }: { onClose: () => void; onNavigate: (p: PageType, nav: string) => void }) => {
  const [items, setItems] = useState<AppNotification[]>([])

  const load = () => setItems(getNotifications())

  useEffect(() => {
    load()
    const handleUpdate = () => load()
    window.addEventListener('notifications:updated', handleUpdate)
    return () => window.removeEventListener('notifications:updated', handleUpdate)
  }, [])

  const unreadCount = items.filter(n => !n.read).length

  const getColor = (type: string) => {
    if (type === 'CRITICAL') return '#c87878'
    if (type === 'SUSPICIOUS') return '#cc9944'
    if (type === 'VERIFIED') return '#68c87a'
    if (type === 'SYSTEM') return '#b5c070'
    return '#7899cc'
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:49 }}/>
      <div className="animate-fade-in" style={{ position:'fixed', right:12, top:58, width:360, maxWidth:'calc(100vw - 24px)', background:'#141810', border:'1px solid rgba(74,90,42,0.35)', borderRadius:10, zIndex:50, boxShadow:'0 12px 48px rgba(0,0,0,0.7)', overflow:'hidden' }}>
        <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid rgba(74,90,42,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', display:'flex', alignItems:'center', gap:8 }}>
              <span>Live Alerts</span>
              {unreadCount > 0 && (
                <span style={{ fontSize:10, fontWeight:700, background:'#FF9933', color:'#060803', padding:'1px 6px', borderRadius:10 }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ fontSize:10, color:'#5a6a40', marginTop:2 }}>Real-time verification &amp; screening feed</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#5a6a40', padding:4 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>
          </button>
        </div>
        <div style={{ maxHeight:360, overflowY:'auto' }}>
          {items.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', color:'#5a6a40', fontSize:12 }}>
              No notifications yet.
            </div>
          ) : (
            items.slice(0, 8).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  markAsRead(item.id)
                  if (item.targetPage) {
                    onNavigate(item.targetPage, item.targetNav || item.targetPage)
                    onClose()
                  }
                }}
                style={{
                  padding:'12px 16px',
                  borderBottom:'1px solid rgba(74,90,42,0.1)',
                  display:'flex',
                  gap:12,
                  alignItems:'flex-start',
                  cursor:'pointer',
                  background: item.read ? 'transparent' : 'rgba(74,90,42,0.12)',
                  transition:'background 0.12s'
                }}
                onMouseOver={e=>(e.currentTarget.style.background='rgba(74,90,42,0.18)')}
                onMouseOut={e=>(e.currentTarget.style.background=item.read?'transparent':'rgba(74,90,42,0.12)')}
              >
                <div style={{ width:8, height:8, borderRadius:'50%', background:getColor(item.type), marginTop:5, flexShrink:0, boxShadow: !item.read ? `0 0 6px ${getColor(item.type)}` : 'none' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight: item.read ? 500 : 700, color:'#d0c8b8', lineHeight:1.3 }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'#8a9a68', marginTop:3, lineHeight:1.4 }}>{item.message}</div>
                  <div style={{ fontSize:9, color:'#4a5a30', marginTop:4 }}>{new Date(item.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(74,90,42,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={markAllAsRead} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#8b9a5a', fontWeight:600 }}>Mark all as read</button>
          <button
            onClick={() => { onNavigate('notifications', 'notifications'); onClose(); }}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#FF9933', fontWeight:700 }}
          >
            View All Notifications →
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Profile page ───────────────────────────────── */
const getInitials = (name: string) => name ? name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'

const PRESET_AVATARS = [
  { id: 'officer_gold', label: 'Senior Officer', icon: '🎖️', bg: 'linear-gradient(135deg, #FF9933, #784010)' },
  { id: 'cyber_shield', label: 'Cyber Security', icon: '🛡️', bg: 'linear-gradient(135deg, #3a8a48, #103018)' },
  { id: 'ai_specialist', label: 'AI Forensics', icon: '👁️', bg: 'linear-gradient(135deg, #4f6128, #232a12)' },
  { id: 'national_emissary', label: 'Central Emissary', icon: '🇮🇳', bg: 'linear-gradient(135deg, #e88020, #138808)' },
  { id: 'directorate', label: 'Super Admin', icon: '⚡', bg: 'linear-gradient(135deg, #7899cc, #1a2a48)' },
  { id: 'vanguard', label: 'Tactical Vanguard', icon: '🦁', bg: 'linear-gradient(135deg, #cc9944, #3a2808)' },
]

export const ProfilePage = ({ currentUser }: { currentUser: BackendUser | null }) => {
  const name = currentUser?.name || currentUser?.email || 'Dhirendra'
  const initials = getInitials(name)
  
  const [avatar, setAvatar] = useState<string | null>(() => {
    return localStorage.getItem('admin_avatar') || (currentUser as any)?.avatar || null
  })
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handleUpdate = () => {
      setAvatar(localStorage.getItem('admin_avatar'))
    }
    window.addEventListener('user:profile_updated', handleUpdate)
    return () => window.removeEventListener('user:profile_updated', handleUpdate)
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please choose a smaller photo.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        localStorage.setItem('admin_avatar', dataUrl)
        setAvatar(dataUrl)
        window.dispatchEvent(new Event('user:profile_updated'))
        setSuccessMsg('Profile picture updated successfully!')
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSelectPreset = (preset: typeof PRESET_AVATARS[0]) => {
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#141810"/><circle cx="60" cy="60" r="56" fill="none" stroke="#FF9933" stroke-width="4"/><text x="60" y="74" font-size="48" text-anchor="middle">${preset.icon}</text></svg>`
    const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`
    localStorage.setItem('admin_avatar', encoded)
    setAvatar(encoded)
    window.dispatchEvent(new Event('user:profile_updated'))
    setShowPresetModal(false)
    setSuccessMsg(`Preset avatar "${preset.label}" applied!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleRemoveAvatar = () => {
    localStorage.removeItem('admin_avatar')
    setAvatar(null)
    window.dispatchEvent(new Event('user:profile_updated'))
    setSuccessMsg('Profile picture removed. Initials restored.')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  return (
    <div style={{ padding:'16px', maxWidth:680, margin:'0 auto' }}>
      <h1 style={{ fontSize:18, fontWeight:700, color:'#e8e0d0', margin:'0 0 16px' }}>Admin Profile</h1>

      {successMsg && (
        <div style={{ padding:'10px 14px', background:'rgba(58,138,72,0.15)', border:'1px solid rgba(58,138,72,0.35)', borderRadius:6, color:'#68c87a', fontSize:12, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background:'none', border:'none', color:'#68c87a', cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Profile Card */}
      <div className="card-2" style={{ borderRadius:10, padding:'24px 20px', marginBottom:16 }}>
        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display:'none' }}
          onChange={handleFileUpload}
        />

        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24, flexWrap:'wrap' }}>
          {/* Avatar Container with Camera Badge Overlay */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position:'relative',
              width:76,
              height:76,
              borderRadius:'50%',
              cursor:'pointer',
              flexShrink:0,
              boxShadow:'0 0 16px rgba(255,153,51,0.25)',
              border:'2px solid #FF9933',
              overflow:'hidden',
              background:'linear-gradient(135deg,#4f6128,#2a3218)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center'
            }}
            title="Click to change profile picture"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Profile Avatar"
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
              />
            ) : (
              <span style={{ fontSize:26, fontWeight:800, color:'#e8e0d0' }}>
                {initials}
              </span>
            )}

            {/* Hover / Touch Camera Overlay */}
            <div
              style={{
                position:'absolute',
                inset:0,
                background: isHovered ? 'rgba(0,0,0,0.6)' : 'transparent',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                transition:'all 0.2s ease',
                opacity: isHovered ? 1 : 0
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9933" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>

            {/* Bottom-right Camera Icon Badge */}
            <div
              style={{
                position:'absolute',
                bottom:2,
                right:2,
                width:20,
                height:20,
                borderRadius:'50%',
                background:'#FF9933',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                boxShadow:'0 2px 6px rgba(0,0,0,0.6)',
                border:'1px solid #080a05'
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#080a05">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4" fill="#FF9933"/>
              </svg>
            </div>
          </div>

          {/* User Details & Action Buttons */}
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <div style={{ fontSize:19, fontWeight:700, color:'#e8e0d0' }}>{name}</div>
              <span className="badge-verified" style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, display:'inline-flex', alignItems:'center', gap:4 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#68c87a' }}/>
                Active Session
              </span>
            </div>
            <div style={{ fontSize:12, color:'#FF9933', marginTop:3, fontWeight:600, letterSpacing:'0.06em' }}>
              {currentUser?.role || 'SUPER_ADMIN'}
            </div>

            {/* Photo Action Buttons */}
            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                style={{ padding:'6px 12px', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setShowPresetModal(true)}
                className="btn-ghost"
                style={{ padding:'6px 12px', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer', color:'#FF9933', border:'1px solid rgba(255,153,51,0.3)', display:'flex', alignItems:'center', gap:5 }}
              >
                ✨ Choose Preset
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="btn-ghost"
                  style={{ padding:'6px 12px', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer', color:'#c87878', border:'1px solid rgba(200,120,120,0.3)', display:'flex', alignItems:'center', gap:5 }}
                >
                  ✕ Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:10 }}>
          {[
            ['Admin ID', currentUser?._id ? currentUser._id.substring(0,8).toUpperCase() : 'DOC-ADM-9941'],
            ['Email', currentUser?.email || 'dhirendra@admin.com'],
            ['Role', currentUser?.role || 'SUPER_ADMIN'],
            ['Department', currentUser?.department || 'Document Verification Directorate'],
            ['Account Created', currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Verified'],
            ['Session Status', 'Online / Encrypted (256-bit TLS)']
          ].map(([l,v]) => (
            <div key={l} style={{ background:'rgba(42,50,24,0.4)', borderRadius:6, padding:'10px 12px', border:'1px solid rgba(74,90,42,0.15)', overflow:'hidden' }}>
              <div style={{ fontSize:9, color:'#4a5a30', fontWeight:600, letterSpacing:'0.06em', marginBottom:3 }}>{l.toUpperCase()}</div>
              <div style={{ fontSize:11, color:'#c8c0b0', fontWeight:500, wordBreak:'break-word' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="card-1" style={{ borderRadius:10, padding:'16px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:12 }}>Activity Summary</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:10 }}>
          {[['Documents Reviewed','142','#b5c070'],['Approved / Verified','128','#68c87a'],['Suspicious Flagged','14','#c87878']].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:'center', padding:'12px', background:`${c}12`, borderRadius:6, border:`1px solid ${c}25` }}>
              <div style={{ fontSize:20, fontWeight:800, color:String(c) }}>{v}</div>
              <div style={{ fontSize:10, color:'#5a6a40', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preset Avatars Selection Modal */}
      {showPresetModal && (
        <div
          onClick={() => setShowPresetModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:14 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card-1 animate-fade-in"
            style={{ width:'100%', maxWidth:440, borderRadius:10, padding:'24px 20px', background:'#11140c', border:'1px solid rgba(74,90,42,0.35)', boxShadow:'0 16px 64px rgba(0,0,0,0.85)' }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <h3 style={{ margin:0, fontSize:15, color:'#e8e0d0', fontWeight:700 }}>Choose Preset Avatar</h3>
                <p style={{ margin:'3px 0 0', fontSize:11, color:'#6a7a48' }}>Select an official badge or emblem for your admin profile</p>
              </div>
              <button
                onClick={() => setShowPresetModal(false)}
                style={{ background:'none', border:'none', color:'#7a8a58', cursor:'pointer', padding:4 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
              </button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:10, marginBottom:16 }}>
              {PRESET_AVATARS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    padding:'14px 10px',
                    borderRadius:8,
                    background:'rgba(42,50,24,0.4)',
                    border:'1px solid rgba(74,90,42,0.25)',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    gap:8,
                    cursor:'pointer',
                    transition:'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF9933'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(74,90,42,0.25)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ width:44, height:44, borderRadius:'50%', background:p.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 4px 12px rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.2)' }}>
                    {p.icon}
                  </div>
                  <span style={{ fontSize:10, fontWeight:600, color:'#e8e0d0', textAlign:'center', lineHeight:1.2 }}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowPresetModal(false)}
                style={{ padding:'6px 14px', borderRadius:5, fontSize:12, cursor:'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Settings page ──────────────────────────────── */
export const SettingsPage = () => {
  const [settings, setSettings] = useState({ autoNotify:true, twoFactor:true, sessionLog:true, aiScan:true, emailAlerts:false, darkMode:true, strictMode:false, apiAccess:true })
  const toggle = (k: keyof typeof settings) => setSettings(s => ({ ...s, [k]: !s[k] }))

  const Toggle = ({ id, label, desc }: { id: keyof typeof settings; label: string; desc: string }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(74,90,42,0.12)', gap:12 }}>
      <div>
        <div style={{ fontSize:12, color:'#d0c8b8', fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:10, color:'#4a5a30', marginTop:2 }}>{desc}</div>
      </div>
      <div onClick={() => toggle(id)} style={{ width:38, height:20, borderRadius:10, background:settings[id]?'#4f6128':'rgba(42,50,24,0.6)', border:'1px solid rgba(74,90,42,0.35)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ width:14, height:14, borderRadius:'50%', background:'#e8e0d0', position:'absolute', top:2, left:settings[id]?20:2, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }}/>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'16px', maxWidth:680, margin:'0 auto' }}>
      <h1 style={{ fontSize:18, fontWeight:700, color:'#e8e0d0', margin:'0 0 16px' }}>Settings</h1>
      <div className="card-2" style={{ borderRadius:10, padding:'18px 16px', marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#FF9933', marginBottom:3, letterSpacing:'0.06em' }}>SECURITY</div>
        <div style={{ fontSize:10, color:'#4a5a30', marginBottom:12 }}>Authentication and access control settings</div>
        <Toggle id="twoFactor"  label="Two-Factor Authentication" desc="Require 2FA for admin login"/>
        <Toggle id="sessionLog" label="Session Activity Logging" desc="Log all admin actions for audit trail"/>
        <Toggle id="strictMode" label="Strict Verification Mode" desc="Require manual confirmation for all decisions"/>
        <Toggle id="apiAccess"  label="API Access" desc="Allow external API integrations"/>
      </div>
      <div className="card-2" style={{ borderRadius:10, padding:'18px 16px', marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#FF9933', marginBottom:3, letterSpacing:'0.06em' }}>NOTIFICATIONS</div>
        <div style={{ fontSize:10, color:'#4a5a30', marginBottom:12 }}>Alert and notification preferences</div>
        <Toggle id="autoNotify"  label="Automatic Alerts" desc="Get notified when documents are submitted"/>
        <Toggle id="emailAlerts" label="Email Notifications" desc="Receive verification summaries via email"/>
      </div>
      <div className="card-2" style={{ borderRadius:10, padding:'18px 16px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#FF9933', marginBottom:3, letterSpacing:'0.06em' }}>AI ENGINE</div>
        <div style={{ fontSize:10, color:'#4a5a30', marginBottom:12 }}>AI and OCR processing configuration</div>
        <Toggle id="aiScan"   label="AI Auto-Scan" desc="Automatically run AI analysis on submission"/>
        <Toggle id="darkMode" label="High Contrast Mode" desc="Enhanced visual contrast for review screens"/>
      </div>
    </div>
  )
}

/* ── Main Layout ────────────────────────────────── */
export default function Layout({ currentPage, navSelection, onNavigate, isSidebarOpen, onToggleSidebar, onLogout, currentUser, children }: LayoutProps) {
  const [showNotif, setShowNotif] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [unreadCount, setUnreadCount] = useState(getUnreadCount())
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('admin_avatar') : null)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setHeaderAvatar(localStorage.getItem('admin_avatar'))
    }
    window.addEventListener('user:profile_updated', handleAvatarUpdate)
    return () => window.removeEventListener('user:profile_updated', handleAvatarUpdate)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleUpdate = () => setUnreadCount(getUnreadCount())
    window.addEventListener('notifications:updated', handleUpdate)
    return () => window.removeEventListener('notifications:updated', handleUpdate)
  }, [])

  const handleNavClick = (pageId: PageType, navId: string) => {
    onNavigate(pageId, navId)
    if (isMobile && isSidebarOpen) {
      onToggleSidebar()
    }
  }

  return (
    <div style={{ display:'flex', height:'100%', background:'#0d0f08', fontFamily:'Inter,system-ui,sans-serif', position:'relative', overflow:'hidden' }}>
      {/* ── Mobile Backdrop Overlay ──────────────────── */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={onToggleSidebar}
          style={{
            position:'fixed',
            inset:0,
            background:'rgba(0,0,0,0.7)',
            backdropFilter:'blur(3px)',
            zIndex:45,
            transition:'opacity 0.25s ease'
          }}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside
        style={{
          width: isMobile ? 260 : (isSidebarOpen ? 248 : 64),
          minWidth: isMobile ? 260 : (isSidebarOpen ? 248 : 64),
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: isMobile ? 50 : 10,
          transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          background:'#080a05',
          borderRight:'1px solid rgba(74,90,42,0.25)',
          display:'flex',
          flexDirection:'column',
          transition: isMobile ? 'transform 0.25s cubic-bezier(0.16,1,0.3,1)' : 'width 0.25s ease, min-width 0.25s ease',
          overflow:'hidden',
          boxShadow: isMobile && isSidebarOpen ? '8px 0 32px rgba(0,0,0,0.8)' : '4px 0 24px rgba(0,0,0,0.5)'
        }}
      >
        {/* Logo */}
        <div style={{ padding:'16px 14px 14px', borderBottom:'1px solid rgba(74,90,42,0.2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flexShrink:0 }}><ChakraIcon size={28}/></div>
            {(isSidebarOpen || isMobile) && (
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#e8e0d0', letterSpacing:'0.03em', lineHeight:1.1 }}>DOCIscan</div>
                <div style={{ fontSize:9, fontWeight:600, color:'#FF9933', letterSpacing:'0.15em', marginTop:2, textTransform:'uppercase' }}>Admin Portal</div>
              </div>
            )}
          </div>
          {isMobile && (
            <button onClick={onToggleSidebar} style={{ background:'none', border:'none', color:'#7a8a58', padding:4, cursor:'pointer', display:'flex', alignItems:'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 8px' }}>
          {(['MAIN','SYSTEM'] as const).map(group => (
            <div key={group} style={{ marginBottom:14 }}>
              {(isSidebarOpen || isMobile) && (
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.15em', color:'#2a3a14', padding:'0 6px 7px', textTransform:'uppercase' }}>{group}</div>
              )}
              {navRows.filter(r=>r.group===group).map((row,i) => {
                const isActive = navSelection === row.navId
                return (
                  <div key={i} className={`nav-item${isActive?' active':''}`}
                    onClick={() => handleNavClick(row.pageId, row.navId)}
                    style={{ justifyContent:(isSidebarOpen||isMobile)?'flex-start':'center', padding:(isSidebarOpen||isMobile)?'9px 12px':'9px 0', marginBottom:2 }}
                    title={!isSidebarOpen && !isMobile ? row.label : undefined}
                  >
                    <span className="nav-accent" style={{ display:(isSidebarOpen||isMobile)?'block':'none' }}/>
                    <span style={{ display:'flex', alignItems:'center', color:'inherit', flexShrink:0 }}>
                      {Icons[row.iconKey]}
                    </span>
                    {(isSidebarOpen || isMobile) && <span style={{ fontSize:13 }}>{row.label}</span>}
                  </div>
                )
              })}
              {group === 'SYSTEM' && (
                <div className="nav-item" onClick={() => setShowLogoutConfirm(true)}
                  style={{ color:'#c87878', marginTop:6, justifyContent:(isSidebarOpen||isMobile)?'flex-start':'center', padding:(isSidebarOpen||isMobile)?'9px 12px':'9px 0', cursor:'pointer' }}
                  title={!isSidebarOpen && !isMobile ? 'Logout' : undefined}
                >
                  <span className="nav-accent" style={{ display:(isSidebarOpen||isMobile)?'block':'none', background:'transparent' }}/>
                  <span style={{ display:'flex', alignItems:'center', color:'inherit', flexShrink:0 }}>{Icons.logout}</span>
                  {(isSidebarOpen || isMobile) && <span style={{ fontSize:13 }}>Logout</span>}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Security indicator */}
        {(isSidebarOpen || isMobile) && (
          <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(74,90,42,0.2)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4a9a4a', boxShadow:'0 0 6px #4a9a4a' }}/>
              <span style={{ fontSize:9, color:'#4a6a28', letterSpacing:'0.06em', fontWeight:600 }}>SECURE CONNECTION</span>
            </div>
            <div style={{ fontSize:9, color:'#2a3a14', marginTop:3, letterSpacing:'0.04em' }}>SSL/TLS ENCRYPTED · ADMIN ONLY</div>
          </div>
        )}
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, width:'100%', overflow:'hidden' }}>
        {/* Header */}
        <header style={{ height:54, background:'rgba(8,10,5,0.97)', borderBottom:'1px solid rgba(74,90,42,0.25)', display:'flex', alignItems:'center', gap:10, padding: isMobile ? '0 12px' : '0 18px', flexShrink:0, zIndex:9 }}>
          <button onClick={onToggleSidebar} style={{ background:'none', border:'none', cursor:'pointer', color:'#7a8a58', padding:4, display:'flex', alignItems:'center' }}>
            <svg width="18" height="18" viewBox="0 0 17 17" fill="currentColor"><rect y="2.5" width="17" height="1.5" rx="0.75"/><rect y="7.75" width="17" height="1.5" rx="0.75"/><rect y="13" width="17" height="1.5" rx="0.75"/></svg>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:5, minWidth:0, overflow:'hidden' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', letterSpacing:'0.02em', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>
              {PAGE_TITLES[navSelection] || PAGE_TITLES[currentPage]}
            </span>
          </div>

          {!isMobile && (
            <div style={{ flex:1, maxWidth:320, position:'relative', marginLeft:10 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#3a4a22' }}>
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
                <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input className="admin-input" placeholder="Search users, documents…" style={{ width:'100%', padding:'6px 12px 6px 30px', fontSize:12 }}/>
            </div>
          )}

          <div style={{ flex:1 }}/>

          {/* Notifications button */}
          <div style={{ position:'relative' }}>
            <button
              onClick={()=>setShowNotif(p=>!p)}
              style={{
                position:'relative',
                background: unreadCount > 0 ? 'rgba(255,153,51,0.15)' : 'rgba(74,90,42,0.12)',
                border: unreadCount > 0 ? '1px solid rgba(255,153,51,0.4)' : '1px solid rgba(74,90,42,0.25)',
                borderRadius:6,
                padding:'5px 8px',
                cursor:'pointer',
                color: unreadCount > 0 ? '#FF9933' : '#8b9a5a',
                display:'flex',
                alignItems:'center',
                transition:'all 0.2s'
              }}
              title="Real-time Alerts"
            >
              {Icons.bell}
              {unreadCount > 0 && (
                <span
                  className="animate-pulse"
                  style={{
                    position:'absolute',
                    top:-4,
                    right:-4,
                    background:'#FF9933',
                    color:'#080a05',
                    fontSize:9,
                    fontWeight:800,
                    borderRadius:'50%',
                    minWidth:16,
                    height:16,
                    padding:'0 2px',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    boxShadow:'0 0 8px rgba(255,153,51,0.6)'
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <NotificationsPanel
                onClose={()=>setShowNotif(false)}
                onNavigate={onNavigate}
              />
            )}
          </div>

          {/* Admin profile */}
          <div style={{ position:'relative' }}>
            <div onClick={()=>setProfileOpen(p=>!p)} style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', padding:'4px 8px', borderRadius:6, background:'rgba(74,90,42,0.1)', border:'1px solid rgba(74,90,42,0.2)' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#4f6128,#2a3218)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#e8e0d0', border:'1px solid rgba(255,153,51,0.3)', overflow:'hidden' }}>
                {headerAvatar ? (
                  <img src={headerAvatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'
                )}
              </div>
              {!isMobile && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#e8e0d0', lineHeight:1.2 }}>{currentUser?.name || currentUser?.email || 'Unknown'}</div>
                  <div style={{ fontSize:8, color:'#FF9933', letterSpacing:'0.04em' }}>{currentUser?.role || 'Admin'}</div>
                </div>
              )}
              <svg width="8" height="8" viewBox="0 0 9 9" fill="#5a6a40"><polyline points="1.5,3.5 4.5,6.5 7.5,3.5"/></svg>
            </div>
            {profileOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#141810', border:'1px solid rgba(74,90,42,0.3)', borderRadius:8, padding:8, minWidth:150, zIndex:100, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>
                {[['Profile','profile','profile'],['Settings','settings','settings']].map(([label,page,nav]) => (
                  <div key={page} onClick={()=>{ onNavigate(page as PageType, nav); setProfileOpen(false) }}
                    style={{ padding:'8px 12px', fontSize:12, color:'#b8b098', borderRadius:4, cursor:'pointer' }}
                    onMouseOver={e=>(e.currentTarget.style.background='rgba(74,90,42,0.15)')}
                    onMouseOut={e=>(e.currentTarget.style.background='transparent')}
                  >{label}</div>
                ))}
                <div style={{ height:1, background:'rgba(74,90,42,0.2)', margin:'4px 0' }}/>
                <div onClick={() => { setProfileOpen(false); setShowLogoutConfirm(true); }} style={{ padding:'8px 12px', fontSize:12, color:'#c87878', borderRadius:4, cursor:'pointer' }}
                  onMouseOver={e=>(e.currentTarget.style.background='rgba(138,56,56,0.12)')}
                  onMouseOut={e=>(e.currentTarget.style.background='transparent')}
                >Sign Out</div>
              </div>
            )}
          </div>

          {/* Auth badge */}
          {!isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 8px', background:'rgba(42,60,18,0.3)', borderRadius:4, border:'1px solid rgba(58,138,72,0.2)' }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="#4a9a4a"><path d="M4.5 1L2 2.8v2c0 1.7 1.3 3 2.5 3.2 1.2-.2 2.5-1.5 2.5-3.2V2.8L4.5 1z"/></svg>
              <span style={{ fontSize:9, color:'#4a9a4a', letterSpacing:'0.06em', fontWeight:600 }}>ADMIN</span>
            </div>
          )}
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch' }}>
          {children}
        </main>
      </div>

      {/* ── Logout Confirmation Modal ──────────────── */}
      {showLogoutConfirm && (
        <div
          style={{
            position:'fixed',
            inset:0,
            background:'rgba(0,0,0,0.75)',
            backdropFilter:'blur(4px)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            zIndex:1000,
            padding:16,
            animation:'fadeIn 0.15s ease'
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:'100%',
              maxWidth:400,
              background:'#12160d',
              border:'1px solid rgba(200,120,120,0.35)',
              borderRadius:10,
              padding:'22px 20px',
              boxShadow:'0 16px 48px rgba(0,0,0,0.8), 0 0 24px rgba(200,80,80,0.12)',
              position:'relative'
            }}
          >
            {/* Header Icon + Title */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div
                style={{
                  width:42,
                  height:42,
                  borderRadius:'50%',
                  background:'rgba(200,80,80,0.14)',
                  border:'1px solid rgba(200,80,80,0.35)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  color:'#c87878',
                  flexShrink:0
                }}
              >
                <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M5.5 13H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2.5M10 11l3-3-3-3M13 7.5H6"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#e8e0d0' }}>
                  Confirm Sign Out
                </h3>
                <p style={{ margin:'2px 0 0', fontSize:11, color:'#7a8a58' }}>
                  DOCIscan Admin Session
                </p>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize:13, color:'#c8c0b0', lineHeight:1.45, margin:'0 0 14px' }}>
              Are you sure you want to log out of your admin account? You will need your credentials to access the portal again.
            </p>

            {/* User Details Preview Box */}
            <div
              style={{
                background:'rgba(30,36,20,0.5)',
                border:'1px solid rgba(74,90,42,0.25)',
                borderRadius:6,
                padding:'10px 12px',
                display:'flex',
                alignItems:'center',
                gap:10,
                marginBottom:18
              }}
            >
              <div
                style={{
                  width:32,
                  height:32,
                  borderRadius:'50%',
                  background:'linear-gradient(135deg,#4f6128,#2a3218)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontSize:12,
                  fontWeight:700,
                  color:'#e8e0d0',
                  border:'1px solid rgba(255,153,51,0.3)',
                  overflow:'hidden',
                  flexShrink:0
                }}
              >
                {headerAvatar ? (
                  <img src={headerAvatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'
                )}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#e8e0d0', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>
                  {currentUser?.name || currentUser?.email || 'Administrator'}
                </div>
                <div style={{ fontSize:10, color:'#FF9933', marginTop:1 }}>
                  {currentUser?.role || 'SUPER_ADMIN'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding:'8px 16px', borderRadius:6, fontSize:12, cursor:'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                style={{
                  padding:'8px 18px',
                  borderRadius:6,
                  fontSize:12,
                  fontWeight:700,
                  background:'linear-gradient(135deg,#c84040,#9e2828)',
                  color:'#ffffff',
                  border:'1px solid rgba(255,120,120,0.4)',
                  cursor:'pointer',
                  boxShadow:'0 2px 10px rgba(200,60,60,0.35)',
                  transition:'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(200,60,60,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(200,60,60,0.35)' }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

