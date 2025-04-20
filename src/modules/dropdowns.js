import { FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';

export default function Dropdown({ macro, setMacro, micro, setMicro }) {
  const [macroSearch, setMacroSearch] = useState('');
  const [microSearch, setMicroSearch] = useState('');

  const handleChange = (event) => {
    setMacro(event.target.value);
    setMicro(''); // Reset micro when macro changes
    setMicroSearch(''); // Reset micro search when macro changes
  };

  const handleMicroChange = (event) => {
    setMicro(event.target.value);
  };

  const relationMacrosMicros = {
    "CENTRAL / CRUSP": [
        'X amarelo no chão',
        'Pixe "Ocupar? Ocupei!!"',
        'Pixe "Gestão Pelega!"',
        'CARE',
        'USPAO',
        'Praça do Bidet'
    ],
    "ECA": [
        'Pixe EV\'s',
        'Mulher e árvore olho fechado',
        'Duas Mulheres Acariota',
        'Mulher Suzue',
        'Cubos',
        'Antena',
        'Sapos/Sonic/Pikachus',
        'Escadaria amarela',
        'Pixe "Amar é um risco" - prédio audiovisual',
        'Piche "É o corre na Cena 2024" - prédio audiovisual',
        'Pixe "mais um pardo no mestrado, menos 3 pardos na biqueira"',
        'Palhaço de chapéu e olho hipinotizado',
        'Placa "EAD - Escola de Arte Dramática"',
        'Escada pra porra nenhuma',
        'Grande Hotelo',
        'Piano no chão',
        'uncle Johnny',
        'Placa coringa',
        'Restaurante Dona Leoa',
        'Banco 3',
        'Geodesia',
        'Osso',
        'ALB + CTR GC',
        'Placa "Foda-se o que você acha sobre você... Oq vc sabe sobre você?"',
        'Leão de 7 olhos',
        'Placa de rua sem saída no teatro laboratorio',
        'Outdoor na ECA',
        'Caixa d\'água com escada que não dá pra subir',
        'Bar QiB',
        'CELACC',
        'Placa de Rua sem saida',
        'Pirâmides',
        'Placa CAP'
    ],
    "FAU": [
        'STMEEC FAUUSP (antigo LAME)',
        'Forninho FAU',
        'Bandeira',
        'Guarita',
        'Vaga de deficientes',
        'Cratera',
        'Coliseu de tijolos ao lado da fau',
        'Casa do Hobbit',
        '13 portas de 12 salas de aula (Porta 7 se repete)',
        'Teatro romano',
        'Restaurante Monte Sinai',
        'AUH',
        'AUT',
        'Prédio FAU - Edifício Vila Nova Artigas',
        'Edifícil Vila Penteado - FAU Maranhão',
        'Atelie de Escultura Caetano Fraccaroli',
        'Placa de gás encanado',
        'Auditório Ariosto Milas',
        'Jardim flor copo de leite',
        'Bicicletário',
        'Placa vilanova artigas',
        'Lame',
        'Coliseu'
    ],
    "IME": [
        'Bandeiras',
        'Placa "Proibido trânsito de Motocicleta na Calçada"',
        'Lousas do IME',
        'Seafortía Cortada (árvore)',
        'Pinheiro-Bravo',
        'Grade com carros dentro (biciletário?)',
        'CCSL',
        'Vaga CEC',
        'Vaga de professor decano',
        'Vaga de deficiente',
        'Lixeira amarela',
        'Chapeu de Sol',
        'Butijão de gas extermo',
        'Luminárias Roxas',
        '1010',
        'LEM',
        'Laboratório de Matemática Aplicada (LabMAP)',
        'Placa de pedestre atravessando a rua sozinho',
        'Secretaria',
        'Estacionamento de motos',
        'Cano no meio do jardins',
        'Rotatória',
        'Mural Atlética',
        'Marquise',
        'Caixa de sugestões bloco B',
        'Quadro da Língua da letra Q',
        'Cano no meio do jardim',
        'Quadro da Língua da letra Q.',
        'Cantinho "FBI"',
        'Totem',
        'Estátua de uma cabeça de cachorro entalhada em madeira.'
    ],
    "PSICO": [
        'Pirâmides',
        'Oca psico',
        'Prédio Hades',
        'Prédio Anitta',
        'Pixe "stop eating from the trashcan"',
        'Pixe "ela tem pau e a outra também tem pau"',
        'Figueira da psico',
        'Trepa-Trepa',
        'Churrasqueira da psico',
        'Porta pra lugar nenhum',
        'CEIP',
        'Biblioteca Dante Moreira Leite',
        'Xadrez Psico',
        'Foodtruck Janinha',
        'Árvore de metal',
        'Laboratório Chronos',
        'Placa escrita "SáBaDos"',
        'Placa de carga e descarga',
        'PSC - Lixeiras de lixo reciclavel',
        'Orelhão',
        'Predio Cesar Ades',
        'Bloco B',
        'Parada de ônibus Psicologia 1',
        'biblioteca',
        'na lateral do bloco da biblioteca',
        'Ponto de Ônibus',
        'Ipe Amarelo'
    ],
    "IF": [
        'Auditório Adma Jafet',
        'Tanque de argonio',
        'Arvore com marca do Ivan',
        'Caixa de força entre travessa E e R',
        'Lab. Criogenia',
        'Biblioteca',
        'Placa de 70º aniversário do prof. Aluisio Neves Fagundes',
        'SBF',
        'Placa de perigo no tokamak',
        'Laboratório do Acelerador Linear',
        'Placa "Saída Passar Apenas um Veiculo por Vez"',
        'Edificio Novo Milenio',
        'quadra',
        'TICTAC',
        'Edificio Van de Graaff',
        'Cookie',
        'Praça do mickey e grupo sampa',
        'Praça do Mickey',
        'grafite de einstein no corredor atrás do cj. abraão de moraes',
        'Bicicletário do Laboratório do Acelerador Linear',
        'caçamba grande de lixo do lado da catraca',
        'Rua das Flores',
        'Pelletron',
        'AAAGW',
        'Capsula',
        'Cookie da física',
        'Edificil Amélia Império Hamburguer',
        'Criogenia',
        'Praça do Mickey',
        'DFMT',
        'Entrada do predio PA2 - Ala II',
        'Banco do morro da coruja',
        'Árvores cortadas',
        'Bikes Itaú bandejão',
        'Auditorio Abrahão de Morais',
        'Lab de dosimetria',
        'portão branco proibido estacionar entre o pelletron e o auditório.',
        'Placa de compartilhe a pista',
        'Lab de dosimetria',
        'Tic Tac',
        'Laboratório do acelerador linear',
        'Rede em cima do prédio',
        'Van der graaf: Sala de espalhamento de luz e bolsistas',
        'Placa em homenagem ao vigia assassinado',
        'Pílula gigante',
        'Laboratório de química',
        'Laboratório de criogenia',
        'Gerador de laser',
        'Rua das Flores',
        'Poste alienigna',
        'Caixa Eletrônico do Santander e do Banco do Brasil',
        'Quadro de Picasso e Monalisa no mesmo corredor',
        'Local com um telefone público, um telefone de ramal 6637 e um relógio parado na hora H (09:37)',
        'Porta com caracteres japoneses no fim do corredor',
        'Conjunto "Van de Graff"',
        'Laboratorio de Dosimetria',
        'Sala CEPA, prédio Van deGraaf',
        'Laboratorio decriogenia',
        'Placa do Prof.Watanabe',
        'SociedadeBrasileira deFísica',
        'FAP -Totem doEd. Basílio Jafet',
        'Laboratorio deRessonânciaMagnética',
        'Sala do diretor',
        'Luminária naPraça ElisabethEthiene Varella',
        'AuditórioAbrahão de Moraes',
        'GrupoSAMPA',
        'HEPIC',
        'Lixo bandeco',
        'Chaminé do lado do grupo SAMPA',
        'Luminária naPraça ElisabethEthiene Varella'
    ],
    "ODONTO": [
        'Totem',
        'Portao dos fundos',
        'Ponto de onibus',
        'Boca de Lobo',
        'Ponto de Onibus',
        'rampa azul na faixa de pedestres da odonto',
        'Entrada da Atlética da Odonto',
        'CAPE',
        'Biologia Oral',
        'Plantação de maracujá',
        'Buraco escuro nas fundaçoes do prédio',
        'Parede com quadros de diretores e professores eméritos',
        'Sala de esterilização',
        'Departamente de Prótese',
        'Sala de "Biologia Oral" do lado de fora',
        'Quadro com V vermelho na clínica',
        'Placa',
        'Portão deentrada principal',
        'Placa noestacionamento',
        'Pintura lobo na parede do corredor do CA',
        'Biologia Oral',
        'Orelhão roxo',
        'NICE CABELEREIRA',
        'Semáforo -23,567095 -46,737707',
        'Restaurante Princesa das Saladas',
        'HH',
        'Escada entre Odonto e Fofito',
        'Portão de entrada principal',
        'Placa no estacionamento',
        'Biologia Oral',
        'Orelhão',
        'NICE CABELEREIRA',
        'Semáforo-23,567095-46,737707',
        'Buraco escuro nas fundaçoes do prédio',
        'Parede com quadros de diretores e professores eméritos',
        'Sala de esterilização',
        'Departamente de Prótese',
        'Sala de "Biologia Oral" do lado de fora',
        'Quadro com V vermelho na clínica',
        'Porta com "Favor não entrar sem ser convidado"'
    ],
    "EDUCAÇÃO": [
        'Totem - Educação',
        'escola de aplicação'
    ],
    "CEPE": [
        'Portão 1',
        'Portão 2',
        'Bikes Itaú',
        'Cadeira de Juiz',
        'Portão 22',
        'Totem CEPE',
        'Tampa Azul - P37',
        'Portão 21',
        'Portão 20',
        'Portão 19 - NURI',
        'Jardim de Chuva - CEPE',
        'Portão 18',
        'Portão 17 / Orelhão',
        'Portão 16',
        'Tampa de Madeira',
        'Portão 15',
        'Portão 14',
        'Portão 13',
        'Portão 12',
        'Portão 11',
        'Portão sem número',
        'Portão 10 / Entrada Raia',
        'Portão 9',
        'Portão 8',
        'Portão 7',
        'Portão 6'
    ],
    "BIO": [
        'Edificio "Sobre as Ondas"',
        'André Dreyfus',
        'Placa da Arvore Copaíba',
        'Moeda - ADM Velha',
        'Rainha das Saladas',
        'Barco da Bio',
        'ICB II - Elevador'
    ],
    "FFLCH": [
        'Jardim de inverno',
        'Armario na Florestan Fernandes',
        'Caixa dagua',
        'Hidrante perto do aquário',
        'Biblioteca Florestan Fernandes',
        'Escada externa'
    ],
    "FEA": [
        'Placa da turma 2002',
        '10t',
        'CAVC',
        'Ponto de ônibus'
    ]
} 

  const generalMicros = ['banco', 'poste', 'placa']

  // Função para obter todos os micros (específicos + gerais)
  const getAllMicros = (selectedMacro) => {
    const specificMicros = relationMacrosMicros[selectedMacro] || [];
    // Sort specific micros alphabetically
    const sortedSpecificMicros = [...specificMicros].sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
    // Sort general micros alphabetically
    const sortedGeneralMicros = [...generalMicros].sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
    // Return specific micros first, then general micros
    return [...sortedSpecificMicros, ...sortedGeneralMicros];
  };

  // Filter macro options based on search
  const filteredMacros = Object.keys(relationMacrosMicros)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .filter(key => key.toLowerCase().includes(macroSearch.toLowerCase()));

  // Filter micro options based on search
  const filteredMicros = macro ? 
    getAllMicros(macro).filter(item =>
      item.toLowerCase().includes(microSearch.toLowerCase())
    ) : [];

  return (
    <div>
    <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="macro-select-label">Macro</InputLabel>
              <Select
                labelId="macro-select-label"
                id="macro-select"
                value={macro}
                label="Macro"
                onChange={handleChange}
                onOpen={() => setMacroSearch('')} // Reset search when opening
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.5)',
                    borderWidth: 2,
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0, 0, 0, 0.8)',
                  },
                  '& .MuiSelect-select': {
                    color: 'rgba(0, 0, 0, 0.9)',
                    textTransform: 'uppercase'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 400
                    }
                  }
                }}
              >
                <MenuItem>
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="Buscar..."
                    value={macroSearch}
                    onChange={(e) => setMacroSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    fullWidth
                  />
                </MenuItem>
                {filteredMacros.map((key) => (
                  <MenuItem key={key} value={key}>{key.toUpperCase()}</MenuItem>
                ))}
              </Select>
    </FormControl>

    <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="micro-select-label">Micro</InputLabel>
              <Select
                labelId="micro-select-label"
                id="micro-select"
                value={micro}
                label="Micro"
                onChange={handleMicroChange}
                onOpen={() => setMicroSearch('')} // Reset search when opening
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.5)',
                    borderWidth: 2,
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0, 0, 0, 0.8)',
                  },
                  '& .MuiSelect-select': {
                    color: 'rgba(0, 0, 0, 0.9)',
                    textTransform: 'uppercase'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 400
                    }
                  }
                }}
              >
                <MenuItem>
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="Buscar..."
                    value={microSearch}
                    onChange={(e) => setMicroSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    fullWidth
                  />
                </MenuItem>
                {macro && filteredMicros.map((item) => (
                  <MenuItem key={item} value={item}>{item.toUpperCase()}</MenuItem>
                ))}
              </Select>
    </FormControl>
    </div>
  )
}

