import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import './index.css';

const AI_PURPOSES = [
  { id: 'A', label: '資料搜尋／查證' },
  { id: 'B', label: '資料整理／摘要' },
  { id: 'C', label: '架構／邏輯分析' },
  { id: 'D', label: '文案／翻譯／潤飾' },
  { id: 'E', label: '數據整理／分析' },
  { id: 'F', label: '簡報內容製作' },
  { id: 'G', label: '簡報排版／視覺' },
  { id: 'H', label: '圖像／影音生成' }
];

const ADOPTION_STATUSES = [
  '完成工作需求(好)',
  '經修改後由主管採用(很好)',
  '主管直接採用(非常好)',
  '獲高階主管肯定／採用(極好)',
  '尚未採用／僅供參考'
];

const COMPANIES = [
  '東森購物',
  '東森新媒體',
  '東森國際(含東林)',
  '東森寵物雲',
  '慈愛生物科技',
  '東森房屋',
  '東森保代',
  '東森全球',
  '東森自然美',
  '分眾傳媒',
  '東森健康生技',
  '遠富',
  '香港草莓網'
];

type AITool = {
  name: string;
  percentage: number | '';
  purposes: string[];
};

const initialTool: AITool = { name: '', percentage: '', purposes: [] };

function App() {
  const [formData, setFormData] = useState({
    company: '',
    unit: '',
    reporter: '',
    date: new Date().toISOString().split('T')[0],
    report_name: '',
    used_ai: true
  });

  const [mainAi, setMainAi] = useState<AITool>({ ...initialTool });
  const [subAi1, setSubAi1] = useState<AITool>({ ...initialTool });
  const [subAi2, setSubAi2] = useState<AITool>({ ...initialTool });
  const [otherAi, setOtherAi] = useState<AITool>({ ...initialTool });

  const [aiParticipationLevel, setAiParticipationLevel] = useState<string>('');
  const [adoptionStatus, setAdoptionStatus] = useState<string>('');
  const [topCaseDescription, setTopCaseDescription] = useState<string>('');

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPercentage = useMemo(() => {
    return (Number(mainAi.percentage) || 0) + 
           (Number(subAi1.percentage) || 0) + 
           (Number(subAi2.percentage) || 0) + 
           (Number(otherAi.percentage) || 0);
  }, [mainAi.percentage, subAi1.percentage, subAi2.percentage, otherAi.percentage]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePurposeToggle = (setter: React.Dispatch<React.SetStateAction<AITool>>, toolState: AITool, purposeId: string) => {
    if (toolState.purposes.includes(purposeId)) {
      setter({ ...toolState, purposes: toolState.purposes.filter(p => p !== purposeId) });
    } else {
      if (toolState.purposes.length < 3) {
        setter({ ...toolState, purposes: [...toolState.purposes, purposeId] });
      } else {
        showToast('主要用途最多只能選擇 3 項', 'error');
      }
    }
  };

  const validateForm = () => {
    if (!formData.company || !formData.unit || !formData.reporter || !formData.report_name) {
      showToast('請填寫完整基本資料', 'error');
      return false;
    }
    
    if (formData.used_ai) {
      if (!mainAi.name) {
        showToast('請至少填寫主要 AI 工具名稱', 'error');
        return false;
      }
      if (totalPercentage !== 100 && totalPercentage !== 0) { // Allow 0 if they haven't typed yet, but warn if submitting
        showToast(`AI 占比總計必須為 100% (目前為 ${totalPercentage}%)`, 'error');
        return false;
      }
      if (!aiParticipationLevel) {
        showToast('請選擇 AI 參與程度', 'error');
        return false;
      }
      if (!adoptionStatus) {
        showToast('請選擇成果採用情形', 'error');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      main_ai: formData.used_ai ? { ...mainAi, percentage: Number(mainAi.percentage) || 0 } : null,
      sub_ai_1: formData.used_ai ? { ...subAi1, percentage: Number(subAi1.percentage) || 0 } : null,
      sub_ai_2: formData.used_ai ? { ...subAi2, percentage: Number(subAi2.percentage) || 0 } : null,
      other_ai: formData.used_ai ? { ...otherAi, percentage: Number(otherAi.percentage) || 0 } : null,
      ai_participation_level: formData.used_ai ? aiParticipationLevel : null,
      adoption_status: formData.used_ai ? adoptionStatus : null,
      top_case_description: formData.used_ai ? topCaseDescription : null,
    };

    try {
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbyjlRXcE5ovcvqBD74-y3KUxn3MnlfZIfmJypKHDmjRvXnU2R5EKjAOWwN9gI_XpkNA/exec';
      const response = await fetch(scriptUrl, {
        method: 'POST',
        redirect: 'follow', // 處理 Google Apps Script 常見的重新導向
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json().catch(() => ({}));
      
      if (result.status !== 'success') {
        throw new Error(result.message || '提交失敗');
      }
      
      showToast('問卷提交成功！', 'success');
      
      // Reset form (partial reset for convenience)
      setFormData(prev => ({ ...prev, report_name: '' }));
      setMainAi({ ...initialTool });
      setSubAi1({ ...initialTool });
      setSubAi2({ ...initialTool });
      setOtherAi({ ...initialTool });
      setAiParticipationLevel('');
      setAdoptionStatus('');
      setTopCaseDescription('');
      
    } catch (error: any) {
      console.error(error);
      showToast(`錯誤: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAIToolInput = (label: string, state: AITool, setter: React.Dispatch<React.SetStateAction<AITool>>, required: boolean = false) => (
    <div className="tool-group">
      <h3>{label} {required && <span style={{color: 'var(--error-color)'}}>*</span>}</h3>
      <div className="tool-grid">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="AI 工具名稱 (例如: ChatGPT)" 
            value={state.name}
            onChange={(e) => setter({ ...state, name: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input 
            type="number" 
            className="form-control" 
            placeholder="占比 (%)" 
            min="0" max="100"
            value={state.percentage}
            onChange={(e) => setter({ ...state, percentage: e.target.value ? Number(e.target.value) : '' })}
          />
        </div>
      </div>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <p className="help-text">主要用途 (最多選 3 項)</p>
        <div className="tags-container">
          {AI_PURPOSES.map(purpose => {
            const isChecked = state.purposes.includes(purpose.id);
            return (
              <label key={purpose.id}>
                <input 
                  type="checkbox" 
                  className="tag-checkbox"
                  checked={isChecked}
                  onChange={() => handlePurposeToggle(setter, state, purpose.id)}
                />
                <span className="tag-label">{purpose.id}. {purpose.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="header">
        <h1>AI 工具實戰應用與成果追蹤調查表V2</h1>
        <p>請回填最近一次八大中心會議之提報資料，一份報告填寫一筆。</p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {/* 一、報告基本資料 */}
        <div className="form-section">
          <h2>一、報告基本資料</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>公司／中心 *</label>
              <select 
                className="form-control" 
                value={formData.company} 
                onChange={e => setFormData({...formData, company: e.target.value})} 
                required
              >
                <option value="" disabled>請選擇公司／中心</option>
                {COMPANIES.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>單位 *</label>
              <input type="text" className="form-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>提報人 *</label>
              <input type="text" className="form-control" value={formData.reporter} onChange={e => setFormData({...formData, reporter: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>提報日期 *</label>
              <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
          </div>
          
          <div className="form-group">
            <label>報告名稱 *</label>
            <input type="text" className="form-control" value={formData.report_name} onChange={e => setFormData({...formData, report_name: e.target.value})} required />
          </div>

          <div className="form-group">
            <label>1. 本份報告／成果是否使用 AI 工具協助？</label>
            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" name="used_ai" checked={formData.used_ai} onChange={() => setFormData({...formData, used_ai: true})} />
                <span>是（請繼續填答）</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="used_ai" checked={!formData.used_ai} onChange={() => setFormData({...formData, used_ai: false})} />
                <span>否（以下免填）</span>
              </label>
            </div>
          </div>
        </div>

        {/* 二、AI 工具組合與使用占比 */}
        {formData.used_ai && (
          <div className="form-section" style={{ animation: 'fadeInDown 0.3s ease-out' }}>
            <h2>二、AI 工具組合與使用占比</h2>
            <p className="help-text" style={{ marginBottom: '1.5rem' }}>請至少填主要 AI；如有明顯搭配其他工具，再填輔助 AI。占比填大約即可。僅使用單一 AI 時請填 100%。</p>
            
            {renderAIToolInput("主要 AI", mainAi, setMainAi, true)}
            {renderAIToolInput("輔助 AI 1", subAi1, setSubAi1)}
            {renderAIToolInput("輔助 AI 2", subAi2, setSubAi2)}
            {renderAIToolInput("其他 AI", otherAi, setOtherAi)}

            <div className={`total-percentage ${totalPercentage === 100 ? 'success' : (totalPercentage > 0 ? 'error' : '')}`}>
              占比合計：{totalPercentage} % (原則上合計 100%)
            </div>
          </div>
        )}

        {/* 三、AI 參與程度與成果採用情形 */}
        {formData.used_ai && (
          <div className="form-section" style={{ animation: 'fadeInDown 0.4s ease-out' }}>
            <h2>三、AI 參與程度與成果採用情形</h2>
            
            <div className="form-group">
              <label>3. AI 在本份報告／成果中的參與程度為何？ *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input type="radio" name="ai_level" checked={aiParticipationLevel === '高'} onChange={() => setAiParticipationLevel('高')} />
                  <span><strong>高</strong>｜AI 參與核心分析、主要內容產出或主要成品製作</span>
                </label>
                <label className="radio-option">
                  <input type="radio" name="ai_level" checked={aiParticipationLevel === '中'} onChange={() => setAiParticipationLevel('中')} />
                  <span><strong>中</strong>｜AI 協助架構、初稿、部分分析或部分製作</span>
                </label>
                <label className="radio-option">
                  <input type="radio" name="ai_level" checked={aiParticipationLevel === '低'} onChange={() => setAiParticipationLevel('低')} />
                  <span><strong>低</strong>｜AI 僅用於查詢、校對、翻譯、潤飾或局部美化</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>4. 本份成果最終採用情形為何？ *</label>
              <p className="help-text">由提報人依實際結果勾選；必要時由主管／AI 實戰學院校核（※ 提醒：本題為單選）</p>
              <div className="radio-group">
                {ADOPTION_STATUSES.map(status => (
                  <label key={status} className="radio-option">
                    <input type="radio" name="adoption_status" checked={adoptionStatus === status} onChange={() => setAdoptionStatus(status)} />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>5. 若本份成果獲主管／高階主管肯定，請填寫成果檔名、連結或一句話說明：</label>
              <p className="help-text">（選填，供後續 Top AI Cases 萃取）</p>
              <textarea 
                className="form-control" 
                rows={3}
                value={topCaseDescription}
                onChange={e => setTopCaseDescription(e.target.value)}
                placeholder="請輸入說明..."
              ></textarea>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '處理中...' : '送出問卷'}
        </button>
      </form>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
