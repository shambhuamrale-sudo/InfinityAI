import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cloud, HardDrive, Database, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useAppContext } from '../../context/useAppContext'
import { API_BASE } from '../../config/api'

export default function SystemStatus() {
  const { subscription, usage, adminConfig } = useAppContext()
  const [syncStatus, setSyncStatus] = useState('Synced')
  const [connectionStatus, setConnectionStatus] = useState('Online')
  const [lastSync, setLastSync] = useState('Just now')

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/state`, { credentials: 'include' })
        if (res.ok) {
          if (mounted) {
            setConnectionStatus('Online')
            setSyncStatus('Synced')
            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          }
        } else {
          if (mounted) {
            setConnectionStatus('Offline')
            setSyncStatus('Pending')
          }
        }
      } catch {
        if (mounted) {
          setConnectionStatus('Offline')
          setSyncStatus('Pending')
        }
      }
    }
    check()
    const timer = setInterval(check, 30000)
    return () => { mounted = false; clearInterval(timer) }
  }, [])

  const cloudMode = subscription?.plan ? subscription.plan.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unavailable'
  const storageUsed = usage?.storageUsed || 0
  const storageLimit = adminConfig?.storageLimit || 100

  const items = [
    { label: 'Cloud Mode', value: cloudMode, icon: Cloud, tone: 'text-indigo-300' },
    { label: 'Local Mode', value: 'Unavailable', icon: HardDrive, tone: 'text-emerald-300' },
    { label: 'Storage', value: `${storageUsed} / ${storageLimit} GB`, icon: Database, tone: 'text-amber-300' },
    { label: 'Sync', value: syncStatus, icon: RefreshCw, tone: syncStatus === 'Synced' ? 'text-emerald-300' : 'text-amber-300' },
    { label: 'Connection', value: connectionStatus, icon: connectionStatus === 'Online' ? Wifi : WifiOff, tone: connectionStatus === 'Online' ? 'text-emerald-300' : 'text-rose-300' },
  ]

  return (
    <div className="glass rounded-3xl border p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow">System</p>
          <h3 className="text-lg font-semibold text-white">System status</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">{lastSync}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/10 text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-300">{item.label}</span>
              </div>
              <span className={`text-sm font-semibold ${item.tone}`}>{item.value}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
