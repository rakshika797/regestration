import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ShowcaseCard from '../../components/ShowcaseCard';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`/users/${id}`);
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this profile. Try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div style={styles.container}>Loading profile...</div>;
  if (error) return <div style={styles.container}><div style={styles.error}>{error}</div></div>;
  if (!profile) return null;

  const isOwnProfile = user?._id === profile._id;
  const portfolio = profile.portfolio || [];
  const itemsForSkill = (skill) =>
    portfolio.filter((p) => p.skill.toLowerCase() === skill.toLowerCase());
  const showcasedSkills = (profile.skillsOffered || []).filter(
    (s) => itemsForSkill(s).length > 0
  );
  const hasShowcase = (skill) => itemsForSkill(skill).length > 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatar}>{profile.name.charAt(0).toUpperCase()}</div>
          <div style={styles.headerText}>
            <h1 style={styles.name}>{profile.name}</h1>
            {profile.location && <p style={styles.meta}>📍 {profile.location}</p>}
            <p style={styles.meta}>⭐ {profile.credits} credits</p>
          </div>
          {isOwnProfile ? (
            <Link to="/profile" style={styles.secondaryBtn}>Edit profile</Link>
          ) : (
            <button style={styles.primaryBtn} onClick={() => navigate(`/swaps/new/${profile._id}`)}>
              Request swap
            </button>
          )}
        </div>

        {profile.bio && profile.bio.trim() && <p style={styles.bio}>{profile.bio}</p>}

        <div style={styles.skillBlock}>
          <p style={styles.skillLabel}>Offers</p>
          <div style={styles.tags}>
            {(profile.skillsOffered || []).length === 0 && (
              <span style={styles.muted}>No skills listed yet</span>
            )}
            {(profile.skillsOffered || []).map((s) =>
              hasShowcase(s) ? (
                <span key={s} style={styles.showcaseTag}>🏅 {s}</span>
              ) : (
                <span key={s} style={styles.offerTag}>{s}</span>
              )
            )}
          </div>
        </div>

        <div style={styles.skillBlock}>
          <p style={styles.skillLabel}>Wants to learn</p>
          <div style={styles.tags}>
            {(profile.skillsWanted || []).length === 0 && (
              <span style={styles.muted}>No skills listed yet</span>
            )}
            {(profile.skillsWanted || []).map((s) => (
              <span key={s} style={styles.wantTag}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Showcase */}
      <div style={{ ...styles.card, marginTop: '24px' }}>
        <h2 style={styles.sectionTitle}>Work showcase</h2>

        {showcasedSkills.length === 0 ? (
          <p style={styles.empty}>
            {isOwnProfile
              ? 'You have not added any work samples yet. Add links on your profile page to earn a showcase badge and show up first in search.'
              : `${profile.name} has not added any work samples yet.`}
          </p>
        ) : (
          showcasedSkills.map((skill) => (
            <div key={skill} style={styles.group}>
              <h3 style={styles.groupTitle}>🏅 {skill}</h3>
              <div style={styles.cardList}>
                {itemsForSkill(skill).map((item) => (
                  <ShowcaseCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#d00',
    padding: '12px',
    borderRadius: '8px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px',
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
  headerText: {
    flex: 1,
    minWidth: '160px',
  },
  name: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333',
  },
  meta: {
    fontSize: '13px',
    color: '#888',
    marginTop: '3px',
  },
  primaryBtn: {
    backgroundColor: '#6c63ff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    color: '#6c63ff',
    border: '1px solid #6c63ff',
    padding: '9px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  bio: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  skillBlock: {
    marginTop: '14px',
  },
  skillLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '6px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  muted: {
    fontSize: '13px',
    color: '#aaa',
  },
  offerTag: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  showcaseTag: {
    backgroundColor: '#fff4d6',
    color: '#8a5a00',
    border: '1px solid #f3d98a',
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
  },
  wantTag: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
  },
  empty: {
    fontSize: '14px',
    color: '#888',
    lineHeight: 1.6,
  },
  group: {
    marginBottom: '20px',
  },
  groupTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '10px',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
};

export default UserProfile;
