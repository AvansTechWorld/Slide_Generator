// Curated cybersecurity icon set. Each icon is a self-contained 24x24
// stroke-based SVG path set using `currentColor`, so recoloring is just a
// CSS color change on the wrapping element. No external API/CDN involved.

export interface IconDef {
  id: string
  label: string
  /** Inner SVG markup (paths/shapes only) sized to a 24x24 viewBox. */
  svg: string
}

const s = (inner: string) => inner

export const ICONS: IconDef[] = [
  { id: 'lock', label: 'Lock', svg: s('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>') },
  { id: 'unlock', label: 'Unlock', svg: s('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.6-1.8"/>') },
  { id: 'shield', label: 'Shield', svg: s('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>') },
  { id: 'shield-check', label: 'Shield Check', svg: s('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>') },
  { id: 'shield-alert', label: 'Shield Alert', svg: s('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M12 8v4"/><circle cx="12" cy="15.5" r="0.6" fill="currentColor" stroke="none"/>') },
  { id: 'warning-triangle', label: 'Warning', svg: s('<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none"/>') },
  { id: 'checkmark', label: 'Checkmark', svg: s('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>') },
  { id: 'x-circle', label: 'X', svg: s('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>') },
  { id: 'key', label: 'Key', svg: s('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>') },
  { id: 'bug', label: 'Bug', svg: s('<rect x="8" y="9" width="8" height="10" rx="4"/><path d="M12 9V6M9 6l-2-2M15 6l2-2M4 12h4M16 12h4M5 18l3-2M19 18l-3-2"/>') },
  { id: 'eye', label: 'Eye', svg: s('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>') },
  { id: 'eye-off', label: 'Eye Off', svg: s('<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M6.6 6.7C4 8.3 2 12 2 12s4 7 10 7c1.8 0 3.4-.5 4.8-1.3M17.5 17.5C20 15.8 22 12 22 12s-1.3-2.3-3.5-4.2"/>') },
  { id: 'wifi', label: 'Wifi', svg: s('<path d="M2 8.5a16 16 0 0 1 20 0M5 12.5a11 11 0 0 1 14 0M8.5 16.5a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="0.8" fill="currentColor" stroke="none"/>') },
  { id: 'wifi-off', label: 'Wifi Off', svg: s('<path d="M2 3l19 19M2 8.5c2-1.7 4.4-2.9 7-3.5M22 8.5a16 16 0 0 0-4.5-2.9M5 12.5a11 11 0 0 1 4.5-2.4M18.9 12.4a11 11 0 0 0-2.6-1.7M8.5 16.5a6 6 0 0 1 3.6-1.3M15.5 16.5a6 6 0 0 0-1-.8"/><circle cx="12" cy="20" r="0.8" fill="currentColor" stroke="none"/>') },
  { id: 'database', label: 'Database', svg: s('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>') },
  { id: 'server', label: 'Server', svg: s('<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><circle cx="7" cy="7.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="7" cy="16.5" r="0.6" fill="currentColor" stroke="none"/>') },
  { id: 'cloud', label: 'Cloud', svg: s('<path d="M7 18h11a4 4 0 0 0 .5-8 6 6 0 0 0-11.4-1.6A4.5 4.5 0 0 0 7 18z"/>') },
  { id: 'cloud-off', label: 'Cloud Off', svg: s('<path d="M3 3l18 18M9.3 5.4A6 6 0 0 1 17.5 10a4 4 0 0 1 1.9 7.5M7 18a4 4 0 0 1-1.7-7.6"/>') },
  { id: 'laptop', label: 'Laptop', svg: s('<rect x="4" y="5" width="16" height="10" rx="1.5"/><path d="M2 19h20"/>') },
  { id: 'phone', label: 'Phone', svg: s('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>') },
  { id: 'mail', label: 'Mail', svg: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>') },
  { id: 'mail-warning', label: 'Phishing Mail', svg: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/><path d="M18 15l2 4h-4z"/>') },
  { id: 'link', label: 'Link', svg: s('<path d="M9 15l6-6"/><path d="M13 5l1.5-1.5a4 4 0 0 1 5.5 5.5L18 11"/><path d="M11 19l-1.5 1.5a4 4 0 0 1-5.5-5.5L6 13"/>') },
  { id: 'link-broken', label: 'Broken Link', svg: s('<path d="M13 5l1.5-1.5a4 4 0 0 1 5.5 5.5L18 11"/><path d="M11 19l-1.5 1.5a4 4 0 0 1-5.5-5.5L6 13"/><path d="M4 20L20 4"/>') },
  { id: 'fingerprint', label: 'Fingerprint', svg: s('<path d="M12 2a7 7 0 0 0-7 7c0 3 1 5 1 8"/><path d="M12 2a7 7 0 0 1 7 7c0 2 -.3 3.5 -1 5"/><path d="M8 20c1-2 1.5-4 1.5-6a2.5 2.5 0 0 1 5 0c0 3-1 5-1.5 7"/><path d="M5 12c0 4 1 6 2 8"/><path d="M19 12c0 2-.2 3.5-.8 5"/>') },
  { id: 'skull', label: 'Skull', svg: s('<path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.2 4 2 5v2h10v-2c.8-1 2-2.5 2-5a7 7 0 0 0-7-7z"/><circle cx="9.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><path d="M10 20h4M9.5 17h1M13.5 17h1"/>') },
  { id: 'alert-circle', label: 'Alert', svg: s('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v6"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none"/>') },
  { id: 'info', label: 'Info', svg: s('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none"/>') },
  { id: 'arrow-right', label: 'Arrow Right', svg: s('<path d="M4 12h16M14 6l6 6-6 6"/>') },
  { id: 'swipe', label: 'Swipe', svg: s('<path d="M3 12h13M12 6l6 6-6 6"/><path d="M16 4v16" stroke-dasharray="2 2"/>') },
  { id: 'firewall', label: 'Firewall', svg: s('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M8 4v5M13 4v5M8 14v6M16 14v6"/>') },
  { id: 'vpn', label: 'VPN Tunnel', svg: s('<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6" stroke-dasharray="2 2"/>') },
  { id: 'password', label: 'Password', svg: s('<rect x="3" y="10" width="18" height="9" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/><circle cx="8" cy="14.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="12" cy="14.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="16" cy="14.5" r="0.7" fill="currentColor" stroke="none"/>') },
  { id: '2fa', label: 'Two-Factor', svg: s('<rect x="2" y="7" width="12" height="14" rx="2"/><rect x="14" y="3" width="8" height="6" rx="1.5"/><path d="M17 15h2M17 18h2"/>') },
  { id: 'malware', label: 'Malware', svg: s('<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M9 10l2 2-2 2M15 10l-2 2 2 2"/>') },
  { id: 'ransomware', label: 'Ransomware', svg: s('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>') },
  { id: 'phishing-hook', label: 'Phishing Hook', svg: s('<path d="M12 3v9a3.5 3.5 0 1 0 3.5 3.5"/><circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none"/>') },
  { id: 'privacy', label: 'Privacy', svg: s('<path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/><path d="M2 2l20 20"/>') },
  { id: 'compliance', label: 'Compliance', svg: s('<path d="M8 3h8l1 4H7l1-4z"/><path d="M6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7z"/><path d="M9 12l2 2 4-4"/>') },
  { id: 'network', label: 'Network', svg: s('<circle cx="12" cy="4" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 6v6M12 12l-6 4M12 12l6 4"/>') },
  { id: 'backup', label: 'Backup', svg: s('<path d="M4 6a8 8 0 1 1-1.5 4.7"/><path d="M2 4v4h4"/>') },
  { id: 'incident', label: 'Incident', svg: s('<path d="M12 2l3 6 6 1-4.5 4.4 1 6.1L12 16.5 6.5 19.5l1-6.1L3 8l6-1 3-6z"/>') },
  { id: 'usb', label: 'USB Threat', svg: s('<rect x="9" y="3" width="6" height="8" rx="1"/><path d="M12 11v6"/><rect x="8" y="17" width="8" height="4" rx="1"/>') },
  { id: 'clock', label: 'Clock', svg: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>') },
  { id: 'chart-up', label: 'Chart Up', svg: s('<path d="M4 19h16"/><path d="M6 15l4-4 3 3 5-6"/>') },
]

export function getIcon(id: string): IconDef {
  return ICONS.find((i) => i.id === id) ?? ICONS[0]
}
