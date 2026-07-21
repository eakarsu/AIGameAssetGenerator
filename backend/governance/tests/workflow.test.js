'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../domain');

test('domain workflow accepts a reviewable, grounded case', () => {
  const evaluation = evaluate({
  brief: { id: 'brief-1', prompt: 'licensed forest hero', styleGuideVersion: 'style-2', requiredTags: ['hero'] },
  sources: [{ id: 'src-1', rightsBasis: 'licensed', licenseRef: 'license:1', sha256: 'a'.repeat(64) }],
  versions: [{ id: 'asset-1', version: 1, width: 1024, height: 1024, format: 'png',
    moderationStatus: 'passed', styleGuideVersion: 'style-2', tags: ['hero'] }],
  packageSpec: { width: 1024, height: 1024, format: 'png' }
});
  assert.deepEqual(evaluation.errors, []);
  assert.equal(evaluation.result.decision, 'reviewable');
  assert.ok(Array.isArray(evaluation.assumptions));
  assert.equal(typeof evaluation.uncertainty, 'object');
});

test('domain workflow fails closed on unsafe or incomplete input', () => {
  const evaluation = evaluate({ brief: {}, sources: [], versions: [] });
  assert.ok(evaluation.errors.length > 0);
  assert.notEqual(evaluation.result.decision, 'reviewable');
});
