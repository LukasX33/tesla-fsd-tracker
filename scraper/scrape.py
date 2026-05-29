import asyncio
import os
import json
from twikit import Client

# Zuordnung von Keywords im Tweet zu ISO-3 Ländercodes
COUNTRY_MAPPING = {
    'germany': 'DEU', 'deutschland': 'DEU',
    'netherlands': 'NLD', 'holland': 'NLD',
    'france': 'FRA', 'frankreich': 'FRA',
    'spain': 'ESP', 'spanien': 'ESP',
    'lithuania': 'LTU', 'litauen': 'LTU',
    'belgium': 'BEL', 'belgien': 'BEL',
    'united kingdom': 'GBR', 'uk': 'GBR'
}

async def main():
    # Client initialisieren
    client = Client('en-US')
    
    # Login über die GitHub Secrets
    await client.login(
        auth_info_1=os.environ['X_USERNAME'],
        auth_info_2=os.environ['X_EMAIL'],
        password=os.environ['X_PASSWORD']
    )
    
    # Tweets von @teslaeurope holen
    user = await client.get_user_by_screen_name('teslaeurope')
    tweets = await client.get_user_tweets(user.id, 'Tweets')
    
    # Bestehende data.json einlesen
    data_path = os.path.join(os.path.dirname(__file__), '../public/data.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        current_status = json.load(f)
        
    for tweet in tweets:
        text = tweet.text.lower()
        
        # Land im Text suchen
        found_iso = None
        for keyword, iso in COUNTRY_MAPPING.items():
            if keyword in text:
                found_iso = iso
                break
                
        if found_iso:
            # Fall 1: Volle Zulassung
            if 'fsd supervised' in text and ('rolling out' in text or 'approved' in text or 'certified' in text):
                current_status[found_iso] = {
                    'status': 'approved',
                    'comment': f'Zugelassen laut X: "{tweet.text[:60]}..."'
                }
            # Fall 2: Ride-Alongs / Tests
            elif 'ride along' in text or 'testing fsd' in text or 'pilot' in text:
                if current_status.get(found_iso, {}).get('status') != 'approved':
                    current_status[found_iso] = {
                        'status': 'ridealong',
                        'comment': f'Testphase laut X: "{tweet.text[:60]}..."'
                    }

    # Aktualisierte Daten zurückschreiben
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(current_status, f, indent=2, ensure_ascii=False)
        
    print("data.json wurde über Python erfolgreich aktualisiert!")

if __name__ == '__main__':
    asyncio.run(main())
