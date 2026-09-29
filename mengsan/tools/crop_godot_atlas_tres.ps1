<#
Batch-crop Godot AtlasTexture .tres files into PNGs from their referenced atlas images.
Requires a FULL RECOVERY output where atlas sources are PNG/WebP. This script does not
unpack PCK files or decode .ctex; it only reads .tres/.tpsheet metadata and crops images.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [Parameter(Mandatory = $true)]
    [string]$OutputDirectory,

    [string]$SpriteDirectory = 'images/atlases/compressed.sprites/card_template',

    [switch]$Overwrite
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd('\')
$outRoot = [System.IO.Path]::GetFullPath($OutputDirectory).TrimEnd('\')
$relativeSpriteDir = $SpriteDirectory.TrimStart('\', '/').Replace('/', '\')
$sourceDir = [System.IO.Path]::GetFullPath((Join-Path $root $relativeSpriteDir))

if (-not (Test-Path -LiteralPath $root -PathType Container)) {
    throw "ProjectRoot not found: $root"
}
if (-not (Test-Path -LiteralPath $sourceDir -PathType Container)) {
    throw "SpriteDirectory not found: $sourceDir"
}
if ($outRoot.Equals($root, [System.StringComparison]::OrdinalIgnoreCase) -or
    $outRoot.StartsWith($root + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'OutputDirectory must be outside ProjectRoot so recovered source files stay untouched.'
}

$invariant = [System.Globalization.CultureInfo]::InvariantCulture
$files = @(Get-ChildItem -LiteralPath $sourceDir -Filter '*.tres' -File -Recurse)
$written = 0
$skipped = 0
$errors = [System.Collections.Generic.List[string]]::new()

foreach ($tres in $files) {
    $sourceImage = $null
    $crop = $null
    try {
        $text = [System.IO.File]::ReadAllText($tres.FullName)
        if ($text -notmatch 'type="AtlasTexture"') {
            $skipped++
            continue
        }

        $atlasIdMatch = [regex]::Match($text, '(?m)^\s*atlas\s*=\s*ExtResource\("([^"]+)"\)')
        $regionMatch = [regex]::Match($text, '(?m)^\s*region\s*=\s*Rect2i?\(\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*\)')
        if (-not $atlasIdMatch.Success -or -not $regionMatch.Success) {
            $skipped++
            $errors.Add("Missing atlas/region fields: $($tres.FullName)")
            continue
        }

        $atlasPath = $null
        foreach ($blockMatch in [regex]::Matches($text, '(?m)^\s*\[ext_resource[^\]]*\]')) {
            $block = $blockMatch.Value
            $idMatch = [regex]::Match($block, '\bid="([^"]+)"')
            $pathMatch = [regex]::Match($block, '\bpath="([^"]+)"')
            if ($idMatch.Success -and $pathMatch.Success -and
                $idMatch.Groups[1].Value -eq $atlasIdMatch.Groups[1].Value) {
                $atlasPath = $pathMatch.Groups[1].Value
                break
            }
        }
        if (-not $atlasPath) {
            $skipped++
            $errors.Add("Could not resolve atlas ExtResource: $($tres.FullName)")
            continue
        }

        if ($atlasPath.StartsWith('res://', [System.StringComparison]::OrdinalIgnoreCase)) {
            $atlasRelative = $atlasPath.Substring(6).Replace('/', '\')
            $atlasFile = Join-Path $root $atlasRelative
        } else {
            $atlasFile = Join-Path $tres.DirectoryName $atlasPath.Replace('/', '\')
        }
        if (-not (Test-Path -LiteralPath $atlasFile -PathType Leaf)) {
            $skipped++
            $errors.Add("Atlas image missing (Full Recovery should restore it as PNG): $atlasFile ; referenced by $($tres.FullName)")
            continue
        }

        $values = @(
            [double]::Parse($regionMatch.Groups[1].Value, $invariant),
            [double]::Parse($regionMatch.Groups[2].Value, $invariant),
            [double]::Parse($regionMatch.Groups[3].Value, $invariant),
            [double]::Parse($regionMatch.Groups[4].Value, $invariant)
        )
        $rounded = @($values | ForEach-Object { [int][Math]::Round($_) })
        for ($i = 0; $i -lt 4; $i++) {
            if ([Math]::Abs($values[$i] - $rounded[$i]) -gt 0.001) {
                throw "Non-integer pixel region in $($tres.FullName)"
            }
        }
        $x = $rounded[0]; $y = $rounded[1]; $width = $rounded[2]; $height = $rounded[3]
        if ($x -lt 0 -or $y -lt 0 -or $width -le 0 -or $height -le 0) {
            throw "Invalid crop region Rect2($x, $y, $width, $height) in $($tres.FullName)"
        }

        $sourceImage = [System.Drawing.Bitmap]::FromFile($atlasFile)
        if (($x + $width) -gt $sourceImage.Width -or ($y + $height) -gt $sourceImage.Height) {
            throw "Crop exceeds atlas bounds ($($sourceImage.Width)x$($sourceImage.Height)): $($tres.FullName)"
        }
        $rect = [System.Drawing.Rectangle]::new($x, $y, $width, $height)
        $crop = $sourceImage.Clone($rect, $sourceImage.PixelFormat)

        $relativeTres = $tres.FullName.Substring($root.Length).TrimStart('\')
        $relativeOutput = [System.IO.Path]::ChangeExtension($relativeTres, '.png')
        $target = Join-Path $outRoot $relativeOutput
        $targetDir = Split-Path -Parent $target
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        if ((Test-Path -LiteralPath $target) -and -not $Overwrite) {
            $skipped++
            continue
        }
        if (Test-Path -LiteralPath $target) {
            Remove-Item -LiteralPath $target -Force
        }
        $crop.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
        $written++
    }
    catch {
        $skipped++
        $errors.Add("$($tres.FullName): $($_.Exception.Message)")
    }
    finally {
        if ($null -ne $crop) { $crop.Dispose() }
        if ($null -ne $sourceImage) { $sourceImage.Dispose() }
    }
}

Write-Output "TRES scanned: $($files.Count)"
Write-Output "PNG written: $written"
Write-Output "Skipped: $skipped"
foreach ($message in $errors) { Write-Warning $message }
