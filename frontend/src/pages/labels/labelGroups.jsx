import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import './labels.css';

const LabelGroup = () => {
  const [rules, setRules] = useState({ merge: [], association: [] });
  const [expanded, setExpanded] = useState({ merge: true, association: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalForm, setModalForm] = useState({ 
    type: 'merge', target: '', list: '', isEdit: false, id: null 
  });

  const loadRules = async (type) => {
    try {
      const res = await fetch(`/api/label/rule/list/${type}`);
      const data = await res.json();
      setRules(prev => ({ ...prev, [type]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error(`讀取 ${type} 規則失敗:`, err);
    }
  };

  useEffect(() => {
    loadRules('merge');
    loadRules('association');
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
      setIsModalOpen(false);
      setModalForm({ type: 'merge', target: '', list: '', isEdit: false, id: null });
    } else {
      alert("儲存失敗");
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("確定要刪除這條規則嗎？")) return;
    await fetch(`/api/label/rule/delete/${type}/${id}`, { method: 'DELETE' });
    loadRules(type);
  };

  return (
    <div className="group-container">
      <Header />
      <div className="content">
        <div className="global-actions">
          <button className="add-btn-global" onClick={() => {
            setModalForm({ type: 'merge', target: '', list: '', isEdit: false, id: null });
            setIsModalOpen(true);
          }}>+ 新增自動化規則</button>
          
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
            <h3>{expanded.association ? '▼' : '▶'} 自動化新增規則</h3>
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
            <input placeholder="輸入主要目標" value={modalForm.target}
                   onChange={(e) => setModalForm({...modalForm, target: e.target.value})} />
            <input placeholder={modalForm.type === 'merge' ? "輸入來源 Labels (逗號分隔)" : "輸入觸發 Labels (逗號分隔)"} value={modalForm.list}
                   onChange={(e) => setModalForm({...modalForm, list: e.target.value})} />
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