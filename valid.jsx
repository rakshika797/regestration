import { useState } from 'react';
import axios from '../api/axios';
import ShowcaseCard from './ShowcaseCard';

const EMPTY_FORM = {
  skill: '',
  type: 'project',
  title: '',
  url: '',
  description: '',
  credential: '',
};

// Same rule as the backend: only real http(s) addresses
const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
};

const PortfolioManager = ({ skills, items, onItemsChange }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingId && !form.skill) {
      return setError('Choose the skill this work sample belongs to');
    }
    if (!form.title.trim()) {
      return setError('Add a title for this work sample');
    }
    if (!isValidHttpUrl(form.url)) {
      return setError('Enter a valid web address starting with http:// or https://');
    }

    setSaving(true);
    try {
      let data;
      if (editingId) {
        const { skill, ...updates } = form; // skill can't change when editing
        ({ data } = await axios.put(`/users/portfolio/${editingId}`, updates));
      } else {
        ({ data } = await axios.post('/users/portfolio', form));
      }
      onItemsChange(data.portfolio);
      setSuccess(editingId ? 'Work sample updated' : 'Work sample added');
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this work sample. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      skill: item.skill,
      type: item.type,
      title: item.title,
      url: item.url,
      description: item.description || '',
      credential: item.credential || '',
    });
    setEditingId(item._id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from your showcase?`)) return;
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.delete(`/users/portfolio/${item._id}`);
      onItemsChange(data.portfolio);
      if (editingId === item._id) resetForm();
      setSuccess('Work sample removed');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this work sample. Try again.');
    }
  };

  const itemsForSkill = (skill) =>
    items.filter((i) => i.skill.toLowerCase() === skill.toLowerCase());

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Portfolio and work showcase</h2>
      <p style={styles.subheading}>
        Link real work for each skill you offer. Profiles with work samples appear first in
        search and get a showcase badge.
      </p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>✅ {success}</div>}

      {skills.length === 0 ? (
        <div style={styles.info}>
          Add skills under "Skills you offer" and save your profile. Then you can attach work
          samples to each one here.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Skill</label>
              <select
                name="skill"
                value={form.skill}
                onChange={handleChange}
                style={styles.input}
                disabled={Boolean(editingId)}
              >
                <option value="">Choose a skill</option>
                {skills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <select name="type" value={form.type} onChange={handleChange} style={styles.input}>
                <option value="project">Project</option>
                <option value="certificate">Certificate</option>
                <option value="portfolio">Portfolio</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. SkillSwap, AI skill-exchange app"
              maxLength={100}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Link</label>
            <input
              type="text"
              inputMode="url"
              name="url"
              value={form.url}
              onChange={handleChange}
              placeholder="https://github.com/your-name/your-project"
              maxLength={500}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What did you build or achieve? What should a learner know?"
              maxLength={500}
              rows={3}
              style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Credential (optional)</label>
            <input
              type="text"
              name="credential"
              value={form.credential}
              onChange={handleChange}
              placeholder="e.g. Meta Front-End Developer Certificate, 2025"
              maxLength={150}
              style={styles.input}
            />
          </div>

          <div style={styles.buttonRow}>
            <button type="submit" style={styles.primaryBtn} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add work sample'}
            </button>
            {editingId && (
              <button type="button" style={styles.secondaryBtn} onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      )}

      {skills.length > 0 && (
        <div style={styles.groups}>
          {skills.map((skill) => {
            const list = itemsForSkill(skill);
            return (
              <div key={skill} style={styles.group}>
                <div style={styles.groupHeader}>
                  <h3 style={styles.groupTitle}>{skill}</h3>
                  {list.length > 0 ? (
                    <span style={styles.badge}>🏅 Showcase · {list.length}</span>
                  ) : (
                    <span style={styles.noEvidence}>No work samples yet</span>
                  )}
                </div>

                <div style={styles.cardList}>
                  {list.map((item) => (
                    <ShowcaseCard
                      key={item._id}
                      item={item}
                      actions={
                        <>
                          <button
                            type="button"
                            style={styles.smallBtn}
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={styles.smallDangerBtn}
                            onClick={() => handleDelete(item)}
                          >
                            Remove
                          </button>
                        </>
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginTop: '24px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px',
  },
  subheading: {
    fontSize: '14px',
    color: '#777',
    lineHeight: 1.5,
    marginBottom: '20px',
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#d00',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  info: {
    backgroundColor: '#f0effe',
    color: '#4b44c9',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  form: {
    marginBottom: '8px',
  },
  row: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  field: {
    flex: 1,
    minWidth: '160px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '11px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    padding: '12px 24px',
    backgroundColor: '#6c63ff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#6c63ff',
    border: '1px solid #6c63ff',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  groups: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  group: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '16px',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  groupTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
  },
  badge: {
    backgroundColor: '#fff4d6',
    color: '#8a5a00',
    fontSize: '12px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  noEvidence: {
    fontSize: '12px',
    color: '#999',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  smallBtn: {
    background: 'white',
    border: '1px solid #ccc',
    color: '#555',
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  smallDangerBtn: {
    background: 'white',
    border: '1px solid #f0b4b4',
    color: '#c62828',
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default PortfolioManager;
