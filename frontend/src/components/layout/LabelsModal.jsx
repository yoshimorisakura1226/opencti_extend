import React, { useState, useEffect } from 'react';
import './LabelsModal.css'

const LabelModal = ({ isOpen, onClose, onSave, editingLabel }) => {
  const [value, setValue] = useState('');
  const [color, setColor] = useState('#ffffff'); // 預設白色

  // 當 editingLabel 改變時，更新內部的狀態
  useEffect(() => {
    if (isOpen) { // 當視窗開啟時檢查
      if (editingLabel) {
        setValue(editingLabel.value || '');
        // 這裡確保將顏色值寫入 state，這會直接反映在 <input type="color"> 上
        setColor(editingLabel.color || '#ffffff'); 
      } else {
        setValue('');
        setColor('#ffffff');
      }
    }
  }, [isOpen, editingLabel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{editingLabel ? '修改標籤' : '新增標籤'}</h3>
        
        <label>標籤名稱:</label>
        <input 
          type="text" // 顯式設定為文字框
          className="styled-input" 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
        />

        <label style={{ marginTop: '15px', display: 'block' }}>顏色 (Hex):</label>
        <input 
          type="color" 
          className="styled-input" 
          value={color} // 這裡的 value 對應上面的 state
          onChange={(e) => setColor(e.target.value)} 
          style={{ width: '100%', height: '40px' }}
        />

        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button onClick={() => onSave({ value, color })}>確定</button>
        </div>
      </div>
    </div>
  );
};

export default LabelModal;