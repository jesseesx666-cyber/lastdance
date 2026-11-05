import { ACCOUNT_IDS, ACCOUNT_LABEL, type AccountId } from '../../shared/accounts'
import { ACCOUNT_PLATFORMS, PLATFORM_LABEL, type PlatformId } from '../../shared/platforms'
import { setAccount, setPlatform, useAccount, usePlatform } from '../account'

/** Tab akun (judul) dan di bawahnya tab platform sosial media milik akun itu; bisa digeser di layar sempit. */
export default function AccountTabs({ className = '', platforms = true, onChange, onPlatform }: { className?: string; platforms?: boolean; onChange?: (a: AccountId) => void; onPlatform?: (p: PlatformId) => void }) {
  const account = useAccount()
  const platform = usePlatform()
  const tab = (on: boolean, small = false) =>
    `flex-1 shrink-0 whitespace-nowrap rounded-full font-medium transition-colors ${small ? 'px-3.5 py-1 text-[13px]' : 'px-4 py-1.5 text-sm'} ${on ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`
  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <div role="tablist" aria-label="Akun" className="flex min-w-0 gap-1 overflow-x-auto rounded-full glass p-1">
        {ACCOUNT_IDS.map((id) => (
          <button key={id} role="tab" aria-selected={id === account} className={tab(id === account)}
            onClick={() => {
              setAccount(id)
              onChange?.(id)
              onPlatform?.(ACCOUNT_PLATFORMS[id].includes(platform) ? platform : 'instagram')
            }}>
            {ACCOUNT_LABEL[id]}
          </button>
        ))}
      </div>
      {platforms && <div role="tablist" aria-label="Platform" className="flex min-w-0 gap-1 overflow-x-auto rounded-full glass p-1 sm:inline-flex">
        {ACCOUNT_PLATFORMS[account].map((p) => (
          <button key={p} role="tab" aria-selected={p === platform} className={tab(p === platform, true)}
            onClick={() => {
              setPlatform(p)
              onPlatform?.(p)
            }}>
            {PLATFORM_LABEL[p]}
          </button>
        ))}
      </div>}
    </div>
  )
}
