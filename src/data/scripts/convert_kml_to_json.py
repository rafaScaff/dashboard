import xml.etree.ElementTree as ET
import json
import re
from html import unescape

def parse_coordinates(coords_str):
    """Parse coordinates string (longitude,latitude,altitude) and return lat, long"""
    if not coords_str:
        return None, None
    
    coords = coords_str.strip().split(',')
    if len(coords) >= 2:
        try:
            longitude = float(coords[0].strip())
            latitude = float(coords[1].strip())
            return latitude, longitude
        except ValueError:
            return None, None
    return None, None

def extract_image_url(description):
    """Extract image URL from description HTML"""
    if not description:
        return None
    
    # Try to find img src in description
    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', description, re.IGNORECASE)
    if img_match:
        return img_match.group(1)
    
    # Try to find in CDATA
    cdata_match = re.search(r'https?://[^\s<>"\']+', description)
    if cdata_match:
        return cdata_match.group(0)
    
    return None

def clean_html(text):
    """Remove HTML tags from text"""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode HTML entities
    text = unescape(text)
    return text.strip()

def kml_to_json(kml_file_path, json_file_path):
    """
    Convert KML file to JSON format
    
    Args:
        kml_file_path: Path to input KML file
        json_file_path: Path to output JSON file
    """
    try:
        # Parse KML file
        tree = ET.parse(kml_file_path)
        root = tree.getroot()
        
        # Define namespace (KML uses default namespace)
        # Register default namespace
        for elem in root.iter():
            if '}' in elem.tag:
                # Extract namespace
                namespace = elem.tag.split('}')[0][1:]
                ET.register_namespace('', namespace)
                break
        
        # Try to find Placemarks with different approaches
        placemarks = []
        
        # Method 1: Try with namespace
        namespaces = {
            'kml': 'http://www.opengis.net/kml/2.2'
        }
        placemarks = root.findall('.//kml:Placemark', namespaces)
        
        # Method 2: Try without namespace prefix
        if not placemarks:
            placemarks = root.findall('.//{http://www.opengis.net/kml/2.2}Placemark')
        
        # Method 3: Try without any namespace
        if not placemarks:
            placemarks = root.findall('.//Placemark')
        
        # Method 4: Search in Document
        if not placemarks:
            document = root.find('.//{http://www.opengis.net/kml/2.2}Document')
            if document is not None:
                placemarks = document.findall('.//{http://www.opengis.net/kml/2.2}Placemark')
        
        if not placemarks:
            document = root.find('.//Document')
            if document is not None:
                placemarks = document.findall('.//Placemark')
        
        result = []
        
        for placemark in placemarks:
            # Helper function to find element with or without namespace
            def find_elem(parent, tag):
                # Try with namespace
                elem = parent.find(f'.//{{http://www.opengis.net/kml/2.2}}{tag}')
                if elem is None:
                    # Try without namespace
                    elem = parent.find(f'.//{tag}')
                return elem
            
            # Extract name
            name_elem = find_elem(placemark, 'name')
            name = name_elem.text if name_elem is not None and name_elem.text else ""
            
            # Extract description
            desc_elem = find_elem(placemark, 'description')
            description_html = desc_elem.text if desc_elem is not None and desc_elem.text else ""
            description = clean_html(description_html)
            
            # Extract image URL
            image_url = extract_image_url(description_html)
            
            # Extract coordinates
            point = find_elem(placemark, 'Point')
            
            lat, long = None, None
            if point is not None:
                coords_elem = find_elem(point, 'coordinates')
                if coords_elem is not None and coords_elem.text:
                    lat, long = parse_coordinates(coords_elem.text)
            
            # Extract ExtendedData
            extended_data = {}
            ext_data_elem = find_elem(placemark, 'ExtendedData')
            if ext_data_elem is not None:
                for data_elem in ext_data_elem.findall('.//Data'):
                    if '}' in data_elem.tag:
                        # Skip if it's not a Data element
                        continue
                    data_name = data_elem.get('name', '')
                    value_elem = find_elem(data_elem, 'value')
                    if value_elem is not None and value_elem.text:
                        extended_data[data_name] = value_elem.text.strip()
            
            # Extract styleUrl
            style_url_elem = find_elem(placemark, 'styleUrl')
            style_url = style_url_elem.text if style_url_elem is not None and style_url_elem.text else ""
            
            # Create JSON object
            placemark_data = {
                "name": name,
                "description": description,
                "lat": lat,
                "long": long,
                "styleUrl": style_url,
                "imageUrl": image_url
            }
            
            # Add extended data fields
            if extended_data:
                placemark_data["extendedData"] = extended_data
            
            # Only add if we have coordinates
            if lat is not None and long is not None:
                result.append(placemark_data)
        
        # Write to JSON file
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Conversão concluída!")
        print(f"   Total de pontos convertidos: {len(result)}")
        print(f"   Arquivo salvo em: {json_file_path}")
        
        return result
        
    except ET.ParseError as e:
        print(f"❌ Erro ao fazer parse do arquivo KML: {e}")
        return None
    except Exception as e:
        print(f"❌ Erro durante a conversão: {e}")
        return None

if __name__ == "__main__":
    # Caminhos dos arquivos
    kml_file = "Portas.kml"
    json_file = "portas.json"
    
    print(f"🔄 Convertendo {kml_file} para {json_file}...")
    kml_to_json(kml_file, json_file)
