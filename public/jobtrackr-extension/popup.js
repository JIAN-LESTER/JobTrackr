const baseUrlInput = document.getElementById('baseUrl');
const statusEl = document.getElementById('status');
const saveButton = document.getElementById('save');

chrome.storage.sync.get({ baseUrl: 'http://localhost:8000' }, ({ baseUrl }) => {
  baseUrlInput.value = baseUrl;
});

baseUrlInput.addEventListener('change', () => {
  chrome.storage.sync.set({ baseUrl: baseUrlInput.value.trim() });
});

// Runs *inside* the job page, not the popup — same JSON-LD/meta logic as the PHP crawler.
function extractJobData() {
  const clean = (v) => {
    if (v == null || typeof v !== 'string') return null;
    const t = v.replace(/\s+/g, ' ').trim();
    return t || null;
  };

  const stripHtml = (html) => {
    if (!html) return null;
    const div = document.createElement('div');
    div.innerHTML = html;
    return clean(div.textContent).slice(0, 3000);
  };

  const metaContent = (attr, value) => {
    const el = document.querySelector(`meta[${attr}="${value}"]`);
    return el ? el.getAttribute('content') : null;
  };

  const firstText = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = clean(el?.innerText || el?.textContent);
      if (text) return text;
    }

    return null;
  };

  const matchText = (text, values) => {
    const source = clean(text);
    if (!source) return null;

    return values.find((value) => new RegExp(`\\b${value}\\b`, 'i').test(source)) || null;
  };

  const findJobPosting = () => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      let data;
      try { data = JSON.parse(script.textContent); } catch { continue; }
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const all = item['@graph'] ? [item, ...item['@graph']] : [item];
        for (const candidate of all) {
          const types = Array.isArray(candidate['@type']) ? candidate['@type'] : [candidate['@type']];
          if (types.includes('JobPosting')) return candidate;
        }
      }
    }
    return null;
  };

  const job = findJobPosting() || {};
  const salary = job.baseSalary?.value;
  const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
  const address = loc?.address || loc;
  const locationText = typeof address === 'object' && address
    ? [address.addressLocality, address.addressRegion, address.addressCountry].filter(Boolean).join(', ')
    : address;
  const topCardText = firstText([
    '.job-details-jobs-unified-top-card__primary-description-container',
    '.topcard__flavor-row',
    '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
  ]);
  const topCardParts = topCardText ? topCardText.split('·').map(clean).filter(Boolean) : [];
  const locationFromTopCard = topCardParts.find((part, index) =>
    index > 0 && !matchText(part, ['Remote', 'Hybrid', 'On-site', 'Onsite'])
  );
  const bodyText = clean(document.body.innerText);
  const workSetup = job.jobLocationType === 'TELECOMMUTE'
    ? 'Remote'
    : matchText(topCardText || bodyText, ['Remote', 'Hybrid', 'On-site', 'Onsite']);
  const jobType = clean(job.employmentType)
    || matchText(topCardText || bodyText, ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary']);

  return {
    company: clean(job.hiringOrganization?.name)
      || firstText([
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.topcard__org-name-link',
        '.topcard__flavor',
      ])
      || clean(metaContent('property', 'og:site_name')),
    job_title: clean(job.title)
      || firstText([
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title',
        '.topcard__title',
        'h1',
      ])
      || clean(metaContent('property', 'og:title'))
      || clean(document.title),
    location: clean(locationText)
      || firstText([
        '.job-details-jobs-unified-top-card__bullet',
        '.topcard__flavor--bullet',
        '.job-search-card__location',
        '[data-testid="job-location"]',
      ])
      || locationFromTopCard,
    job_type: jobType,
    work_setup: workSetup === 'Onsite' ? 'On-site' : workSetup,
    salary_min: typeof salary === 'object' ? (salary?.minValue ?? salary?.value) : salary,
    salary_max: typeof salary === 'object' ? (salary?.maxValue ?? salary?.value) : salary,
    job_description: stripHtml(job.description) || clean(metaContent('name', 'description')),
    url: window.location.href,
  };
}

saveButton.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, '');

  if (!tab || !tab.url || !baseUrl) {
    statusEl.textContent = 'Missing page or JobTrackr URL.';
    return;
  }

  await chrome.storage.sync.set({ baseUrl });
  statusEl.textContent = 'Reading job details…';

  let extracted = {};
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobData,
    });
    extracted = result || {};
  } catch (err) {
    console.error(err);
  }

  extracted.url = extracted.url || tab.url;

  const payload = encodeURIComponent(JSON.stringify({ baseUrl, ...extracted }));
  chrome.tabs.create({ url: chrome.runtime.getURL(`bridge.html?data=${payload}`) });
  statusEl.textContent = 'Sent to JobTrackr.';
});
