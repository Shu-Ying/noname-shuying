param(
    [Parameter(Mandatory = $true)][string]$Root,
    [string]$EventName = 'workflow_dispatch',
    [string]$PreviousRef = ''
)

$ErrorActionPreference = 'Stop'

function Read-Version([string]$Ref) {
    $source = git show "${Ref}:extension.js"
    if ($LASTEXITCODE -ne 0) { throw "Cannot read extension.js at $Ref" }
    $matches = [regex]::Matches(($source -join "`n"),
        '(?m)^\s*const\s+shuYingLocalVersion\s*=\s*"([^"\r\n]+)"\s*;')
    if ($matches.Count -ne 1) { throw "Expected one version at $Ref" }
    return $matches[0].Groups[1].Value
}

Push-Location -LiteralPath $Root
try {
    $version = Read-Version 'HEAD'
    if ($version -cnotmatch '^\d+\.\d+\.\d+\.\d+(-rc\.\d+)?$') {
        throw "Invalid release version: $version"
    }
    $changed = $true
    if ($EventName -eq 'push') {
        if ($PreviousRef -notmatch '^[0-9a-fA-F]{40}$') {
            throw 'Push event must provide its previous commit SHA'
        }
        if ($PreviousRef -notmatch '^0+$') {
            $previous = Read-Version $PreviousRef
            $changed = $previous -ne $version
        }
    }
    if (!$env:GITHUB_OUTPUT -or !$env:GITHUB_ENV) {
        throw 'Actions output and environment files are required'
    }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $release = $changed.ToString().ToLowerInvariant()
    [IO.File]::AppendAllText($env:GITHUB_OUTPUT,
        "should_release=$release`n", $utf8)
    [IO.File]::AppendAllText($env:GITHUB_ENV,
        "RELEASE_VERSION=$version`nRELEASE_TAG=v$version`n", $utf8)
    Write-Host "Version: $version; release required: $release"
} finally {
    Pop-Location
}
