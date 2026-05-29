import os
import json
import urllib.request
import xml.etree.ElementTree as ET

# Globale länderspezifische Wort- und Emoji-Datenbank für das Matching
WORLD_COUNTRY_DATABASE = {
    # Europa
    'DEU': ['germany', 'deutschland', '🇩🇪'],
    'NLD': ['netherlands', 'nederland', 'holland', '🇳🇱'],
    'FRA': ['france', 'frankreich', '🇫🇷'],
    'GBR': ['united kingdom', 'uk', '2026', 'britain', 'england', '🇬🇧'],
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
    
    # Amerika
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
    """Prüft, ob ein Begriff oder eine Flagge aus der Datenbank im Tweet steckt"""
    for iso_code, keywords in WORLD_COUNTRY_DATABASE.items():
        for keyword in keywords:
            if keyword in text:
                return iso_code
    return None

def main():
    # RSS-Spiegel von @teslaeurope laden
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
    
    # Absoluten Pfad zur data.json im public-Ordner ermitteln
    data_path = os.path.join(os.path.dirname(__file__), '../public/data.json')
    
    # Falls Datei nicht existiert oder leer ist, mit leerem JSON starten
    if os.path.exists(data_path) and os.path.getsize(data_path) > 0:
        with open(data_path, 'r', encoding='utf-8') as f:
            current_status = json.load(f)
    else:
        current_status = {}

    for item in root.findall('.//item'):
        title = item.find('title').text if item.find('title') is not None else ""
        description = item.find('description').text if item.find('description') is not None else ""
        full_text = (title + " " + description).lower()
        
        found_iso = find_country_in_text(full_text)
                
        if found_iso:
            clean_text = title if title else "Tesla Europe Update"
            
            # 🟢 GRÜN: Volle Zulassung / Rollout-Bestätigung
            if 'fsd supervised' in full_text and ('rolling out' in full_text or 'approved' in full_text or 'certified' in full_text or 'available' in full_text):
                current_status[found_iso] = {
                    'status': 'approved',
                    'comment': f'Zugelassen laut X: "{clean_text[:65]}..."'
                }
            # 🔵 BLAU: Ride-Alongs, Testflotten, Behörden-Piloten
            elif 'ride along' in full_text or 'testing fsd' in full_text or 'pilot' in full_text or 'regulatory' in full_text:
                # Niemals ein bereits zugelassenes (grünes) Land auf blau zurückstufen
                if current_status.get(found_iso, {}).get('status') != 'approved':
                    current_status[found_iso] = {
                        'status': 'ridealong',
                        'comment': f'Testphase laut X: "{clean_text[:65]}..."'
                    }

    # Die neuen Daten sauber formatiert abspeichern
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(current_status, f, indent=2, ensure_ascii=False)
        
    print("Globale FSD-Datenbank erfolgreich aktualisiert!")

if __name__ == '__main__':
    main()
