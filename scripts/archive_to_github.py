#!/usr/bin/env python3
"""Verified GitHub archive; only confirmed old generated files are pruned."""
import datetime as dt, fcntl, hashlib, json, os, re, shutil, subprocess, tempfile
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT = Path(__file__).resolve().parents[1]
REMOTE = 'https://github.com/HeySeeTech/Crypto-Charting.git'
TZ = ZoneInfo('Asia/Shanghai')
def run(*args, cwd=None):
    return subprocess.check_output(args, cwd=cwd, stderr=subprocess.STDOUT, text=True).strip()
def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    state = ROOT / '.archive-state'; state.mkdir(exist_ok=True)
    lock = (state/'lock').open('w')
    try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError: return
    today = dt.datetime.now(TZ).date().isoformat()
    candidates=[]
    for folder in ['crypto-charting-data','outputs','research','x-finance-os/CONTENT_DB']:
        base=ROOT/folder
        for p in sorted(base.rglob('*')):
            if not p.is_file() or p.is_symlink() or p.name.startswith('.'): continue
            rel=p.relative_to(ROOT)
            if any(x in {'node_modules','.git','__pycache__'} for x in rel.parts): continue
            match=re.search(r'20\d{2}-\d{2}-\d{2}',str(rel))
            date=match.group() if match else dt.datetime.fromtimestamp(p.stat().st_mtime,TZ).date().isoformat()
            permanent=folder.endswith('CONTENT_DB') or any(x in {'assets','references'} for x in rel.parts) or p.suffix in {'.py','.mjs','.js','.sh'}
            candidates.append((p,rel,date,permanent,digest(p)))
    with tempfile.TemporaryDirectory(prefix='crypto-github-') as temp:
        repo=Path(temp)/'repo'
        run('git','clone','--depth','1',REMOTE,str(repo))
        run('git','config','user.name','HeySeeTech',cwd=repo)
        run('git','config','user.email','HeySeeTech@users.noreply.github.com',cwd=repo)
        verified=[]
        for p,rel,date,permanent,sha in candidates:
            dest=Path('archive')/date/rel
            target=repo/dest
            if target.exists() and digest(target)!=sha:
                dest=dest.with_name(dest.stem+'.'+sha[:16]+dest.suffix); target=repo/dest
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(p,target)
            if digest(target)!=sha: raise RuntimeError(f'File changed during copy: {rel}')
            verified.append((p,dest,date,permanent,sha))
        for name in ['scripts/archive_to_github.py','ARCHIVE.md','AGENTS.md']:
            src=ROOT/name
            if src.exists():
                target=repo/name; target.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,target)
        run('git','add','--all',cwd=repo)
        if run('git','status','--porcelain',cwd=repo):
            run('git','commit','-m',f'Archive generated content {today}',cwd=repo)
            run('git','push','origin','HEAD:main',cwd=repo)
        head=run('git','rev-parse','HEAD',cwd=repo)
        remote_head=run('git','ls-remote','origin','refs/heads/main',cwd=repo).split()[0]
        if head!=remote_head: raise RuntimeError('Remote commit verification failed; local files retained')
        deleted=0
        for p,dest,date,permanent,sha in verified:
            # Verify the exact committed bytes before removing an unchanged local file.
            blob=subprocess.check_output(['git','show',f'{head}:{dest.as_posix()}'],cwd=repo)
            if hashlib.sha256(blob).hexdigest()!=sha: raise RuntimeError(f'Archive verification failed: {dest}')
            if date<today and not permanent and p.exists() and digest(p)==sha:
                p.unlink(); deleted+=1
        for folder in ['crypto-charting-data','outputs','research']:
            for p in sorted((ROOT/folder).rglob('*'),key=lambda x:len(x.parts),reverse=True):
                if p.is_dir() and not p.is_symlink():
                    try:p.rmdir()
                    except OSError:pass
        result={'time':dt.datetime.now(TZ).isoformat(),'commit':head,'archived_files':len(verified),'deleted_old_files':deleted}
        (state/'last-success.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
        print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__': main()
