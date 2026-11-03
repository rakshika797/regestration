{/* Skill Portfolio Section */}
<div style={styles.formGroup}>
  <h3>My Skill Portfolio</h3>
  <p style={styles.hint}>
    Add projects and certificates to showcase your skills.
  </p>

  <label style={styles.label}>Select Skill</label>
  <select
    name="skill"
    value={portfolioDraft.skill}
    onChange={handlePortfolioChange}
    style={styles.input}
  >
    <option value="">Select a skill</option>
    {formData.skillsOffered
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s, i) => (
        <option key={i} value={s}>{s}</option>
      ))}
  </select>

  <label style={styles.label}>Project Title</label>
  <input
    name="title"
    value={portfolioDraft.title}
    onChange={handlePortfolioChange}
    placeholder="e.g. E-commerce Website"
    style={styles.input}
  />

  <label style={styles.label}>Project URL</label>
  <input
    name="url"
    value={portfolioDraft.url}
    onChange={handlePortfolioChange}
    placeholder="https://github.com/..."
    style={styles.input}
  />

  <label style={styles.label}>Description</label>
  <textarea
    name="description"
    value={portfolioDraft.description}
    onChange={handlePortfolioChange}
    placeholder="Describe your project..."
    style={styles.textarea}
    rows={2}
  />

  <label style={styles.label}>Certificate URL (Optional)</label>
  <input
    name="credentialUrl"
    value={portfolioDraft.credentialUrl}
    onChange={handlePortfolioChange}
    placeholder="https://..."
    style={styles.input}
  />

  <button
    type="button"
    onClick={addPortfolio}
    style={styles.button}
  >
    + Add Portfolio
  </button>

  {skillPortfolio.map((item, index) => (
    <div key={index} style={{ marginTop: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <strong>{item.title}</strong>
      <p>{item.skill}</p>
      <a href={item.url} target="_blank" rel="noreferrer">
        View Project
      </a>
    </div>
  ))}
</div>