import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const [snapshotPath, referencePath, outputPath] = process.argv.slice(2);
if (!snapshotPath || !outputPath) throw new Error('Usage: build_crypto_workbook.mjs SNAPSHOT.json REFERENCE.json|- OUTPUT.xlsx');
const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
const ref = referencePath && referencePath !== '-' ? JSON.parse(await fs.readFile(referencePath, 'utf8')) : null;
if (ref && ref.symbol !== snapshot.symbol) throw new Error('Reference symbol mismatch');
const symbol = snapshot.symbol;
const wb = Workbook.create();
const dash = wb.worksheets.add(`${symbol}日报`);
const hold = wb.worksheets.add('持仓录入');
const market = wb.worksheets.add('行情与资金流');
const context = wb.worksheets.add('链上与动态');
for (const s of [dash, hold, market, context]) s.showGridLines = false;
dash.tabColor = '#0B233B';
hold.tabColor = '#A88AC9';
market.tabColor = '#7990A9';
context.tabColor = '#12957F';

const navy = '#0B233B', navy2 = '#132F4C', paper = '#EDF3F8', white = '#FFFFFF';
const ink = '#17334B', muted = '#7B91A7', green = '#12957F', red = '#D5486C';
const lilac = '#9B79C2', line = '#DCE6EF', amber = '#FFF4DD';
const fmtNum = '#,##0.00;[Red](#,##0.00);–';
const fmtSigned = '+#,##0.00;[Red]-#,##0.00;–';
const fmtPct = '+0.00%;[Red]-0.00%;–';
const font = 'Arial';
function set(s,addr,value){ s.getRange(addr).values=[[value]]; }
function formula(s,addr,value){ s.getRange(addr).formulas=[[value]]; }
function merge(s,addr,value){ s.mergeCells(addr); set(s,addr.split(':')[0],value); }
function fill(s,addr,color){ s.getRange(addr).format.fill=color; }
function fontStyle(s,addr,style){ s.getRange(addr).format.font={name:font,...style}; }
function titleBand(s,addr,label){ fill(s,addr,white); fontStyle(s,addr,{size:12,bold:true,color:ink}); set(s,addr.split(':')[0],label); }

