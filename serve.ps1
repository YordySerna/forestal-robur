param(
  # por defecto sirve la carpeta donde está este mismo script
  [string]$Root = $PSScriptRoot,
  [int]$Port = 8765
)

$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".js"="application/javascript; charset=utf-8"; ".json"="application/json; charset=utf-8";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".png"="image/png"; ".webp"="image/webp";
  ".svg"="image/svg+xml"; ".ico"="image/x-icon"; ".mp4"="video/mp4"; ".woff2"="font/woff2";
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "serving $Root on http://localhost:$Port/"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
    $path = Join-Path $Root ($rel -replace '/', '\')

    if ((Test-Path $path -PathType Container)) { $path = Join-Path $path "index.html" }

    if (Test-Path $path -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $res.AddHeader("Cache-Control", "no-store")
      $res.AddHeader("Accept-Ranges", "bytes")
      $bytes = [System.IO.File]::ReadAllBytes($path)

      $range = $req.Headers["Range"]
      if ($range -and $range -match 'bytes=(\d+)-(\d*)') {
        $start = [int]$Matches[1]
        $end = if ($Matches[2]) { [int]$Matches[2] } else { $bytes.Length - 1 }
        if ($end -ge $bytes.Length) { $end = $bytes.Length - 1 }
        $len = $end - $start + 1
        $res.StatusCode = 206
        $res.AddHeader("Content-Range", "bytes $start-$end/$($bytes.Length)")
        $res.ContentLength64 = $len
        $res.OutputStream.Write($bytes, $start, $len)
      } else {
        $res.StatusCode = 200
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 $rel")
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $msg.Length
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.OutputStream.Close()
  } catch {
    Write-Host "ERR $($_.Exception.Message)"
  }
}
