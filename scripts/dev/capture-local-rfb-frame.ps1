[CmdletBinding()]
param(
    [string]$HostName = '127.0.0.1',
    [ValidateRange(1, 65535)]
    [int]$Port = 5900,
    [switch]$SendF1,
    [Parameter(Mandatory)]
    [string]$OutputPpm
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-Exact {
    param([System.IO.Stream]$Stream, [int]$Count)
    $buffer = [byte[]]::new($Count)
    $offset = 0
    while ($offset -lt $Count) {
        $received = $Stream.Read($buffer, $offset, $Count - $offset)
        if ($received -le 0) {
            throw 'The RFB peer closed the connection before the expected payload arrived.'
        }
        $offset += $received
    }
    return $buffer
}

function Read-U16Be {
    param([byte[]]$Buffer, [int]$Offset)
    return [uint16]((([uint16]$Buffer[$Offset]) -shl 8) -bor $Buffer[$Offset + 1])
}

function Read-U32Be {
    param([byte[]]$Buffer, [int]$Offset)
    return [uint32]((([uint32]$Buffer[$Offset]) -shl 24) -bor (([uint32]$Buffer[$Offset + 1]) -shl 16) -bor (([uint32]$Buffer[$Offset + 2]) -shl 8) -bor $Buffer[$Offset + 3])
}

function Set-U16Be {
    param([byte[]]$Buffer, [int]$Offset, [uint16]$Value)
    $Buffer[$Offset] = [byte]($Value -shr 8)
    $Buffer[$Offset + 1] = [byte]($Value -band 0xff)
}

$client = [System.Net.Sockets.TcpClient]::new()
try {
    $client.Connect($HostName, $Port)
    $stream = $client.GetStream()
    $banner = [Text.Encoding]::ASCII.GetString((Read-Exact $stream 12))
    if ($banner -ne "RFB 003.008`n") {
        throw "Unsupported RFB banner: $banner"
    }
    $stream.Write([Text.Encoding]::ASCII.GetBytes("RFB 003.008`n"), 0, 12)

    $securityCount = (Read-Exact $stream 1)[0]
    if ($securityCount -eq 0) {
        $reasonLength = Read-U32Be (Read-Exact $stream 4) 0
        $reason = [Text.Encoding]::UTF8.GetString((Read-Exact $stream $reasonLength))
        throw "RFB server rejected the connection: $reason"
    }
    $securityTypes = Read-Exact $stream $securityCount
    if (-not ($securityTypes -contains [byte]1)) {
        throw 'The local RFB server did not offer the no-authentication security type.'
    }
    $stream.Write([byte[]]@(1), 0, 1)
    if ((Read-U32Be (Read-Exact $stream 4) 0) -ne 0) {
        throw 'The local RFB server rejected no-authentication security.'
    }

    $stream.Write([byte[]]@(1), 0, 1)
    $serverInit = Read-Exact $stream 24
    $width = Read-U16Be $serverInit 0
    $height = Read-U16Be $serverInit 2
    $pixelFormat = $serverInit[4..19]
    $nameLength = Read-U32Be $serverInit 20
    $serverName = [Text.Encoding]::UTF8.GetString((Read-Exact $stream $nameLength))

    $bytesPerPixel = [int]($pixelFormat[0] / 8)
    if ($bytesPerPixel -lt 1 -or $bytesPerPixel -gt 4 -or $pixelFormat[3] -ne 1) {
        throw 'The local RFB server selected an unsupported pixel format.'
    }

    if ($SendF1) {
        $keyEvent = [byte[]]::new(8)
        $keyEvent[0] = 4
        $keyEvent[1] = 1
        $keyEvent[6] = 0xff
        $keyEvent[7] = 0xbe
        $stream.Write($keyEvent, 0, $keyEvent.Length)
        $keyEvent[1] = 0
        $stream.Write($keyEvent, 0, $keyEvent.Length)
    }

    $setEncodings = [byte[]]::new(8)
    $setEncodings[0] = 2
    Set-U16Be $setEncodings 2 1
    $stream.Write($setEncodings, 0, $setEncodings.Length)

    $request = [byte[]]::new(10)
    $request[0] = 3
    Set-U16Be $request 6 $width
    Set-U16Be $request 8 $height
    $stream.Write($request, 0, $request.Length)

    $rawPixels = $null
    $frameWidth = 0
    $frameHeight = 0
    while ($null -eq $rawPixels) {
        $messageType = (Read-Exact $stream 1)[0]
        switch ($messageType) {
            0 {
                $updateHeader = Read-Exact $stream 3
                $rectangleCount = Read-U16Be $updateHeader 1
                for ($rectangle = 0; $rectangle -lt $rectangleCount; $rectangle++) {
                    $rectangleHeader = Read-Exact $stream 12
                    $rectangleWidth = Read-U16Be $rectangleHeader 4
                    $rectangleHeight = Read-U16Be $rectangleHeader 6
                    $encoding = [int32](Read-U32Be $rectangleHeader 8)
                    if ($encoding -ne 0) {
                        throw "The local RFB server returned unsupported encoding $encoding."
                    }
                    $payloadLength = [int64]$rectangleWidth * [int64]$rectangleHeight * $bytesPerPixel
                    if ($payloadLength -gt [int]::MaxValue) {
                        throw 'The RFB rectangle is too large to capture.'
                    }
                    $payload = Read-Exact $stream ([int]$payloadLength)
                    if ($rectangleWidth -ne $width -or $rectangleHeight -ne $height -or $rectangle -ne 0) {
                        throw 'The local RFB server did not return one full framebuffer rectangle.'
                    }
                    $rawPixels = $payload
                    $frameWidth = $rectangleWidth
                    $frameHeight = $rectangleHeight
                }
            }
            2 { }
            3 {
                $cutHeader = Read-Exact $stream 7
                [void](Read-Exact $stream ([int](Read-U32Be $cutHeader 3)))
            }
            default { throw "The local RFB server sent unsupported message type $messageType." }
        }
    }

    $redMaximum = Read-U16Be $pixelFormat 4
    $greenMaximum = Read-U16Be $pixelFormat 6
    $blueMaximum = Read-U16Be $pixelFormat 8
    $redShift = $pixelFormat[10]
    $greenShift = $pixelFormat[11]
    $blueShift = $pixelFormat[12]
    $bigEndian = $pixelFormat[2] -ne 0
    $ppmHeader = [Text.Encoding]::ASCII.GetBytes("P6`n$frameWidth $frameHeight`n255`n")
    $ppm = [byte[]]::new($ppmHeader.Length + ($frameWidth * $frameHeight * 3))
    [Array]::Copy($ppmHeader, $ppm, $ppmHeader.Length)
    for ($pixel = 0; $pixel -lt ($frameWidth * $frameHeight); $pixel++) {
        [uint64]$value = 0
        for ($component = 0; $component -lt $bytesPerPixel; $component++) {
            $sourceIndex = ($pixel * $bytesPerPixel) + $component
            if ($bigEndian) {
                $value = ($value -shl 8) -bor $rawPixels[$sourceIndex]
            } else {
                $value = $value -bor (([uint64]$rawPixels[$sourceIndex]) -shl (8 * $component))
            }
        }
        $destination = $ppmHeader.Length + ($pixel * 3)
        $ppm[$destination] = [byte]((($value -shr $redShift) -band $redMaximum) * 255 / $redMaximum)
        $ppm[$destination + 1] = [byte]((($value -shr $greenShift) -band $greenMaximum) * 255 / $greenMaximum)
        $ppm[$destination + 2] = [byte]((($value -shr $blueShift) -band $blueMaximum) * 255 / $blueMaximum)
    }
    [IO.Directory]::CreateDirectory((Split-Path -Parent $OutputPpm)) | Out-Null
    [IO.File]::WriteAllBytes($OutputPpm, $ppm)
    [pscustomobject]@{
        Host = $HostName
        Port = $Port
        ServerName = $serverName
        Width = $frameWidth
        Height = $frameHeight
        SentF1 = [bool]$SendF1
        OutputPpm = [IO.Path]::GetFullPath($OutputPpm)
    }
} finally {
    $client.Dispose()
}
