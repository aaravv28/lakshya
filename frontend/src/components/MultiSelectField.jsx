import { useEffect, useId, useRef, useState } from 'react'

// A dropdown that picks several options. Picked options show as tags; the list stays open
// while picking and closes on Escape or a click outside.
export default function MultiSelectField({ label, options, value, onChange, placeholder = 'Choose…', invalid }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const listId = useId()
  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [open])
  const toggle = (option) => onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])
  const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false) }
  return <div className="field full-field multi-select" ref={root} onKeyDown={closeOnEscape}>
    <span>{label}</span>
    <div className={`multi-select-control${invalid ? ' invalid' : ''}`}>
      {value.map((option) => <span className="multi-select-tag" key={option}>{option}<button type="button" aria-label={`Remove ${option}`} onClick={() => toggle(option)}>✕</button></span>)}
      <button type="button" className="multi-select-toggle" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}>
        {value.length === 0 ? placeholder : 'Add more'} <span aria-hidden="true">▾</span>
      </button>
    </div>
    {open && <ul className="multi-select-list" id={listId} role="listbox" aria-multiselectable="true" aria-label={label}>
      {options.map((option) => <li key={option} role="option" aria-selected={value.includes(option)}>
        <button type="button" onClick={() => toggle(option)}><span className="multi-select-check" aria-hidden="true">{value.includes(option) ? '✓' : ''}</span>{option}</button>
      </li>)}
    </ul>}
  </div>
}
