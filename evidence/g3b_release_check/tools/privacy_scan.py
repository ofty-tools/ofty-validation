import os,re,sys,json,collections,hashlib
root=sys.argv[1]; out=sys.argv[2]
P={
 'secret_token':re.compile(r'(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_\-]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'),
 'credential_word':re.compile(r'(?i)\b(password|passwd|api[_-]?key|secret[_-]?key|access[_-]?token|bearer\s+[A-Za-z0-9])'),
 'email':re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'),
 'abs_local_path':re.compile(r'(/tmp/claude|/root/|/home/[a-z]|[A-Z]:\\\\?Users|/Users/[A-Za-z]|scratchpad|/mnt/user-data|/opt/[a-z])'),
 'medical_device_claim':re.compile(r'(?i)not a medical device'),
 'm1_advanced_ref':re.compile(r'(?i)m1-advanced|m1_advanced|M1 Advanced'),
 'rotterdam':re.compile(r'(?i)rotterdam|RW3_RUN|RW4_|DATASET ROTTERDAM'),
 'recovery_codes':re.compile(r'(?i)recovery[-_ ]codes'),
 'tracking':re.compile(r'(googletagmanager|gtag\(|G-[A-Z0-9]{8,}|google-analytics)'),
 'ipv4_non_local':re.compile(r'\b(?!127\.0\.0\.1\b)(?!0\.0\.0\.0\b)(?:\d{1,3}\.){3}\d{1,3}\b'),
 'patient_identifier_words':re.compile(r'(?i)\b(DNI|NHC|historia cl[ií]nica|patient name|fecha de nacimiento|date of birth)\b'),
}
rows=[]; counts=collections.Counter(); ext=collections.Counter(); hits={}
for dp,dn,fn in os.walk(root):
    dn[:]=[d for d in dn if d not in ('node_modules','.git','out')]
    for f in fn:
        p=os.path.join(dp,f); rel=os.path.relpath(p,root); b=open(p,'rb').read()
        e=os.path.splitext(f)[1].lower() or '(none)'; ext[e]+=1
        try: t=b.decode('utf-8'); kind='text'
        except UnicodeDecodeError: t=''; kind='BINARY'
        r={'path':rel,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'kind':kind}
        for k,rx in P.items():
            m=rx.findall(t)
            if m:
                vals=sorted(set(x if isinstance(x,str) else x[0] for x in m))
                r[k]=len(m); counts[k]+=1; hits.setdefault(k,{})[rel]=vals[:8]
        rows.append(r)
json.dump({'root':'<release tree>','files':len(rows),'extensions':ext,'files_with_hits':counts,'hits':hits},open(out,'w'),indent=1)
print('files',len(rows),dict(ext)); print('files with hits',dict(counts))
for k,v in hits.items():
    print('==',k)
    for rel,vals in list(v.items())[:40]: print('  ',rel,vals[:6])
