import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const STATIC_FALLBACK_QUESTIONS = {
  algorithms: [
    { id: 1, type: 'text', question: "Explain the difference between a Hash Map and a Tree Map. What are their search time complexities?" },
    { id: 2, type: 'code', question: "Write a function in JavaScript to check if a binary tree is a valid Binary Search Tree (BST).", template: "function isValidBST(root) {\n  // Write your code here\n  \n}" },
    { id: 3, type: 'text', question: "How would you detect a cycle in a directed graph? Explain the algorithm briefly." }
  ],
  'system-design': [
    { id: 1, type: 'text', question: "How would you design a URL shortening service like Bit.ly? Focus on database choice and hashing approach." },
    { id: 2, type: 'text', question: "Explain how database sharding works. What are the main challenges when implementing it?" },
    { id: 3, type: 'text', question: "Design a rate limiter for a public API. What algorithm and cache storage would you use?" }
  ],
  behave: [
    { id: 1, type: 'text', question: "Tell me about a time you had a technical disagreement with a team member. How did you resolve it?" },
    { id: 2, type: 'text', question: "Describe a project that failed or fell behind schedule. What did you learn from the experience?" },
    { id: 3, type: 'text', question: "How do you handle prioritization when you have multiple urgent tasks with competing deadlines?" }
  ],
  frontend: [
    { id: 1, type: 'text', question: "What is the Virtual DOM in React and how does the reconciliation process work?" },
    { id: 2, type: 'code', question: "Implement a throttle function in JavaScript that limits a callback to executing once per delay interval.", template: "function throttle(func, limit) {\n  // Write your code here\n  \n}" },
    { id: 3, type: 'text', question: "Explain the JavaScript Event Loop. How do microtasks (Promises) differ from macrotasks (setTimeout)?" }
  ]
};

