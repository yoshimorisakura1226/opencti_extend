import { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './labels.css';
import Header from '../../components/layout/Header';
import LabelModal from '../../components/layout/LabelsModal';

const LabelMerge = () => {
  const [labels, setLabels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [targetId, setTargetId] = useState('');
  const [selectedSourceNames, setSelectedSourceNames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);

  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/label');
      const data = await res.json();
      if (Array.isArray(data)) setLabels(data);
    } catch (err) {
      console.error('Error fetching labels:', err);
    }
  };

  useEffect(() => { fetchLabels(); }, []);

  const filteredLabels = labels.filter(l => {
    const matchesSearch = l.value.toLowerCase().includes(searchTerm.toLowerCase());

    const createdDate = new Date(l.created);
    const matchesStart = startDate ? createdDate >= startDate : true;
    const matchesEnd = endDate
      ? createdDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : true;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const targetSuggestions = labels.filter(l => l.value.toLowerCase().includes(targetSearch.toLowerCase()));

  const toggleSourceLabel = (labelValue) => {
    setSelectedSourceNames(prev =>
      prev.includes(labelValue)
        ? prev.filter(i => i !== labelValue)
        : [...prev, labelValue]
    );
  };

  const handleMergeSubmit = async () => {
    if (!targetId) return alert("請先選擇目標標籤！");
    setLoading(true);
    try {
      const res = await fetch('/api/label/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_name: targetId, source_names: selectedSourceNames })
      });
      const result = await res.json();
      if (res.ok) {
        alert(`合併成功！處理了 ${result.processed} 個實體。`);
        setSelectedSourceNames([]);
        setTargetId('');
        setTargetSearch('');
        await fetchLabels();
      } else {
        alert('合併失敗: ' + result.error);
      }
    } catch (err) {
      alert('請求發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    const url = editingLabel ? `/api/label/${editingLabel.id}` : '/api/label';
    const method = editingLabel ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setEditingLabel(null);
        await fetchLabels();
      } else {
        alert("儲存失敗");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedSourceNames.length === 0) return;
    if (!window.confirm(`確定要刪除這 ${selectedSourceNames.length} 個標籤嗎？`)) return;

    setLoading(true);
    try {
      const idsToDelete = labels
        .filter(l => selectedSourceNames.includes(l.value))
        .map(l => l.id);

      // 執行批次請求
      await Promise.all(idsToDelete.map(id => 
        fetch(`/api/label/${id}`, { method: 'DELETE' })
      ));

      setSelectedSourceNames([]);
      await fetchLabels();
      alert("刪除成功！");
    } catch (err) {
      console.error("刪除失敗", err);
      alert("刪除過程中發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="merge-container">
      <Header />
      <div className='labelboard' style={{ width: '85vw' }}>
        <div className="input-group">
          <div className='top-group'>
            <p>📦 系統總標籤: <b>{labels.length}</b></p>
            <div>
              <button 
                className="action-button add-del--button" 
                onClick={() => { setEditingLabel(null); setIsModalOpen(true); }}
              >
                + 新增
              </button>
              <button 
                className="action-button del-button" 
                onClick={handleBatchDelete} // 直接呼叫批次刪除
                disabled={selectedSourceNames.length === 0}
              >
                - 刪除
              </button>

              <LabelModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                editingLabel={editingLabel}
              />
            </div>
          </div>
          <div className='search-group'>
            <input
              className="styled-input"
              placeholder="Search Labels..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="date-filter">
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={([start, end]) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="styled-input"
                dateFormat="yyyy/MM/dd"
                placeholderText="Select Date"
                isClearable
              />
            </div>
          </div>
        </div>

        <div className="input-group" style={{ position: 'relative' }}>
          <p>1. 設定目標標籤 (合併後保留)：</p>
          <input
            className="styled-input"
            placeholder="搜尋目標標籤..."
            value={targetSearch}
            onChange={(e) => { setTargetSearch(e.target.value); setShowSuggestions(true); }}
          />
          {showSuggestions && targetSearch && (
            <div className="suggestions">
              {targetSuggestions.map(l => (
                <div key={l.id} onClick={() => { setTargetId(l.value); setTargetSearch(l.value); setShowSuggestions(false); }}>
                  {l.value}
                </div>
              ))}
            </div>
          )}
        </div>

        <p>2. 點擊清單選擇要【合併】的來源標籤 (當前已選: {selectedSourceNames.length}):</p>
        <div className="custom-label-list">
          {filteredLabels
            .filter(l => l.value !== targetId)
            .slice(0, 500)
            .map(l => (
              <div
                key={l.id}
                className={`label-item ${selectedSourceNames.includes(l.value) ? 'selected' : ''}`}
                onClick={() => toggleSourceLabel(l.value)}
                onDoubleClick={() => { 
                  setEditingLabel(l);
                  setIsModalOpen(true);
                }}
                style={{ borderLeft: `5px solid ${l.color || '#cccccc'}` }}
              >
                {l.value}
              </div>
            ))
          }
        </div>

        <div className="selected-preview">
          {selectedSourceNames.map(name => (
            <span key={name} className="tag">
              {name} <span onClick={() => toggleSourceLabel(name)}>×</span>
            </span>
          ))}
        </div>

        <button
          className="action-button"
          onClick={handleMergeSubmit}
          disabled={loading || selectedSourceNames.length === 0}
        >
          {loading ? '🚀 正在大融合中...' : `🚀 執行 ${selectedSourceNames.length} 個標籤合併`}
        </button>
      </div>
    </div>
  );
};

export default LabelMerge;