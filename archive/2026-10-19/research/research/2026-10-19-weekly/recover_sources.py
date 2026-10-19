import json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
root=Path('/Users/jss/Desktop/workspace/XCreator/crypto-charting-data/2026-10-19')
now=datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(timespec='seconds')
u=json.loads((root/'UNI.json').read_text())
u['source_access_notes']=u['missing_or_stale']
labels=[('Uniswap 协议 TVL（约）',3.872e9),('Uniswap 协议 DEX 成交额 24h（约）',1.73e9),('Uniswap 协议 DEX 成交额 7d（约）',15.601e9),('Uniswap 协议费用 7d（约）',19.2e6),('Uniswap 协议收入 7d（约）',1.83e6)]
u['chain']['metrics']=[dict(name=n,value=v,unit='USD',data_as_of=now+' 北京时间页面观察',source_url='https://defillama.com/protocol/uniswap',method='多链 Uniswap 协议页面缩写约值；24h/7d 为滚动窗口，未公布精确采样时刻；非 UNI 持有人现金收入') for n,v in labels]
u['sources'].append(dict(name='DefiLlama Uniswap protocol',url='https://defillama.com/protocol/uniswap'))
u['missing_or_stale']=[]
u['status']='complete'
z=json.loads((root/'ZEC.json').read_text())
z['source_access_notes']=z['missing_or_stale'][:]
url='https://farside.co.uk/zec/'
rows=[('2026-10-08',-18.7),('2026-10-09',0),('2026-10-12',-1.7),('2026-10-13',-5.2),('2026-10-14',3.7),('2026-10-15',-14.8),('2026-10-16',-1.2)]
z['etf']['flow_history']=[dict(trading_date_et=d,net_flow_usd_millions=v,source_url=url) for d,v in rows]
z['etf']['flows']=[dict(trading_date_et=rows[-1][0],net_flow_usd_millions=rows[-1][1],source_url=url,contributors_usd_millions={'ZCSH':rows[-1][1]})]
z['etf']['trading_date_et']=rows[-1][0]
z['etf']['product_details'][0].update(annual_fee_pct_listed=2.5,fee_source_url=url,net_flow_usd_millions=-1.2,flow_as_of_et='2026-10-16',flow_source_url=url)
z['sources'].append(dict(name='Farside ZEC flows',url=url))
z['missing_or_stale']=[x for x in z['missing_or_stale'] if '美元资金流' not in x]
for s,x in [('UNI',u),('ZEC',z)]:
 x['revision']={'revised_at_shanghai':now,'reason':'周一周报重新采集实时行情；终端访问失败的协议/资金流由本次重新打开的公开网页核对补充，保留各字段所属日期。'}
 x['history_baseline_audit']={'date':'2026-10-12','source':'https://github.com/HeySeeTech/Crypto-Charting/blob/main/README.md','result':'归档日期索引无 2026-10-12；UNI/ZEC 自 10-18 纳入，精确七天前基准不足。'}
 (root/(s+'.json')).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