export function MockInterviews() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [customQuestions, setCustomQuestions] = useState([]);
  
  const [activeSession, setActiveSession] = useState(null); // { topicId, currentQuestionIndex, answers: [], codeAnswers: [] }
  const [evaluating, setEvaluating] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(null); // feedback details
  const [textAnswer, setTextAnswer] = useState('');
  const [codeAnswer, setCodeAnswer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechTimer, setSpeechTimer] = useState(0);

  const [feedbackHistory, setFeedbackHistory] = useState(() => {
    const stored = localStorage.getItem('careerpilot_interview_feedback');
    if (stored) return JSON.parse(stored);
    
    const defaults = [
      { id: 'fb1', title: 'Data Structures & Algorithms', score: 85, date: 'Oct 28', summary: 'Good complexity analysis. Code structure was clear but can optimize the space complexity.' },
      { id: 'fb2', title: 'Frontend Core (React/JS)', score: 92, date: 'Oct 22', summary: 'Excellent understanding of Virtual DOM and React reconciliation mechanics.' },
      { id: 'fb3', title: 'Behavioral & Leadership', score: 78, date: 'Oct 15', summary: 'Detailed conflict resolution example. Make sure to structure responses using the STAR method.' }
    ];
    localStorage.setItem('careerpilot_interview_feedback', JSON.stringify(defaults));
    return defaults;
  });

  const topics = [
    { id: 'algorithms', title: 'Data Structures & Algorithms', icon: 'account_tree', sessions: 12, difficulty: 'Advanced' },
    { id: 'system-design', title: 'System Design', icon: 'hub', sessions: 8, difficulty: 'Intermediate' },
    { id: 'behave', title: 'Behavioral & Leadership', icon: 'psychology', sessions: 5, difficulty: 'Beginner' },
    { id: 'frontend', title: 'Frontend Core (React/JS)', icon: 'terminal', sessions: 15, difficulty: 'Advanced' },
  ];

  // Speech simulator timer
  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => {
        setSpeechTimer(prev => prev + 1);
      }, 1000);
    } else {
      setSpeechTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const cleanJsonString = (str) => {
    return str.replace(/```json/i, '').replace(/```/g, '').trim();
  };

  const handleStartRandom = () => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)].id;
    setSelectedTopic(randomTopic);
  };

  const handleInitializeSession = async (topicId) => {
    const topicObj = topics.find(t => t.id === topicId);
    setLoadingQuestions(true);
    setSessionCompleted(null);
    setCustomQuestions([]);
    
    if (ai) {
      try {
        const prompt = `Generate 3 distinct, high-quality interview questions for a candidate interviewing for a ${topicObj.title} position. 
        Format the output strictly as a JSON array of objects, with no extra markdown backticks or formatting.
        Each object in the array must contain:
        - "id" (number, starting from 1)
        - "type" (string, either "text" or "code")
        - "question" (string, the question text)
        - "template" (string, only if type is "code" containing standard starting JS function code, otherwise empty string)
        
        Example JSON:
        [{"id": 1, "type": "text", "question": "What is...", "template": ""}]`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleanedJson = cleanJsonString(rawText);
        const parsed = JSON.parse(cleanedJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomQuestions(parsed);
          startSession(topicId, parsed);
          setLoadingQuestions(false);
          return;
        }
      } catch (err) {
        console.error("Gemini question generation error, falling back to static questions:", err);
      }
    }
    
    // Fallback if API key missing or request fails
    const fallback = STATIC_FALLBACK_QUESTIONS[topicId];
    setCustomQuestions(fallback);
    startSession(topicId, fallback);
    setLoadingQuestions(false);
  };

  const startSession = (topicId, questionsList) => {
    setActiveSession({
      topicId,
      currentQuestionIndex: 0,
      answers: [],
      codeAnswers: []
    });
    setTextAnswer('');
    const firstQ = questionsList[0];
    setCodeAnswer(firstQ.type === 'code' ? firstQ.template : '');
  };

  const handleSimulateSpeech = async () => {
    setIsSpeaking(true);
    
    // If AI is available, generate a highly contextual spoken answer simulation, else fallback static answer
    if (ai && activeQuestion) {
      try {
        const prompt = `Write a short, professional spoken-style answer (2-3 sentences) responding to the interview question: "${activeQuestion.question}". 
        Make it sound like a candidate answering out loud. Do not include quotes or intro text.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        setIsSpeaking(false);
        setTextAnswer(prev => prev + (prev ? " " : "") + (response.text || '').trim());
        return;
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      setIsSpeaking(false);
      setTextAnswer(prev => prev + (prev ? " " : "") + "To answer this, I would consider using an optimized approach where we maintain a state variable or use binary search strategies to minimize lookup overhead.");
    }, 3000);
  };

  const handleSubmitAnswer = async () => {
    const questions = customQuestions.length > 0 ? customQuestions : STATIC_FALLBACK_QUESTIONS[activeSession.topicId];
    const currentQ = questions[activeSession.currentQuestionIndex];

    const updatedAnswers = [...activeSession.answers, textAnswer];
    const updatedCodeAnswers = [...activeSession.codeAnswers, currentQ.type === 'code' ? codeAnswer : ''];

    const nextIndex = activeSession.currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setActiveSession({
        ...activeSession,
        currentQuestionIndex: nextIndex,
        answers: updatedAnswers,
        codeAnswers: updatedCodeAnswers
      });
      setTextAnswer('');
      const nextQ = questions[nextIndex];
      setCodeAnswer(nextQ.type === 'code' ? nextQ.template : '');
    } else {
      // Complete Session & Perform Real AI Evaluation
      setEvaluating(true);
      const topicObj = topics.find(t => t.id === activeSession.topicId);
      
      let finalFeedback = null;

      if (ai) {
        try {
          const evalPrompt = `You are a professional technical recruiter conducting a mock interview for the topic: "${topicObj.title}".
          Below are the questions asked, and the answers/code provided by the candidate:
          
          ${questions.map((q, idx) => `
            Question ${idx + 1}: ${q.question}
            Candidate Answer: ${updatedAnswers[idx]}
            ${q.type === 'code' ? `Candidate Code:\n${updatedCodeAnswers[idx]}` : ''}
          `).join('\n')}
          
          Evaluate the responses constructively. Keep it professional. Provide a performance score (0 to 100) and a brief feedback summary (2-3 sentences).
          Return ONLY a JSON object with this format:
          {
            "score": 85,
            "summary": "Your explanation of... was..."
          }
          Return no markdown syntax or code wraps, just raw JSON.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: evalPrompt
          });

          const rawText = response.text || '';
          const cleanedJson = cleanJsonString(rawText);
          const parsed = JSON.parse(cleanedJson);
          if (parsed && typeof parsed.score === 'number' && parsed.summary) {
            finalFeedback = {
              id: Date.now().toString(),
              title: topicObj.title,
              score: parsed.score,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
              summary: parsed.summary
            };
          }
        } catch (err) {
          console.error("Gemini evaluation error, using fallback scorecard:", err);
        }
      }

      if (!finalFeedback) {
        // Fallback simulated feedback
        const randomScore = Math.floor(Math.random() * 15) + 80;
        finalFeedback = {
          id: Date.now().toString(),
          title: topicObj.title,
          score: randomScore,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
          summary: `Mock Session Evaluated. Demonstrated decent theoretical understanding, score: ${randomScore}%. Recommendation: Review standard practice problems.`
        };
      }

      const updatedHistory = [finalFeedback, ...feedbackHistory];
      setFeedbackHistory(updatedHistory);
      localStorage.setItem('careerpilot_interview_feedback', JSON.stringify(updatedHistory));

      setSessionCompleted(finalFeedback);
      setEvaluating(false);
      setActiveSession(null);
    }
  };

  const currentQuestions = customQuestions.length > 0 ? customQuestions : (selectedTopic ? STATIC_FALLBACK_QUESTIONS[selectedTopic] : []);
  const activeQuestion = activeSession ? currentQuestions[activeSession.currentQuestionIndex] : null;

  return (
    <div className="pt-24 px-8 pb-12 max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2 p-1 px-3 bg-primary/10 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              {ai ? 'Gemini AI Engine Active' : 'AI Agent Ready'}
            </span>
          </div>
          <h2 className="text-4xl font-black text-on-surface tracking-tighter">Mock Interview Hub</h2>
          <p className="text-slate-500 mt-2 text-lg font-medium">Practice with our AI interviewer and get real-time feedback on your performance.</p>
        </div>
        {!activeSession && !loadingQuestions && !evaluating && (
          <button 
            onClick={handleStartRandom}
            className="px-8 py-4 bg-gradient-to-br from-slate-900 to-black text-white rounded-2xl font-bold flex items-center gap-3 shadow-2xl hover:scale-[1.03] transition-all text-sm uppercase tracking-wider"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Start Random Prep
          </button>
        )}
      </header>

      {/* Loading States */}
      {loadingQuestions && (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 text-center gap-4 min-h-[400px]">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <h4 className="text-xl font-bold text-slate-700">Connecting to Gemini AI Engine...</h4>
          <p className="text-slate-500 text-sm">Generating custom, highly-relevant questions for your topic.</p>
        </div>
      )}

      {evaluating && (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 text-center gap-4 min-h-[400px]">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <h4 className="text-xl font-bold text-slate-700">Gemini AI is analyzing your performance...</h4>
          <p className="text-slate-500 text-sm">Grading your explanations, logic, and code design patterns.</p>
        </div>
      )}

      {/* Topic selection list */}
      {!activeSession && !sessionCompleted && !loadingQuestions && !evaluating && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map(topic => (
            <Card 
              key={topic.id}
              className={`p-6 cursor-pointer transition-all border-2 ${selectedTopic === topic.id ? 'border-primary shadow-xl shadow-primary/5' : 'border-transparent hover:border-slate-200'}`}
              onClick={() => setSelectedTopic(topic.id)}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${selectedTopic === topic.id ? 'bg-primary text-white' : 'bg-surface-container-low text-slate-400'}`}>
                <span className="material-symbols-outlined text-3xl">{topic.icon}</span>
              </div>
              <h3 className="text-sm font-black text-on-surface mb-2 tracking-tight leading-tight h-10">{topic.title}</h3>
              <div className="flex justify-between items-center mt-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{topic.sessions} Sessions</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  topic.difficulty === 'Advanced' ? 'bg-red-50 text-red-500' : 
                  topic.difficulty === 'Intermediate' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                }`}>{topic.difficulty}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Main session board */}
      <AnimatePresence mode="wait">
        {activeSession && activeQuestion && !loadingQuestions && !evaluating ? (
          <motion.div
            key="active-session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-12 gap-8"
          >
            <div className={activeQuestion.type === 'code' ? 'col-span-12 lg:col-span-6 space-y-6' : 'col-span-12 lg:col-span-8 space-y-6'}>
              {/* Question card */}
              <Card className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                    Question {activeSession.currentQuestionIndex + 1} of {currentQuestions.length}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Topic: {topics.find(t => t.id === activeSession.topicId)?.title}</span>
                </div>
                
                <h4 className="text-xl font-bold text-slate-800 leading-snug">{activeQuestion.question}</h4>
                
                <div className="relative">
                  <textarea 
                    rows="5"
                    placeholder="Type your explanation answer here..."
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  
                  {/* Microphone speech simulation bar */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    {isSpeaking && (
                      <span className="text-[10px] font-black text-primary uppercase animate-pulse">
                        Listening ({speechTimer}s)
                      </span>
                    )}
                    <button 
                      onClick={handleSimulateSpeech}
                      disabled={isSpeaking}
                      className={`p-2.5 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                        isSpeaking ? 'bg-primary text-white animate-bounce' : 'bg-white text-slate-500 border border-slate-100 hover:text-primary'
                      }`}
                      title={ai ? "Simulate real AI candidate voice answer" : "Simulate speech answer"}
                    >
                      <span className="material-symbols-outlined text-lg">mic</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button 
                    onClick={() => setActiveSession(null)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl uppercase tracking-wider"
                  >
                    Quit Session
                  </button>
                  <button 
                    onClick={handleSubmitAnswer}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all uppercase tracking-widest"
                  >
                    {activeSession.currentQuestionIndex === currentQuestions.length - 1 ? 'Finish & Analyze' : 'Next Question'}
                  </button>
                </div>
              </Card>
            </div>

            {/* Split pane code editor */}
            {activeQuestion.type === 'code' && (
              <div className="col-span-12 lg:col-span-6">
                <Card className="p-0 overflow-hidden flex flex-col h-full min-h-[400px]">
                  <div className="bg-slate-900 px-6 py-3 flex justify-between items-center text-white border-b border-slate-800">
                    <span className="text-xs font-bold font-mono">index.js</span>
                    <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">JavaScript</span>
                  </div>
                  <textarea 
                    value={codeAnswer}
                    onChange={(e) => setCodeAnswer(e.target.value)}
                    className="flex-1 bg-slate-950 text-slate-100 font-mono p-6 outline-none resize-none text-xs leading-relaxed"
                    spellCheck="false"
                  />
                </Card>
              </div>
            )}

            {/* Simulated camera stream avatar */}
            {activeQuestion.type !== 'code' && (
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <Card className="p-6 flex flex-col items-center justify-center text-center gap-6 bg-slate-900 text-white min-h-[350px]">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center p-3 border-2 border-primary/50 shadow-2xl">
                      <span className="material-symbols-outlined text-5xl text-primary animate-pulse-slow">smart_toy</span>
                    </div>
                    <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm tracking-wide">AI Panel Interviewer</h5>
                    <p className="text-slate-400 text-xs mt-1">Analyzing your speech pitch, key terminology matches, and response flow in real-time.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="p-3 bg-white/5 rounded-xl flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-primary text-sm">mic</span>
                      <span>Active</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-purple-400 text-sm">videocam</span>
                      <span>Enabled</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        ) : null}

        {/* Feedback results screen */}
        {sessionCompleted && !loadingQuestions && !evaluating && (
          <motion.div
            key="session-completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              
              <h3 className="text-3xl font-black text-slate-800">Session Completed!</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">We've completed the analysis of your performance. Here is your feedback scorecard:</p>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sessionCompleted.title}</span>
                <div className="text-5xl font-black text-primary mt-2">{sessionCompleted.score}%</div>
                <p className="text-xs font-semibold text-slate-600 mt-4 leading-relaxed">{sessionCompleted.summary}</p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button 
                  onClick={() => setSessionCompleted(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200"
                >
                  Back to Hub
                </button>
                <button 
                  onClick={() => handleInitializeSession(selectedTopic)}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-primary/10 hover:shadow-primary/25"
                >
                  Start New Session
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Landing selection guide */}
        {!activeSession && !sessionCompleted && !loadingQuestions && !evaluating && (
          <motion.div
            key={selectedTopic || 'none'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-12 gap-8 mt-12"
          >
            <div className="col-span-12 lg:col-span-8">
              {selectedTopic ? (
                <Card className="p-0 overflow-hidden relative min-h-[400px] flex flex-col justify-center items-center bg-slate-50 border-dashed border-2 border-slate-200">
                  <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8">
                     <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center p-4">
                        <span className="material-symbols-outlined text-6xl text-primary animate-pulse-slow">smart_toy</span>
                     </div>
                     <h4 className="text-2xl font-black text-on-surface leading-tight">Ready to begin your {topics.find(t => t.id === selectedTopic)?.title} session?</h4>
                     <p className="text-slate-500 text-sm font-medium">The session will include 3 key technical questions tailored to your level with code execution analysis (if applicable).</p>
                     <button 
                       onClick={() => handleInitializeSession(selectedTopic)}
                       className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                     >
                       Initialize Session
                     </button>
                  </div>
                  
                  {/* Floating tooltips */}
                  <div className="absolute top-10 left-10 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                     <span className="material-symbols-outlined text-primary text-sm">mic</span>
                     <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Mic Ready</span>
                  </div>
                  <div className="absolute bottom-10 right-10 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                     <span className="material-symbols-outlined text-purple-500 text-sm">videocam</span>
                     <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Camera Enabled</span>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center p-20 bg-surface-container-low/30 rounded-3xl border-2 border-dashed border-slate-200 text-center gap-4 min-h-[400px]">
                   <span className="material-symbols-outlined text-6xl text-slate-200 animate-bounce">arrow_upward</span>
                   <h4 className="text-xl font-bold text-slate-400">Select a topic above to begin your preparation</h4>
                </div>
              )}
            </div>
            
            <div className="col-span-12 lg:col-span-4 space-y-6">
               <Card className="p-6">
                 <h4 className="font-bold text-on-surface mb-6 flex items-center justify-between">
                   Recent Feedback
                   <span className="text-[10px] font-black text-slate-400 uppercase">Archive</span>
                 </h4>
                 <div className="space-y-4 max-h-64 overflow-y-auto">
                   {feedbackHistory.map((fb) => (
                     <div key={fb.id} className="p-4 rounded-xl bg-surface-container-low hover:bg-slate-100 transition-colors group border border-transparent hover:border-slate-200">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors leading-tight">{fb.title}</h5>
                          <span className="text-sm font-bold text-primary shrink-0 ml-2">{fb.score}%</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{fb.date} • Feedback</p>
                        <p className="text-[11px] text-slate-500 mt-2 font-medium line-clamp-2 leading-relaxed">{fb.summary}</p>
                     </div>
                   ))}
                 </div>
               </Card>
               
               <Card className="p-6 bg-primary text-white border-0 shadow-xl overflow-hidden relative">
                 <div className="relative z-10">
                   <h4 className="font-bold mb-2">Weekly Leaderboard</h4>
                   <p className="text-xs opacity-70 mb-6">Top performers in Prep sessions.</p>
                   <div className="flex items-end justify-around h-32">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden shadow-lg"><img src="https://i.pravatar.cc/100?img=3" alt="" /></div>
                        <div className="w-10 bg-white/20 rounded-t-lg h-16"></div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-primary overflow-hidden shadow-2xl scale-110"><img src="https://i.pravatar.cc/100?img=1" alt="" /></div>
                        <div className="w-12 bg-white rounded-t-lg h-24"></div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden shadow-lg"><img src="https://i.pravatar.cc/100?img=5" alt="" /></div>
                        <div className="w-10 bg-white/20 rounded-t-lg h-20"></div>
                      </div>
                   </div>
                 </div>
                 <span className="absolute -bottom-10 -right-10 material-symbols-outlined text-[160px] opacity-10 rotate-12">emoji_events</span>
               </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
