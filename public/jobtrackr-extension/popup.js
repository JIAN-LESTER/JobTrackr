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
    return formattedText(div);
  };

  const normalizeFormattedText = (value) => {
    const lines = value
      .replace(/\r\n?/g, '\n')
      .split(/\n+/)
      .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
      .filter((line) => line && !/^show\s+(?:more|less)$/i.test(line));
    const text = lines.join('\n\n');
    return text ? text.slice(0, 5000) : null;
  };

  const textWithBreaks = (node) => {
    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
      return node.textContent || '';
    }

    const name = node.nodeName.toLowerCase();

    if (name === 'br') return '\n';

    let text = '';
    node.childNodes.forEach((child) => {
      text += textWithBreaks(child);
    });

    if (name === 'li') return `\n- ${text.trim()}\n`;

    if (['p', 'div', 'section', 'article', 'header', 'footer', 'ul', 'ol', 'table', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(name)) {
      return `\n${text.trim()}\n`;
    }

    return text;
  };

  const formattedText = (el) => el ? normalizeFormattedText(textWithBreaks(el)) : null;

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

  const firstFormattedText = (selectors) => {
    for (const selector of selectors) {
      const text = formattedText(document.querySelector(selector));
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
  const description = stripHtml(job.description)
    || firstFormattedText([
      '#jobDescriptionText',
      '[data-testid="jobDescription"]',
      '[data-testid="job-description"]',
      '[data-test="job-description"]',
      '[data-test-id="job-description"]',
      '[data-automation="jobDescription"]',
      '.jobs-description-content__text',
      '.jobs-description',
      '.jobsearch-jobDescriptionText',
      '.job-description',
      '.description__text',
      '.show-more-less-html',
    ])
    || clean(metaContent('name', 'description'))
    || clean(metaContent('property', 'og:description'));

  return {
    company: clean(job.hiringOrganization?.name)
      || firstText([
        '[data-testid="company-name"]',
        '[data-test="company-name"]',
        '[data-test-id="company-name"]',
        '[data-automation="advertiser-name"]',
        '[itemprop="hiringOrganization"] [itemprop="name"]',
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.jobsearch-InlineCompanyRating-companyHeader',
        '.topcard__org-name-link',
        '.topcard__flavor',
      ])
      || clean(metaContent('property', 'og:site_name')),
    job_title: clean(job.title)
      || firstText([
        '[data-testid="job-title"]',
        '[data-test="job-title"]',
        '[data-test-id="job-title"]',
        '[data-automation="job-detail-title"]',
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title',
        '.jobsearch-JobInfoHeader-title',
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
    job_description: description ? description.slice(0, 5000) : null,
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
