import { Link } from 'react-router-dom'

export function LoadingState({ label = 'Loading workspace' }) {
  return <div className="state-panel"><span className="spinner" />{label}</div>
}

export function ErrorState({ message, onRetry }) {
  return <div className="state-panel error-state"><strong>Could not load this view</strong><span>{message}</span>{onRetry && <button className="button button-light" onClick={onRetry}>Try again</button>}</div>
}

export function EmptyState({ title, message, action }) {
  return <div className="state-panel"><strong>{title}</strong><span>{message}</span>{action}</div>
}

export function StatusBadge({ value }) {
  const tone = String(value || '').toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge ${tone}`}>{value || 'Not specified'}</span>
}

export function StatCard({ label, value, detail, accent = 'blue' }) {
  return <div className={`stat-card ${accent}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

export function SectionHeading({ title, action }) {
  return <div className="section-heading"><h2>{title}</h2>{action}</div>
}

export function DetailRow({ label, value }) {
  return <div className="detail-row"><span>{label}</span><strong>{value || 'Not specified'}</strong></div>
}

export function Field({ label, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>
}

export function SelectField({ label, children, ...props }) {
  return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>
}

export function Logo() {
  return <Link className="brand" to="/"><span className="brand-mark">L</span><span><strong>Lakshya</strong><small>Campus placement platform</small></span></Link>
}
