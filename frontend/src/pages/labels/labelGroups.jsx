import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import './labels.css';

const LabelGroup = () => {
  const [rules, setRules] = useState({ mergeRules: [], associationRules: [] });
  const [expanded, setExpanded] = useState({ merge: true, association: false });

  // 讀取規則 (模擬 API)
  useEffect(() => {
    fetch('/api/rules').then(res => res.json()).then(setRules);
  }, []);

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="group-container">
      <Header />
      <div className="content">
        {/* 自動化合併區域 */}
        <section className="rule-section">
          <div className="section-header" onClick={() => toggleSection('merge')}>
            <h3>{expanded.merge ? '▼' : '▶'} 自動化合併規則</h3>
          </div>
          {expanded.merge && (
            <div className="section-body">
              {rules.mergeRules.map(rule => (
                <div key={rule.id} className="rule-card">
                  <span>目標: <b>{rule.target}</b></span>
                  <span>來源: {rule.sources.join(', ')}</span>
                </div>
              ))}
              <button className="add-btn">+ 新增合併規則</button>
            </div>
          )}
        </section>

        {/* 自動化新增區域 */}
        <section className="rule-section">
          <div className="section-header" onClick={() => toggleSection('association')}>
            <h3>{expanded.association ? '▼' : '▶'} 自動化新增規則</h3>
          </div>
          {expanded.association && (
            <div className="section-body">
              {rules.associationRules.map(rule => (
                <div key={rule.id} className="rule-card">
                  <span>若包含: <b>{rule.triggerLabel}</b></span>
                  <span>則自動補上: <b>{rule.addLabel}</b></span>
                </div>
              ))}
              <button className="add-btn">+ 新增關聯規則</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LabelGroup;