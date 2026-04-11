import { FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { useState, useEffect } from 'react';

export default function Dropdown({ macro, setMacro, micro, setMicro, hasMicro }) {
  const [macroSearch, setMacroSearch] = useState('');
  const [microSearch, setMicroSearch] = useState('');
  const [relationMacrosMicros, setRelationMacrosMicros] = useState({});

  useEffect(() => {
    const fetchMicros = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/caca_api/micros`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setRelationMacrosMicros(data);
      } catch (error) {
        console.error('Error fetching micros:', error);
      }
    };

    fetchMicros();
  }, []);

  const handleChange = (event) => {
    setMacro(event.target.value);
    setMicro('');
    setMicroSearch('');
  };

  const handleMicroChange = (event) => {
    setMicro(event.target.value);
  };

  const getMicros = (selectedMacro) => {
    const specific = relationMacrosMicros[selectedMacro] || [];
    const general = relationMacrosMicros['no_macro'] || [];
    const sorted = (arr) => [...arr].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return [...sorted(specific), ...sorted(general)];
  };

  const filteredMacros = Object.keys(relationMacrosMicros)
    .filter(key => key !== 'no_macro')
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .filter(key => key.toLowerCase().includes(macroSearch.toLowerCase()));

  const filteredMicros = macro
    ? getMicros(macro).filter(item => item.toLowerCase().includes(microSearch.toLowerCase()))
    : [];

  const selectSx = {
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 2 },
    '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.8)' },
    '& .MuiSelect-select': { color: 'rgba(0, 0, 0, 0.9)', textTransform: 'uppercase' }
  };

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
          onOpen={() => setMacroSearch('')}
          sx={selectSx}
          MenuProps={{ PaperProps: { style: { maxHeight: 400 } } }}
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

      {macro && (
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="micro-select-label">Micro</InputLabel>
          <Select
            labelId="micro-select-label"
            id="micro-select"
            value={micro}
            label="Micro"
            onChange={handleMicroChange}
            onOpen={() => setMicroSearch('')}
            sx={selectSx}
            MenuProps={{ PaperProps: { style: { maxHeight: 400 } } }}
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
      )}
    </div>
  );
}
