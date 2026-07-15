const baseUrlInput = document.getElementById('baseUrl');
const statusEl = document.getElementById('status');
const saveButton = document.getElementById('save');
const productionBaseUrl = 'https://jobtrackr-sglu.onrender.com';

chrome.storage.sync.get({ baseUrl: productionBaseUrl }, ({ baseUrl }) => {
  const savedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  const normalizedBaseUrl = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(savedBaseUrl)
    ? productionBaseUrl
    : savedBaseUrl;

  baseUrlInput.value = normalizedBaseUrl;
  chrome.storage.sync.set({ baseUrl: normalizedBaseUrl });
});

baseUrlInput.addEventListener('change', () => {
  chrome.storage.sync.set({ baseUrl: baseUrlInput.value.trim() });
});

// Runs inside the job page, not the popup.
async function extractJobData() {
  const clean = (v) => {
    if (v == null || typeof v !== 'string') return null;
    const t = v.replace(/\s+/g, ' ').trim();
    return t || null;
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

  const stripHtml = (html) => {
    if (!html) return null;
    const div = document.createElement('div');
    div.innerHTML = html;
    return formattedText(div);
  };

  const metaContent = (attr, value) => {
    const el = document.querySelector(`meta[${attr}="${value}"]`);
    return el ? el.getAttribute('content') : null;
  };

  const waitForElement = (selectors, timeout = 10000) => new Promise((resolve) => {
    const findElement = () => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        const text = clean(element?.innerText || element?.textContent);

        if (text) return element;
      }

      return null;
    };

    const existing = findElement();

    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = findElement();

      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });

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

  const firstClean = (values) => {
    for (const value of values) {
      const text = clean(value);
      if (text) return text;
    }

    return null;
  };

  const matchText = (text, values) => {
    const source = clean(text);
    if (!source) return null;

    return values.find((value) => new RegExp(`\\b${value}\\b`, 'i').test(source)) || null;
  };

  const findJobPosting = (value) => {
    if (!value) return null;

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findJobPosting(item);
        if (result) return result;
      }

      return null;
    }

    if (typeof value !== 'object') return null;

    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];

    if (types.includes('JobPosting')) return value;
    if (value['@graph']) return findJobPosting(value['@graph']);

    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') {
        const result = findJobPosting(child);
        if (result) return result;
      }
    }

    return null;
  };

  const extractJobPostingJsonLd = () => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      let parsed;

      try {
        parsed = JSON.parse(script.textContent);
      } catch {
        continue;
      }

      const posting = findJobPosting(parsed);
      if (posting) return posting;
    }

    return null;
  };

  const locationFromJobPosting = (job) => {
    const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
    const address = loc?.address || loc;

    if (address && typeof address === 'object') {
      return clean([
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
        address.addressCountry,
      ].filter(Boolean).join(', '));
    }

    return clean(address);
  };

  const normalizeJsonLd = (job) => {
    if (!job) return {};

    const salary = job.baseSalary?.value;

    return {
      company: clean(job.hiringOrganization?.name),
      job_title: clean(job.title),
      location: locationFromJobPosting(job),
      job_type: clean(Array.isArray(job.employmentType) ? job.employmentType.join(', ') : job.employmentType),
      work_setup: job.jobLocationType === 'TELECOMMUTE' ? 'Remote' : null,
      salary_min: typeof salary === 'object' ? (salary?.minValue ?? salary?.value) : salary,
      salary_max: typeof salary === 'object' ? (salary?.maxValue ?? salary?.value) : salary,
      job_description: stripHtml(job.description),
    };
  };

  const adapters = {
    linkedin: {
      title: [
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title',
        '.topcard__title',
        'h1',
      ],
      company: [
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.topcard__org-name-link',
        '.topcard__flavor',
      ],
      location: [
        '.job-details-jobs-unified-top-card__bullet',
        '.topcard__flavor--bullet',
        '.job-search-card__location',
      ],
      description: [
        '.jobs-description__content',
        '.jobs-description-content__text',
        '.jobs-description',
        '.show-more-less-html__markup',
        '.show-more-less-html',
      ],
      topCard: [
        '.job-details-jobs-unified-top-card__primary-description-container',
        '.topcard__flavor-row',
      ],
    },
    indeed: {
      title: [
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        '.jobsearch-JobInfoHeader-title',
        'h1',
      ],
      company: [
        '[data-testid="inlineHeader-companyName"]',
        '[data-testid="company-name"]',
        '.jobsearch-InlineCompanyRating-companyHeader',
      ],
      location: [
        '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
        '[data-testid="job-location"]',
      ],
      description: [
        '#jobDescriptionText',
        '[data-testid="jobsearch-JobComponent-description"]',
        '.jobsearch-jobDescriptionText',
      ],
      topCard: [
        '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
      ],
    },
    jobstreet: {
      title: [
        '[data-automation="job-detail-title"]',
        '[data-testid="job-title"]',
        'h1',
      ],
      company: [
        '[data-automation="advertiser-name"]',
        '[data-testid="company-name"]',
        '[data-automation="company-name"]',
      ],
      location: [
        '[data-automation="job-detail-location"]',
        '[data-testid="job-location"]',
      ],
      description: [
        '[data-automation="jobAdDetails"]',
        '[data-automation="jobDescription"]',
        '[data-testid="job-description"]',
        'main',
      ],
      topCard: [
        '[data-automation="job-detail-location"]',
      ],
    },
    generic: {
      title: [
        '[data-testid="job-title"]',
        '[data-test="job-title"]',
        '[data-test-id="job-title"]',
        'h1',
      ],
      company: [
        '[data-testid="company-name"]',
        '[data-test="company-name"]',
        '[data-test-id="company-name"]',
        '[itemprop="hiringOrganization"] [itemprop="name"]',
      ],
      location: [
        '[data-testid="job-location"]',
        '[data-test="job-location"]',
        '[data-test-id="job-location"]',
      ],
      description: [
        '[data-testid="jobDescription"]',
        '[data-testid="job-description"]',
        '[data-test="job-description"]',
        '[data-test-id="job-description"]',
        '[data-automation="jobDescription"]',
        '.job-description',
        '.description__text',
      ],
      topCard: [],
    },
  };

  const adapterForHost = () => {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('linkedin.com')) return adapters.linkedin;
    if (hostname.includes('indeed.com')) return adapters.indeed;
    if (hostname.includes('jobstreet.')) return adapters.jobstreet;

    return adapters.generic;
  };

  const extractDomData = async (adapter, shouldWaitForDescription) => {
    const descriptionElement = shouldWaitForDescription
      ? await waitForElement(adapter.description)
      : null;
    const description = formattedText(descriptionElement)
      || firstFormattedText(adapter.description)
      || clean(metaContent('name', 'description'))
      || clean(metaContent('property', 'og:description'));
    const topCardText = firstText(adapter.topCard);
    const topCardParts = topCardText ? topCardText.split(/\s*(?:\u00b7|\||-)\s*/u).map(clean).filter(Boolean) : [];
    const locationFromTopCard = topCardParts.find((part, index) =>
      index > 0 && !matchText(part, ['Remote', 'Hybrid', 'On-site', 'Onsite'])
    );
    const bodyText = clean(document.body.innerText);

    return {
      company: firstText(adapter.company) || clean(metaContent('property', 'og:site_name')),
      job_title: firstText(adapter.title) || clean(metaContent('property', 'og:title')) || clean(document.title),
      location: firstText(adapter.location) || locationFromTopCard,
      job_type: matchText(topCardText || bodyText, ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary']),
      work_setup: matchText(topCardText || bodyText, ['Remote', 'Hybrid', 'On-site', 'Onsite']),
      job_description: description,
    };
  };

  const jsonLdData = normalizeJsonLd(extractJobPostingJsonLd());
  const domData = await extractDomData(adapterForHost(), !jsonLdData.job_description);
  const bodyText = clean(document.body.innerText);
  const workSetup = firstClean([jsonLdData.work_setup, domData.work_setup, matchText(bodyText, ['Remote', 'Hybrid', 'On-site', 'Onsite'])]);
  const jobType = firstClean([jsonLdData.job_type, domData.job_type, matchText(bodyText, ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary'])]);

  return {
    company: jsonLdData.company || domData.company,
    job_title: jsonLdData.job_title || domData.job_title,
    location: jsonLdData.location || domData.location,
    job_type: jobType,
    work_setup: workSetup === 'Onsite' ? 'On-site' : workSetup,
    salary_min: jsonLdData.salary_min,
    salary_max: jsonLdData.salary_max,
    job_description: (jsonLdData.job_description || domData.job_description || null)?.slice(0, 5000) || null,
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
  statusEl.textContent = 'Reading job details...';

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