// Original inputs and transparent provenance.
hold.getRange('A1:J36').format.font={name:font,size:10,color:ink};
hold.getRange('A1:J36').format.rowHeight=24;
hold.getRange('A:A').format.columnWidth=16;
hold.getRange('B:B').format.columnWidth=23;
hold.getRange('C:C').format.columnWidth=18;
hold.getRange('D:E').format.columnWidth=20;
hold.getRange('F:F').format.columnWidth=16;
hold.getRange('G:G').format.columnWidth=17;
hold.getRange('H:H').format.columnWidth=18;
hold.getRange('I:I').format.columnWidth=14;
hold.getRange('J:J').format.columnWidth=16;
merge(hold,'A1:J1',`${symbol} ETF 持仓录入｜原始口径`);
fill(hold,'A1:J1',navy); fontStyle(hold,'A1:J1',{size:15,bold:true,color:white});
set(hold,'A2','持仓日期'); set(hold,'B2',ref?.as_of_et ?? '未核实');
set(hold,'A3','数据状态'); set(hold,'B3',ref?.source_label ?? '尚无完整持仓来源');
set(hold,'A4','来源文件'); set(hold,'B4',ref?.source_file ?? '');
set(hold,'A5',`总持仓 (${symbol})`); set(hold,'B5',ref?.holdings_total ?? null);
set(hold,'F2','上7交易日变化'); set(hold,'G2',ref?.prior_seven_trading_days_change ?? null);
set(hold,'F3','本月以来'); set(hold,'G3',ref?.month_to_date_change ?? null);
set(hold,'F4','今年以来'); set(hold,'G4',ref?.year_to_date_change ?? null);
set(hold,'F5','上市以来'); set(hold,'G5',ref?.since_listing_change ?? null);
hold.getRange('B5:G5').format.numberFormat=fmtNum;
hold.getRange('G2:G5').format.numberFormat=fmtSigned;
fill(hold,'A7:E7',navy2); fontStyle(hold,'A7:E7',{bold:true,color:white});
hold.getRange('A7:E7').values=[['交易日',`总持仓 ${symbol}`,`日变化 ${symbol}`,'由持仓差计算',`差额 ${symbol}`]];
const daily=ref?.daily ?? [];
for (let i=0;i<Math.max(7,daily.length);i++) {
 const r=8+i, d=daily[i];
 if(d) hold.getRange(`A${r}:C${r}`).values=[[d.date.slice(5),d.holdings,d.change]];
 if(i>0 && d){ formula(hold,`D${r}`,`=B${r}-B${r-1}`); formula(hold,`E${r}`,`=D${r}-C${r}`); }
 if(i%2) fill(hold,`A${r}:E${r}`,paper);
}
hold.getRange('B8:E14').format.numberFormat=fmtNum;
fill(hold,'A17:C17',navy2); fontStyle(hold,'A17:C17',{bold:true,color:white});
hold.getRange('A17:C17').values=[['产品','发行商',`当日变化 ${symbol}`]];
const funds=ref?.fund_changes ?? [];
for(let i=0;i<Math.max(13,funds.length);i++){
 const r=18+i,f=funds[i]; if(f) hold.getRange(`A${r}:C${r}`).values=[[f.ticker,f.name,f.change]];
 if(i%2) fill(hold,`A${r}:C${r}`,paper);
}
hold.getRange('C18:C30').format.numberFormat=fmtSigned;
fill(hold,'F17:I17',navy2); fontStyle(hold,'F17:I17',{bold:true,color:white});
hold.getRange('F17:I17').values=[['产品','发行商',`持仓 ${symbol}`,'占比']];
const rank=ref?.holdings_rank ?? [];
for(let i=0;i<Math.max(7,rank.length);i++){
 const r=18+i,f=rank[i]; if(f){ hold.getRange(`F${r}:H${r}`).values=[[f.ticker,f.name,f.holdings]]; formula(hold,`I${r}`,`=IFERROR(H${r}/$B$5,"")`); }
 if(i%2) fill(hold,`F${r}:I${r}`,paper);
}
hold.getRange('H18:H24').format.numberFormat=fmtNum;
hold.getRange('I18:I24').format.numberFormat='0.00%';
set(hold,'F27','核对：产品持仓合计'); formula(hold,'H27','=SUM(H18:H24)');
set(hold,'F28','与报表总持仓差'); formula(hold,'H28','=H27-B5');
set(hold,'F29','产品变化合计'); formula(hold,'H29','=SUM(C18:C30)');
set(hold,'F30','与日报变化差'); formula(hold,'H30','=H29-C14');
set(hold,'F31','7日变化合计'); formula(hold,'H31','=SUM(C8:C14)');
hold.getRange('H27:H31').format.numberFormat=fmtNum;
merge(hold,'A33:J33','注意：截图持仓属于用户提供的参考数据；差额反映截图逐项四舍五入或录入差异，不据此补造缺失产品。');
fill(hold,'A33:J33',amber); fontStyle(hold,'A33:J33',{color:'#765925'});

