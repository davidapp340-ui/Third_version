const csvData = `ID,Category_Name,Color_Name,Is_Displayed
MTIHA1,Stretch,Red,Yes
MTIHA2,Stretch,Red,Yes
MTIHA3,Stretch,Red,Yes
MTIHA4,Stretch,Red,Yes
TNOA1,Movement,Blue,Yes
TNOA2,Movement,Blue,Yes
TNOA3,Movement,Blue,Yes
TNOA4,Movement,Blue,Yes
ARPYA1,Relaxation,Purple,Yes
ARPYA2,Relaxation,Purple,Yes
ARPYA3,Relaxation,Purple,Yes
ARPYA4,Relaxation,Purple,Yes
CORDINAZIA1,Coordination,Green,Yes
CORDINAZIA2,Coordination,Green,Yes
CORDINAZIA3,Coordination,Green,Yes
CORDINAZIA4,Coordination,Green,No
MIKUD1,Focus,Light_Blue,Yes
MIKUD2,Focus,Light_Blue,Yes
MIKUD3,Focus,Light_Blue,Yes
MIKUD4,Focus,Light_Blue,No
DIMYON1,Guided imagery, brown,Yes
DIMYON2,Guided imagery,brown,Yes
DIMYON3,Guided imagery,brown,Yes
DIMYON4,Guided imagery,brown,No
HIMUM1,Warming up,Yellow ,Yes
HIMUM2,Warming up,Yellow ,Yes
HIMUM3,Warming up,Yellow ,Yes
HIMUM4,Warming up,Yellow ,No`;

const colorMap = {
  'Red': '#FF6B6B',
  'Blue': '#4ECDC4',
  'Purple': '#9B59B6',
  'Green': '#2ECC71',
  'Light_Blue': '#3498DB',
  'brown': '#8B4513',
  'Yellow': '#F1C40F',
  'Yellow ': '#F1C40F',
};

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });

    data.push(row);
  }

  return data;
}

function generateSQL(data) {
  const statements = [];

  data.forEach((row, index) => {
    const id = row.ID;
    let category = row.Category_Name;
    let colorName = row.Color_Name;
    const isDisplayed = row.Is_Displayed.toLowerCase() === 'yes';

    // Handle "Guided imagery, brown" case
    if (category.includes(',')) {
      const parts = category.split(',');
      category = parts[0].trim();
      colorName = parts[1].trim();
    }

    const hexColor = colorMap[colorName] || colorMap[colorName.trim()] || '#808080';
    const displayOrder = index + 1;

    statements.push(`('${id}', '${category}', '${hexColor}', ${isDisplayed}, ${displayOrder})`);
  });

  return statements;
}

const parsedData = parseCSV(csvData);
const sqlValues = generateSQL(parsedData);

console.log('-- Parsed data count:', parsedData.length);
console.log('');
console.log('-- SQL VALUES for INSERT:');
console.log(sqlValues.join(',\n'));
console.log('');
console.log('-- Categories found:');
const categories = [...new Set(parsedData.map(r => {
  let cat = r.Category_Name;
  if (cat.includes(',')) cat = cat.split(',')[0].trim();
  return cat;
}))];
console.log(categories.join(', '));
