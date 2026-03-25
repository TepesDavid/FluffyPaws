# Update missing detail fields for animals collection.
# Adds vaccinated/sterilized/microchipped/dewormed/temperament when missing.

$FirebaseApiKey = 'AIzaSyB49ICZFZzDrnZdCqK153SB95QTCzEm7ac'
$ProjectId = 'proiectweb-487aa'
$Collection = 'animals'
$BaseUrl = "https://firestore.googleapis.com/v1/projects/$ProjectId/databases/%28default%29/documents/$Collection"

function Convert-ToFirestoreValue {
    param($Value)

    if ($null -eq $Value) { return @{ nullValue = $null } }
    if ($Value -is [string]) { return @{ stringValue = $Value } }
    if ($Value -is [bool]) { return @{ booleanValue = $Value } }
    if ($Value -is [int] -or $Value -is [long]) { return @{ integerValue = $Value.ToString() } }
    if ($Value -is [double] -or $Value -is [decimal]) { return @{ doubleValue = [double]$Value } }
    if ($Value -is [datetime]) { return @{ timestampValue = $Value.ToString('o') } }

    if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
        $values = @()
        foreach ($item in $Value) {
            $values += (Convert-ToFirestoreValue $item)
        }
        return @{ arrayValue = @{ values = $values } }
    }

    if ($Value -is [hashtable] -or $Value -is [pscustomobject]) {
        $fields = @{}
        foreach ($key in $Value.Keys) {
            $fields[$key] = Convert-ToFirestoreValue $Value[$key]
        }
        return @{ mapValue = @{ fields = $fields } }
    }

    return @{ stringValue = "$Value" }
}

function Convert-ToFirestoreDoc {
    param($Object)

    $fields = @{}
    foreach ($key in $Object.Keys) {
        $fields[$key] = Convert-ToFirestoreValue $Object[$key]
    }
    return @{ fields = $fields }
}

function Get-FieldString {
    param($Fields, $Name)
    if ($Fields -and ($Fields.PSObject.Properties.Name -contains $Name)) {
        return $Fields.$Name.stringValue
    }
    return $null
}

function Has-Field {
    param($Fields, $Name)
    if (-not $Fields) { return $false }
    return ($Fields.PSObject.Properties.Name -contains $Name)
}

function Get-TemperamentDefault {
    param($Species)
    switch ($Species) {
        'dog' { return @('Prietenos','Jucaus') }
        'cat' { return @('Calm','Afectuos') }
        'rabbit' { return @('Bland','Timid') }
        'bird' { return @('Curios','Vocal') }
        'other' { return @('Curios') }
        default { return @('Prietenos') }
    }
}

function Get-HealthDefaults {
    param($AgeCategory)
    $result = @{
        vaccinated = $true
        sterilized = $false
        microchipped = $false
        dewormed = $true
    }

    switch ($AgeCategory) {
        'baby' {
            $result.vaccinated = $false
            $result.sterilized = $false
            $result.microchipped = $false
            $result.dewormed = $true
        }
        'young' {
            $result.vaccinated = $true
            $result.sterilized = $false
            $result.microchipped = $false
            $result.dewormed = $true
        }
        'adult' {
            $result.vaccinated = $true
            $result.sterilized = $true
            $result.microchipped = $true
            $result.dewormed = $true
        }
        'senior' {
            $result.vaccinated = $true
            $result.sterilized = $true
            $result.microchipped = $true
            $result.dewormed = $true
        }
        default {
            $result.vaccinated = $true
            $result.sterilized = $false
            $result.microchipped = $false
            $result.dewormed = $true
        }
    }

    return $result
}

$allDocs = @()
$pageToken = $null

while ($true) {
    $uri = "$($BaseUrl)?key=$FirebaseApiKey&pageSize=200"
    if ($pageToken) { $uri = "$uri&pageToken=$pageToken" }

    try {
        $res = Invoke-RestMethod -Method Get -Uri $uri
    } catch {
        Write-Error $_.Exception.Message
        if ($_.ErrorDetails) { Write-Error $_.ErrorDetails.Message }
        exit 1
    }

    if ($res.documents) {
        $allDocs += $res.documents
    }

    if ($res.nextPageToken) {
        $pageToken = $res.nextPageToken
    } else {
        break
    }
}

$updated = @()
foreach ($doc in $allDocs) {
    $fields = $doc.fields
    $ageCategory = Get-FieldString $fields 'ageCategory'
    $species = Get-FieldString $fields 'species'

    $healthDefaults = Get-HealthDefaults $ageCategory
    $temperamentDefault = Get-TemperamentDefault $species

    $updates = @{}
    if (-not (Has-Field $fields 'vaccinated')) { $updates.vaccinated = $healthDefaults.vaccinated }
    if (-not (Has-Field $fields 'sterilized')) { $updates.sterilized = $healthDefaults.sterilized }
    if (-not (Has-Field $fields 'microchipped')) { $updates.microchipped = $healthDefaults.microchipped }
    if (-not (Has-Field $fields 'dewormed')) { $updates.dewormed = $healthDefaults.dewormed }
    if (-not (Has-Field $fields 'temperament')) { $updates.temperament = $temperamentDefault }

    if ($updates.Count -eq 0) { continue }

    $docBody = Convert-ToFirestoreDoc $updates
    $json = $docBody | ConvertTo-Json -Depth 10

    $mask = ($updates.Keys | ForEach-Object { "updateMask.fieldPaths=$($_)" }) -join '&'
    $patchUri = "https://firestore.googleapis.com/v1/$($doc.name)?key=$FirebaseApiKey&$mask"

    try {
        Invoke-RestMethod -Method Patch -Uri $patchUri -ContentType 'application/json' -Body $json | Out-Null
        $updated += $doc.name
    } catch {
        Write-Error $_.Exception.Message
        if ($_.ErrorDetails) { Write-Error $_.ErrorDetails.Message }
        exit 1
    }
}

Write-Host "Updated documents:"
$updated | ForEach-Object { Write-Host " - $_" }
