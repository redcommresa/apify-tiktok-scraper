import assert from 'node:assert/strict';
import test from 'node:test';
import { buildJobs, postMatchesQuery } from '../src/searchJobs.js';

const sloganOnly = {
  clockworks: { text: 'Udahin aduhnya bikin lega', hashtags: [] },
};

test('optional keyword searches the brand phrase and matches the slogan', () => {
  const jobs = buildJobs({
    hashtags: ['panadol', 'panadol udahin aduhnya'],
    hashtagMatches: ['panadol', 'udahin aduhnya'],
  });
  assert.deepEqual(jobs, [
    { mode: 'search', query: 'panadol', match: 'panadol' },
    { mode: 'search', query: 'panadol udahin aduhnya', match: 'udahin aduhnya' },
  ]);
  const sloganJob = jobs[1];
  assert.equal(postMatchesQuery(sloganOnly, sloganJob.match || sloganJob.query), true);
  assert.equal(postMatchesQuery(sloganOnly, sloganJob.query), false);
});

test('a blank hashtag does not shift the match needle', () => {
  const jobs = buildJobs({
    hashtags: ['', 'panadol udahin aduhnya'],
    hashtagMatches: ['ignored', 'udahin aduhnya'],
  });
  assert.deepEqual(jobs, [
    { mode: 'search', query: 'panadol udahin aduhnya', match: 'udahin aduhnya' },
  ]);
});

test('missing match needle falls back to the search query', () => {
  const jobs = buildJobs({ hashtags: ['panadol udahin aduhnya'] });
  assert.deepEqual(jobs, [{ mode: 'search', query: 'panadol udahin aduhnya' }]);
  assert.equal(postMatchesQuery(sloganOnly, jobs[0].match || jobs[0].query), false);
});