// Live observation and independently published USD flow series.
market.getRange('A1:J30').format.font={name:font,size:10,color:ink};
market.getRange('A1:J30').format.rowHeight=24;
market.getRange('A:A').format.columnWidth=20;
market.getRange('B:B').format.columnWidth=25;
market.getRange('C:C').format.columnWidth=3;
market.getRange('D:D').format.columnWidth=18;
market.getRange('E:E').format.columnWidth=19;
market.getRange('F:F').format.columnWidth=3;
market.getRange('G:G').format.columnWidth=23;
market.getRange('H:J').format.columnWidth=23;
merge(market,'A1:J1',`${symbol} 行情与 ETF 美元资金流`); fill(market,'A1:J1',navy); fontStyle(market,'A1:J1',{size:15,bold:true,color:white});
const metrics=snapshot.metrics;
const fields=[['采集时间',snapshot.collected_at.replace('T',' ').replace('+08:00',' 北京时间')],['价格 USD',metrics.price_usd?.value],['24h 变化',metrics.change_24h_pct?.value==null?null:metrics.change_24h_pct.value/100],['24h 成交额 USD',metrics.volume_24h_usd?.value],['市值 USD',metrics.market_cap_usd?.value],['7d 变化',metrics.change_7d_pct?.value==null?null:metrics.change_7d_pct.value/100]];
for(let i=0;i<fields.length;i++) market.getRange(`A${i+3}:B${i+3}`).values=[fields[i]];
market.getRange('B4').format.numberFormat='"$"#,##0.00';
market.getRange('B5').format.numberFormat=fmtPct;
market.getRange('B6:B7').format.numberFormat='"$"#,##0';
market.getRange('B8').format.numberFormat=fmtPct;
set(market,'D3','最新已披露交易日'); set(market,'E3',snapshot.etf?.trading_date_et ?? '');
set(market,'D4','净资金流 (百万美元)'); set(market,'E4',snapshot.etf?.flows?.[0]?.net_flow_usd_millions ?? null);
market.getRange('E4').format.numberFormat=fmtSigned;
set(market,'D5','持币总量状态'); set(market,'E5',ref?'截图样本／未独立核验':'暂无完整来源');
fill(market,'A12:B12',navy2); fontStyle(market,'A12:B12',{bold:true,color:white}); market.getRange('A12:B12').values=[['ETF交易日','资金流 百万美元']];
const flowRows=(snapshot.etf?.flow_history ?? []).slice(-7).map(x=>[x.trading_date_et.slice(5),x.net_flow_usd_millions]);
for(let i=0;i<flowRows.length;i++) market.getRange(`A${13+i}:B${13+i}`).values=[flowRows[i]];
market.getRange('B13:B19').format.numberFormat=fmtSigned;
fill(market,'D12:E12',navy2); fontStyle(market,'D12:E12',{bold:true,color:white}); market.getRange('D12:E12').values=[['UTC 日期',`${symbol} 收盘 USD`]];
const close=snapshot.series?.price_7_completed_utc_days?.points ?? [];
for(let i=0;i<Math.min(7,close.length);i++) market.getRange(`D${13+i}:E${13+i}`).values=[[close[i].date_utc.slice(5),close[i].close_usd]];
market.getRange('E13:E19').format.numberFormat='"$"#,##0';
fill(market,'G12:J12',navy2); fontStyle(market,'G12:J12',{bold:true,color:white}); market.getRange('G12:J12').values=[['来源/口径','链接或路径','','']];
const srcRows=[['即时行情',metrics.price_usd?.source_url ?? ''],['价格历史',snapshot.series?.price_7_completed_utc_days?.source_url ?? ''],['ETF资金流',snapshot.etf?.flows?.[0]?.source_url ?? ''],['持仓截图',ref?.source_file ?? ''],['行情时间口径','采集时页面观察，源时间未给出'],['ETF时间口径','美东交易日；未披露不是零']];
for(let i=0;i<srcRows.length;i++) market.getRange(`G${13+i}:H${13+i}`).values=[srcRows[i]];
market.getRange('H13:H18').format.columnWidth=54;
merge(market,'A22:J22',`资金净流入以美元计，不等于 ETF 原生 ${symbol} 持仓变化；不同来源更新时间不能混用。`);
fill(market,'A22:J22',amber); fontStyle(market,'A22:J22',{color:'#765925'});

// Chain measures and dated developments remain separate from market and ETF quantities.
context.getRange('A1:H32').format.font={name:font,size:10,color:ink};
context.getRange('A1:H32').format.rowHeight=25;
context.getRange('A:A').format.columnWidth=28;
context.getRange('B:B').format.columnWidth=22;
context.getRange('C:C').format.columnWidth=17;
context.getRange('D:D').format.columnWidth=22;
context.getRange('E:E').format.columnWidth=28;
context.getRange('F:F').format.columnWidth=75;
context.getRange('G:H').format.columnWidth=20;
merge(context,'A1:H1',`${symbol} 链上指标与重要动态`);fill(context,'A1:H1',navy);fontStyle(context,'A1:H1',{size:15,bold:true,color:white});
context.getRange('A3:F3').values=[['链上指标','数值','单位','数据日期','定义 / 范围','直接来源']];fill(context,'A3:F3',navy2);fontStyle(context,'A3:F3',{bold:true,color:white});
const chainMetrics=snapshot.chain?.metrics ?? [];
for(let i=0;i<Math.min(chainMetrics.length,8);i++){const m=chainMetrics[i];context.getRange(`A${4+i}:F${4+i}`).values=[[m.name??m.metric??'',m.value??null,m.unit??'',m.data_as_of??'',m.method??m.scope??'',m.source_url??'']];}
if(!chainMetrics.length) merge(context,'A4:F4','暂无已核实、适合本币种的链上指标。');
context.getRange('A14:F14').values=[['重要动态','事件日期','发布日期','核验状态','摘要','直接来源']];fill(context,'A14:F14',navy2);fontStyle(context,'A14:F14',{bold:true,color:white});
const developments=snapshot.developments ?? [];
for(let i=0;i<Math.min(developments.length,8);i++){const d=developments[i];context.getRange(`A${15+i}:F${15+i}`).values=[[d.title??'',d.event_time??'',d.published_at??'',d.status??'已查阅来源',d.details??'',d.source_url??'']];}
if(!developments.length) merge(context,'A15:F15','本次未核实到符合时间窗口的重要动态。');
merge(context,'A25:H25','数据口径：链上活动是网络指标，不能等同于代币现金流；事件日期与文章发布日期分别记录。');fill(context,'A25:H25',amber);fontStyle(context,'A25:H25',{color:'#765925'});

