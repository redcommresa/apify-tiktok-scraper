/**
 * Turn actor input into scrape jobs, and decide which search hits to keep.
 *
 * hashtags/searchQueries/profiles/postUrls are unioned (not either/or).
 * hashtags and searchQueries are real TikTok keyword searches, not hashtag
 * pages. hashtagMatches[i], when set, is the caption needle for hashtags[i]:
 * the TikTok query can be "Panadol Udahin aduhnya" while a post is kept if it
 * only mentions "Udahin aduhnya".
 */

function nonBlank(arr) {
  return (arr || []).map((value) => String(value ?? '').trim()).filter(Boolean);
}

export function buildJobs({ hashtags, hashtagMatches, searchQueries, profiles, postUrls, mode, queries }) {
  const jobs = [];

  (hashtags || []).forEach((raw, index) => {
    const query = String(raw ?? '').trim().replace(/^#/, '');
    if (!query) return;
    const matchRaw = hashtagMatches && hashtagMatches[index] != null
      ? String(hashtagMatches[index]).trim().replace(/^#/, '')
      : '';
    const job = { mode: 'search', query };
    if (matchRaw) job.match = matchRaw;
    jobs.push(job);
  });

  jobs.push(
    ...nonBlank(searchQueries).map((query) => ({ mode: 'search', query })),
    ...nonBlank(profiles).map((profile) => ({ mode: 'profile', query: profile.replace(/^@/, '') })),
    ...nonBlank(postUrls).map((url) => ({ mode: 'post', query: url })),
  );

  if (jobs.length === 0) {
    for (const query of nonBlank(queries)) {
      jobs.push({ mode: mode || 'search', query });
    }
  }

  return jobs;
}

export function collapseText(value) {
  return String(value || '').toLowerCase().replace(/[\s#]+/g, '');
}

/** Search jobs must mention the needle in the caption or hashtags.
 * "kafein / caffeine" matches either side. Profile and post jobs are not
 * filtered here — those queries are a username or a URL, not caption text. */
export function postMatchesQuery(wrapperItem, query) {
  const alternatives = String(query || '')
    .split('/')
    .map((part) => collapseText(part))
    .filter(Boolean);
  if (!alternatives.length) return true;

  const clock = wrapperItem.clockworks || {};
  const tags = (clock.hashtags || [])
    .map((tag) => (typeof tag === 'string' ? tag : tag?.name || ''))
    .join(' ');
  const haystack = collapseText(`${clock.text || ''} ${tags} ${wrapperItem.raw?.desc || ''} ${wrapperItem.compat?.text || ''}`);
  return alternatives.some((needle) => haystack.includes(needle));
}
