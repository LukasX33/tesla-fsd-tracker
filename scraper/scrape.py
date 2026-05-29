import os
import json
import urllib.request
import xml.etree.ElementTree as ET

COUNTRY_MAPPING = {
    'germany': 'DEU', 'deutschland': 'DEU',
    'netherlands': 'NLD', 'holland': 'NLD',
    'france': 'FRA', 'frankreich': 'FRA',
    'spain': 'ESP', 'spanien': 'ESP',
    'lithuania': 'LTU', 'litauen': 'LTU',
    'belgium': 'BEL', 'belgien': 'BEL',
    'united kingdom': 'GBR', 'uk': 'GBR'
}

def main():
    # Wir nutzen eine verlässliche nitter-Instanz (Open-Source X-Viewer), um den RSS-Feed zu holen
    # Nitter spiegelt X-Accounts komplett ohne Login-Schranken
    rss_url = "https://nitter.privacydev.net/teslaeurope/rss"
    
    try:
        req = urllib.request.Request(
            rss_url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"Fehler beim Abrufen des Feeds: {e}")
        return

    # XML parsen
    root = ET.fromstring(xml_data)
    
    data_path = os.path.join(os.path.dirname(__file__), '../public/data.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        current_status = json.load(f)

    # Alle Artikel (Tweets) im Feed durchgehen
    for item in root.findall('.//item'):
        title = item.find('title').text if item.find('title') is not None else ""
        description = item.find('description').text if item.find('description') is not None else ""
        
        # Kombiniere Text für die Suche
        full_text = (title + " " + description).lower()
        
        found_iso = None
        for keyword, iso in COUNTRY_MAPPING.items():
            if keyword in full_text:
                found_iso = iso
                break
                
        if found_iso:
            clean_text = title if title else "Tesla Europe Update"
            # Fall 1: FSD Zulassung
            if 'fsd supervised' in full_text and ('rolling out' in full_text or 'approved' in full_text or 'certified' in full_text):
                current_status[found_iso] = {
                    'status': 'approved',
                    'comment': f'Zugelassen laut X: "{clean_text[:60]}..."'
                }
            # Fall 2: Ride-Alongs
            elif 'ride along' in full_text or 'testing fsd' in full_text or 'pilot' in full_text:
                if current_status.get(found_iso, {}).get('status') != 'approved':
                    current_status[found_iso] = {
                        'status': 'ridealong',
                        'comment': f'Testphase laut X: "{clean_text[:60]}..."'
                    }

    # Speichern
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(current_status, f, indent=2, ensure_ascii=False)
        
    print("data.json wurde via RSS erfolgreich aktualisiert!")

if __name__ == '__main__':
    main()