// Reader dashboard, visually close to the supplied report while keeping source status explicit.
dash.getRange('A1:R68').format.font={name:font,size:11,color:ink};
dash.getRange('A1:R68').format.columnWidth=11.5;
dash.getRange('A1:R68').format.rowHeight=25;
fill(dash,'A1:R8',navy);
merge(dash,'A2:R2','CRYPTO CHARTING / DAILY'); fontStyle(dash,'A2:R2',{size:11,bold:true,color:lilac});
merge(dash,'A3:R5',`${symbol} 现货 ETF 日报`); fontStyle(dash,'A3:R5',{size:27,bold:true,color:white});
merge(dash,'A6:R6',`持仓观察日（美东） ${ref?.as_of_et ?? '待核实'}   ·   美国现货 ETF`); fontStyle(dash,'A6:R6',{size:12,color:'#B5C7D8'});
merge(dash,'A8:R8',ref?'持仓数据来自用户截图，未独立核验；已核实行情和美元资金流见「行情与资金流」页。':'尚未取得完整、可比的原生币持仓；以下持仓项保留缺失状态。');
fill(dash,'A8:R8',amber); fontStyle(dash,'A8:R8',{size:10,bold:true,color:'#765925'});
fill(dash,'A9:R68',paper);
const cardRanges=ref?
 [['A10:C15','总持仓',"='持仓录入'!B5",symbol,navy,white],['D10:F15','当日净变化',"='持仓录入'!C14",symbol,white,green],['G10:I15','最近七交易日',"=SUM('持仓录入'!C8:C14)",symbol,white,red],['J10:L15','本月以来',"='持仓录入'!G3",symbol,white,red],['M10:O15','今年以来',"='持仓录入'!G4",symbol,white,red],['P10:R15','上市以来',"='持仓录入'!G5",symbol,white,green]]:
 [['A10:C15','现价',"='行情与资金流'!B4",'USD',navy,white],['D10:F15','24h 变化',"='行情与资金流'!B5",'%',white,red],['G10:I15','7d 变化',"='行情与资金流'!B8",'%',white,red],['J10:L15','24h 成交额',"='行情与资金流'!B6",'USD',white,ink],['M10:O15','市值',"='行情与资金流'!B7",'USD',white,ink],['P10:R15','ETF 资金流',"='行情与资金流'!E4",'百万美元',white,green]];
