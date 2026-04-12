import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../utils/LoadingSpinner';

const API = process.env.REACT_APP_API_URL;

function authHeaders(withBody = false) {
  const headers = { 'Authorization': localStorage.getItem('token') };
  if (withBody) headers['Content-Type'] = 'application/json';
  return headers;
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function SubmitButton({ loading, label }) {
  return (
    <button type="submit" disabled={loading} style={{ padding: '8px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
      {loading ? <LoadingSpinner size={16} color="white" /> : label}
    </button>
  );
}

function Feedback({ msg }) {
  if (!msg) return null;
  const isError = msg.startsWith('Erro') || msg.startsWith('erro');
  return <p style={{ marginTop: 10, color: isError ? '#dc3545' : '#28a745', fontWeight: 500 }}>{msg}</p>;
}

// ── Create Macro ────────────────────────────────────────────
function CreateMacro({ onCreated }) {
  const [enumVal, setEnumVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API}/caca_api/admin/macro`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ enum: enumVal }),
      });
      if (!res.ok) throw new Error((await res.json()).description || 'Erro ao criar macro');
      setMsg(`Macro "${enumVal}" criada!`);
      setEnumVal('');
      onCreated();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Nome (enum)" value={enumVal} onChange={setEnumVal} required placeholder="ex: FEA" />
      <SubmitButton loading={loading} label="Criar Macro" />
      <Feedback msg={msg} />
    </form>
  );
}

// ── Create Micro ────────────────────────────────────────────
function CreateMicro({ macros, onCreated }) {
  const [enumVal, setEnumVal] = useState('');
  const [macroEnum, setMacroEnum] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const body = { enum: enumVal };
    if (macroEnum) body.macro_enum = macroEnum;
    try {
      const res = await fetch(`${API}/caca_api/admin/micro`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).description || 'Erro ao criar micro');
      setMsg(`Micro "${enumVal}" criado!`);
      setEnumVal('');
      setMacroEnum('');
      onCreated();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Nome (enum)" value={enumVal} onChange={setEnumVal} required placeholder="ex: Placa de parada" />
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Macro (opcional)</label>
        <select
          value={macroEnum}
          onChange={e => setMacroEnum(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
        >
          <option value="">— sem macro —</option>
          {macros.map(m => <option key={m.enum} value={m.enum}>{m.enum}</option>)}
        </select>
      </div>
      <SubmitButton loading={loading} label="Criar Micro" />
      <Feedback msg={msg} />
    </form>
  );
}

// ── Create Pista ────────────────────────────────────────────
function CreatePista({ macros }) {
  const [content, setContent] = useState('');
  const [resolution, setResolution] = useState('');
  const [selectedMacro, setSelectedMacro] = useState('');
  const [selectedMicro, setSelectedMicro] = useState('');
  const [allMicros, setAllMicros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/caca_api/micros`, { headers: authHeaders() })
      .then(r => r.json())
      .then(microList => {
        const flat = Object.values(microList).flat();
        setAllMicros(flat);
      })
      .catch(() => {});
  }, []);

  const responseType = (selectedMicro || selectedMacro) ? 'macro_micro' : 'text';

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const body = { content, response_type: responseType };
    if (resolution) body.resolution_description = resolution;
    if (selectedMicro) body.micro_enum = selectedMicro;
    if (selectedMacro) body.macro_enum = selectedMacro;
    try {
      const res = await fetch(`${API}/caca_api/admin/pista`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).description || 'Erro ao criar pista');
      const data = await res.json();
      setMsg(`Pista criada! Chave: ${data.pista_key}`);
      setContent('');
      setResolution('');
      setSelectedMacro('');
      setSelectedMicro('');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = { width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Conteúdo *</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          rows={4}
          placeholder="Texto da pista..."
          style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Descrição da resolução (opcional)</label>
        <textarea
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          rows={2}
          placeholder="Como chegar na resposta..."
          style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Macro (opcional)</label>
        <select value={selectedMacro} onChange={e => setSelectedMacro(e.target.value)} style={selectStyle}>
          <option value="">— sem macro —</option>
          {macros.map(m => <option key={m.enum} value={m.enum}>{m.enum}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Micro (opcional)</label>
        <select value={selectedMicro} onChange={e => setSelectedMicro(e.target.value)} style={selectStyle}>
          <option value="">— sem micro —</option>
          {allMicros.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <p style={{ margin: '0 0 12px', color: '#666', fontSize: '0.9rem' }}>
        Tipo de resposta: <strong>{responseType}</strong>
      </p>
      <SubmitButton loading={loading} label="Criar Pista" />
      <Feedback msg={msg} />
    </form>
  );
}

// ── Users ───────────────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [grantingUser, setGrantingUser] = useState(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API}/caca_api/admin/users`, { headers: authHeaders() });
      setUsers(await res.json());
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const grantAdmin = async username => {
    setGrantingUser(username);
    try {
      await fetch(`${API}/caca_api/admin/user/${username}/grant_admin`, {
        method: 'POST',
        headers: authHeaders(),
      });
      await fetchUsers();
    } finally {
      setGrantingUser(null);
    }
  };

  if (loadingUsers) return <LoadingSpinner />;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={th}>Username</th>
          <th style={th}>Admin</th>
          <th style={th}>Criado em</th>
          <th style={th}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.username} style={{ borderBottom: '1px solid #eee' }}>
            <td style={td}>{u.username}</td>
            <td style={td}>{u.is_admin ? '✅' : '—'}</td>
            <td style={td}>{u.deactivated_on ? `Desativado` : 'Ativo'}</td>
            <td style={td}>
              {!u.is_admin && (
                <button
                  onClick={() => grantAdmin(u.username)}
                  disabled={grantingUser === u.username}
                  style={{ padding: '4px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  {grantingUser === u.username ? '...' : 'Tornar Admin'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600 };
const td = { padding: '10px 12px' };

// ── Pistas List ─────────────────────────────────────────────
function PistasList({ onScheduled }) {
  const [pistas, setPistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchPistas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/caca_api/admin/pista`, { headers: authHeaders() });
      if (res.ok) setPistas(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPistas(); }, []);

  const schedule = async (pista_key) => {
    setScheduling(pista_key);
    setMsg('');
    try {
      const res = await fetch(`${API}/caca_api/admin/daily_pista`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ pista_key }),
      });
      if (!res.ok) throw new Error((await res.json()).description || 'Erro ao agendar');
      setMsg('Pista agendada!');
      onScheduled();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setScheduling(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Feedback msg={msg} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={th}>Conteúdo</th>
              <th style={th}>Micro</th>
              <th style={th}>Macro</th>
              <th style={th}>Tipo</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pistas.map(p => (
              <tr key={p.pista_key} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ ...td, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.content}>{p.content}</td>
                <td style={td}>{p.micro_enum || '—'}</td>
                <td style={td}>{p.macro_enum || '—'}</td>
                <td style={td}>{p.response_type}</td>
                <td style={td}>
                  <button
                    onClick={() => schedule(p.pista_key)}
                    disabled={scheduling === p.pista_key}
                    style={{ padding: '4px 12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    {scheduling === p.pista_key ? '...' : 'Agendar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Daily Pista Schedule ────────────────────────────────────
function DailySchedule({ refresh }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allPistas, setAllPistas] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editPistaKey, setEditPistaKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/caca_api/admin/daily_pista`, { headers: authHeaders() });
      if (res.ok) setSchedule(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchPistas = async () => {
    try {
      const res = await fetch(`${API}/caca_api/admin/pista`, { headers: authHeaders() });
      if (res.ok) setAllPistas(await res.json());
    } catch (_) {}
  };

  useEffect(() => { fetchSchedule(); }, [refresh]);
  useEffect(() => { fetchPistas(); }, []);

  const startEdit = (dp) => {
    setEditingKey(dp.daily_pista_key);
    setEditPistaKey(dp.pista?.pista_key || '');
    setMsg('');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditPistaKey('');
  };

  const saveEdit = async (daily_pista_key) => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`${API}/caca_api/admin/daily_pista/${daily_pista_key}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ pista_key: editPistaKey }),
      });
      if (!res.ok) throw new Error((await res.json()).description || 'Erro ao salvar');
      setEditingKey(null);
      setEditPistaKey('');
      await fetchSchedule();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!schedule.length) return <p style={{ color: '#888' }}>Nenhuma pista agendada.</p>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectStyle = { padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', maxWidth: 220, width: '100%' };

  return (
    <>
      <Feedback msg={msg} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={th}>Data</th>
              <th style={th}>Status</th>
              <th style={th}>Conteúdo</th>
              <th style={th}>Micro</th>
              <th style={th}>Macro</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(dp => {
              const date = new Date(dp.start_date);
              date.setHours(0, 0, 0, 0);
              const isPast = date < today;
              const isToday = date.getTime() === today.getTime();
              const status = isToday ? '📅 Hoje' : isPast ? 'Passado' : 'Futuro';
              const rowBg = isToday ? '#fffbe6' : 'transparent';
              const isEditing = editingKey === dp.daily_pista_key;
              const selectedPista = allPistas.find(p => p.pista_key === editPistaKey);

              return (
                <tr key={dp.daily_pista_key} style={{ borderBottom: '1px solid #eee', background: rowBg }}>
                  <td style={td}>{new Date(dp.start_date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ ...td, color: isToday ? '#b8860b' : isPast ? '#aaa' : '#28a745', fontWeight: isToday ? 700 : 400 }}>{status}</td>
                  {isEditing ? (
                    <>
                      <td style={td} colSpan={3}>
                        <select
                          value={editPistaKey}
                          onChange={e => setEditPistaKey(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">— selecionar pista —</option>
                          {allPistas.map(p => (
                            <option key={p.pista_key} value={p.pista_key}>
                              {p.content.length > 60 ? p.content.slice(0, 60) + '…' : p.content}
                              {p.micro_enum ? ` [${p.micro_enum}]` : p.macro_enum ? ` [${p.macro_enum}]` : ''}
                            </option>
                          ))}
                        </select>
                        {selectedPista && (
                          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 2 }}>
                            Micro: {selectedPista.micro_enum || '—'} · Macro: {selectedPista.macro_enum || '—'}
                          </div>
                        )}
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => saveEdit(dp.daily_pista_key)}
                            disabled={saving || !editPistaKey}
                            style={{ padding: '4px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          >
                            {saving ? '...' : 'Salvar'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            style={{ padding: '4px 10px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...td, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dp.pista?.content}>{dp.pista?.content}</td>
                      <td style={td}>{dp.pista?.micro_enum || '—'}</td>
                      <td style={td}>{dp.pista?.macro_enum || '—'}</td>
                      <td style={td}>
                        <button
                          onClick={() => startEdit(dp)}
                          style={{ padding: '4px 10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                          Editar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Time Machine (local builds only) ────────────────────────
function TimeMachine() {
  const [currentTime, setCurrentTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [msg, setMsg] = useState('');

  const fetchCurrentTime = async () => {
    try {
      const res = await fetch(`${API}/caca_api/admin/time-machine`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCurrentTime(data.current_time);
      }
    } catch (_) {}
  };

  useEffect(() => { fetchCurrentTime(); }, []);

  const handleSet = async e => {
    e.preventDefault();
    if (!selectedDate) return;
    const res = await fetch(`${API}/caca_api/admin/time-machine`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ datetime: selectedDate })
    });
    const data = await res.json();
    setCurrentTime(data.current_time);
    setMsg(`Tempo definido para: ${data.current_time}`);
  };

  const handleReset = async () => {
    const res = await fetch(`${API}/caca_api/admin/time-machine`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ datetime: null })
    });
    const data = await res.json();
    setCurrentTime(data.current_time);
    setMsg('Tempo restaurado para o real.');
  };

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <strong>Tempo atual do servidor:</strong> {currentTime || '...'}
      </p>
      <form onSubmit={handleSet} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Definir data/hora</label>
          <input
            type="datetime-local"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 16px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Definir
        </button>
        <button type="button" onClick={handleReset} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Resetar
        </button>
      </form>
      <Feedback msg={msg} />
    </div>
  );
}

// ── Main Admin Page ─────────────────────────────────────────
function Admin() {
  const navigate = useNavigate();
  const [macros, setMacros] = useState([]);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);

  const fetchMacros = async () => {
    try {
      const res = await fetch(`${API}/caca_api/admin/macro`, { headers: authHeaders() });
      if (res.ok) setMacros(await res.json());
    } catch (_) {}
  };

  useEffect(() => {
    if (!localStorage.getItem('is_admin')) {
      navigate('/play');
      return;
    }
    fetchMacros();
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: 24 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Painel Admin</h1>
          <button onClick={() => navigate('/play')} style={{ padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' }}>
            Voltar ao jogo
          </button>
        </div>

        <Section title="Criar Macro">
          <CreateMacro onCreated={fetchMacros} />
        </Section>

        <Section title="Criar Micro">
          <CreateMicro macros={macros} onCreated={() => {}} />
        </Section>

        <Section title="Criar Pista">
          <CreatePista macros={macros} />
        </Section>

        <Section title="Pistas">
          <PistasList onScheduled={() => setScheduleRefresh(r => r + 1)} />
        </Section>

        <Section title="Agenda Daily Pista">
          <DailySchedule refresh={scheduleRefresh} />
        </Section>

        <Section title="Usuários">
          <Users />
        </Section>

        {process.env.REACT_APP_LOCAL_BUILD === 'true' && (
          <Section title="🕐 Time Machine (local only)">
            <TimeMachine />
          </Section>
        )}
      </div>
    </div>
  );
}

export default Admin;
