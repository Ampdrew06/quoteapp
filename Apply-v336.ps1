$ErrorActionPreference = 'Stop'
try {
 $target = Join-Path $PSScriptRoot 'src\pages\documents\CustomerRoofDocument.jsx'
 $template = Join-Path $PSScriptRoot 'Quotation-v336.txt'
 if (!(Test-Path $target)) { throw 'Extract this update into the app root containing src, then run again.' }
 $text = [IO.File]::ReadAllText($target)
 if (!$text.Contains("import ModernOrderForm")) { throw 'Install v335 first. No existing source has been changed.' }
 if (!$text.Contains("import RoofIsometric")) {
  $text = "import RoofIsometric from './RoofIsometric';" + [Environment]::NewLine + "import './quotationPack.css';" + [Environment]::NewLine + $text
 }
 $pattern = '(?s)function Quotation\(.*?(?=\r?\nfunction OrderForm\()'
 $rx = New-Object System.Text.RegularExpressions.Regex($pattern)
 if ($rx.Matches($text).Count -ne 1) { throw 'Could not identify the Quotation component. No existing source has been changed.' }
 $replacement = [IO.File]::ReadAllText($template)
 $text = $rx.Replace($text,[System.Text.RegularExpressions.MatchEvaluator]{param($m) $replacement})
 if (!$text.Contains('const [includeOrder,setIncludeOrder]')) {
  $old='const [customer,setCustomer]=useState(null);'
  if (!$text.Contains($old)) { throw 'Customer state not found. No existing source has been changed.' }
  $text=$text.Replace($old,$old+[Environment]::NewLine+' const [includeOrder,setIncludeOrder]=useState(true);')
 }
 $text=$text.Replace("const label=order?'Order Form':'Quotation';","const label=order?'Order Form':includeOrder?'Quotation & Order Form':'Quotation';")
 if (!$text.Contains('Include order form in PDF')) {
  $old='{ready&&<div className="rd-actions">'
  if (!$text.Contains($old)) { throw 'Print controls not found. No existing source has been changed.' }
  $new='{ready&&!order&&<label><input type="checkbox" checked={includeOrder} onChange={e=>setIncludeOrder(e.target.checked)}/> Include order form in PDF</label>}'+[Environment]::NewLine+'    '+$old
  $text=$text.Replace($old,$new)
 }
 $old='{ready&&(order?<ModernOrderForm key={record.id} data={d}/>:<Quotation data={d} drawing={plan.drawing}/>)}'
 $new=@'
{ready&&(order?<ModernOrderForm key={record.id} data={d}/>:<>
    <Quotation data={d} drawing={plan.drawing} preview={<RoofIsometric family={family} geometry={plan.geometry} inputs={record.inputs_json??{}}/>}/>
    {includeOrder&&<ModernOrderForm key={record.id} data={d}/>}
   </>)}
'@
 if ($text.Contains($old)) { $text=$text.Replace($old,$new) }
 elseif (!$text.Contains('preview={<RoofIsometric')) { throw 'Document output not found. No existing source has been changed.' }
 $text=$text.Replace('Save as PDF, then attach it to your email.','Choose Save as PDF, then attach it to your email.')
 Copy-Item $target ($target+'.before-v336-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.bak')
 [IO.File]::WriteAllText($target,$text,(New-Object System.Text.UTF8Encoding($false)))
 Write-Host 'v336 installed. Your email body/signature and existing CSS files were preserved.' -ForegroundColor Green
} catch {
 Write-Host $_.Exception.Message -ForegroundColor Red
 exit 1
}
