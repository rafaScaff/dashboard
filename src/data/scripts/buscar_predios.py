import requests
import json

def buscar_predios_usp():
    # URL da Overpass API
    url = "http://overpass-api.de/api/interpreter"
    
    # Query na linguagem Overpass QL
    # 1. Define a área da Cidade Universitária (USP Butantã)
    # 2. Busca nós (nodes), caminhos (ways) e relações (relations) que sejam prédios e tenham nome
    # 3. 'out center;' garante que mesmo prédios grandes (polígonos) retornem um único ponto central de lat/long ideal para pinos.
    # query = """
    # [out:json][timeout:25];
    # area["name"="Cidade Universitária Armando de Salles Oliveira"]->.usp;
    # (
    #   node["building"]["name"](area.usp);
    #   way["building"]["name"](area.usp);
    #   relation["building"]["name"](area.usp);
      
    #   // Bônus: pega também faculdades/institutos que podem não estar com a tag exata de "building"
    #   node["amenity"="university"]["name"](area.usp);
    #   way["amenity"="university"]["name"](area.usp);
    # );
    # out center;
    # """

    query = """
    [out:json][timeout:50];
    area["name"="Cidade Universitária Armando de Salles Oliveira"]->.usp;
    (
    node(area.usp);
    way(area.usp);
    relation(area.usp);
    );
    out center;
    """
    
    print("Buscando dados no OpenStreetMap... Isso pode levar alguns segundos.")
    response = requests.post(url, data={'data': query})
    with open('todos_predios.json', 'w', encoding='utf-8') as f:
        json.dump(response.json(), f, ensure_ascii=False, indent=4)
    if response.status_code == 200:
        data = response.json()
        predios_mapeados = []
        
        for element in data['elements']:
            # Pega o nome do prédio
            nome = element.get('tags', {}).get('name', 'Sem Nome')
            tags = json.dumps(element.get('tags', {}))
            
            # Se for um 'node', a lat/long vem direto. Se for 'way' (polígono), vem no 'center'
            if element['type'] == 'node':
                lat = element['lat']
                lon = element['lon']
            else:
                lat = element['center']['lat']
                lon = element['center']['lon']
                
            predios_mapeados.append({
                "nome": nome,
                "latitude": lat,
                "longitude": lon,
                "tags": tags
            })
            
        return predios_mapeados
    else:
        print(f"Erro na requisição: {response.status_code}")
        return None

predios = buscar_predios_usp()

if predios:
    # Removendo duplicatas baseadas no nome (caso o OSM tenha mapeado a mesma coisa duas vezes)
    predios_unicos = {p['nome']: p for p in predios}.values()
    
    print(f"✅ Encontrados {len(predios_unicos)} prédios/institutos com nome na USP Butantã!\n")
    
    # Salvando em um arquivo JSON para você importar no seu App
    with open('predios_usp.json', 'w', encoding='utf-8') as f:
        json.dump(list(predios_unicos), f, ensure_ascii=False, indent=4)
        
    print("Arquivo 'predios_usp.json' gerado com sucesso!")
    
    # Mostrando os 5 primeiros só para dar um gostinho
    for p in list(predios_unicos)[:5]:
        print(f"- {p['nome']} (Lat: {p['latitude']}, Lng: {p['longitude']})")