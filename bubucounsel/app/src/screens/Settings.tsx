import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { DIRECT_MODE, DIRECT_MODELS, getDirectSettings, saveDirectSettings } from '../lib/directSettings';
import { dismissError, useRun } from '../lib/run';
import { clearThreads, useThreads } from '../lib/threads';

export function Settings() {
  const { threads } = useThreads();
  const [confirming, setConfirming] = useState(false);

  return (
    <main className="screen settings">
      <h1 className="title-1 page-title">설정</h1>

      <section className="group" aria-labelledby="g-history">
        <h2 id="g-history" className="group-title">
          대화 기록
        </h2>
        <div className="group-card">
          <div className="row">
            <span className="row-label">저장된 대화</span>
            <span className="row-value">{threads.length}개</span>
          </div>
          <p className="row-note">대화는 이 기기에만 저장돼요. 토스 앱을 지우면 함께 사라져요.</p>
          <div className="row">
            {confirming ? (
              <div className="confirm-row">
                <span className="caption">대화를 모두 지울까요? 되돌릴 수 없어요.</span>
                <div className="confirm-actions">
                  <Button variant="secondary" onClick={() => setConfirming(false)}>
                    그대로 두기
                  </Button>
                  <Button
                    variant="secondary"
                    className="danger"
                    onClick={() => {
                      clearThreads();
                      setConfirming(false);
                    }}
                  >
                    모두 지우기
                  </Button>
                </div>
              </div>
            ) : (
              <button type="button" className="row-button danger" onClick={() => setConfirming(true)} disabled={threads.length === 0}>
                대화 모두 지우기
              </button>
            )}
          </div>
        </div>
      </section>

      {DIRECT_MODE && <TestSettings />}

      <section className="group" aria-labelledby="g-about">
        <h2 id="g-about" className="group-title">
          투닥이에 대해
        </h2>
        <ul className="group-card about">
          <li>투닥이는 생성형 AI예요. 답과 분석 결과는 AI가 만들어요.</li>
          <li>보낸 캡처와 적어 준 상황만으로 판단해요. 전문 상담을 대신하지 않아요.</li>
          <li>캡처는 분석에만 쓰고 저장하지 않아요.</li>
        </ul>
      </section>

      <section className="group" aria-labelledby="g-help">
        <h2 id="g-help" className="group-title">
          도움이 필요할 때
        </h2>
        <ul className="group-card help">
          <li>
            <strong>여성긴급전화 1366</strong>
            <span className="caption muted">가정폭력·데이트폭력 상담, 24시간</span>
          </li>
          <li>
            <strong>자살예방 상담전화 109</strong>
            <span className="caption muted">힘든 마음을 털어놓을 수 있어요, 24시간</span>
          </li>
          <li>
            <strong>긴급 신고 112</strong>
            <span className="caption muted">지금 위험하다면 바로 신고해 주세요</span>
          </li>
        </ul>
      </section>

      <p className="fine-print center">
        투닥 {__APP_VERSION__}
        {DIRECT_MODE ? ' · 테스트 버전' : ''}
      </p>
    </main>
  );
}

/** 테스트 APK에서만 보이는 설정: 본인 Claude API 키와 모델 */
function TestSettings() {
  const navigate = useNavigate();
  const run = useRun();
  const initial = getDirectSettings();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const [shown, setShown] = useState(false);
  const [saved, setSaved] = useState(false);
  const looksValid = apiKey.trim() === '' || apiKey.trim().startsWith('sk-ant-');
  const changed = apiKey.trim() !== initial.apiKey || model !== initial.model;

  const save = () => {
    saveDirectSettings({ apiKey, model });
    setSaved(true);
    // 키가 없어 멈췄던 응답이 있으면 대화로 돌아가 바로 다시 시도한다.
    if (run.status === 'error' && (run.code === 'no_key' || run.code === 'bad_key') && apiKey.trim()) {
      const retry = run.retry;
      dismissError();
      retry();
      navigate(-1);
    }
  };

  return (
    <section className="group" aria-labelledby="g-test">
      <h2 id="g-test" className="group-title">
        테스트 설정 <span className="test-tag">테스트 버전에만 있어요</span>
      </h2>
      <div className="group-card test">
        <label className="row-label" htmlFor="api-key">
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
            onChange={(event) => {
              setApiKey(event.target.value);
              setSaved(false);
            }}
          />
          <Button variant="text" onClick={() => setShown((value) => !value)}>
            {shown ? '가리기' : '보기'}
          </Button>
        </div>
        {!looksValid && <p className="caption notice-inline">키는 보통 sk-ant-로 시작해요. 다시 확인해 주세요.</p>}
        <p className="row-note">키는 이 휴대폰에만 저장되고, 답할 때 Anthropic으로만 전송돼요. 비용은 이 키의 계정에 청구돼요.</p>

        <span className="row-label">모델</span>
        <ul className="model-list" role="radiogroup" aria-label="답하는 모델">
          {DIRECT_MODELS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="radio"
                aria-checked={model === option.id}
                className={`model ${model === option.id ? 'selected' : ''}`}
                onClick={() => {
                  setModel(option.id);
                  setSaved(false);
                }}
              >
                <span className="body-strong">{option.label}</span>
                <span className="caption muted">{option.note}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="fine-print">비용은 캡처 5장 분석 기준 대략적인 추정이에요.</p>

        <div className="test-actions">
          <Button onClick={save} disabled={!changed && !saved}>
            {saved && !changed ? '저장했어요' : '저장하기'}
          </Button>
          {initial.apiKey && (
            <Button
              variant="text"
              className="subtle"
              onClick={() => {
                setApiKey('');
                saveDirectSettings({ apiKey: '', model });
                setSaved(true);
              }}
            >
              저장된 키 지우기
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
