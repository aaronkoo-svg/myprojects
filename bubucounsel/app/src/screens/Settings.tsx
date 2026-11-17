import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomBar, Button } from '../components/ui';
import { DIRECT_MODELS, getDirectSettings, saveDirectSettings } from '../lib/directSettings';
import { startAnalysis, useDraft } from '../lib/job';

/** 테스트 APK 전용 설정 화면. 토스 출시용 빌드에는 없다. */
export function Settings() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const draft = useDraft();
  const initial = getDirectSettings();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const [shown, setShown] = useState(false);
  const resume = params.get('resume') === '1' && draft.photos.length > 0;
  const looksValid = apiKey.trim().startsWith('sk-ant-');

  const save = () => {
    saveDirectSettings({ apiKey, model });
    if (resume && apiKey.trim()) {
      void startAnalysis();
      navigate('/result/new', { replace: true });
    } else navigate(-1);
  };

  return (
    <main className="screen with-bottom-bar">
      <header className="hero compact">
        <h1 className="title-1">테스트 설정</h1>
        <p className="body muted">테스트 버전에서는 본인 Claude API 키로 분석해요. 토스 출시 버전에는 이 화면이 없어요.</p>
      </header>

      <section className="section">
        <label className="title-2" htmlFor="api-key">
          Claude API 키
        </label>
        <div className="key-field">
          <input
            id="api-key"
            className="textarea input"
            type={shown ? 'text' : 'password'}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="sk-ant-로 시작하는 키"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <Button variant="text" onClick={() => setShown((value) => !value)}>
            {shown ? '가리기' : '보기'}
          </Button>
        </div>
        {apiKey && !looksValid && <p className="caption notice-inline">키는 보통 sk-ant-로 시작해요. 다시 확인해 주세요.</p>}
        <p className="caption muted">
          키는 이 휴대폰에만 저장되고, 분석할 때 Anthropic으로만 전송돼요. 분석 비용은 이 키의 계정에 청구돼요.
        </p>
      </section>

      <section className="section">
        <h2 className="title-2">모델</h2>
        <ul className="model-list" role="radiogroup" aria-label="분석 모델">
          {DIRECT_MODELS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="radio"
                aria-checked={model === option.id}
                className={`model ${model === option.id ? 'selected' : ''}`}
                onClick={() => setModel(option.id)}
              >
                <span className="body-strong">{option.label}</span>
                <span className="caption muted">{option.note}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="fine-print">비용은 캡처 5장 기준 대략적인 추정이에요.</p>
      </section>

      {initial.apiKey && (
        <div>
          <Button
            variant="text"
            className="subtle"
            onClick={() => {
              setApiKey('');
              saveDirectSettings({ apiKey: '', model });
            }}
          >
            저장된 키 지우기
          </Button>
        </div>
      )}

      <BottomBar>
        <Button onClick={save}>{resume && apiKey.trim() ? '저장하고 분석하기' : '저장하기'}</Button>
      </BottomBar>
    </main>
  );
}
