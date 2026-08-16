param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('wasm32', 'wasm64')]
    [string]$Variant,
    [Parameter(Mandatory = $true)]
    [string]$ArtifactDirectory,
    [switch]$Incremental
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$msysBash = 'C:\msys64\usr\bin\bash.exe'
if (-not (Test-Path -LiteralPath $msysBash)) { throw 'MSYS2 bash was not found at C:\msys64\usr\bin\bash.exe.' }

$artifactFullPath = [IO.Path]::GetFullPath($ArtifactDirectory)
$projectPrefix = "$projectRoot\"
if (-not $artifactFullPath.StartsWith($projectPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'ArtifactDirectory must remain below the repository root.' }
$relativeArtifact = $artifactFullPath.Substring($projectPrefix.Length).Replace('\', '/')
if (-not $relativeArtifact.StartsWith('.cache/')) { throw 'ArtifactDirectory must remain below the repository .cache directory.' }

$env:MSYSTEM = 'UCRT64'
$env:CHERE_INVOKING = 'yes'
$command = if ($Incremental) {
    "cd '$($projectRoot.Replace('\', '/'))' && PC110_WEB_PKGCONF=/ucrt64/bin/pkgconf.exe PC110_WEB_MAKE=/usr/bin/make.exe scripts/qemu-build/incremental-qemu-wasm-gitbash.sh $Variant $relativeArtifact"
} else {
    "cd '$($projectRoot.Replace('\', '/'))' && PC110_WEB_PKGCONF=/ucrt64/bin/pkgconf.exe PC110_WEB_MAKE=/usr/bin/make.exe scripts/qemu-build/clean-qemu-wasm-variant-gitbash.sh $Variant $relativeArtifact"
}

& $msysBash -lc $command
exit $LASTEXITCODE
