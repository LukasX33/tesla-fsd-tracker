import os
import json
import urllib.request
import xml.etree.ElementTree as ET

# Globale Datenbank für alle Länder der Welt (ISO-3 Mapping)
# Erweitert um englische/deutsche Namen und länderspezifische Emojis
WORLD_COUNTRY_DATABASE = {
    # Europa
    'DEU': ['germany', 'deutschland', '🇩🇪'],
    'NLD': ['netherlands', 'nederland', 'holland', '🇳🇱'],
    'FRA': ['france', 'frankreich', '🇫🇷'],
    'GBR': ['united kingdom', 'uk', 'britain', 'england', '🇬🇧'],
    'ITA': ['italy', 'italien', 'italia', '🇮🇹'],
    'ESP': ['spain', 'spanien', 'espana', '🇪🇸'],
    'LTU': ['lithuania', 'litauen', '🇱🇹'],
    'BEL': ['belgium', 'belgien', '🇧🇪'],
    'AUT': ['austria', 'österreich', '🇦🇹'],
    'CHE': ['switzerland', 'schweiz', '🇨🇭'],
    'SWE': ['sweden', 'schweden', '🇸🇪'],
    'NOR': ['norway', 'norwegen', '🇳🇴'],
    'DNK': ['denmark', 'dänemark', '🇩🇰'],
    'POL': ['poland', 'polen', '🇵🇱'],
    'PRT': ['portugal', '🇵🇹'],
    'IRL': ['ireland', 'irland', '🇮🇪'],
    'FIN': ['finland', 'finnland', '🇫🇮'],
    'GRC': ['greece', 'griechenland', '🇬🇷'],
    
    # Nord- & Südamerika
    'USA': ['usa', 'united states', 'america', 'amerika', '🇺🇸'],
    'CAN': ['canada', 'kanada', '🇨🇦'],
    'MEX': ['mexico', 'mexiko', '🇲🇽'],
    'BRA': ['brazil', 'brasilien', 'brasil', '🇧🇷'],
    
    # Asien & Ozeanien
    'CHN': ['china', '🇨🇳'],
    'JPN': ['japan', '🇯🇵'],
    'AUS': ['australia', 'australien', '🇦🇺'],
    'NZL': ['new zealand', 'neuseeland', '🇳🇿'],
    'KOR': ['south korea', 'südkorea', '🇰🇷'],
    'ISR': ['israel', '🇮🇱'],
    'ARE': ['uae', 'dubai', 'emirates', 'emirate', '🇦🇪']
}

def find_country_in_text(text):
    """Durchsucht den Text nach Ländernamen oder Flaggen-Emojis"""
    for iso_code, keywords in WORLD_COUNTRY_DATABASE.items():
        for keyword in keywords:
            if keyword in text:
                return iso_code
    return None

def main():
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

    root = ET.fromstring(xml_data)
    
    data_path = os.path.join(os.path.dirname(__file__), '../public/data.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        current_status = json.load(f)

    for item in root.findall('.//item'):
        title = item.find('title').text if item.find('title') is not None else ""
        description = item.find('description').text if item.find('description') is not None else ""
        full_text = (title + " " + description).lower()
        
        # Land anhand der neuen Datenbank suchen
        found_iso = find_country_in_text(full_text)
                
        if found_iso:
            clean_text = title if title else "Tesla Europe Update"
            
            # Erkennung für "Zugelassen / FSD Supervised Rollout"
            if 'fsd supervised' in full_text and ('rolling out' in full_text or 'approved' in full_text or 'certified' in full_text or 'available' in full_text):
                current_status[found_iso] = {
                    'status': 'approved',
                    'comment': f'Zugelassen laut X: "{clean_text[:60]}..."'
                }
            # Erkennung für "Testfahrten / Ride-Alongs"
            elif 'ride along' in full_text or 'testing fsd' in full_text or 'pilot' in full_text or 'regulatory' in full_text:
                if current_status.get(found_iso, {}).get('status') != 'approved':
                    current_status[found_iso] = {
                        'status': 'ridealong',
                        'comment': f'Testphase laut X: "{clean_text[:60]}..."'
                    }

    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(current_status, f, indent=2, ensure_ascii=False)
        
    print("Globale Länderprüfung erfolgreich abgeschlossen!")

if __name__ == '__main__':
    main()
