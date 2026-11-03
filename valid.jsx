import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PortfolioManager from '../../components/PortfolioManager';

const Profile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    skillsOffered: '',
    skillsWanted: '',
  });
  // Saved copies, used by the portfolio manager
  const [portfolio, setPortfolio] = useState([]);
  const [savedSkills, setSavedSkills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/users/profile');
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
          skillsOffered: (data.skillsOffered || []).join(', '),
          skillsWanted: (data.skillsWanted || []).join(', '),
        });
        setPortfolio(data.portfolio || []);
        setSavedSkills(data.skillsOffered || []);
      } catch (err) {
        setError('Could not load your profile. Refresh the page to try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const toList = (text) =>
    text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        skillsOffered: toList(formData.skillsOffered),
        skillsWanted: toList(formData.skillsWanted),
      };

      const { data } = await axios.put('/users/profile', payload);

      // Keep AuthContext + localStorage fresh (existing token is kept)
      login({ ...user, ...data });

      // Portfolio items for removed skills are deleted by the backend
      setPortfolio(data.portfolio || []);
      setSavedSkills(data.skillsOffered || []);

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading profile...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatar}>{formData.name.charAt(0).toUpperCase()}</div>
          <div>
            <h1 style={styles.title}>{formData.name}</h1>
            <p style={styles.credits}>⭐ {user?.credits} credits</p>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>✅ Profile updated successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell others a bit about yourself..."
              style={styles.textarea}
              rows={3}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Jaipur, Rajasthan"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Skills you offer (comma separated)</label>
            <input
              type="text"
              name="skillsOffered"
              value={formData.skillsOffered}
              onChange={handleChange}
              placeholder="e.g. JavaScript, Node.js, MongoDB"
              style={styles.input}
            />
            <p style={styles.hint}>
              Save your profile, then link work samples for each skill in the showcase below.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Skills you want to learn (comma separated)</label>
            <input
              type="text"
              name="skillsWanted"
              value={formData.skillsWanted}
              onChange={handleChange}
              placeholder="e.g. Guitar, Spanish, UI Design"
              style={styles.input}
            />
            <p style={styles.hint}>Separate multiple skills with commas</p>
          </div>

          <button
            type="submit"
            style={saving ? { ...styles.button, opacity: 0.7 } : styles.button}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <PortfolioManager skills={savedSkills} items={portfolio} onItemsChange={setPortfolio} />
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#6c63ff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333',
  },
  credits: {
    fontSize: '14px',
    color: '#888',
    marginTop: '4px',
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
  formGroup: {
    marginBottom: '18px',
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
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#6c63ff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default Profile;
