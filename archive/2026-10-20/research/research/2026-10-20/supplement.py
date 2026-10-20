import json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
p=Path('/Users/jss/Desktop/workspace/XCreator/crypto-charting-data/2026-10-20')
now=datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(timespec='seconds')
def read(s):return json.loads((p/(s+'.json')).read_text())
def save(s,j):
 j['revision']={'revised_at_shanghai':now,'reason':'本次采集的网页补充核验；保留初始行情采集时间与各字段实际所属日期。'}
 (p/(s+'.json')).write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
u=read('UNI');u['source_access_notes']=u['missing_or_stale'][:]
names=['Uniswap 协议 TVL（约）','Uniswap 协议 DEX 成交额 24h（约）','Uniswap 协议 DEX 成交额 7d（约）','Uniswap 协议费用 7d（约）','Uniswap 协议收入 7d（约）']
u['chain']['metrics']=[dict(name=n,value=v,unit='USD',data_as_of=now+' 北京时间页面观察',source_url='https://defillama.com/protocol/uniswap',method='多链协议滚动指标；页面未披露精确采样时刻；缩写数值为约值，非 UNI 持有人现金收入') for n,v in zip(names,[4.2e9,1.679e9,15.122e9,19.2e6,1.83e6])]
u['missing_or_stale']=[];u['status']='complete';u['sources'].append(dict(name='DefiLlama Uniswap',url='https://defillama.com/protocol/uniswap'));save('UNI',u)
z=read('ZEC');url='https://farside.co.uk/zec/';rows=[('2026-10-09',0),('2026-10-12',-1.7),('2026-10-13',-5.2),('2026-10-14',3.7),('2026-10-15',-14.8),('2026-10-16',-1.2),('2026-10-19',-10.4)]
z['source_access_notes']=z['missing_or_stale'][:]
z['etf']['flow_history']=[dict(trading_date_et=d,net_flow_usd_millions=v,source_url=url) for d,v in rows]
z['etf']['flows']=[dict(trading_date_et='2026-10-19',net_flow_usd_millions=-10.4,source_url=url,contributors_usd_millions={'ZCSH':-10.4})]
z['etf']['trading_date_et']='2026-10-19'
z['etf']['product_details'][0].update(annual_fee_pct_listed=2.5,fee_source_url=url,net_flow_usd_millions=-10.4,flow_as_of_et='2026-10-19',flow_source_url=url)
z['missing_or_stale']=[x for x in z['missing_or_stale'] if '美元资金流' not in x];z['sources'].append(dict(name='Farside ZEC',url=url));save('ZEC',z)
b=read('BTC');b['etf']['holdings'].append(dict(ticker='HODL',quantity_native=14665.524,unit='BTC',as_of_et='2026-10-16',source_url='https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/',issuer_url='https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/',source_tier='issuer_direct',verified_at_shanghai=now,scope='本次网页核验 ETF Statistics Bitcoin in Trust；与四舍五入托管储备口径区分'))
b['missing_or_stale']=[x for x in b['missing_or_stale'] if not x.startswith('HODL 原生币持仓')]
for d in b['etf']['product_details']:
 if d['ticker']=='HODL':d['holding_status']='发行商 ETF Statistics 10-16；当前页面未披露更新日期数量'
save('BTC',b)
for s in ['BTC','ETH']:
 j=read(s);j['missing_or_stale'].insert(0,'10-19 Farside 尚未完整：'+('IBIT 为未披露短横线，已披露小计 -138.5 百万美元' if s=='BTC' else 'ETHA、ETHB 为未披露短横线，已披露小计 -7.9 百万美元')+'；首页及七交易日序列采用最后完整交易日 10-16，不将待披露值填零。');save(s,j)
x=read('XRP');h=next(h for h in x['etf']['holdings'] if h['ticker']=='XRPC');h.update(quantity_native=243456798.33500001,as_of_et='2026-10-19',source_url='https://canaryetfs.com/xrpc/',issuer_url='https://canaryetfs.com/xrpc/',source_tier='issuer_direct',scope='发行商 Holdings 表 10-19 Quantity Original；不是数据集观察日',verified_at_shanghai=now);h.pop('aggregator_error',None)
x['etf']['last_valid_holdings']=[dict(ticker='XRPZ',quantity_native=295825867.22,unit='XRP',as_of_et='2026-10-05',source_url=x['etf']['product_universe'][2]['source_url'],source_tier='issuer_direct',issuer_url=x['etf']['product_universe'][2]['source_url'],verified_at_shanghai=now,scope='本次原页 Additional Fund Info 仍显示 10-05，另有更新的转录观察日；保留历史证据不相加')]
for d in x['etf']['product_details']:
 if d['ticker']=='XRPC':d['holding_status']='发行商直接披露 2026-10-19 原生数量'
 if d['ticker']=='XRPZ':d.update(annual_fee_pct_listed=0.19,fee_source_url=x['etf']['product_universe'][2]['source_url'])
day=max(h['as_of_et'] for h in x['etf']['holdings']);x['etf']['holdings_summary'].update(as_of_et=day,verified_products=sum(h['as_of_et']==day for h in x['etf']['holdings']))
save('XRP',x)
