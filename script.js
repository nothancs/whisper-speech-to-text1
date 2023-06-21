const AUDIO_TYPE = 'audio';
const MODEL = 'whisper-1';
const TRANSCRIPTIONS_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

class WhisperSTT {
  constructor(apiKey) {
    this.recorder = null;
    this.stream = null;
    this.isRecording = false;
    this.isStopped = true;
    this.isPaused = false;
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  pauseRecording = async () => {
    if (!this.recorder) {
      throw new Error('Cannot pause recording: no recorder');
    }
    await this.recorder.pauseRecording();
    this.isPaused = true;
    this.isRecording = false;
  };

  resumeRecording = async () => {
    if (!this.recorder) {
      throw new Error('Cannot resume recording: no recorder');
    }
    await this.recorder.resumeRecording();
    this.isPaused = false;
    this.isRecording = true;
  };

  startRecording = async () => {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = new RecordRTCPromisesHandler(this.stream, {
        type: AUDIO_TYPE,
      });
      await this.recorder.startRecording();
      this.isRecording = true;
      this.isStopped = false;
    } catch (error) {
      this.isRecording = false;
      this.isStopped = true;
      throw new Error(`Error starting recording: ${error.message}`);
    }
  };

  stopRecording = async (onFinish) => {
    if (!this.isRecording || !this.recorder) {
      throw new Error('Cannot stop recording: no recorder');
    }
    try {
      await this.recorder.stopRecording();
      const blob = await this.recorder.getBlob();
      await this.transcribe(blob, onFinish);
      this.stream?.getTracks().forEach((track) => {
        track.stop();
      });
      this.recorder = null;
      this.stream = null;
      this.isRecording = false;
      this.isStopped = true;
      this.isPaused = false;
    } catch (error) {
      this.isRecording = false;
      this.isStopped = true;
      throw new Error(`Error stopping recording: ${error.message}`);
    }
  };

  transcribe = async (audioBlob, onFinish) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', MODEL);

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'multipart/form-data',
    };
    try {
      const response = await axios.post(TRANSCRIPTIONS_API_URL, formData, {
        headers,
      });
      onFinish(response.data?.text || '');
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };
}

// Usage example
const apiKey = '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'; // Replace with your actual API key
const whisperSTT = new WhisperSTT(apiKey);

const startButton = document.getElementById('mute-button');
const stopButton = document.getElementById('pause-button');
const transcriptionTextarea = document.getElementById('phraseDiv');

startButton.addEventListener('click', () => {
  if (whisperSTT.isRecording) {
    whisperSTT.stopRecording((text) => {
      transcriptionTextarea.value = text;
    });
    // Change microphone button class to "bi-mic-mute" immediately when recording is stopped
    startButton.classList.remove('bi-mic');
    startButton.classList.add('bi-mic-mute');
  } else {
    whisperSTT.startRecording().then(() => {
      transcriptionTextarea.value = '';

      // Change microphone button class to "bi-mic-mute" immediately when recording starts
      startButton.classList.remove('bi-mic-mute');
      startButton.classList.add('bi-mic');
    });
  }
});
