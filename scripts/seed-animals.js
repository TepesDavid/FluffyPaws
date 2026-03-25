// Seed 12 animals into Firestore via REST API.
// Uses the Firebase web API key and assumes Firestore rules allow write access.

const FIREBASE_API_KEY = 'AIzaSyB49ICZFZzDrnZdCqK153SB95QTCzEm7ac';
const PROJECT_ID = 'proiectweb-487aa';
const COLLECTION = 'animals';

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`;

const nowIso = new Date().toISOString();

const animals = [
  {
    name: 'Luna',
    species: 'cat',
    breed: 'European Shorthair',
    ageCategory: 'young',
    sex: 'F',
    size: 'small',
    city: 'bucuresti',
    description: 'Pisica blanda, curioasa si sociabila, obisnuita cu apartamentul.',
    photo: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1492370284958-c20b15c692d2?w=800&h=600&fit=crop'
    ],
    status: 'new',
    available: true,
    vaccinated: true,
    sterilized: false,
    microchipped: true,
    dewormed: true,
    temperament: ['Prietenos', 'Curios', 'Linistit']
  },
  {
    name: 'Rex',
    species: 'dog',
    breed: 'Ciobanesc German',
    ageCategory: 'adult',
    sex: 'M',
    size: 'large',
    city: 'cluj',
    description: 'Loial si protector, potrivit pentru o familie activa.',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=800&h=600&fit=crop'
    ],
    status: 'available',
    available: true,
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    dewormed: true,
    temperament: ['Energic', 'Loial', 'Jucaus']
  },
  {
    name: 'Maya',
    species: 'cat',
    breed: 'British Shorthair',
    ageCategory: 'adult',
    sex: 'F',
    size: 'medium',
    city: 'timisoara',
    description: 'Pisica echilibrata, potrivita pentru familii cu copii.',
    photo: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1492370284958-c20b15c692d2?w=800&h=600&fit=crop'
    ],
    status: 'available',
    available: true,
    vaccinated: true,
    sterilized: true,
    microchipped: false,
    dewormed: true,
    temperament: ['Calm', 'Afectuos']
  },
  {
    name: 'Toby',
    species: 'dog',
    breed: 'Beagle',
    ageCategory: 'young',
    sex: 'M',
    size: 'medium',
    city: 'iasi',
    description: 'Nas fin si mult chef de joaca, invata rapid.',
    photo: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop'
    ],
    status: 'new',
    available: true,
    vaccinated: true,
    sterilized: false,
    microchipped: true,
    dewormed: true,
    temperament: ['Jucaus', 'Sociabil']
  },
  {
    name: 'Nala',
    species: 'cat',
    breed: 'Ragdoll',
    ageCategory: 'young',
    sex: 'F',
    size: 'medium',
    city: 'brasov',
    description: 'Foarte blanda si lipicioasa, se intelege cu alti pisici.',
    photo: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1492370284958-c20b15c692d2?w=800&h=600&fit=crop'
    ],
    status: 'available',
    available: true,
    vaccinated: true,
    sterilized: false,
    microchipped: false,
    dewormed: true,
    temperament: ['Calm', 'Afectuos', 'Prietenos']
  },
  {
    name: 'Bruno',
    species: 'dog',
    breed: 'Labrador',
    ageCategory: 'adult',
    sex: 'M',
    size: 'large',
    city: 'sibiu',
    description: 'Caine calm si iubitor, ideal pentru familie.',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800&h=600&fit=crop'
    ],
    status: 'available',
    available: true,
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    dewormed: true,
    temperament: ['Prietenos', 'Echilibrat']
  },
  {
    name: 'Pufi',
    species: 'rabbit',
    breed: 'Iepure Pitic',
    ageCategory: 'young',
    sex: 'F',
    size: 'small',
    city: 'bucuresti',
    description: 'Iepuras bland, obisnuit cu oamenii si joaca.',
    photo: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&h=600&fit=crop'
    ],
    status: 'available',
    available: true,
    vaccinated: false,
    sterilized: false,
    microchipped: false,
    dewormed: true,
    temperament: ['Bland', 'Timid']
  },
  {
    name: 'Rio',
    species: 'bird',
    breed: 'Papagal',
    ageCategory: 'adult',
    sex: 'M',
    size: 'small',
    city: 'cluj',
    description: 'Papagal vocal si inteligent, invata rapid cuvinte.',
    photo: 'https://images.unsplash.com/photo-1463436755683-3f8051433e73?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1463436755683-3f8051433e73?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1490718720454-936c0f8ad5ae?w=800&h=600&fit=crop'
    ],
    status: 'urgent',
    available: true,
    vaccinated: false,
    sterilized: false,
    microchipped: false,
    dewormed: true,
    temperament: ['Vocal', 'Curios']
  },
  {
    name: 'Milo',
    species: 'cat',
    breed: 'Maine Coon',
    ageCategory: 'adult',
    sex: 'M',
    size: 'large',
    city: 'iasi',
    description: 'Bland si prietenos, se intelege cu copiii.',
    photo: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1492370284958-c20b15c692d2?w=800&h=600&fit=crop'
    ],
    status: 'available',
    available: true,
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    dewormed: true,
    temperament: ['Afectuos', 'Calm']
  },
  {
    name: 'Loki',
    species: 'dog',
    breed: 'Husky',
    ageCategory: 'young',
    sex: 'M',
    size: 'large',
    city: 'brasov',
    description: 'Energic si curios, are nevoie de miscare zilnica.',
    photo: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=800&h=600&fit=crop'
    ],
    status: 'new',
    available: true,
    vaccinated: true,
    sterilized: false,
    microchipped: true,
    dewormed: true,
    temperament: ['Energic', 'Jucaus']
  },
  {
    name: 'Coco',
    species: 'other',
    breed: 'Hamster Sirian',
    ageCategory: 'baby',
    sex: 'F',
    size: 'small',
    city: 'timisoara',
    description: 'Hamster mic si activ, usor de ingrijit.',
    photo: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop'
    ],
    status: 'available',
    available: true,
    vaccinated: false,
    sterilized: false,
    microchipped: false,
    dewormed: true,
    temperament: ['Activ', 'Curios']
  },
  {
    name: 'Bella',
    species: 'dog',
    breed: 'Bichon',
    ageCategory: 'senior',
    sex: 'F',
    size: 'small',
    city: 'bucuresti',
    description: 'Foarte blanda si atasata de oameni, potrivita pentru apartament.',
    photo: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=300&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=800&h=600&fit=crop'
    ],
    status: 'urgent',
    available: true,
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    dewormed: true,
    temperament: ['Bland', 'Afectuos']
  }
];

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number' && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields = {};
    Object.entries(value).forEach(([k, v]) => {
      fields[k] = toFirestoreValue(v);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  Object.entries(obj).forEach(([k, v]) => {
    fields[k] = toFirestoreValue(v);
  });
  return { fields };
}

async function createAnimal(animal) {
  const body = toFirestoreDoc({
    ...animal,
    createdAt: nowIso
  });

  const res = await fetch(`${BASE_URL}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.name;
}

(async () => {
  try {
    const results = [];
    for (const animal of animals) {
      results.push(await createAnimal(animal));
    }
    console.log('Created documents:');
    results.forEach(r => console.log(' - ' + r));
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  }
})();
