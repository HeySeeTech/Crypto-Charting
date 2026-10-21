import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const root='/Users/jss/Desktop/workspace/XCreator/crypto-charting-data/2026-10-21';
const reports=[];
for(const symbol of ['BTC','ETH','SOL','SUI','XRP']){
 const snap=JSON.parse(await fs.readFile(`${root}/${symbol}.json`,'utf8'));
 const w=await SpreadsheetFile.importXlsx(await FileBlob.load(`${root}/${symbol}.xlsx`));
 const hold=w.worksheets.getItem('持仓录入');
 const dash=w.worksheets.getItem(`${symbol}日报`);
 const etf=snap.etf;
 const sampleDay=etf.holdings_summary?.as_of_et;
 const expected=etf.holdings.filter(h=>h.as_of_et===sampleDay).reduce((s,h)=>s+h.quantity_native,0);
 const value=()=>hold.getRange('B5').values[0][0];
 const original=value();
 if(etf.holdings.length&&Math.abs(original-expected)>.001)throw Error(`${symbol} subtotal mismatch`);
 const historical=(etf.last_valid_holdings??[]).find(h=>!etf.holdings.some(x=>x.ticker===h.ticker));
 if(historical){
  const row=18+etf.product_universe.findIndex(p=>p.ticker===historical.ticker);
  const old=hold.getRange(`R${row}`).values[0][0];hold.getRange(`R${row}`).values=[[old+100]];w.recalculate();
  if(value()!==original)throw Error(`${symbol} historical quantity contaminated current subtotal`);
  hold.getRange(`R${row}`).values=[[old]];
 }
 const current=etf.holdings.find(h=>h.as_of_et===sampleDay);
 if(current){
  const row=18+etf.product_universe.findIndex(p=>p.ticker===current.ticker);
  const old=hold.getRange(`H${row}`).values[0][0];hold.getRange(`H${row}`).values=[[old+100]];w.recalculate();
  const changed=value();const linked=dash.getRange('G16').values[0][0];
  if(Math.abs(changed-original-100)>.001||Math.abs(linked-changed)>.001)throw Error(`${symbol} input recalculation failed`);
  hold.getRange(`H${row}`).values=[[old]];
 }else if(typeof dash.getRange('G16').values[0][0]==='number')throw Error(`${symbol} missing holding displayed as number`);
 w.recalculate();
 const end=17+etf.product_universe.length;
 const blob=await w.render({sheetName:'持仓录入',range:`F17:L${end}`,scale:1,format:'png'});
 await fs.writeFile(`${root}/${symbol}-holdings-detail-qa.png`,new Uint8Array(await blob.arrayBuffer()));
 const inspection=await w.inspect({kind:'table',range:`'${symbol}日报'!A8:R19`,include:'values,formulas',tableMaxRows:12,tableMaxCols:18,maxChars:3000});
 await fs.writeFile(`${root}/${symbol}-table-check.ndjson`,inspection.ndjson);
 reports.push({symbol,current_sample:current?expected:null,history_excluded:true,current_input_recalculates:!!current,missing_holdings_not_zero:!current?true:null});
}
await fs.writeFile('/Users/jss/Desktop/workspace/XCreator/research/2026-10-21/recalculation-qa.json',JSON.stringify(reports,null,2)+'\n');
console.log(JSON.stringify(reports));
