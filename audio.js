// Web Audio API によるノイズ音声生成
// 外部音声ファイル不要で「ボイスメモ」の質感を再現する
window.LD = window.LD || {};

window.LD.Audio = (function () {
  let audioCtx = null;
  let currentSource = null;
  let currentGain = null;
  let isPlaying = false;

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // ノイズバッファ生成（ホワイト / ブラウン / ピンク）
  function makeNoiseBuffer(type, durationSec) {
    const ctx = getCtx();
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * w) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    return buffer;
  }

  // ノイズに「声らしき」変調を重ねる
  function addVoiceModulation(buffer, gain) {
    const ctx = getCtx();
    const data = buffer.getChannelData(0);
    const sr = ctx.sampleRate;
    const freqs = [180, 280, 420, 650, 920];

    for (let i = 0; i < data.length; i++) {
      let mod = 0;
      freqs.forEach(f => { mod += Math.sin(2 * Math.PI * f * i / sr) * 0.18; });
      // ゆっくり揺れるエンベロープ（喋っている感じ）
      const env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.5 * i / sr);
      data[i] = data[i] * (1 - gain) + data[i] * mod * env * gain;
    }
  }

  function stopCurrent() {
    if (currentSource) {
      try { currentSource.stop(); } catch (_) {}
      currentSource = null;
    }
    isPlaying = false;
  }

  return {
    play(memoConfig, onProgress, onEnd) {
      stopCurrent();
      const ctx = getCtx();

      // 実際の再生時間
      const playDuration = memoConfig.duration;

      const noiseBuffer = makeNoiseBuffer(memoConfig.noiseType || 'white', playDuration);
      if (memoConfig.hasVoice && memoConfig.voiceGain > 0) {
        addVoiceModulation(noiseBuffer, memoConfig.voiceGain);
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;

      // 帯域フィルタ（電話越し感）
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.8;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.25;

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start();
      currentSource = source;
      currentGain = gainNode;
      isPlaying = true;

      // プログレス通知
      const startTime = Date.now();
      const tick = () => {
        if (!isPlaying) return;
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(1, elapsed / playDuration);
        onProgress && onProgress(pct);
        if (pct < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      source.onended = () => {
        isPlaying = false;
        onProgress && onProgress(1);
        onEnd && onEnd();
        currentSource = null;
      };

      window.LD.Logger && window.LD.Logger.logAudioReplay(memoConfig.id);
    },

    stop: stopCurrent,
    isPlaying() { return isPlaying; }
  };
})();
