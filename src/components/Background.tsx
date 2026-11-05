import LiquidChrome from './LiquidChrome'
import { useFx, useTheme } from '../theme'

/**
 * Latar animasi untuk semua halaman, di belakang seluruh konten.
 * 'lite' (perangkat lemah): resolusi rendah, 20 FPS, detail minimum, tanpa simulasi riak,
 * tanpa pelacak pointer. 'off': tidak ada WebGL sama sekali.
 */
export default function Background() {
  const fx = useFx()
  const dark = useTheme() === 'dark'
  if (fx === 'off') return null
  const lite = fx === 'lite'
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-10 ${dark ? 'opacity-50' : 'opacity-60 brightness-[0.7]'}`}>
      <LiquidChrome
        key={fx}
        color={dark ? '#a78bfa' : '#6366f1'}
        lightMode={!dark}
        speed={still ? 0 : lite ? 0.08 : 0.2}
        amplitude={0.3}
        detail={lite ? 2 : 4}
        interactive={!lite}
        intro={!lite}
        maxDevicePixelRatio={lite ? 0.5 : 1.5}
        maxFps={lite ? 20 : 0}
      />
    </div>
  )
}
