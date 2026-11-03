import { useState } from 'react';

const TYPE_META = {
  project: { icon: '🛠️', label: 'Project' },
  certificate: { icon: '🎓', label: 'Certificate' },
  portfolio: { icon: '🎨', label: 'Portfolio' },
};

const getHostname = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

// Short, readable preview of the link, e.g. github.com/chintan16-bhatt/SkillSwap
const getPreviewText = (url) => {
  try {
    const u = new URL(url);
    const text = u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '');
    return text.length > 45 ? `${text.slice(0, 42)}...` : text;
  } catch {
    return url;
  }
};

const ShowcaseCard = ({ item, actions }) => {
  const [open, setOpen] = useState(false);

  const meta = TYPE_META[item.type] || TYPE_META.project;
  const isGithub = getHostname(item.url) === 'github.com';
  const hasDetails = Boolean(item.description || item.credential);
  // Extra safety: only render a clickable link for real http(s) addresses
  const safeLink = /^https?:\/\//i.test(item.url);

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <span style={styles.icon}>{isGithub ? '🐙' : meta.icon}</span>
        <div style={styles.titleBox}>
          <h4 style={styles.title}>{item.title}</h4>
          <p style={styles.preview}>🔗 {getPreviewText(item.url)}</p>
        </div>
        <span style={styles.typePill}>{meta.label}</span>
      </div>

      {open && hasDetails && (
        <div style={styles.details}>
          {item.description && <p style={styles.description}>{item.description}</p>}
          {item.credential && (
            <p style={styles.credential}>🏷️ Credential: {item.credential}</p>
          )}
        </div>
      )}

      <div style={styles.footer}>
        {hasDetails ? (
          <button type="button" style={styles.detailsBtn} onClick={() => setOpen(!open)}>
            {open ? 'Hide details ▴' : 'Show details ▾'}
          </button>
        ) : (
          <span />
        )}

        <div style={styles.footerRight}>
          {actions}
          {safeLink && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.openBtn}
            >
              Open link ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#fafaff',
    border: '1px solid #e3e1ff',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  icon: {
    fontSize: '22px',
    lineHeight: 1.2,
  },
  titleBox: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '2px',
    wordBreak: 'break-word',
  },
  preview: {
    fontSize: '12px',
    color: '#777',
    wordBreak: 'break-all',
  },
  typePill: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6c63ff',
    backgroundColor: '#ecebff',
    padding: '3px 10px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
  details: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px dashed #dcdaf5',
  },
  description: {
    fontSize: '13px',
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '6px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  credential: {
    fontSize: '13px',
    color: '#2e7d32',
    fontWeight: '600',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '12px',
  },
  detailsBtn: {
    background: 'none',
    border: 'none',
    color: '#6c63ff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  openBtn: {
    backgroundColor: '#6c63ff',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
  },
};

export default ShowcaseCard;
