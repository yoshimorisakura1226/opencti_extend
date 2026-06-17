import { useState, useEffect,useRef } from 'react';
import Header from '../../components/layout/Header';
import './labels.css';

const LabelGroup = () => {
  const inputRef = useRef(null);
  const [activeField, setActiveField] = useState(null);
  const [rules, setRules] = useState({ merge: [], association: [] });
  const [expanded, setExpanded] = useState({ merge: true, association: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalForm, setModalForm] = useState({ 
    type: 'merge', target: '', list: '', isEdit: false, id: null 
  });
  const [isRunning, setIsRunning] = useState(false);
  const [allLabels, setAllLabels] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const loadRules = async (type) => {
    try {
      const res = await fetch(`/api/label/rule/list/${type}`);
      const data = await res.json();
      setRules(prev => ({ ...prev, [type]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error(`讀取 ${type} 規則失敗:`, err);
    }
  };

  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/label');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllLabels(data);
      }
    } catch (err) {
      console.error("更新標籤列表失敗:", err);
    }
  };

  useEffect(() => {
    loadRules('merge');
    loadRules('association');
    fetchLabels();
  }, []);

  // 搜尋過濾邏輯
  const filterRules = (rulesArray) => {
    if (!searchTerm) return rulesArray;
    return rulesArray.filter(rule => 
      rule.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.sources && rule.sources.join(',').toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rule.conditions && rule.conditions.join(',').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const handleEdit = (type, rule) => {
    setModalForm({
      type,
      target: rule.target,
      list: type === 'merge' ? rule.sources.join(', ') : rule.conditions.join(', '),
      isEdit: true,
      id: rule.id
    });
    setIsModalOpen(true);
  };

  const handleAddSubmit = async () => {
    if (!modalForm.target || !modalForm.list) {
      alert("請填寫所有欄位");
      return;
    }

    const isMerge = modalForm.type === 'merge';
    const payload = {
      target: modalForm.target,
      [isMerge ? 'sources' : 'conditions']: modalForm.list.split(',').map(s => s.trim())
    };

    const url = modalForm.isEdit 
      ? `/api/label/rule/update/${modalForm.type}/${modalForm.id}`
      : `/api/label/rule/add/${modalForm.type}`;
    const method = modalForm.isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      loadRules(modalForm.type);
      fetchLabels();
      setIsModalOpen(false);
      setModalForm({ type: 'merge', target: '', list: '', isEdit: false, id: null });
    } else {
      alert("儲存失敗");
    }
  };

  const getSuggestions = (inputValue, isTargetInput) => {
    const filtered = allLabels.filter(label => {
      const matches = label.value.toLowerCase().includes(inputValue.toLowerCase());
      if (!isTargetInput && modalForm.target) {
        return matches && label.value !== modalForm.target; // 排除目標欄位的值
      }
      return matches;
    });
    return filtered.slice(0, 5);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setModalForm(prev => ({ ...prev, [field]: value }));
    setActiveField(field);

    const term = field === 'list' ? value.split(',').pop().trim() : value;
    
    if (term.length > 0) {
      const matches = allLabels.filter(label => 
        label.value.toLowerCase().includes(term.toLowerCase()) && 
        (field === 'target' || label.value !== modalForm.target) // list 欄位排除已選 target
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (val, field) => {
    if (field === 'target') {
      setModalForm(prev => ({ ...prev, target: val }));
    } else {
      const parts = modalForm.list.split(',');
      parts.pop();
      parts.push(val);
      setModalForm(prev => ({ ...prev, list: parts.join(', ') + ', ' }));
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("確定要刪除這條規則嗎？")) return;
    await fetch(`/api/label/rule/delete/${type}/${id}`, { method: 'DELETE' });
    loadRules(type);
  };

  const handleRunNow = async () => {
    if (!window.confirm("確定要立即執行所有規則嗎？")) return;
    
    setIsRunning(true); // 開始執行，鎖定按鈕
    try {
        const response = await fetch('/api/label/runAllTasks', { method: 'POST' });
        const result = await response.json();
    } finally {
        setIsRunning(false); // 執行結束，解鎖按鈕
    }
  };

  return (
    <div className="group-container">
      <Header />
      <div className="content">
        <div className="global-actions">
          <button className="add-btn-global" onClick={() => {
            fetchLabels();
            setModalForm({ type: 'merge', target: '', list: '', isEdit: false, id: null });
            setIsModalOpen(true);
          }}>+ 新增自動化規則</button>

          <button className="add-btn-global" onClick={handleRunNow} disabled={isRunning}>
            {isRunning ? '執行中...' : '立即執行'}
          </button>

          <input 
            type="text" 
            placeholder="搜尋規則..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </div>

        <section className="rule-section">
          <div className="section-header" onClick={() => setExpanded(p => ({...p, merge: !p.merge}))}>
            <h3>{expanded.merge ? '▼' : '▶'} 自動化合併規則</h3>
          </div>
          {expanded.merge && (
            <div className="section-body">
              {filterRules(rules.merge).map(rule => (
                <div key={rule.id} className="rule-card">
                  <div className="rule-info">
                    <span>目標: <b>{rule.target}</b></span>
                    <small>來源: {rule.sources?.join(', ')}</small>
                  </div>
                  <div className="card-actions">
                    <button className="edit-btn" onClick={() => handleEdit('merge', rule)}>修改</button>
                    <button className="delete-btn" onClick={() => handleDelete('merge', rule.id)}>刪除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rule-section">
          <div className="section-header" onClick={() => setExpanded(p => ({...p, association: !p.association}))}>
            <h3>{expanded.association ? '▼' : '▶'} 自動化關聯規則</h3>
          </div>
          {expanded.association && (
            <div className="section-body">
              {filterRules(rules.association).map(rule => (
                <div key={rule.id} className="rule-card">
                  <div className="rule-info">
                    <span>補上: <b>{rule.target}</b></span>
                    <small>若包含: <b>{rule.conditions?.join(', ')}</b></small>
                  </div>
                  <div className="card-actions">
                    <button className="edit-btn" onClick={() => handleEdit('association', rule)}>修改</button>
                    <button className="delete-btn" onClick={() => handleDelete('association', rule.id)}>刪除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{modalForm.isEdit ? '修改規則' : '新增自動化規則'}</h3>
            <select value={modalForm.type} onChange={(e) => setModalForm({...modalForm, type: e.target.value})}>
              <option value="merge">合併規則 (Merge)</option>
              <option value="association">關聯新增 (Association)</option>
            </select>

            {/* --- 主要目標 Input (加上自動完成) --- */}
            <div className="autocomplete-wrapper" style={{ position: 'relative' }}>
              <input 
                placeholder="輸入主要目標" 
                value={modalForm.target}
                onChange={(e) => handleInputChange(e, 'target')}
              />
              {/* 如果正在輸入 target，顯示 target 的建議 */}
              {activeField === 'target' && suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map(s => (
                    <li key={s.id} onClick={() => selectSuggestion(s.value, 'target')}>
                      {s.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* --- 列表 Input (自動完成，排除已選 target) --- */}
            <div className="autocomplete-wrapper" style={{ position: 'relative' }}>
              <input 
                placeholder={modalForm.type === 'merge' ? "輸入來源 Labels (逗號分隔)" : "輸入觸發 Labels (逗號分隔)"} 
                value={modalForm.list}
                onChange={(e) => handleInputChange(e, 'list')}
              />
              {activeField === 'list' && suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map(s => (
                    <li key={s.id} onClick={() => selectSuggestion(s.value, 'list')}>
                      {s.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="modal-actions">
              <button onClick={handleAddSubmit}>儲存</button>
              <button onClick={() => setIsModalOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelGroup;