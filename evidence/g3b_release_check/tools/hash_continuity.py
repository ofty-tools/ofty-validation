#!/usr/bin/env python3
"""G3-B P1/P8 checks (frozen before any G3-B change).
P1: the eight retained G2-E files have the same SHA-256 in the baseline (S00) and in the G3-B tree; the new
    candidate/index.html differs from the old one; no file of candidate/m1-advanced/ exists; the candidate file list is
    exactly the expected set.
P8: root SHA256SUMS.txt and candidate/SHA256SUMS.txt verify; the root list covers every file except itself; the
    candidate list covers exactly the nine source files; neither list contains its own path.
Also: every file outside candidate/ (except files listed as documentation changes) is compared with S00.
Usage: python3 -I hash_continuity.py <S00_tree> <G3B_tree> <out_json>
"""
import hashlib, json, os, sys
s00, new, out = sys.argv[1], sys.argv[2], sys.argv[3]
H = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
RETAINED = ['gate2/index.html', 'gate2/semantic.cjs', 'gate2/session.js', 'iop-cct/index.html', 'orchestrator/index.html',
            'rnfl-progression/index.html', 'target-iop/index.html', 'vf-progression/index.html']
EXCLUDED = ['m1-advanced/build.manifest.json', 'm1-advanced/index.html', 'm1-advanced/m1_advanced_bundle.js', 'm1-advanced/m1_advanced_schema.json']
EXPECTED_CANDIDATE = sorted(RETAINED + ['index.html', 'README.md', 'SHA256SUMS.txt'])
def files(r):
    o = {}
    for dp, dn, fn in os.walk(r):
        for f in fn: p = os.path.join(dp, f); o[os.path.relpath(p, r)] = p
    return o
A, B = files(s00), files(new)
R = {'retained': [], 'checks': {}}
for f in RETAINED:
    a, b = H(A['candidate/' + f]), (H(B['candidate/' + f]) if 'candidate/' + f in B else None)
    R['retained'].append({'file': 'candidate/' + f, 'sha256_baseline': a, 'sha256_g3b': b, 'identical': a == b})
R['checks']['P1_eight_retained_identical'] = all(x['identical'] for x in R['retained']) and len(R['retained']) == 8
R['index_old'] = H(A['candidate/index.html']); R['index_new'] = H(B['candidate/index.html']) if 'candidate/index.html' in B else None
R['checks']['P1_index_new_hash'] = R['index_new'] is not None and R['index_new'] != R['index_old']
R['m1_advanced_present'] = sorted(k for k in B if k.startswith('candidate/m1-advanced/'))
R['checks']['P1_m1_advanced_zero_files'] = R['m1_advanced_present'] == []
cand = sorted(k[len('candidate/'):] for k in B if k.startswith('candidate/'))
R['candidate_files'] = cand
R['checks']['P1_candidate_file_set_exact'] = cand == EXPECTED_CANDIDATE
# P8 manifests
def check_list(root, listfile, rel_prefix=''):
    bad, entries = [], []
    for line in open(os.path.join(root, listfile)):
        h, p = line.rstrip('\n').split('  ', 1); entries.append(p)
        fp = os.path.join(root, p)
        if not os.path.isfile(fp) or H(fp) != h: bad.append(p)
    return entries, bad
re_, rb = check_list(new, 'SHA256SUMS.txt')
R['root_list_entries'] = len(re_); R['root_list_bad'] = rb
R['checks']['P8_root_list_verifies'] = rb == []
R['checks']['P8_root_list_covers_all_but_itself'] = sorted(re_) == sorted(k for k in B if k != 'SHA256SUMS.txt')
ce, cb = check_list(os.path.join(new, 'candidate'), 'SHA256SUMS.txt')
R['candidate_list_entries'] = sorted(ce); R['candidate_list_bad'] = cb
R['checks']['P8_candidate_list_verifies'] = cb == []
R['checks']['P8_candidate_list_is_nine_sources'] = sorted(ce) == sorted(RETAINED + ['index.html'])
R['checks']['P8_no_self_reference'] = 'SHA256SUMS.txt' not in re_ and 'SHA256SUMS.txt' not in ce
# outside candidate: historical files identical to S00
HIST = ['OFTY_SUITE_TEST_RUNNER.html', 'LICENSE', 'rules/M1_rules.json', 'rules/M2_rules.json', 'rules/M3_rules.json', 'rules/M4_rules.json', 'rules/M5_rules.json', 'scenarios/manual_scenarios.json', 'scenarios/combinatorial_axes.json']
R['checks']['historical_files_identical_to_S00'] = all(H(A[f]) == H(B[f]) for f in HIST)
R['checks']['tests_tree_identical_to_S00_except_declared'] = True
R['changed_outside_candidate'] = sorted(k for k in B if not k.startswith('candidate/') and k in A and H(A[k]) != H(B[k]))
R['added_outside_candidate'] = sorted(k for k in B if not k.startswith('candidate/') and k not in A)
R['removed_outside_candidate'] = sorted(k for k in A if not k.startswith('candidate/') and k not in B)
R['tests_changed'] = [k for k in R['changed_outside_candidate'] + R['added_outside_candidate'] + R['removed_outside_candidate'] if k.startswith('tests/')]
R['checks']['tests_tree_identical_to_S00_except_declared'] = R['tests_changed'] == []
R['status'] = 'PASS' if all(R['checks'].values()) else 'FAIL'
json.dump(R, open(out, 'w'), indent=1)
print(json.dumps({'status': R['status'], 'checks': R['checks'], 'changed_outside_candidate': R['changed_outside_candidate'], 'added': R['added_outside_candidate'], 'removed': R['removed_outside_candidate']}, indent=1))
