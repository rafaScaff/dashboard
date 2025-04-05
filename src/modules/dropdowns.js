import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState } from 'react';



export default function Dropdown() {
  const [macro, setMacro] = useState('');
  const [micro, setMicro] = useState('');

  const handleChange = (event) => {
    setMacro(event.target.value);
  };

  const handleMicroChange = (event) => {
    setMicro(event.target.value);
  };

  return (
    <div>
    <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="demo-simple-select-label">Macro</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={macro}
                label="Macro"
                onChange={handleChange}
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
                  }
                }}
              >
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
    </FormControl>

    <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="demo-simple-select-label">Micro</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={micro}
                label="Micro"
                onChange={handleMicroChange}
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
                  }
                }}
              >
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
    </FormControl>
    </div>
  )
  }