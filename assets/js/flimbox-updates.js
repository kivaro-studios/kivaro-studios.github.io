const latestContainer = document.querySelector('[data-flimbox-latest]');
const releasesContainer = document.querySelector('[data-flimbox-releases]');

let cachedLatest = null;
let cachedReleases = [];

const getText = (key, vars = {}) => {
  if (window.kivaroSite) return window.kivaroSite.t(`flimbox.${key}`, vars);
  return '';
};

const formatDate = (value) => {
  try {
    const locale = window.kivaroSite && window.kivaroSite.getLanguage() === 'en' ? 'en-US' : 'it-IT';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const renderLatest = (release) => {
  if (!latestContainer) return;
  latestContainer.innerHTML = `
    <div class="highlight-box stack">
      <div class="release-header">
        <div>
          <span class="tag">${getText('latestTag')}</span>
          <h3>FlimBox v${release.version}</h3>
          <p class="muted">${getText('publishedOn', { date: formatDate(release.publishedAt) })}</p>
        </div>
        ${release.mandatory ? `<span class="status-pill">${getText('mandatory')}</span>` : `<span class="card-badge">${getText('optional')}</span>`}
      </div>
      <div>
        <strong>${getText('mainChanges')}</strong>
        <ul class="list-check">
          ${release.notes.map((note) => `<li>${note}</li>`).join('')}
        </ul>
      </div>
      <div class="button-row">
        <a class="btn btn-primary" href="${release.downloadUrl}">${getText('downloadVersion', { version: release.version })}</a>
        ${release.releasePageUrl ? `<a class="btn btn-secondary" href="${release.releasePageUrl}">${getText('goToRelease')}</a>` : ''}
      </div>
      <details>
        <summary>${getText('showTechnicalInfo')}</summary>
        <div class="stack small" style="margin-top: 1rem;">
          <div><strong>${getText('sha')}</strong><div class="hash-text">${release.sha256 || getText('notAvailable')}</div></div>
          <div><strong>${getText('channel')}</strong> ${release.channel || 'stable'}</div>
          <div><strong>${getText('platform')}</strong> ${release.platform || 'windows-x64'}</div>
          <div><strong>${getText('size')}</strong> ${release.size || getText('notSpecified')}</div>
        </div>
      </details>
    </div>
  `;
};

const renderReleases = (releases) => {
  if (!releasesContainer) return;

  releasesContainer.innerHTML = releases.map((release) => `
    <article class="update-item">
      <div class="release-header">
        <div>
          <h4>${getText('versionLabel', { version: release.version })}</h4>
          <div class="update-meta">
            <time datetime="${release.publishedAt}">${formatDate(release.publishedAt)}</time>
            <span>• ${release.mandatory ? getText('requiredUpdate') : getText('optionalUpdate')}</span>
          </div>
        </div>
        <a class="btn btn-secondary" href="${release.downloadUrl}">${getText('download')}</a>
      </div>
      <ul class="list-check" style="margin-top: 1rem;">
        ${release.notes.map((note) => `<li>${note}</li>`).join('')}
      </ul>
    </article>
  `).join('');
};

const renderError = () => {
  const message = `<div class="notice">${getText('loadError')}</div>`;
  if (latestContainer) latestContainer.innerHTML = message;
  if (releasesContainer) releasesContainer.innerHTML = '';
};

const rerender = () => {
  if (cachedLatest) renderLatest(cachedLatest);
  if (cachedReleases.length) renderReleases(cachedReleases);
};

const loadUpdates = async () => {
  try {
    const [latestResponse, releasesResponse] = await Promise.all([
      fetch('../data/flimbox/latest.json'),
      fetch('../data/flimbox/releases.json')
    ]);

    if (!latestResponse.ok || !releasesResponse.ok) {
      throw new Error('Unable to load release data');
    }

    cachedLatest = await latestResponse.json();
    cachedReleases = await releasesResponse.json();

    renderLatest(cachedLatest);
    renderReleases(cachedReleases);
  } catch (error) {
    renderError();
  }
};

if (window.kivaroSite) {
  window.kivaroSite.onLanguageChange(() => {
    if (cachedLatest || cachedReleases.length) {
      rerender();
    }
  });
}

loadUpdates();
