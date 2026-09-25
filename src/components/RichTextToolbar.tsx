export type FormatAction = 'bold' | 'italic' | 'code' | 'bullet-list' | 'numbered-list'

interface RichTextToolbarProps {
  position: { x: number; y: number }
  onFormat: (action: FormatAction) => void
}

const BUTTONS: { action: FormatAction; label: string; title: string }[] = [
  { action: 'bold', label: 'B', title: 'Bold' },
  { action: 'italic', label: 'I', title: 'Italic' },
  { action: 'code', label: '</>', title: 'Inline code' },
  { action: 'bullet-list', label: '•', title: 'Bullet list' },
  { action: 'numbered-list', label: '1.', title: 'Numbered list' },
]

export default function RichTextToolbar({ position, onFormat }: RichTextToolbarProps) {
  return (
    <div
      className="floating-toolbar"
      style={{ left: position.x, top: position.y, transform: 'translateX(-50%)' }}
      // Prevent the textarea from losing focus/selection when clicking a button.
      onMouseDown={(e) => e.preventDefault()}
    >
      {BUTTONS.map((btn) => (
        <button
          key={btn.action}
          type="button"
          title={btn.title}
          onClick={() => onFormat(btn.action)}
          style={btn.action === 'italic' ? { fontStyle: 'italic' } : undefined}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