for(const [range,label,f,unit,bg,fg] of cardRanges){
 const [start,end]=range.split(':'); const col=start.match(/[A-Z]+/)[0], endCol=end.match(/[A-Z]+/)[0];
 fill(dash,range,bg); dash.getRange(range).format.borders={preset:'outside',style:'thin',color:line};
 merge(dash,`${col}10:${endCol}11`,label); fontStyle(dash,`${col}10:${endCol}11`,{size:11,bold:true,color:bg===navy?'#ADC2D5':muted});
 dash.mergeCells(`${col}12:${endCol}14`);
 if(ref || (label==='ETF 资金流' ? snapshot.etf?.flows?.length : true)) formula(dash,`${col}12`,f); else set(dash,`${col}12`,'待披露');
 dash.getRange(`${col}12:${endCol}14`).format.numberFormat=label==='总持仓'||label==='现价'?fmtNum:label.includes('变化')&&!ref?fmtPct:label==='24h 成交额'||label==='市值'?'#,##0':fmtSigned;
 fontStyle(dash,`${col}12:${endCol}14`,{size:18,bold:true,color:fg});
 merge(dash,`${col}15:${endCol}15`,unit);
 fontStyle(dash,`${col}15:${endCol}15`,{size:10,color:bg===navy?'#B3C5D4':muted});
}
fill(dash,'A17:R18','#E2ECF5');
set(dash,'A17','上7交易日合计'); if(ref) formula(dash,'C17',"='持仓录入'!G2"); else set(dash,'C17','待核实');
set(dash,'G17','美国总持仓'); if(ref) formula(dash,'J17',"='持仓录入'!B5"); else set(dash,'J17','待核实');
set(dash,'M17',`资金流 / 美东${(snapshot.etf?.trading_date_et ?? '').slice(5)}`); if(snapshot.etf?.flows?.length) formula(dash,'P17',"='行情与资金流'!E4"); else set(dash,'P17','待披露');
dash.getRange('C17').format.numberFormat=fmtSigned; dash.getRange('J17').format.numberFormat=fmtNum; dash.getRange('P17').format.numberFormat=fmtSigned;
fontStyle(dash,'A17:R18',{size:11,bold:true,color:ink});
fill(dash,'A20:F36',white); fill(dash,'G20:L36',white); fill(dash,'M20:R36',white);
titleBand(dash,'A20:F20',ref?'近7交易日总持仓走势':'近7日收盘价走势'); titleBand(dash,'G20:L20',ref?'近7交易日净变化':'近7交易日 ETF 资金流'); titleBand(dash,'M20:R20','今日变化焦点');
if(ref){
 for(const [r,sr] of [[23,21],[25,20],[27,29]]){
  dash.mergeCells(`M${r}:P${r}`);formula(dash,`M${r}`,`='持仓录入'!B${sr}`);
  dash.mergeCells(`Q${r}:R${r}`);formula(dash,`Q${r}`,`='持仓录入'!C${sr}`);
  dash.getRange(`Q${r}`).format.numberFormat=fmtSigned;fontStyle(dash,`Q${r}:R${r}`,{bold:true,color:green});
 }
 dash.mergeCells('M31:P31');formula(dash,'M31',"='持仓录入'!B18");
 dash.mergeCells('Q31:R31');formula(dash,'Q31',"='持仓录入'!C18");dash.getRange('Q31').format.numberFormat=fmtSigned;fontStyle(dash,'Q31:R31',{bold:true,color:red});
} else merge(dash,'M24:R29','暂无可核实的逐产品持仓变化');
merge(dash,'M34:R35',`单位 ${symbol}；${ref?'截图中的产品变化尚待发行商逐项核验。':'缺失数据保持空白。'}`); fontStyle(dash,'M34:R35',{size:9,color:muted});
if(daily.length>=2){
 const chart=dash.charts.add('line',hold.getRange('A7:B14'));
 chart.title=`持仓 ${symbol}`; chart.titleTextStyle.typeface=font; chart.titleTextStyle.fontSize=11; chart.hasLegend=false;
 chart.xAxis={axisType:'textAxis',textStyle:{typeface:font,fontSize:9}};
 chart.yAxis={numberFormatCode:'#,##0',numberFormatSourceLinked:false,textStyle:{typeface:font,fontSize:9}};
 chart.series.items[0].line={fill:'#438AC6',style:'solid',width:2};
 chart.setPosition('A21','F36');
 const change=dash.charts.add('bar',[hold.getRange('A7:A14'),hold.getRange('C7:C14')]);
 change.title=`净变化 ${symbol}`; change.titleTextStyle.typeface=font; change.titleTextStyle.fontSize=11; change.hasLegend=false;
 change.xAxis={axisType:'textAxis',textStyle:{typeface:font,fontSize:9}};
 change.yAxis={numberFormatCode:'+#,##0;-#,##0;0',numberFormatSourceLinked:false,textStyle:{typeface:font,fontSize:9}};
 change.series.items[0].fill='#C84C6D';
 change.setPosition('G21','L36');
} else {
 if(close.length>=2){const c=dash.charts.add('line',market.getRange(`D12:E${12+Math.min(7,close.length)}`));c.title=`${symbol} 收盘价 USD`;c.hasLegend=false;c.series.items[0].line={fill:'#438AC6',style:'solid',width:2};c.setPosition('A21','F36');}
 else merge(dash,'A25:F29','暂无可比价格历史');
 if(flowRows.length>=2){const c=dash.charts.add('bar',market.getRange(`A12:B${12+Math.min(7,flowRows.length)}`));c.title='净资金流 百万美元';c.hasLegend=false;c.series.items[0].fill='#C84C6D';c.setPosition('G21','L36');}
 else merge(dash,'G25:L29','暂无可比 ETF 资金流历史');
}
fill(dash,'A38:F60',white); fill(dash,'G38:L60',white); fill(dash,'M38:R60',white);
titleBand(dash,'A38:F38',`当日各 ETF 变化（${symbol}）`); titleBand(dash,'G38:L38',`最新持仓排行（${symbol}）`); titleBand(dash,'M38:R38','流向统计');
dash.getRange('A40:F40').values=[['产品','发行商','','','变化','']];
dash.getRange('G40:L40').values=[['排名','代码','基金','持仓','','占比']];
fill(dash,'A40:F40','#E7F0F7'); fill(dash,'G40:L40','#E7F0F7');
for(let i=0;i<13 && ref;i++){
 const r=41+i, src=18+i;
 if(i%2) { fill(dash,`A${r}:F${r}`,paper); fill(dash,`G${r}:L${r}`,paper); }
 formula(dash,`A${r}`,`='持仓录入'!A${src}`);
 formula(dash,`B${r}`,`='持仓录入'!B${src}`);
 formula(dash,`E${r}`,`='持仓录入'!C${src}`);
 dash.getRange(`E${r}`).format.numberFormat=fmtSigned;
 if(i<7){const rr=18+i;set(dash,`G${r}`,i+1);formula(dash,`H${r}`,`='持仓录入'!F${rr}`);formula(dash,`I${r}`,`='持仓录入'!G${rr}`);formula(dash,`J${r}`,`='持仓录入'!H${rr}`);formula(dash,`L${r}`,`='持仓录入'!I${rr}`);dash.getRange(`J${r}`).format.numberFormat=fmtNum;dash.getRange(`L${r}`).format.numberFormat='0.00%';}
}
for(const [label,row,f] of [['净增持产品数',41,"=COUNTIF('持仓录入'!C18:C30,\">0\")"],['净减持产品数',43,"=COUNTIF('持仓录入'!C18:C30,\"<0\")"],['零变化产品数',45,"=COUNTIF('持仓录入'!C18:C30,\"=0\")"],['增持合计',48,"=SUMIF('持仓录入'!C18:C30,\">0\")"],['减持合计',50,"=SUMIF('持仓录入'!C18:C30,\"<0\")"]]){
 merge(dash,`M${row}:O${row}`,label);if(ref) formula(dash,`P${row}`,f);else set(dash,`P${row}`,'待核实');
}
dash.getRange('P48:P50').format.numberFormat=fmtSigned;
merge(dash,'M54:R54','已披露 ETF 资金流（美元）');
if(snapshot.etf?.flows?.length) formula(dash,'M56',"='行情与资金流'!E4");else set(dash,'M56','待披露');
dash.getRange('M56').format.numberFormat='+#,##0.0;-#,##0.0;0';
merge(dash,'N56:R56',`百万美元，不能与 ${symbol} 持仓变化相加`);
fontStyle(dash,'M56',{size:18,bold:true,color:green}); fontStyle(dash,'N56:R56',{size:9,color:muted});
fill(dash,'A62:R66','#E2ECF5');
merge(dash,'A62:R62',`持仓参考日期 ${ref?.as_of_et ?? '待核实'}｜行情页面观察时间 ${snapshot.collected_at}｜ETF 美元资金流美东 ${snapshot.etf?.trading_date_et ?? '待披露'}`);
merge(dash,'A64:R64',ref?'来源：持仓为用户截图（待独立核验）；行情为 CoinGecko；ETF 美元流入为 Farside。明细及链接见右侧数据页。':'来源与链接见「行情与资金流」页。持仓尚无完整可比来源，故未填造持仓图表与产品排行。');
merge(dash,'A65:R65','口径：空白或待核实=未取得完整来源；实际零变化才显示 0。美元资金流不等于原生币持仓变化。');
fontStyle(dash,'A62:R66',{size:9,color:muted});
dash.freezePanes.unfreeze();
hold.freezePanes.freezeRows(7);
market.freezePanes.freezeRows(1);
context.freezePanes.freezeRows(3);

wb.recalculate();
const inspect=await wb.inspect({kind:'region',sheetId:dash.name,range:'A10:R18',maxChars:1800});
console.log(inspect.ndjson);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:50},summary:'final formula error scan'});
console.log(errors.ndjson);
await fs.mkdir(path.dirname(outputPath),{recursive:true});
for(const [s,range,name] of [[dash,'A1:R66','dashboard'],[hold,'A1:J34','holdings'],[market,'A1:J23','market'],[context,'A1:F26','context']]){
 const preview=await wb.render({sheetName:s.name,range,scale:1,format:'png'});
 await fs.writeFile(path.join(path.dirname(outputPath),`${symbol}-${name}-preview.png`),new Uint8Array(await preview.arrayBuffer()));
}
const xlsx=await SpreadsheetFile.exportXlsx(wb); await xlsx.save(outputPath);
console.log(outputPath);
