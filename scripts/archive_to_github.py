#!/usr/bin/env python3
"""Classified GitHub archive entry point."""
from pathlib import Path
from github_archive_api import sync
CATEGORIES = {
    'copy': '文案', 'reports': 'Excel报表', 'charts': '图表与预览',
    'data': '来源数据', 'research': '研究资料', 'logs': '校验与日志',
    'assets': '素材', 'code': '辅助代码', 'other': '其他附件',
}
def category(rel):
    path = Path(rel)
    ext = path.suffix.lower()
    if 'CONTENT_DB' in path.parts: return 'copy'
    if ext in {'.xlsx', '.xls', '.csv'}: return 'reports'
    if ext in {'.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'}: return 'assets' if 'assets' in path.parts else 'charts'
    if ext in {'.ndjson', '.log'} or 'failures' in path.parts: return 'logs'
    if 'research' in path.parts or ext == '.pdf': return 'research'
    if ext == '.json': return 'data'
    if ext in {'.md', '.txt', '.docx', '.html'}: return 'copy'
    if ext in {'.py', '.mjs', '.js', '.sh'}: return 'code'
    return 'other'

if __name__ == "__main__":
    sync(Path(__file__).resolve().parents[1], category, CATEGORIES)
