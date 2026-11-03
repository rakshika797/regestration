import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

const Search = () => {
  const [skill, setSkill] = useState('');
  const [location, setLocation] = useState('');
  const [searchedSkill, setSearchedSkill] = useState(''); // the skill the results belong to
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!skill.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const params = { skill: skill.trim() };
      if (location.trim()) params.location = location.trim();

      const { data } = await axios.get('/users/search', { params });
      setResults(data.users);
      setSearchedSkill(skill.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Find skills</h1>
        <p style={styles.subtitle}>
          Search for people offering skills you want to learn. Profiles with work samples
          appear first.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="What skill are you looking for? (e.g. JavaScript)"
          style={styles.searchInput}
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          style={{ ...styles.searchInput, maxWidth: '200px' }}
        />
        <button type="submit" style={styles.searchBtn} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {/* Results */}
      {searched && !loading && !error && (
        <div style={styles.resultsSection}>
          <p style={styles.resultCount}>
            {results.length === 0
              ? 'No one offers this skill yet. Try a different spelling or a related skill.'
              : `Found ${results.length} user${results.length > 1 ? 's' : ''}`}
          </p>

          <div style={styles.grid} className="search-grid">
            {results.map((u) => {
              const showcased = new Set((u.showcasedSkills || []).map((s) => s.toLowerCase()));
              const matched = u.matchedPortfolioCount || 0;

              return (
                <div
                  key={u._id}
                  style={matched > 0 ? { ...styles.card, ...styles.cardShowcase } : styles.card}
                >
                  {matched > 0 && (
                    <div style={styles.showcaseRibbon}>
                      🏅 {matched} work sample{matched > 1 ? 's' : ''} for {searchedSkill}
                    </div>
                  )}

                  <div style={styles.avatar}>{u.name.charAt(0).toUpperCase()}</div>

                  <h3 style={styles.userName}>{u.name}</h3>

                  {u.location && <p style={styles.location}>📍 {u.location}</p>}

                  {u.bio && u.bio.trim() && <p style={styles.bio}>{u.bio}</p>}

                  {/* Skills Offered */}
                  <div style={styles.skillSection}>
                    <p style={styles.skillLabel}>Offers</p>
                    <div style={styles.skillTags}>
                      {u.skillsOffered.map((s, i) =>
                        showcased.has(s.toLowerCase()) ? (
                          <span key={i} style={styles.showcaseTag}>🏅 {s}</span>
                        ) : (
                          <span key={i} style={styles.offerTag}>{s}</span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Skills Wanted */}
                  <div style={styles.skillSection}>
                    <p style={styles.skillLabel}>Wants to learn</p>
                    <div style={styles.skillTags}>
                      {u.skillsWanted.map((s, i) => (
                        <span key={i} style={styles.wantTag}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div style={styles.cardFooter}>
                    <span style={styles.credits}>⭐ {u.credits} credits</span>
                    <div style={styles.footerButtons}>
                      <button
                        style={styles.profileBtn}
                        onClick={() => navigate(`/users/${u._id}`)}
                      >
                        View profile
                      </button>
                      <button
                        style={styles.swapBtn}
                        onClick={() => navigate(`/swaps/new/${u._id}`)}
                      >
                        Request swap
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#666',
    fontSize: '16px',
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    minWidth: '200px',
  },
  searchBtn: {
    padding: '12px 28px',
    backgroundColor: '#6c63ff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#d00',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  resultsSection: {
    marginTop: '8px',
  },
  resultCount: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    border: '1px solid transparent',
  },
  cardShowcase: {
    border: '1px solid #f3d98a',
    boxShadow: '0 2px 14px rgba(243, 217, 138, 0.45)',
  },
  showcaseRibbon: {
    backgroundColor: '#fff4d6',
    color: '#8a5a00',
    fontSize: '12px',
    fontWeight: '700',
    padding: '6px 10px',
    borderRadius: '6px',
    marginBottom: '14px',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#6c63ff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  userName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '4px',
  },
  location: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '8px',
  },
  bio: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  skillSection: {
    marginBottom: '10px',
  },
  skillLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '6px',
  },
  skillTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  offerTag: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  showcaseTag: {
    backgroundColor: '#fff4d6',
    color: '#8a5a00',
    border: '1px solid #f3d98a',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  wantTag: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
  credits: {
    fontSize: '13px',
    color: '#888',
  },
  footerButtons: {
    display: 'flex',
    gap: '8px',
  },
  profileBtn: {
    backgroundColor: 'white',
    color: '#6c63ff',
    border: '1px solid #6c63ff',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  swapBtn: {
    backgroundColor: '#6c63ff',
    color: 'white',
    border: '1px solid #6c63ff',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Search;
