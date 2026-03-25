# Seed 12 animals into Firestore via REST API.
# Uses the Firebase web API key and assumes Firestore rules allow write access.

$FirebaseApiKey = 'AIzaSyB49ICZFZzDrnZdCqK153SB95QTCzEm7ac'
$ProjectId = 'proiectweb-487aa'
$Collection = 'animals'
$BaseUrl = "https://firestore.googleapis.com/v1/projects/$ProjectId/databases/%28default%29/documents/$Collection"
$NowIso = (Get-Date).ToString('o')

$animals = @(
    @{
        name = 'Luna'
        species = 'cat'
        breed = 'European Shorthair'
        ageCategory = 'young'
        sex = 'F'
        size = 'small'
        city = 'bucuresti'
        description = 'Pisica blanda, curioasa si sociabila, obisnuita cu apartamentul.'
        photo = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop'
        status = 'new'
        available = $true
        vaccinated = $true
        sterilized = $false
        microchipped = $true
        dewormed = $true
        temperament = @('Prietenos','Curios','Linistit')
    },
    @{
        name = 'Rex'
        species = 'dog'
        breed = 'Ciobanesc German'
        ageCategory = 'adult'
        sex = 'M'
        size = 'large'
        city = 'cluj'
        description = 'Loial si protector, potrivit pentru o familie activa.'
        photo = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop'
        status = 'available'
        available = $true
        vaccinated = $true
        sterilized = $true
        microchipped = $true
        dewormed = $true
        temperament = @('Energic','Loial','Jucaus')
    },
    @{
        name = 'Maya'
        species = 'cat'
        breed = 'British Shorthair'
        ageCategory = 'adult'
        sex = 'F'
        size = 'medium'
        city = 'timisoara'
        description = 'Pisica echilibrata, potrivita pentru familii cu copii.'
        photo = 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=400&h=300&fit=crop'
        status = 'available'
        available = $true
        vaccinated = $true
        sterilized = $true
        microchipped = $false
        dewormed = $true
        temperament = @('Calm','Afectuos')
    },
    @{
        name = 'Toby'
        species = 'dog'
        breed = 'Beagle'
        ageCategory = 'young'
        sex = 'M'
        size = 'medium'
        city = 'iasi'
        description = 'Nas fin si mult chef de joaca, invata rapid.'
        photo = 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=400&h=300&fit=crop'
        status = 'new'
        available = $true
        vaccinated = $true
        sterilized = $false
        microchipped = $true
        dewormed = $true
        temperament = @('Jucaus','Sociabil')
    },
    @{
        name = 'Nala'
        species = 'cat'
        breed = 'Ragdoll'
        ageCategory = 'young'
        sex = 'F'
        size = 'medium'
        city = 'brasov'
        description = 'Foarte blanda si lipicioasa, se intelege cu alti pisici.'
        photo = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop'
        status = 'available'
        available = $true
        vaccinated = $true
        sterilized = $false
        microchipped = $false
        dewormed = $true
        temperament = @('Calm','Afectuos','Prietenos')
    },
    @{
        name = 'Bruno'
        species = 'dog'
        breed = 'Labrador'
        ageCategory = 'adult'
        sex = 'M'
        size = 'large'
        city = 'sibiu'
        description = 'Caine calm si iubitor, ideal pentru familie.'
        photo = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop'
        status = 'available'
        available = $true
        vaccinated = $true
        sterilized = $true
        microchipped = $true
        dewormed = $true
        temperament = @('Prietenos','Echilibrat')
    },
    @{
        name = 'Pufi'
        species = 'rabbit'
        breed = 'Iepure Pitic'
        ageCategory = 'young'
        sex = 'F'
        size = 'small'
        city = 'bucuresti'
        description = 'Iepuras bland, obisnuit cu oamenii si joaca.'
        photo = 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&h=300&fit=crop'
        status = 'available'
        available = $true
        vaccinated = $false
        sterilized = $false
        microchipped = $false
        dewormed = $true
        temperament = @('Bland','Timid')
    },
    @{
        name = 'Rio'
        species = 'bird'
        breed = 'Papagal'
        ageCategory = 'adult'
        sex = 'M'
        size = 'small'
        city = 'cluj'
        description = 'Papagal vocal si inteligent, invata rapid cuvinte.'
        photo = 'https://images.unsplash.com/photo-1463436755683-3f8051433e73?w=400&h=300&fit=crop'
        status = 'urgent'
        available = $true
        vaccinated = $false
        sterilized = $false
        microchipped = $false
        dewormed = $true
        temperament = @('Vocal','Curios')
    },
    @{
        name = 'Milo'
        species = 'cat'
        breed = 'Maine Coon'
        ageCategory = 'adult'
        sex = 'M'
        size = 'large'
        city = 'iasi'
        description = 'Bland si prietenos, se intelege cu copiii.'
        photo = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop'
        status = 'available'
        available = $true
        vaccinated = $true
        sterilized = $true
        microchipped = $true
        dewormed = $true
        temperament = @('Afectuos','Calm')
    },
    @{
        name = 'Loki'
        species = 'dog'
        breed = 'Husky'
        ageCategory = 'young'
        sex = 'M'
        size = 'large'
        city = 'brasov'
        description = 'Energic si curios, are nevoie de miscare zilnica.'
        photo = 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=400&h=300&fit=crop'
        status = 'new'
        available = $true
        vaccinated = $true
        sterilized = $false
        microchipped = $true
        dewormed = $true
        temperament = @('Energic','Jucaus')
    },
    @{
        name = 'Coco'
        species = 'other'
        breed = 'Hamster Sirian'
        ageCategory = 'baby'
        sex = 'F'
        size = 'small'
        city = 'timisoara'
        description = 'Hamster mic si activ, usor de ingrijit.'
        photo = 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=300&fit=crop'
        status = 'available'
        available = $true
        vaccinated = $false
        sterilized = $false
        microchipped = $false
        dewormed = $true
        temperament = @('Activ','Curios')
    },
    @{
        name = 'Bella'
        species = 'dog'
        breed = 'Bichon'
        ageCategory = 'senior'
        sex = 'F'
        size = 'small'
        city = 'bucuresti'
        description = 'Foarte blanda si atasata de oameni, potrivita pentru apartament.'
        photo = 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=300&fit=crop'
        status = 'urgent'
        available = $true
        vaccinated = $true
        sterilized = $true
        microchipped = $true
        dewormed = $true
        temperament = @('Bland','Afectuos')
    }
)

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

$created = @()
foreach ($animal in $animals) {
    $doc = Convert-ToFirestoreDoc (@{ } + $animal + @{ createdAt = $NowIso })
    $json = $doc | ConvertTo-Json -Depth 10

    try {
        $uri = "$($BaseUrl)?key=$FirebaseApiKey"
        $res = Invoke-RestMethod -Method Post -Uri $uri -ContentType 'application/json' -Body $json
        $created += $res.name
    } catch {
        Write-Error $_.Exception.Message
        if ($_.ErrorDetails) { Write-Error $_.ErrorDetails.Message }
        exit 1
    }
}

Write-Host "Created documents:"
$created | ForEach-Object { Write-Host " - $_" }
