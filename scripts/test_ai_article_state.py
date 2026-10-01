"""Synthetic TEST data only. No articles, network, Git writes, or package installs."""
from datetime import datetime, timedelta, timezone
import tempfile
import unittest
from unittest.mock import patch

from ai_article_state import Journal, JST, StateError


def candidate(**overrides):
    result = dict(name='TEST synthetic candidate', service='TEST service', feature='TEST feature',
                  use_case='TEST usage', source_urls=['https://example.invalid/test'],
                  announcement_url='https://example.invalid/announcement', summary='TEST only, not research',
                  decision='skipped', reason='TEST source insufficient',
                  reevaluate_when=['TEST official source becomes available'])
    result.update(overrides)
    return result


class JournalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.time = datetime(2026, 10, 1, 11, tzinfo=JST)
        self.journal = Journal(self.temp.name, clock=lambda: self.time, test_data=True)

    def payload(self, run_id='test-1', mode='normal', candidates=None):
        return dict(test_data=True, run=dict(run_id=run_id, mode=mode,
                    started_at=self.time.isoformat(), finished_at=self.time.isoformat(), result='TEST no publication'),
                    candidates=[candidate()] if candidates is None else candidates)

    def test_create_read_append_and_modes(self):
        state = self.journal.write('init')
        self.assertIsNone(state['publication_count'])
        self.assertEqual(state, self.journal.load())
        self.journal.write('record', self.payload())
        state = self.journal.write('record', self.payload('test-2', 'final', []))
        self.assertEqual(['normal', 'final'], [r['mode'] for r in state['runs']])
        self.assertEqual(['TEST official source becomes available'], state['candidates'][0]['observations'][0]['reevaluate_when'])

    def test_identity_renaming_announcement_and_distinct_use(self):
        self.journal.write('init')
        first = self.journal.write('record', self.payload())
        alias = candidate(name='Different TEST name', feature='Renamed TEST feature',
                          announcement_url='https://EXAMPLE.invalid/announcement/#section')
        state = self.journal.write('record', self.payload('test-2', candidates=[alias]))
        self.assertEqual(1, len(state['candidates']))
        self.assertEqual(first['candidates'][0]['id'], state['candidates'][0]['id'])
        state = self.journal.write('record', self.payload('test-3', candidates=[candidate(use_case='Different usage')]))
        self.assertEqual(2, len(state['candidates']))

    def test_reevaluation_keeps_rejection(self):
        self.journal.write('init')
        self.journal.write('record', self.payload())
        change = {'kind': 'source_found', 'detail': 'TEST new evidence', 'source_url': 'https://example.invalid/new'}
        adopted = candidate(decision='adopted', reason='TEST quality confirmed', changes=[change])
        state = self.journal.write('record', self.payload('test-2', 'final', [adopted]))
        history = state['candidates'][0]['observations']
        self.assertEqual(['skipped', 'adopted'], [o['decision'] for o in history])
        self.assertEqual(change, history[1]['changes'][0])

    def test_explicit_identity(self):
        self.journal.write('init')
        state = self.journal.write('record', self.payload())
        alias = candidate(service='TEST alias', feature='alias', use_case='alias',
                          existing_id=state['candidates'][0]['id'], identity_reason='TEST same function and purpose')
        state = self.journal.write('record', self.payload('test-2', candidates=[alias]))
        self.assertEqual(1, len(state['candidates']))

    def test_missing_corrupt_schema_and_test_isolation(self):
        with self.assertRaises(StateError):
            self.journal.load()
        path = self.journal.path(self.journal.today())
        for bad in ('{broken', '{}', '{"schema_version":1,"schema_version":1}'):
            path.write_text(bad, encoding='utf-8')
            with self.assertRaises(StateError):
                self.journal.load()
            with self.assertRaises(StateError):
                self.journal.write('record', self.payload())
            self.assertEqual(bad, path.read_text(encoding='utf-8'))
        path.unlink()  # Test-owned temporary file only.
        self.journal.write('init')
        with self.assertRaises(StateError):
            Journal(self.temp.name, clock=lambda: self.time).load()

    def test_date_rollover(self):
        self.journal.write('init')
        previous = self.journal.path(self.journal.today())
        self.time += timedelta(days=1)
        with self.assertRaises(StateError):
            self.journal.load()
        self.journal.write('init')
        self.assertNotEqual(previous, self.journal.path(self.journal.today()))
        self.assertTrue(previous.exists())
        self.assertIsNone(self.journal.load('2026-10-01')['publication_count'])

    def test_invalid_update_duplicate_run_and_lock_preserve_file(self):
        self.journal.write('init')
        self.journal.write('record', self.payload())
        path = self.journal.path(self.journal.today())
        original = path.read_bytes()
        for payload in (self.payload(), self.payload('test-2', mode='invalid'),
                        self.payload('test-2', candidates=[candidate(publication={'status':'verified'})])):
            with self.assertRaises(StateError):
                self.journal.write('record', payload)
            self.assertEqual(original, path.read_bytes())
        with self.assertRaises(StateError):
            self.journal.write('init')
        path.with_suffix('.lock').write_text('TEST lock')
        with self.assertRaises(StateError):
            self.journal.write('record', self.payload('test-2'))
        self.assertEqual(original, path.read_bytes())

    def test_publication_evidence_not_daily_count(self):
        self.journal.write('init')
        p = dict(status='verified', commit='a'*40, actions_url='https://example.invalid/actions/1',
                 build='success', deploy='success', http_status=200, title_match=True, h1_match=True,
                 body_match=True, first_published_at=self.time.isoformat(), checked_at=self.time.isoformat())
        c = candidate(article_file='site/_posts/2026-10-01-test.md', public_url='https://example.invalid/test/', publication=p)
        state = self.journal.write('record', self.payload(candidates=[c]))
        self.assertEqual(p, state['candidates'][0]['observations'][0]['publication'])
        self.assertIsNone(state['publication_count'])
        self.assertTrue(state['requires_publication_reconciliation'])

    def test_atomic_replace_failure(self):
        self.journal.write('init')
        path = self.journal.path(self.journal.today())
        original = path.read_bytes()
        with patch('ai_article_state.os.replace', side_effect=OSError('TEST disk failure')):
            with self.assertRaises(OSError):
                self.journal.write('record', self.payload())
        self.assertEqual(original, path.read_bytes())
        self.assertFalse(path.with_suffix('.lock').exists())
        self.assertEqual([], list(path.parent.glob('*.tmp')))

    def test_jst_boundary_independent_of_machine_timezone(self):
        self.time = datetime(2026, 9, 30, 15, tzinfo=timezone.utc)
        self.assertEqual('2026-10-01', self.journal.today())
        self.assertEqual('2026-10-01', self.journal.write('init')['date'])


if __name__ == '__main__':
    unittest.main()
