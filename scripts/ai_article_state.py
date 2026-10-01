"""Local daily research journal. Standard library only; never publishes or counts posts."""
import argparse
import copy
from datetime import date, datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import unicodedata
from urllib.parse import urlsplit, urlunsplit
import uuid

JST = timezone(timedelta(hours=9), 'Asia/Tokyo')
ROOT = Path(__file__).resolve().parents[1] / 'runtime' / 'ai-article-state'
CHANGES = {'official_update', 'availability', 'pricing', 'new_usage', 'source_found'}
PUBLICATION = {'not_started', 'in_progress', 'verified', 'failed', 'unknown'}


class StateError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise StateError(message)


def now():
    return datetime.now(JST)


def day_string(value):
    require(isinstance(value, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', value), 'Invalid date')
    try:
        date.fromisoformat(value)
    except ValueError as exc:
        raise StateError('Invalid date') from exc
    return value


def text(value):
    return isinstance(value, str) and bool(value.strip())


def timestamp(value, day=None):
    try:
        dt = datetime.fromisoformat(value)
        require(dt.utcoffset() == timedelta(hours=9), 'Timestamp must use +09:00')
        if day:
            require(dt.date().isoformat() == day, 'Timestamp/date mismatch')
        return dt
    except (ValueError, TypeError) as exc:
        raise StateError('Invalid JST timestamp') from exc


def normalize(value):
    return ' '.join(unicodedata.normalize('NFKC', value).casefold().split())


def url_key(value):
    require(text(value), 'URL required')
    u = urlsplit(value)
    require(u.scheme in ('https', 'http') and bool(u.netloc) and not u.username, 'Invalid URL')
    # Keep query parameters: they can identify different official announcements.
    return urlunsplit((u.scheme.lower(), u.netloc.lower(), u.path.rstrip('/'), u.query, ''))


def read_json(path):
    def unique(pairs):
        obj = {}
        for key, value in pairs:
            require(key not in obj, 'Duplicate JSON key: ' + key)
            obj[key] = value
        return obj
    try:
        return json.loads(path.read_text(encoding='utf-8-sig'), object_pairs_hook=unique,
                          parse_constant=lambda value: require(False, 'Invalid JSON constant'))
    except (OSError, ValueError) as exc:
        raise StateError(f'Cannot read {path}: {exc}; publication count UNKNOWN') from exc


def validate_observation(c):
    require(isinstance(c, dict), 'Candidate must be an object')
    for key in ('name', 'service', 'feature', 'use_case', 'summary', 'reason'):
        require(text(c.get(key)), 'Candidate field required: ' + key)
    require(c.get('decision') in ('adopted', 'skipped', 'pending'), 'Invalid decision')
    require(isinstance(c.get('source_urls'), list) and c['source_urls'], 'Primary sources required')
    for url in c['source_urls']:
        url_key(url)
    if c.get('announcement_url'):
        url_key(c['announcement_url'])
    require(isinstance(c.get('reevaluate_when'), list) and all(text(x) for x in c['reevaluate_when']),
            'reevaluate_when must be a text list')
    require(isinstance(c.get('changes', []), list), 'changes must be a list')
    for change in c.get('changes', []):
        require(isinstance(change, dict) and change.get('kind') in CHANGES and text(change.get('detail')),
                'Invalid reevaluation evidence')
        url_key(change.get('source_url'))
    article = c.get('article_file')
    if article is not None:
        require(isinstance(article, str) and re.fullmatch(r'site/_posts/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md', article),
                'Invalid article path')
    if c.get('public_url') is not None:
        url_key(c['public_url'])
    p = c.get('publication', {'status': 'not_started'})
    require(isinstance(p, dict) and p.get('status') in PUBLICATION, 'Invalid publication status')
    if p['status'] == 'verified':
        require(article and c.get('public_url'), 'Verified publication requires article and URL')
        require(isinstance(p.get('commit'), str) and re.fullmatch(r'[0-9a-f]{40}', p['commit']), 'Commit required')
        url_key(p.get('actions_url'))
        require(p.get('build') == 'success' and p.get('deploy') == 'success' and
                p.get('http_status') == 200 and p.get('title_match') is True and
                p.get('h1_match') is True and p.get('body_match') is True, 'Publication evidence incomplete')
        timestamp(p.get('first_published_at'))
        timestamp(p.get('checked_at'))


def validate(state, day, test_data):
    require(isinstance(state, dict) and state.get('schema_version') == 1, 'Unsupported state schema')
    require(state.get('date') == day and state.get('timezone') == 'Asia/Tokyo', 'Wrong state date/timezone')
    require(type(state.get('test_data')) is bool and state['test_data'] == test_data,
            'Test/production state mismatch')
    timestamp(state.get('created_at'), day)
    timestamp(state.get('updated_at'), day)
    require(state.get('publication_count') is None and state.get('requires_publication_reconciliation') is True,
            'JSON must not assert a daily publication count')
    require(isinstance(state.get('runs'), list) and isinstance(state.get('candidates'), list), 'Missing journal lists')
    run_ids = set()
    for run in state['runs']:
        require(isinstance(run, dict) and text(run.get('run_id')) and run['run_id'] not in run_ids, 'Invalid/duplicate run')
        run_ids.add(run['run_id'])
        require(run.get('mode') in ('normal', 'final') and text(run.get('result')), 'Invalid run mode/result')
        require(timestamp(run.get('started_at'), day) <= timestamp(run.get('finished_at'), day), 'Run time order')
    ids = set()
    for c in state['candidates']:
        require(isinstance(c, dict) and text(c.get('id')) and c['id'] not in ids, 'Invalid candidate ID')
        ids.add(c['id'])
        require(isinstance(c.get('observations'), list) and c['observations'], 'Missing candidate history')
        for obs in c['observations']:
            validate_observation(obs)
            require(obs.get('run_id') in run_ids, 'Unknown observation run')
    for run in state['runs']:
        require(isinstance(run.get('candidate_ids'), list) and all(x in ids for x in run['candidate_ids']), 'Unknown run candidate')


def same_candidate(a, b):
    service_usage = all(normalize(a[k]) == normalize(b[k]) for k in ('service', 'use_case'))
    announcement = a.get('announcement_url') and b.get('announcement_url') and url_key(a['announcement_url']) == url_key(b['announcement_url'])
    return service_usage and (normalize(a['feature']) == normalize(b['feature']) or announcement)


class Journal:
    def __init__(self, root=ROOT, clock=now, test_data=False):
        self.root, self.clock, self.test_data = Path(root), clock, test_data

    def today(self):
        return self.clock().astimezone(JST).date().isoformat()

    def path(self, day):
        return self.root / (day_string(day) + '.json')

    def load(self, day=None):
        day = day or self.today()
        state = read_json(self.path(day))  # Missing is an error, never an empty journal.
        validate(state, day, self.test_data)
        return state

    def write(self, operation, payload=None):
        day = self.today()
        self.root.mkdir(parents=True, exist_ok=True)
        path = self.path(day)
        lock = path.with_suffix('.lock')
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError as exc:
            raise StateError('State locked; do not retry or remove a lock blindly') from exc
        os.close(fd)
        temporary = None
        try:
            if operation == 'init':
                require(not path.exists(), 'State already exists; refusing overwrite')
                stamp = self.clock().astimezone(JST).isoformat()
                state = dict(schema_version=1, date=day, timezone='Asia/Tokyo', test_data=self.test_data,
                             created_at=stamp, updated_at=stamp, publication_count=None,
                             requires_publication_reconciliation=True, runs=[], candidates=[])
            else:
                require(operation == 'record', 'Unknown operation')
                state = self.load(day)
                self.record(state, copy.deepcopy(payload))
            require(self.today() == day, 'Day changed; stop and reconcile')
            state['updated_at'] = self.clock().astimezone(JST).isoformat()
            validate(state, day, self.test_data)
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=self.root, suffix='.tmp', delete=False) as f:
                temporary = Path(f.name)
                json.dump(state, f, ensure_ascii=False, indent=2, allow_nan=False)
                f.write('\n')
                f.flush()
                os.fsync(f.fileno())
            os.replace(temporary, path)
            return state
        finally:
            if temporary and temporary.exists():
                temporary.unlink()
            lock.unlink()

    def record(self, state, payload):
        require(isinstance(payload, dict) and payload.get('test_data') is self.test_data, 'Payload test flag mismatch')
        run = payload.get('run')
        require(isinstance(run, dict) and text(run.get('run_id')), 'run_id required')
        require(not any(r['run_id'] == run['run_id'] for r in state['runs']), 'Run already recorded')
        require(isinstance(payload.get('candidates'), list), 'Candidate list required (may be empty)')
        run['candidate_ids'] = []
        for obs in payload['candidates']:
            validate_observation(obs)
            explicit = obs.pop('existing_id', None)
            if explicit:
                require(text(obs.get('identity_reason')), 'Explicit identity needs identity_reason')
                matches = [c for c in state['candidates'] if c['id'] == explicit]
                require(len(matches) == 1, 'Unknown existing_id')
            else:
                matches = [c for c in state['candidates'] if any(same_candidate(o, obs) for o in c['observations'])]
            require(len(matches) <= 1, 'Ambiguous identity; inspect history and specify existing_id')
            if matches:
                candidate = matches[0]
            else:
                candidate = {'id': str(uuid.uuid4()), 'observations': []}
                state['candidates'].append(candidate)
            require(candidate['id'] not in run['candidate_ids'], 'Same candidate twice in one run')
            # Defaults remain explicit in the persisted history.
            obs.setdefault('article_file', None)
            obs.setdefault('public_url', None)
            obs.setdefault('publication', {'status': 'not_started'})
            obs.setdefault('changes', [])
            obs['run_id'] = run['run_id']
            candidate['observations'].append(obs)
            run['candidate_ids'].append(candidate['id'])
        state['runs'].append(run)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['init', 'show', 'record'])
    parser.add_argument('--input', type=Path, help='record payload JSON')
    parser.add_argument('--date', help='Historical read only; mutations always use current JST date')
    parser.add_argument('--test-data', action='store_true', help='Use isolated ignored test-data/ directory')
    args = parser.parse_args()
    root = ROOT / 'test-data' if args.test_data else ROOT
    journal = Journal(root, test_data=args.test_data)
    try:
        require(not args.date or args.command == 'show', '--date is read-only')
        require((args.input is not None) == (args.command == 'record'), '--input is required only for record')
        state = journal.load(args.date) if args.command == 'show' else journal.write(
            args.command, read_json(args.input) if args.input else None)
        print(json.dumps({'state': state, 'publication_count': None,
                          'warning': 'Reconcile dated posts AND actual publication history before generation/publication.',
                          'historical': state['date'] != journal.today()}, ensure_ascii=False, indent=2))
    except (StateError, OSError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
