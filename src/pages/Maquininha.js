import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    Button, 
    TextField, 
    Box, 
    Paper, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Typography, 
    List, 
    ListItem, 
    ListItemText,
    IconButton,
    Divider,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BlockIcon from '@mui/icons-material/Block';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import consolidado from '../data/consolidado.json';
import { getValidatedJWT } from '../utils/jwtValidator';
import CryptoJS from 'crypto-js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Criar ícone customizado para localização do usuário
const createUserLocationIcon = () => {
    return L.divIcon({
        className: 'user-location-icon',
        html: `
            <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #4285F4;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: white;
                "></div>
            </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

const LocationMarker = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return position ? (
    <Marker position={position} icon={createUserLocationIcon()}>
      <Popup>Você está aqui</Popup>
    </Marker>
  ) : null;
};

// Configurações do S3
const S3_BUCKET_NAME = 'maquininha-bucket';
const S3_REGION = 'us-east-1';

// Função para gerar image_key a partir de imageUrl (MD5 hash)
const generateImageKey = (imageUrl) => {
  return CryptoJS.MD5(imageUrl).toString();
};

// Função para obter image_key de um ponto (gera se não existir)
const getImageKey = (point) => {
  if (point.image_key) {
    return point.image_key;
  }
  if (point.imageUrl) {
    return generateImageKey(point.imageUrl);
  }
  return null;
};

// Função para construir URL do S3 a partir do image_key
const getS3ImageUrl = (imageKey, extension = 'jpg') => {
  if (!imageKey) return null;
  // Constrói URL do S3 com a extensão fornecida (padrão: .jpg)
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${imageKey}.${extension}`;
};

// Função para obter URL da imagem (S3 ou fallback para imageUrl)
const getImageUrl = (point) => {
  const imageKey = getImageKey(point);
  if (imageKey) {
    // Tenta determinar extensão a partir do imageUrl original se disponível
    let extension = 'jpg'; // padrão
    if (point.imageUrl) {
      const urlMatch = point.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
      if (urlMatch) {
        extension = urlMatch[1].toLowerCase();
        if (extension === 'jpeg') extension = 'jpg'; // normaliza jpeg para jpg
      }
    }
    return getS3ImageUrl(imageKey, extension);
  }
  // Fallback para imageUrl original se não houver image_key
  return point.imageUrl || null;
};

// Função para parsear WKT POLYGON e extrair coordenadas
const parseWKTPolygon = (wkt) => {
  if (!wkt || !wkt.includes('POLYGON')) return null;
  
  try {
    // Extrai as coordenadas do POLYGON
    const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
    if (!match) return null;
    
    const coordsStr = match[1];
    const points = coordsStr.split(',').map(coord => {
      const parts = coord.trim().split(/\s+/);
      if (parts.length >= 2) {
        return [parseFloat(parts[0]), parseFloat(parts[1])]; // [long, lat]
      }
      return null;
    }).filter(p => p !== null);
    
    return points.length > 0 ? points : null;
  } catch (e) {
    console.error('Erro ao parsear WKT:', e);
    return null;
  }
};

// Função para verificar se um ponto está dentro de um polígono (ray casting algorithm)
const pointInPolygon = (point, polygon) => {
  if (!polygon || polygon.length < 3) return false;
  
  const [long, lat] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > lat) !== (yj > lat)) && 
                     (long < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

const Maquininha = () => {
    const position = [-23.5614, -46.7305]; // Cidade Universitária USP Butantã
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [imageData, setImageData] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [showAccessDeniedDialog, setShowAccessDeniedDialog] = useState(false);
    const [showImageDialog, setShowImageDialog] = useState(false);
    
    // Estados para filtros avançados
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedMacro, setSelectedMacro] = useState('');
    const [selectedSubMacro, setSelectedSubMacro] = useState('');
    const [hasImageFilter, setHasImageFilter] = useState(false);
    const [hasNameFilter, setHasNameFilter] = useState(false);
    const [macros, setMacros] = useState([]);
    const [subMacros, setSubMacros] = useState([]);

    // Verificar JWT ao carregar
    useEffect(() => {
        const checkJWT = async () => {
            setIsValidating(true);
            const result = await getValidatedJWT();
            
            if (!result.valid) {
                // JWT inválido ou não encontrado, mostra popup
                setShowAccessDeniedDialog(true);
            } else {
                setIsValidating(false);
            }
        };

        checkJWT();
    }, []);

    // Carregar macros e submacros dos CSVs
    useEffect(() => {
        const parseCSV = (csvText) => {
            const lines = csvText.split('\n').slice(1); // Pula header
            const data = [];
            
            for (const line of lines) {
                if (!line.trim()) continue;
                
                // Parse CSV considerando que WKT pode conter vírgulas
                // Formato: "WKT",name,description
                let wkt = '';
                let name = '';
                let description = '';
                
                if (line.startsWith('"')) {
                    // Encontra o fim do WKT (próximo " seguido de vírgula)
                    const wktEnd = line.indexOf('",');
                    if (wktEnd > 0) {
                        wkt = line.substring(1, wktEnd);
                        const rest = line.substring(wktEnd + 2);
                        const parts = rest.split(',');
                        name = parts[0] || '';
                        description = parts.slice(1).join(',').trim();
                    }
                } else {
                    // Linha sem WKT (vazia)
                    continue;
                }
                
                const polygon = parseWKTPolygon(wkt);
                if (polygon && name) {
                    data.push({ 
                        name: name.trim(), 
                        description: description.trim(), 
                        polygon 
                    });
                }
            }
            
            return data;
        };
        
        const loadGeoshapes = async () => {
            try {
                // Determinar o caminho base - em produção, usar caminho absoluto
                const basePath = process.env.PUBLIC_URL || '';
                const isProduction = process.env.NODE_ENV === 'production';
                
                // Carregar map_macro.csv - tenta diferentes caminhos
                // Em produção, priorizar caminho absoluto
                const macroPaths = isProduction 
                    ? [
                        '/data/map_macro.csv',
                        `${basePath}/data/map_macro.csv`,
                        './data/map_macro.csv'
                    ]
                    : [
                        `${basePath}/data/map_macro.csv`,
                        '/data/map_macro.csv',
                        './data/map_macro.csv'
                    ];
                
                let macroText = null;
                for (const path of macroPaths) {
                    try {
                        const response = await fetch(path);
                        if (response.ok && response.status === 200) {
                            const text = await response.text();
                            if (text && text.trim().length > 0) {
                                macroText = text;
                                console.log('map_macro.csv carregado de:', path);
                                break;
                            }
                        }
                    } catch (e) {
                        console.warn(`Erro ao tentar carregar map_macro.csv de ${path}:`, e);
                        continue;
                    }
                }
                
                if (macroText) {
                    const macroData = parseCSV(macroText);
                    if (macroData && macroData.length > 0) {
                        setMacros(macroData);
                        console.log(`Carregadas ${macroData.length} macros`);
                    } else {
                        console.warn('map_macro.csv carregado mas sem dados válidos');
                    }
                } else {
                    console.error('Não foi possível carregar map_macro.csv de nenhum caminho tentado:', macroPaths);
                }
                
                // Carregar map_submacro.csv
                const subMacroPaths = isProduction
                    ? [
                        '/data/map_submacro.csv',
                        `${basePath}/data/map_submacro.csv`,
                        './data/map_submacro.csv'
                    ]
                    : [
                        `${basePath}/data/map_submacro.csv`,
                        '/data/map_submacro.csv',
                        './data/map_submacro.csv'
                    ];
                
                let subMacroText = null;
                for (const path of subMacroPaths) {
                    try {
                        const response = await fetch(path);
                        if (response.ok && response.status === 200) {
                            const text = await response.text();
                            if (text && text.trim().length > 0) {
                                subMacroText = text;
                                console.log('map_submacro.csv carregado de:', path);
                                break;
                            }
                        }
                    } catch (e) {
                        console.warn(`Erro ao tentar carregar map_submacro.csv de ${path}:`, e);
                        continue;
                    }
                }
                
                if (subMacroText) {
                    const subMacroData = parseCSV(subMacroText);
                    if (subMacroData && subMacroData.length > 0) {
                        setSubMacros(subMacroData);
                        console.log(`Carregadas ${subMacroData.length} submacros`);
                    } else {
                        console.warn('map_submacro.csv carregado mas sem dados válidos');
                    }
                } else {
                    console.error('Não foi possível carregar map_submacro.csv de nenhum caminho tentado:', subMacroPaths);
                }
            } catch (error) {
                console.error('Erro ao carregar geoshapes:', error);
            }
        };
        
        loadGeoshapes();
    }, []);

    // Solicitar localização automaticamente ao carregar
    useEffect(() => {
        if (!isValidating && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Não mostrar alerta, apenas logar o erro
                }
            );
        }
    }, [isValidating]);

    // Aplicar filtros avançados aos resultados (para dropdown - não exige coordenadas)
    const applyAdvancedFilters = (results, requireCoordinates = false) => {
        return results.filter(item => {
            // Filtro de coordenadas válidas (apenas se necessário)
            if (requireCoordinates) {
                if (item.lat == null || item.long == null || isNaN(item.lat) || isNaN(item.long)) {
                    return false;
                }
            }
            
            // Filtro de macro (só aplica se tiver coordenadas)
            if (selectedMacro) {
                if (item.lat == null || item.long == null || isNaN(item.lat) || isNaN(item.long)) {
                    return false; // Precisa de coordenadas para verificar geoshape
                }
                const macro = macros.find(m => m.name === selectedMacro);
                if (macro && macro.polygon) {
                    const point = [item.long, item.lat]; // [long, lat]
                    if (!pointInPolygon(point, macro.polygon)) {
                        return false;
                    }
                }
            }
            
            // Filtro de submacro (só aplica se tiver coordenadas)
            if (selectedSubMacro) {
                if (item.lat == null || item.long == null || isNaN(item.lat) || isNaN(item.long)) {
                    return false; // Precisa de coordenadas para verificar geoshape
                }
                const subMacro = subMacros.find(sm => sm.name === selectedSubMacro);
                if (subMacro && subMacro.polygon) {
                    const point = [item.long, item.lat]; // [long, lat]
                    if (!pointInPolygon(point, subMacro.polygon)) {
                        return false;
                    }
                }
            }
            
            // Filtro de possui imagem
            if (hasImageFilter) {
                const imageKey = getImageKey(item);
                if (!imageKey) {
                    return false;
                }
            }
            
            // Filtro de possui nome
            if (hasNameFilter) {
                if (!item.name || item.name.trim() === '') {
                    return false;
                }
            }
            
            return true;
        });
    };

    // Determinar quais pontos exibir no mapa
    // Só mostrar pontos quando houver uma busca ativa (resultados de busca)
    const pointsToDisplay = searchResults.length > 0 
        ? applyAdvancedFilters(searchResults, true) // Requer coordenadas para o mapa
        : []; // Não renderizar nenhum ponto inicialmente

    // Search function - busca tanto por nome quanto por descrição
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
    
        const searchStr = searchQuery.toLowerCase().trim();
        const results = [];
        const LIMIT = 100; // Definimos o limite aqui
    
        // Usamos um loop for comum para poder interromper a execução (break)
        for (let i = 0; i < consolidado.length; i++) {
            const item = consolidado[i];
            
            const nameMatch = item.name 
                ? item.name.toLowerCase().includes(searchStr) 
                : false;
                
            const descriptionMatch = item.description 
                ? item.description.toLowerCase().includes(searchStr) 
                : false;
    
            if (nameMatch || descriptionMatch) {
                results.push(item);
            }
    
            // Se chegarmos no limite, paramos de procurar imediatamente
            if (results.length === LIMIT) {
                break; 
            }
        }
    
        setSearchResults(results);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch();
        }
    };

    const handleResultClick = (location) => {
        // Primeiro resetar estados da imagem
        setImageData(null);
        setImageLoading(false);
        // Depois atualizar localização e abrir dialog
        setSelectedLocation(location);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLocation(null);
        // Limpar estados da imagem após um pequeno delay para evitar race conditions
        setTimeout(() => {
            setImageData(null);
            setImageLoading(false);
        }, 100);
    };

    // Carregar imagem quando o dialog abrir e houver imageUrl ou image_key
    useEffect(() => {
        if (!openDialog || !selectedLocation) {
            return;
        }

        const imageUrl = getImageUrl(selectedLocation);
        if (!imageUrl) {
            setImageData(null);
            setImageLoading(false);
            return;
        }

        // Resetar estados imediatamente
        setImageLoading(true);
        setImageData(null);

        let isMounted = true;
        let testImage = new Image();
        testImage.crossOrigin = 'anonymous';
        
        // Adiciona timestamp para forçar recarregamento e evitar cache
        const urlWithCacheBust = imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
        
        testImage.onload = () => {
            if (isMounted) {
                // Usa a URL com cache-busting para garantir que carregue
                setImageData(urlWithCacheBust);
                setImageLoading(false);
            }
        };
        
        testImage.onerror = () => {
            if (isMounted) {
                // Se falhar com cache-busting, tenta sem
                setImageLoading(false);
                // Tenta usar a URL original diretamente
                setImageData(imageUrl);
            }
        };
        
        // Inicia o carregamento imediatamente
        // Usar um pequeno delay apenas para garantir que o dialog esteja renderizado
        const startLoading = () => {
            if (isMounted) {
                testImage.src = urlWithCacheBust;
            }
        };
        
        // Em produção, pode haver um pequeno delay no rendering do dialog
        // Usar requestAnimationFrame para garantir que o DOM esteja pronto
        if (process.env.NODE_ENV === 'production') {
            requestAnimationFrame(() => {
                requestAnimationFrame(startLoading);
            });
        } else {
            startLoading();
        }
        
        // Cleanup function
        return () => {
            isMounted = false;
            if (testImage) {
                testImage.onload = null;
                testImage.onerror = null;
                testImage.src = '';
                testImage = null;
            }
        };
    }, [openDialog, selectedLocation]);

    // Limpar URL do objeto quando o componente desmontar ou dialog fechar
    useEffect(() => {
        return () => {
            if (imageData && imageData.startsWith('blob:')) {
                URL.revokeObjectURL(imageData);
            }
        };
    }, [imageData]);

    // Mostra loading enquanto valida JWT
    if (isValidating) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <CircularProgress size={50} />
                <Typography variant="body1" color="text.secondary">
                    Validando autenticação...
                </Typography>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Box
                sx={{
                    padding: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}
            >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Paper
                        elevation={3}
                        sx={{
                            flex: 1,
                            minWidth: '300px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 10px',
                            backgroundColor: 'white'
                        }}
                    >
                        <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                        <TextField
                            fullWidth
                            variant="standard"
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            InputProps={{
                                disableUnderline: true,
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            sx={{
                                ml: 1,
                                minWidth: '100px',
                                backgroundColor: '#1976d2',
                                '&:hover': {
                                    backgroundColor: '#1565c0'
                                }
                            }}
                        >
                            Search
                        </Button>
                    </Paper>
                    <Button
                        variant="outlined"
                        startIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        sx={{
                            minWidth: '150px',
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            flexShrink: 0
                        }}
                    >
                        <FilterListIcon sx={{ mr: 1 }} />
                        Filtros
                    </Button>
                </Box>
                {/* Filtros avançados */}
                <Collapse in={showAdvancedFilters}>
                    <Paper
                        elevation={2}
                        sx={{
                            padding: '15px',
                            maxWidth: '600px',
                            backgroundColor: '#f5f5f5'
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Macro</InputLabel>
                                <Select
                                    value={selectedMacro}
                                    label="Macro"
                                    onChange={(e) => setSelectedMacro(e.target.value)}
                                    sx={{ backgroundColor: 'white' }}
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    {macros.map((macro, index) => (
                                        <MenuItem key={`macro-${index}`} value={macro.name}>
                                            {macro.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Sub Macro</InputLabel>
                                <Select
                                    value={selectedSubMacro}
                                    label="Sub Macro"
                                    onChange={(e) => setSelectedSubMacro(e.target.value)}
                                    sx={{ backgroundColor: 'white' }}
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    {subMacros.map((subMacro, index) => (
                                        <MenuItem key={`submacro-${index}`} value={subMacro.name}>
                                            {subMacro.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={hasImageFilter}
                                        onChange={(e) => setHasImageFilter(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Possui imagem"
                            />
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={hasNameFilter}
                                        onChange={(e) => setHasNameFilter(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Apenas com nome"
                            />
                            
                            {(selectedMacro || selectedSubMacro || hasImageFilter || hasNameFilter) && (
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => {
                                        setSelectedMacro('');
                                        setSelectedSubMacro('');
                                        setHasImageFilter(false);
                                        setHasNameFilter(false);
                                    }}
                                    sx={{ ml: 'auto' }}
                                >
                                    Limpar filtros
                                </Button>
                            )}
                        </Box>
                    </Paper>
                </Collapse>
                {/* Lista de resultados da busca */}
                {(() => {
                    // Aplica filtros avançados aos resultados (dropdown não exige coordenadas)
                    const filteredResults = applyAdvancedFilters(searchResults, false);
                    
                    if (filteredResults.length === 0) return null;
                    
                    // Ordena os resultados: alfabético por nome, "Sem nome" no final
                    const sortedResults = [...filteredResults].sort((a, b) => {
                        const nameA = a.name || 'Sem nome';
                        const nameB = b.name || 'Sem nome';
                        
                        // Se ambos são "Sem nome", mantém ordem original
                        if (nameA === 'Sem nome' && nameB === 'Sem nome') {
                            return 0;
                        }
                        // Se A é "Sem nome", vai para o final
                        if (nameA === 'Sem nome') {
                            return 1;
                        }
                        // Se B é "Sem nome", vai para o final
                        if (nameB === 'Sem nome') {
                            return -1;
                        }
                        // Ordena alfabeticamente
                        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
                    });
                    
                    return (
                    <Paper
                        elevation={2}
                        sx={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            maxWidth: '600px'
                        }}
                    >
                        <List dense>
                            {sortedResults.map((result, index) => (
                                <React.Fragment key={`result-${index}`}>
                                    <ListItem
                                        button
                                        onClick={() => handleResultClick(result)}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <LocationOnIcon sx={{ mr: 1, color: result.image_key ? 'yellow' : 'blue' }} />
                                        <ListItemText
                                            primary={result.name || 'Sem nome'}
                                        />
                                    </ListItem>
                                    {index < sortedResults.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                    );
                })()}
            </Box>
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={position} zoom={30} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Renderizar pontos no mapa - filtrados se houver busca ativa */}
                    {pointsToDisplay.map((point, index) => (
                        <Marker 
                            key={`point-${index}`} 
                            position={[point.lat, point.long]}
                            eventHandlers={{
                                click: () => handleResultClick(point)
                            }}
                        >
                            <Popup>
                                <div>
                                    {point.name && <h3>{point.name}</h3>}
                                    {point.description && <p>{point.description}</p>}
                                    {getImageUrl(point) && (
                                        <img 
                                            src={getImageUrl(point)} 
                                            alt={point.name || 'Imagem'} 
                                            style={{ maxWidth: '300px', height: 'auto', marginTop: '10px' }}
                                        />
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    <LocationMarker position={userLocation} />
                </MapContainer>
            </div>
            
            {/* Dialog com informações detalhadas da localização */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" component="div">
                            {selectedLocation?.name || 'Detalhes da Localização'}
                        </Typography>
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseDialog}
                            sx={{
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedLocation && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Nome */}
                            {selectedLocation.name && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Nome
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedLocation.name}
                                    </Typography>
                                </Box>
                            )}
                            
                            {/* Descrição */}
                            {selectedLocation.description && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Descrição
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedLocation.description}
                                    </Typography>
                                </Box>
                            )}
                            
                            {/* Coordenadas */}
                            {(selectedLocation.lat != null && selectedLocation.long != null) && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Coordenadas
                                    </Typography>
                                    <Typography variant="body2">
                                        Latitude: {selectedLocation.lat}
                                    </Typography>
                                    <Typography variant="body2">
                                        Longitude: {selectedLocation.long}
                                    </Typography>
                                </Box>
                            )}
                            
                            {/* Style URL */}
                            {selectedLocation.styleUrl && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Style URL
                                    </Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        {selectedLocation.styleUrl}
                                    </Typography>
                                </Box>
                            )}
                            
                            {/* Imagem */}
                            {getImageUrl(selectedLocation) && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Imagem
                                    </Typography>
                                    {imageLoading && !imageData ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : imageData ? (
                                        <Box sx={{ position: 'relative' }}>
                                            <Box
                                                component="img"
                                                key={`img-${selectedLocation.name || 'default'}-${imageData}`} // Force re-render quando imageData ou location mudar
                                                src={imageData}
                                                alt={selectedLocation.name || 'Imagem da localização'}
                                                crossOrigin="anonymous"
                                                onLoad={() => {
                                                    setImageLoading(false);
                                                }}
                                                onError={() => {
                                                    console.log('Erro ao renderizar imagem no popup');
                                                    setImageLoading(false);
                                                    // Se falhar, tenta URL original sem cache-busting
                                                    const originalUrl = getImageUrl(selectedLocation);
                                                    if (imageData !== originalUrl && originalUrl) {
                                                        setImageData(originalUrl);
                                                    }
                                                }}
                                                sx={{
                                                    maxWidth: '100%',
                                                    height: 'auto',
                                                    borderRadius: 1,
                                                    boxShadow: 2,
                                                    display: 'block'
                                                }}
                                            />
                                            <IconButton
                                                onClick={() => setShowImageDialog(true)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 1)'
                                                    }
                                                }}
                                                size="small"
                                            >
                                                <ZoomInIcon />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Carregando imagem...
                                        </Typography>
                                    )}
                                </Box>
                            )}
                            
                            {/* Informação caso não tenha dados */}
                            {!selectedLocation.name && 
                             !selectedLocation.description && 
                             !getImageUrl(selectedLocation) && (
                                <Typography variant="body2" color="text.secondary">
                                    Nenhuma informação adicional disponível para esta localização.
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de acesso negado */}
            <Dialog
                open={showAccessDeniedDialog}
                onClose={() => {
                    setShowAccessDeniedDialog(false);
                    navigate('/login');
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BlockIcon sx={{ color: 'error.main', fontSize: 28 }} />
                        <Typography variant="h6" component="div" sx={{ color: 'error.main' }}>
                            Acesso Negado
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ marginTop: 2, fontSize: '18px', fontWeight: 'bold' }}>
                        Não aceitamos gente da AEQ!
                    </Typography>
                    <Typography variant="body2" sx={{ marginTop: 2, color: 'text.secondary' }}>
                        Esta página requer autenticação via JWT válido. Por favor, faça login para acessar.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => {
                            setShowAccessDeniedDialog(false);
                            navigate('/login');
                        }}
                        variant="contained"
                        color="primary"
                    >
                        Ir para Login
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog para imagem maximizada */}
            <Dialog
                open={showImageDialog}
                onClose={() => setShowImageDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" component="div">
                            {selectedLocation?.name || 'Imagem'}
                        </Typography>
                        <IconButton
                            aria-label="close"
                            onClick={() => setShowImageDialog(false)}
                            sx={{
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {imageData && (
                        <Box
                            component="img"
                            src={imageData}
                            alt={selectedLocation?.name || 'Imagem da localização'}
                            crossOrigin="anonymous"
                            sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '80vh',
                                objectFit: 'contain',
                                display: 'block',
                                margin: '0 auto'
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowImageDialog(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Maquininha;
