const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

/** Tombol ikon minimalis: bulat, melebar menampilkan label saat disorot atau difokus. */
function IconButton({ label, variant, onClick, children }: { label: string; variant: 'edit' | 'delete'; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`icon-btn icon-btn-${variant}`}>
      <svg {...base}>{children}</svg>
      <span aria-hidden>{label}</span>
    </button>
  )
}

export const EditButton = ({ onClick }: { onClick: () => void }) => (
  <IconButton label="Edit" variant="edit" onClick={onClick}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </IconButton>
)

export const DeleteButton = ({ onClick }: { onClick: () => void }) => (
  <IconButton label="Hapus" variant="delete" onClick={onClick}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 11v5M14 11v5" />
  </IconButton>
)

export const AddButton = ({ onClick, disabled, label = 'Tambah' }: { onClick: () => void; disabled?: boolean; label?: string }) => (
  <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="icon-btn icon-btn-edit disabled:opacity-50">
    <svg {...base}><path d="M12 5v14M5 12h14" /></svg>
    <span aria-hidden>{label}</span>
  </button>
)
