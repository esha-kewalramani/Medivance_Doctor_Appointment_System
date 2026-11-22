param(
    [string]$pptxPath,
    [string]$pdfPath
)

try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $pres = $ppt.Presentations.Open((Resolve-Path $pptxPath).Path, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    # 32 is ppSaveAsPDF
    $pres.SaveAs((Resolve-Path $pdfPath).Path, 32)
    $pres.Close()
    $ppt.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    Write-Output "PDF_EXPORT_SUCCESS"
} catch {
    Write-Output "PDF_EXPORT_FAILED: $_"
}
