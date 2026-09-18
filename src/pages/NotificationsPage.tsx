import { useState, useEffect } from 'react'
import type { PageType } from '../types'
import {
  AppNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  addNotification
} from '../services/notificationService'

interface Props {
  onNavigate: (p: PageType, nav?: string) => void
}

const TYPE_CONFIG = {
  CRITICAL: { color: '#c87878', bg: 'rgba(200,120,120,0.12)', border: 'rgba(200,120,120,0.3)', badge: 'CRITICAL' },
  SUSPICIOUS: { color: '#cc9944', bg: 'rgba(204,153,68,0.12)', border: 'rgba(204,153,68,0.3)', badge: 'WARNING' },
  VERIFIED: { color: '#68c87a', bg: 'rgba(104,200,122,0.12)', border: 'rgba(104,200,122,0.3)', badge: 'VERIFIED' },
  INFO: { color: '#7899cc', bg: 'rgba(120,153,204,0.12)', border: 'rgba(120,153,204,0.3)', badge: 'INFO' },
  SYSTEM: { color: '#b5c070', bg: 'rgba(181,192,112,0.12)', border: 'rgba(181,192,112,0.3)', badge: 'SYSTEM' },
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export default function NotificationsPage({ onNavigate }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'CRITICAL' | 'VERIFIED' | 'SYSTEM'>('ALL')
  const [search, setSearch] = useState('')

  const loadData = () => {
    setNotifications(getNotifications())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('notifications:updated', handleUpdate)
    return () => window.removeEventListener('notifications:updated', handleUpdate)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filterTab === 'UNREAD' && n.read) return false
    if (filterTab === 'CRITICAL' && (n.type !== 'CRITICAL' && n.type !== 'SUSPICIOUS')) return false
    if (filterTab === 'VERIFIED' && n.type !== 'VERIFIED') return false
    if (filterTab === 'SYSTEM' && (n.type !== 'SYSTEM' && n.type !== 'INFO')) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
    }
    return true
  })

  const handleSimulateAlert = () => {
    const types: Array<'CRITICAL' | 'SUSPICIOUS' | 'VERIFIED' | 'INFO'> = ['CRITICAL', 'SUSPICIOUS', 'VERIFIED', 'INFO']
    const randomType = types[Math.floor(Math.random() * types.length)]
    addNotification({
      type: randomType,
      title: randomType === 'CRITICAL' ? 'High Risk Document Alert' : randomType === 'VERIFIED' ? 'AI Screening Completed' : 'New System Event',
      message: `Live event generated at ${new Date().toLocaleTimeString()} by AI Document Engine.`,
      targetPage: 'documents',
      targetNav: 'documents'
    })
  }

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8e0d0', margin: 0 }}>Notification Center</h1>
            {unreadCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#FF9933', color: '#060803', padding: '2px 8px', borderRadius: 12 }}>
                {unreadCount} Unread
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#68c87a', background: 'rgba(104,200,122,0.12)', border: '1px solid rgba(104,200,122,0.25)', padding: '2px 8px', borderRadius: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#68c87a', animation: 'pulse 1.5s infinite' }} />
              Live Stream Active
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#5a6a40', margin: '4px 0 0' }}>Real-time alerts, screening flags, and system verification logs</p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSimulateAlert}
            className="btn-ghost"
            style={{ padding: '7px 12px', fontSize: 11, borderRadius: 6, color: '#FF9933', border: '1px solid rgba(255,153,51,0.3)', cursor: 'pointer' }}
          >
            ⚡ Trigger Live Test Alert
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-ghost"
              style={{ padding: '7px 12px', fontSize: 11, borderRadius: 6, cursor: 'pointer' }}
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="btn-ghost"
              style={{ padding: '7px 12px', fontSize: 11, borderRadius: 6, color: '#c87878', cursor: 'pointer' }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-1" style={{ borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'UNREAD', 'CRITICAL', 'VERIFIED', 'SYSTEM'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filterTab === tab ? 'rgba(255,153,51,0.15)' : 'transparent',
                color: filterTab === tab ? '#FF9933' : '#6a7a48',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'ALL' ? 'All Alerts' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <input
          className="admin-input"
          placeholder="Filter notifications…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220, padding: '6px 10px', fontSize: 12 }}
        />
      </div>

      {/* Notification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div className="card-2" style={{ padding: 48, textAlign: 'center', borderRadius: 8, color: '#5a6a40' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#8b9a5a' }}>No notifications found</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>You're all caught up! New alerts will stream here in real-time.</div>
          </div>
        ) : (
          filtered.map(item => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO
            return (
              <div
                key={item.id}
                className="card-2"
                style={{
                  borderRadius: 8,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  background: item.read ? 'rgba(22,26,10,0.5)' : 'rgba(34,42,16,0.85)',
                  border: item.read ? '1px solid rgba(74,90,42,0.2)' : `1px solid ${config.border}`,
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Type Indicator Dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.color, marginTop: 4, flexShrink: 0, boxShadow: !item.read ? `0 0 8px ${config.color}` : 'none' }} />

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.read ? '#b8b098' : '#e8e0d0' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
                        {config.badge}
                      </span>
                      {!item.read && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#FF9933' }}>● NEW</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#5a6a40', whiteSpace: 'nowrap' }}>
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: item.read ? '#6a7a48' : '#c8c0b0', margin: '0 0 10px', lineHeight: 1.5 }}>
                    {item.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.targetPage && (
                      <button
                        onClick={() => {
                          markAsRead(item.id)
                          onNavigate(item.targetPage!, item.targetNav || item.targetPage!)
                        }}
                        style={{
                          background: 'rgba(255,153,51,0.1)',
                          border: '1px solid rgba(255,153,51,0.3)',
                          color: '#FF9933',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        View Details →
                      </button>
                    )}
                    {!item.read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="btn-ghost"
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(item.id)}
                      className="btn-ghost"
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, color: '#c87878', cursor: 'pointer', marginLeft: 'auto' }}
                      title="Delete alert"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
