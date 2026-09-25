// Simple keyword -> hashtag mapping for the Caption Builder's hashtag
// helper. No external API — purely local lookup against slide content.

const KEYWORD_MAP: { keywords: string[]; tags: string[] }[] = [
  { keywords: ['phish', 'phishing', 'email scam'], tags: ['#Phishing', '#CyberAwareness'] },
  { keywords: ['password', 'passphrase', 'credential'], tags: ['#PasswordSecurity', '#CyberHygiene'] },
  { keywords: ['ransomware', 'ransom'], tags: ['#Ransomware', '#CyberThreat'] },
  { keywords: ['malware', 'virus', 'trojan'], tags: ['#Malware', '#ThreatIntel'] },
  { keywords: ['vpn'], tags: ['#VPN', '#OnlinePrivacy'] },
  { keywords: ['2fa', 'two-factor', 'mfa', 'multi-factor'], tags: ['#2FA', '#MFA'] },
  { keywords: ['data breach', 'breach', 'leaked'], tags: ['#DataBreach', '#CyberSecurity'] },
  { keywords: ['privacy'], tags: ['#DataPrivacy', '#OnlinePrivacy'] },
  { keywords: ['firewall', 'network security'], tags: ['#NetworkSecurity', '#InfoSec'] },
  { keywords: ['social engineering', 'scam', 'fraud'], tags: ['#SocialEngineering', '#ScamAlert'] },
  { keywords: ['wifi', 'wi-fi', 'public network'], tags: ['#WifiSecurity', '#CyberSafety'] },
  { keywords: ['encryption', 'encrypted'], tags: ['#Encryption', '#DataSecurity'] },
  { keywords: ['zero-day', 'vulnerability', 'exploit'], tags: ['#ZeroDay', '#Vulnerability'] },
  { keywords: ['compliance', 'gdpr', 'regulation'], tags: ['#Compliance', '#DataProtection'] },
  { keywords: ['backup', 'recovery'], tags: ['#DataBackup', '#DisasterRecovery'] },
  { keywords: ['insider threat', 'employee'], tags: ['#InsiderThreat', '#SecurityAwareness'] },
  { keywords: ['iot', 'smart device'], tags: ['#IoTSecurity', '#SmartDevices'] },
  { keywords: ['cloud'], tags: ['#CloudSecurity', '#InfoSec'] },
  { keywords: ['soc', 'incident response', 'incident'], tags: ['#IncidentResponse', '#SOC'] },
  { keywords: ['ceo fraud', 'business email'], tags: ['#BEC', '#CyberFraud'] },
]

const GENERIC_TAGS = ['#CyberSecurity', '#InfoSec', '#StaySafeOnline', '#CyberAwareness', '#TechTips']

/**
 * Suggests 3-5 hashtags by scanning the given slide text for known
 * cybersecurity keywords, falling back to generic security tags when
 * fewer than 3 keyword matches are found.
 */
export function suggestHashtags(content: string, max = 5): string[] {
  const lower = content.toLowerCase()
  const matched = new Set<string>()

  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      for (const tag of entry.tags) matched.add(tag)
    }
    if (matched.size >= max) break
  }

  if (matched.size < 3) {
    for (const tag of GENERIC_TAGS) {
      matched.add(tag)
      if (matched.size >= 3) break
    }
  }

  return Array.from(matched).slice(0, max)
}
