<#
.SYNOPSIS
    Выгрузка веб-версии EngiCalc на хостинг через WebDAV (cPanel Web Disk, SSL).

.DESCRIPTION
    Загружает всё содержимое web/ в корень сайта engicalc.electroman.by,
    сохраняя структуру каталогов. Пароль берётся из переменной окружения
    WEBDAV_PASS и НЕ сохраняется в файлах и не пишется в вывод.

.EXAMPLE
    $env:WEBDAV_PASS = 'пароль'
    .\deploy-web.ps1

.EXAMPLE
    # Пробный прогон без записи на сервер
    .\deploy-web.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$Server   = 'electroman.by',
    [int]   $Port     = 2078,
    [string]$User     = 'electromanby',
    [string]$RemoteRoot = 'engicalc.electroman.by',
    [string]$LocalRoot  = "$PSScriptRoot\web",
    # Не выгружать на прод (пути относительно web/, разделитель — прямой слэш).
    # Эти же файлы удаляются с сервера, иначе ранее залитая копия осталась бы висеть.
    [string[]]$Exclude  = @('tests.html')
)

$ErrorActionPreference = 'Stop'

if (-not $env:WEBDAV_PASS) {
    Write-Error "Не задан пароль. Выполните: `$env:WEBDAV_PASS = 'ваш пароль Web Disk'"
    exit 1
}
if (-not (Test-Path $LocalRoot)) {
    Write-Error "Каталог не найден: $LocalRoot"
    exit 1
}

$base = "https://${Server}:${Port}/${RemoteRoot}"

function Get-RelPath($file) {
    $file.FullName.Substring($LocalRoot.Length).TrimStart('\') -replace '\\', '/'
}

$all      = Get-ChildItem -Path $LocalRoot -Recurse -File
$files    = $all | Where-Object { (Get-RelPath $_) -notin $Exclude }
$skipped  = $all | Where-Object { (Get-RelPath $_) -in $Exclude }

Write-Host "Выгрузка $($files.Count) файлов -> $base" -ForegroundColor Cyan
if ($skipped) {
    Write-Host "Исключены из выгрузки: $(($skipped | ForEach-Object { Get-RelPath $_ }) -join ', ')" -ForegroundColor Yellow
}

# --- каталоги создаём заранее: PUT в несуществующую папку вернёт 409 ---
$dirs = $files |
    ForEach-Object { $_.DirectoryName.Substring($LocalRoot.Length).TrimStart('\') } |
    Where-Object { $_ } | Sort-Object -Unique

foreach ($d in $dirs) {
    $url = "$base/" + ($d -replace '\\', '/')
    if (-not $PSCmdlet.ShouldProcess($url, 'MKCOL')) { continue }

    # Никаких --fail-with-body и 2>&1: 405 «каталог уже есть» — штатный ответ,
    # а перенаправление stderr нативной программы в PS 5.1 даёт NativeCommandError
    # и при ErrorActionPreference=Stop обрывает весь деплой.
    $code = & curl.exe --silent --output NUL --write-out '%{http_code}' `
        --user "${User}:$env:WEBDAV_PASS" --request MKCOL $url

    if ($code -notmatch '^(200|201|204|301|405)$') {
        Write-Host ("  MKCOL {0,-12} HTTP {1}" -f $d, $code) -ForegroundColor Yellow
    }
}

$ok = 0; $failed = @()
foreach ($f in $files) {
    $rel = Get-RelPath $f
    $url = "$base/$rel"
    if (-not $PSCmdlet.ShouldProcess($url, 'PUT')) { continue }

    $code = & curl.exe --silent --output NUL --write-out '%{http_code}' `
        --user "${User}:$env:WEBDAV_PASS" --upload-file $f.FullName $url

    if ($code -match '^(200|201|204)$') {
        $ok++
        Write-Host ("  ok  {0,-34} {1}" -f $rel, $code) -ForegroundColor DarkGray
    } else {
        $failed += "$rel -> HTTP $code"
        Write-Host ("  ОШИБКА {0,-30} {1}" -f $rel, $code) -ForegroundColor Red
    }
}

Write-Host "`nЗагружено: $ok из $($files.Count)" -ForegroundColor Cyan

# --- снимаем с публикации исключённые файлы ---
# Исключить из выгрузки недостаточно: ранее залитая копия осталась бы доступной.
foreach ($rel in $Exclude) {
    $url = "$base/$rel"
    if (-not $PSCmdlet.ShouldProcess($url, 'DELETE')) { continue }

    $code = & curl.exe --silent --output NUL --write-out '%{http_code}' `
        --user "${User}:$env:WEBDAV_PASS" --request DELETE $url

    switch -regex ($code) {
        '^(200|204)$' { Write-Host "  удалён с сервера: $rel" -ForegroundColor Yellow }
        '^404$'       { Write-Host "  на сервере отсутствует: $rel" -ForegroundColor DarkGray }
        default       { Write-Host "  не удалось удалить $rel -> HTTP $code" -ForegroundColor Red
                        $failed += "DELETE $rel -> HTTP $code" }
    }
}

if ($failed) {
    Write-Host "Не загрузились:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
}

# --- проверка: сайт отдаёт новую версию service worker ---
try {
    $sw = Invoke-WebRequest "https://$RemoteRoot/sw.js?nocache=$(Get-Random)" -UseBasicParsing -TimeoutSec 20
    $ver = ([regex]::Match($sw.Content, "CACHE_NAME\s*=\s*'([^']+)'")).Groups[1].Value
    Write-Host "Проверка: на сайте CACHE_NAME = $ver" -ForegroundColor Green
} catch {
    Write-Host "Проверку выполнить не удалось: $($_.Exception.Message)" -ForegroundColor Yellow
}

foreach ($rel in $Exclude) {
    try {
        Invoke-WebRequest "https://$RemoteRoot/$rel" -UseBasicParsing -TimeoutSec 15 -Method Head | Out-Null
        Write-Host "Внимание: $rel всё ещё доступен на сайте" -ForegroundColor Red
    } catch {
        Write-Host "Проверка: $rel недоступен публично" -ForegroundColor Green
    }
}
