[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ArchivePath,
    [Parameter(Mandatory = $true)]
    [string]$DestinationPath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ArchivePath -PathType Leaf)) {
    throw "Archive was not found: $ArchivePath"
}
if (Test-Path -LiteralPath $DestinationPath) {
    throw "Destination must not already exist: $DestinationPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$required = [ordered]@{
    'PC110Atlas-Personal-Media/Firmware/pc110_bios.bin' = 'pc110_bios.bin'
    'PC110Atlas-Personal-Media/Firmware/MSM538032E@SOP44.BIN' = 'pc110-fontrom.bin'
    'PC110Atlas-Personal-Media/Boot Media/Personaware.img' = 'Personaware-disk.img'
}

$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ArchivePath))
try {
    $manifestEntry = $zip.Entries | Where-Object FullName -eq 'PC110Atlas-Personal-Media/SHA256SUMS.txt'
    if ($null -eq $manifestEntry) {
        throw 'Archive does not contain SHA256SUMS.txt'
    }
    $reader = [System.IO.StreamReader]::new($manifestEntry.Open())
    try {
        $manifest = @{}
        foreach ($line in $reader.ReadToEnd().Trim().Split("`n")) {
            if ($line -match '^([0-9a-f]{64})  (.+)$') {
                $manifest[$Matches[2].Trim()] = $Matches[1]
            }
        }
    } finally {
        $reader.Dispose()
    }

    New-Item -ItemType Directory -Path $DestinationPath | Out-Null
    foreach ($entryPath in $required.Keys) {
        $entry = $zip.Entries | Where-Object FullName -eq $entryPath
        if ($null -eq $entry) {
            throw "Required archive member is missing: $entryPath"
        }
        $manifestPath = $entryPath.Substring('PC110Atlas-Personal-Media/'.Length)
        if (-not $manifest.ContainsKey($manifestPath)) {
            throw "Required archive member is absent from the embedded hash manifest: $manifestPath"
        }
        $target = Join-Path $DestinationPath $required[$entryPath]
        $input = $entry.Open()
        try {
            $output = [System.IO.File]::Create($target)
            try { $input.CopyTo($output) } finally { $output.Dispose() }
        } finally {
            $input.Dispose()
        }
        $actual = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $manifest[$manifestPath]) {
            throw "Hash verification failed for $entryPath"
        }
    }
} finally {
    $zip.Dispose()
}

Write-Output "Prepared verified local-only PC110 baseline assets at $DestinationPath"
