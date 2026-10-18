"""Reuse GitHub blobs for archival without downloading historical attachments."""
import base64, datetime as dt, fcntl, hashlib, json, re, subprocess
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo
REPO='HeySeeTech/Crypto-Charting'
def api(path,method='GET',body=None):
    args=['gh','api',f'repos/{REPO}/{path}','--method',method]
    if body is not None:args+=['--input','-']
    r=subprocess.run(args,input=json.dumps(body) if body is not None else None,text=True,capture_output=True,timeout=180)
    if r.returncode:raise RuntimeError(r.stderr)
    return json.loads(r.stdout)
def sha(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def sync(root,category,categories):
    tz=ZoneInfo('Asia/Shanghai');today=dt.datetime.now(tz).date().isoformat()
    state=root/'.archive-state';state.mkdir(exist_ok=True);lock=(state/'lock').open('w')
    try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:raise RuntimeError('Another sync is running')
    head=api('git/ref/heads/main')['object']['sha'];tree=api(f'git/trees/{head}?recursive=1')
    if tree.get('truncated'):raise RuntimeError('Incomplete file inventory')
    original={r['path']:{'sha':r['sha'],'mode':r['mode'],'size':r.get('size',0)} for r in tree['tree'] if r['type']=='blob'}
    entries=dict(original);known={r['sha'] for r in entries.values()};pending=[]
    def put(path,data):
        ident=sha(data)
        if ident not in known:
            actual=api('git/blobs','POST',{'content':base64.b64encode(data).decode(),'encoding':'base64'})['sha']
            if actual!=ident:raise RuntimeError('Uploaded blob mismatch')
            known.add(ident)
        entries[path]={'sha':ident,'mode':'100644','size':len(data)}
    migrated=0
    for path,row in list(entries.items()):
        parts=Path(path).parts
        if len(parts)<4 or parts[0]!='archive' or parts[2] not in {'crypto-charting-data','outputs','research','x-finance-os'}:continue
        rel=Path(*parts[2:]);dest=Path('archive')/parts[1]/category(rel)/rel
        if str(dest) in entries and entries[str(dest)]['sha']!=row['sha']:dest=dest.with_name(dest.stem+'.'+row['sha'][:16]+dest.suffix)
        entries[str(dest)]=row;del entries[path];migrated+=1
    for folder in ['crypto-charting-data','outputs','research','x-finance-os/CONTENT_DB']:
        for p in sorted((root/folder).rglob('*')):
            if not p.is_file() or p.is_symlink() or p.name.startswith('.'):continue
            rel=p.relative_to(root)
            if any(x in {'node_modules','.git','__pycache__'} for x in rel.parts):continue
            match=re.search(r'20\d{2}-\d{2}-\d{2}',str(rel))
            date=match.group() if match else dt.datetime.fromtimestamp(p.stat().st_mtime,tz).date().isoformat()
            if folder.endswith('CONTENT_DB'):date=today
            data=p.read_bytes();ident=sha(data);dest=Path('archive')/date/category(rel)/rel
            if str(dest) in entries and entries[str(dest)]['sha']!=ident:dest=dest.with_name(dest.stem+'.'+hashlib.sha256(data).hexdigest()[:16]+dest.suffix)
            put(str(dest),data)
            permanent=folder.endswith('CONTENT_DB') or any(x in {'assets','references'} for x in rel.parts) or p.suffix in {'.py','.mjs','.js','.sh'}
            pending.append((p,str(dest),date,permanent,ident))
    days={}
    for path,row in list(entries.items()):
        parts=Path(path).parts
        if len(parts)>=5 and parts[0]=='archive' and parts[2] in categories:days.setdefault(parts[1],[]).append({'path':'/'.join(parts[2:]),'category':parts[2],'git_blob_sha1':row['sha'],'bytes':row['size']})
    for day,rows in sorted(days.items()):
        lines=[f'# {day} 内容归档','','[返回日期总目录](../../README.md)','']
        for key,label in categories.items():
            group=sorted((r for r in rows if r['category']==key),key=lambda x:x['path'])
            if not group:continue
            lines.extend([f'## {label}（{len(group)}）',''])
            lines.extend(f"- [{r['path'].split('/',1)[1]}]({quote(r['path'])})" for r in group);lines.append('')
        put(f'archive/{day}/README.md',('\n'.join(lines)+'\n').encode())
        put(f'archive/{day}/manifest.json',(json.dumps({'date':day,'files':sorted(rows,key=lambda x:x['path'])},ensure_ascii=False,indent=2)+'\n').encode())
    lines=['# Crypto Charting 内容归档','','按北京时间日期分类保存文案、报表、图表、来源数据和研究资料。每日目录含文件链接，manifest.json 记录 Git blob 校验标识及大小。','','[归档与本地清理规则](ARCHIVE.md)','','| 日期 | 文件数 |','| --- | ---: |']
    lines.extend(f'| [{day}](archive/{day}/README.md) | {len(days[day])} |' for day in sorted(days,reverse=True));put('README.md',('\n'.join(lines)+'\n').encode())
    for name in ['scripts/archive_to_github.py','scripts/github_archive_api.py','ARCHIVE.md','AGENTS.md']:put(name,(root/name).read_bytes())
    if entries!=original:
        tree=api('git/trees','POST',{'tree':[{'path':p,'mode':r['mode'],'type':'blob','sha':r['sha']} for p,r in sorted(entries.items())]})['sha']
        commit=api('git/commits','POST',{'message':f'Classify and archive generated content {today}','tree':tree,'parents':[head]})['sha']
        api('git/refs/heads/main','PATCH',{'sha':commit,'force':False})
    else:commit=head
    if api('git/ref/heads/main')['object']['sha']!=commit:raise RuntimeError('Remote commit changed; local files retained')
    check=api(f'git/trees/{commit}?recursive=1')
    if check.get('truncated'):raise RuntimeError('Incomplete verification; local files retained')
    remote={r['path']:r['sha'] for r in check['tree'] if r['type']=='blob'}
    if remote!={p:r['sha'] for p,r in entries.items()}:raise RuntimeError('Remote files mismatch; local files retained')
    deleted=0
    for p,dest,date,permanent,ident in pending:
        if remote.get(dest)!=ident:raise RuntimeError('Remote blob mismatch')
        if date<today and not permanent and p.exists() and sha(p.read_bytes())==ident:p.unlink();deleted+=1
    for folder in ['crypto-charting-data','outputs','research']:
        for p in sorted((root/folder).rglob('*'),key=lambda x:len(x.parts),reverse=True):
            if p.is_dir() and not p.is_symlink():
                try:p.rmdir()
                except OSError:pass
    result={'time':dt.datetime.now(tz).isoformat(),'commit':commit,'archive_days':len(days),'archive_total_files':sum(map(len,days.values())),'synced_local_files':len(pending),'migrated_files':migrated,'deleted_old_files':deleted}
    (state/'last-success.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
