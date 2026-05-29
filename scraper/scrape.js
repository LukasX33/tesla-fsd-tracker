const { Client } = require('twikit');
const fs = require('fs');
const path = require('path');

// Mapping von Keywords/Ländernamen zu ISO-3-Codes
const countryMapping = {
  'germany': 'DEU', 'deutschland': 'DEU',
  'netherlands': 'NLD', 'holland': 'NLD',
  'france': 'FRA', 'frankreich': 'FRA',
  'spain': 'ESP', 'spanien': 'ESP',
  'lithuania': 'LTU', 'litauen': 'LTU',
  'belgium': 'BEL', 'belgien': 'BEL',
  'united kingdom': 'GBR', 'uk': 'GBR'
};

async function run() {
  const client = new Client('en-US');
  
  // Login über Umgebungsvariablen (wird später in GitHub Secrets hinterlegt)
  await client.login({
    auth_info_1: process.env.X_USERNAME,
    auth_info_2: process.env.X_EMAIL,
    password: process.env.X_PASSWORD
  });

  // ID von @teslaeurope abfragen
  const user = await client.getUserByScreenName('teslaeurope');
  // Die letzten 20 Tweets laden
  const tweets = await client.getUserTweets(user.id, 'Tweets');

  const dataPath = path.join(__dirname, '../public/data.json');
  let currentStatus = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase();
    
    // Suche nach dem betroffenen Land im Tweet-Text
    let foundIso = null;
    for (const [keyword, iso] of Object.entries(countryMapping)) {
      if (text.includes(keyword)) {
        foundIso = iso;
        break;
      }
    }

    if (foundIso) {
      // 1. Fall: Volle FSD Zulassung / Rollout
      if (text.includes('fsd supervised') && (text.includes('rolling out') || text.includes('approved') || text.includes('certified'))) {
        currentStatus[foundIso] = {
          status: 'approved',
          comment: `Zugelassen laut X-Meldung: "${tweet.text.substring(0, 60)}..."`
        };
      } 
      // 2. Fall: Ride-Alongs oder Testphasen
      else if (text.includes('ride along') || text.includes('testing fsd') || text.includes('pilot')) {
        // Überschreibe "approved" nicht, falls bereits grün markiert
        if (currentStatus[foundIso]?.status !== 'approved') {
          currentStatus[foundIso] = {
            status: 'ridealong',
            comment: `Testphase laut X-Meldung: "${tweet.text.substring(0, 60)}..."`
          };
        }
      }
    }
  }

  // Aktualisierte Daten zurückschreiben
  fs.writeFileSync(dataPath, JSON.stringify(currentStatus, null, 2));
  console.log("data.json erfolgreich aktualisiert!");
}

run().catch(console.error);