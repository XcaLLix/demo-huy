import { API_BASE } from '../api';

export const aiService = {
  /**
   * Send a query to the AI Tutor with the context of the current lesson
   * @param {string} content - User query
   * @param {object} lesson - The current lesson context
   * @returns {Promise<string>} Response from AI Tutor
   */
  async sendAiMessage(content, lesson = null, history = [], onChunk = null, imageUrl = null) {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const userApiKey = localStorage.getItem('user_openrouter_api_key');
    const userModel = localStorage.getItem('user_openrouter_model');
    if (userApiKey) {
      headers['X-User-OpenRouter-Key'] = userApiKey;
    }
    if (userModel) {
      headers['X-User-OpenRouter-Model'] = userModel;
    }

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          message: content,
          lessonId: lesson?.id || null,
          history: history,
          imageUrl: imageUrl
        })
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          const fullText = data.data?.text || data.text || data.message || '';
          if (onChunk) onChunk(fullText);
          return fullText;
        } else {
          // It might be a stream (SSE). Let's decode it
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let resultText = '';
          let buffer = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep partial line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    resultText += parsed.text;
                    if (onChunk) {
                      onChunk(resultText);
                    }
                  }
                } catch (e) { /* ignore chunk boundary error */ }
              }
            }
          }
          // Process final buffer if any
          if (buffer.startsWith('data: ')) {
            const dataStr = buffer.slice(6).trim();
            if (dataStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  resultText += parsed.text;
                  if (onChunk) {
                    onChunk(resultText);
                  }
                }
              } catch (e) { /* ignore */ }
            }
          }
          if (resultText) return resultText;
        }
      }
    } catch (err) {
      console.warn('[aiService] Failed to call backend AI API, using local mock response.', err);
    }

    // Fallback Mock AI Tutor response in Vietnamese tailored to the lesson context!
    return new Promise((resolve) => {
      setTimeout(() => {
        const lessonTitle = lesson ? lesson.title : "Chuyên đề ôn thi THPT Quốc Gia";
        const responses = [
          `Chào em! Về câu hỏi của em trong bài học "${lessonTitle}":\n\nĐây là một dạng toán rất trọng tâm trong đề thi THPT Quốc Gia. Để giải quyết câu hỏi này, em cần áp dụng công thức cơ bản và làm theo các bước sau:\n1. Xác định điều kiện xác định.\n2. Tính đạo hàm y' (hoặc công thức liên quan).\n3. Lập bảng xét dấu hoặc giải phương trình.\n\nNếu em gặp khó khăn cụ thể ở bước nào, hãy gửi đề bài chi tiết hoặc công thức cụ thể để tôi hướng dẫn chi tiết nhé!`,
          `Chào em! Đối với phần học "${lessonTitle}" này:\n\nEm cần nhớ kỹ phần lưu ý quan trọng về các trường hợp đặc biệt và cách bấm máy Casio nhanh để tiết kiệm thời gian làm bài trắc nghiệm. \nVí dụ: Đối với dạng toán này, ta có thể quét Table (Mode 8) để nhanh chóng khoanh vùng kết quả chính xác.\n\nEm có muốn tôi lấy một ví dụ cụ thể để giải thích rõ hơn không?`,
          `EduBot AI xin chào em! Về câu hỏi liên quan đến "${lessonTitle}":\n\nĐây là câu hỏi rất hay. Phương pháp giải tối ưu nhất cho dạng này là chia nhỏ bài toán và thiết lập các biến số. Đối với kỳ thi THPT Quốc Gia, cấu trúc câu này chiếm khoảng 0.4 điểm.\n\nEm hãy thử làm và chụp ảnh kết quả gửi lên, hoặc nhắn lại đề bài để tôi cùng giải với em nhé!`
        ];
        
        const randomIndex = Math.floor(Math.random() * responses.length);
        resolve(responses[randomIndex]);
      }, 1200);
    });
  }
};
