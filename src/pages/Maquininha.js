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
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search.js';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BlockIcon from '@mui/icons-material/Block';
import portas from '../data/portas.json';
import { getValidatedJWT } from '../utils/jwtValidator';
import CryptoJS from 'crypto-js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Criar ícone customizado para localização do usuário (estilo Google Maps)
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
    const [imageError, setImageError] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [showAccessDeniedDialog, setShowAccessDeniedDialog] = useState(false);

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

    // Determinar quais pontos exibir no mapa
    // Só mostrar pontos quando houver uma busca ativa (resultados de busca)
    const pointsToDisplay = searchResults.length > 0 
        ? searchResults.filter(item => 
            item.lat != null && item.long != null && 
            !isNaN(item.lat) && !isNaN(item.long)
          )
        : []; // Não renderizar nenhum ponto inicialmente

    // Search function - busca tanto por nome quanto por descrição
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const searchStr = searchQuery.toLowerCase().trim();
        const results = portas.filter(item => {
            // Buscar no nome (se existir)
            const nameMatch = item.name 
                ? item.name.toLowerCase().includes(searchStr)
                : false;
            
            // Buscar na descrição (se existir)
            const descriptionMatch = item.description 
                ? item.description.toLowerCase().includes(searchStr)
                : false;
            
            // Retornar true se encontrar em qualquer um dos campos
            return nameMatch || descriptionMatch;
        });

        setSearchResults(results);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch();
        }
    };

    const handleResultClick = (location) => {
        setSelectedLocation(location);
        setOpenDialog(true);
        // Resetar estados da imagem
        setImageData(null);
        setImageError(false);
        setImageLoading(false);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLocation(null);
        setImageData(null);
        setImageError(false);
        setImageLoading(false);
    };

    // Função para tentar carregar imagem usando proxy CORS
    const loadImageWithProxy = async (imageUrl) => {
        // Lista de proxies CORS públicos que podemos tentar
        const corsProxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
            `https://cors-anywhere.herokuapp.com/${imageUrl}`,
            `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
        ];

        for (const proxyUrl of corsProxies) {
            try {
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    mode: 'cors',
                });
                if (response.ok) {
                    const blob = await response.blob();
                    return URL.createObjectURL(blob);
                }
            } catch (error) {
                console.log(`Proxy falhou: ${proxyUrl}`, error);
                continue;
            }
        }
        throw new Error('Todos os proxies falharam');
    };

    // Carregar imagem quando o dialog abrir e houver imageUrl ou image_key
    useEffect(() => {
        const imageUrl = selectedLocation ? getImageUrl(selectedLocation) : null;
        if (openDialog && imageUrl) {
            setImageLoading(true);
            setImageError(false);
            
            // Para URLs do Google My Maps, usar diretamente (funciona melhor sem crossOrigin)
            const isGoogleMapsUrl = imageUrl.includes('mymaps.usercontent.google.com') || 
                                   imageUrl.includes('googleusercontent.com');
            
            if (isGoogleMapsUrl) {
                // Para Google Maps, usar URL diretamente - geralmente funciona para exibição
                const testImage = new Image();
                
                testImage.onload = () => {
                    setImageData(imageUrl);
                    setImageLoading(false);
                };
                
                testImage.onerror = () => {
                    // Se falhar, tentar com proxy
                    loadImageWithProxy(imageUrl)
                        .then(proxyUrl => {
                            setImageData(proxyUrl);
                            setImageLoading(false);
                        })
                        .catch(() => {
                            // Fallback: usar URL original mesmo com erro
                            setImageData(imageUrl);
                            setImageLoading(false);
                            setImageError(true);
                        });
                };
                
                testImage.src = imageUrl;
            } else {
                // Para outras URLs, tentar estratégias mais complexas
                const testImage = new Image();
                testImage.crossOrigin = 'anonymous';
                
                testImage.onload = () => {
                    setImageData(imageUrl);
                    setImageLoading(false);
                };
                
                testImage.onerror = async () => {
                    try {
                        // Tentar fetch com mode 'no-cors'
                        const response = await fetch(imageUrl, {
                            method: 'GET',
                            mode: 'no-cors',
                        });
                        
                        if (response.type === 'opaque') {
                            setImageData(imageUrl);
                            setImageLoading(false);
                            return;
                        }
                        
                        const blob = await response.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        setImageData(objectUrl);
                        setImageLoading(false);
                    } catch (fetchError) {
                        console.log('Fetch direto falhou, tentando proxy...', fetchError);
                        
                        try {
                            const proxyUrl = await loadImageWithProxy(imageUrl);
                            setImageData(proxyUrl);
                            setImageLoading(false);
                        } catch (proxyError) {
                            console.error('Todos os métodos falharam:', proxyError);
                            setImageError(true);
                            setImageLoading(false);
                            setImageData(imageUrl); // Fallback final
                        }
                    }
                };
                
                testImage.src = imageUrl;
            }
        }
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
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Paper
                        elevation={3}
                        sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 10px',
                            backgroundColor: 'white',
                            maxWidth: '600px'
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
                </Box>
                {/* Lista de resultados da busca */}
                {searchResults.length > 0 && (
                    <Paper
                        elevation={2}
                        sx={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            maxWidth: '600px'
                        }}
                    >
                        <List dense>
                            {searchResults.map((result, index) => (
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
                                        <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <ListItemText
                                            primary={result.name || 'Sem nome'}
                                            secondary={result.description || 'Sem descrição'}
                                        />
                                    </ListItem>
                                    {index < searchResults.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
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
                                    {imageLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : imageError && !imageData ? (
                                        <Typography variant="body2" color="error">
                                            Erro ao carregar a imagem. Tentando exibir diretamente...
                                        </Typography>
                                    ) : imageData ? (
                                        <Box
                                            component="img"
                                            src={imageData}
                                            alt={selectedLocation.name || 'Imagem da localização'}
                                            crossOrigin={imageData.includes('mymaps.usercontent.google.com') || imageData.includes('googleusercontent.com') ? undefined : 'anonymous'}
                                            onError={() => {
                                                console.log('Erro ao renderizar imagem, tentando URL original...');
                                                setImageError(true);
                                                // Fallback para URL original
                                                const fallbackUrl = getImageUrl(selectedLocation);
                                                if (imageData !== fallbackUrl && fallbackUrl) {
                                                    setImageData(fallbackUrl);
                                                }
                                            }}
                                            sx={{
                                                maxWidth: '100%',
                                                height: 'auto',
                                                borderRadius: 1,
                                                boxShadow: 2
                                            }}
                                        />
                                    ) : null}
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
        </div>
    );
};

export default Maquininha;
