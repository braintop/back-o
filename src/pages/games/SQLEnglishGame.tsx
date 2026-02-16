import { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Box, Button, Paper, LinearProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Radio, RadioGroup, FormControlLabel, FormControl, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import type { SQLWord } from '../../data/sqlWords';
import { sqlWords, getWrongOptions } from '../../data/sqlWords';
import { saveGameScore } from '../../firebase/gamesApi';

const GAME_DURATION = 240; // 4 minutes in seconds
const GAME_TYPE = 'sql-english-trainer';

interface Question {
  word: SQLWord;
  options: string[];
  correctAnswer: string;
}

export default function SQLEnglishGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [usedWordIds, setUsedWordIds] = useState<Set<number>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Generate a new question
  const generateQuestion = useCallback(() => {
    const availableWords = sqlWords.filter(w => !usedWordIds.has(w.id));
    
    if (availableWords.length === 0) {
      // Reset if all words have been used
      setUsedWordIds(new Set());
      return generateQuestion();
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    const wrongOptions = getWrongOptions(randomWord, 3);
    const allOptions = [...wrongOptions, randomWord.simpleHebrew].sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      word: randomWord,
      options: allOptions,
      correctAnswer: randomWord.simpleHebrew
    });
    setUsedWordIds(prev => new Set([...prev, randomWord.id]));
    setSelectedAnswer('');
    setFeedback(null);
  }, [usedWordIds]);

  // Start game
  const startGame = () => {
    if (!username.trim()) {
      setUsernameError('אנא הזן שם משתמש');
      return;
    }
    setGameState('playing');
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setUsedWordIds(new Set());
    generateQuestion();
  };

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Save score when game finishes
  useEffect(() => {
    if (gameState !== 'finished') return;
    
    const saveScore = async () => {
      try {
        await saveGameScore({
          username: username.trim(),
          score,
          correctAnswers,
          totalQuestions,
          gameType: GAME_TYPE,
          duration: GAME_DURATION - timeLeft
        });
      } catch (error) {
        console.error('Error saving game score:', error);
      }
    };
    
    saveScore();
  }, [gameState, username, score, correctAnswers, totalQuestions, timeLeft]);

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setTotalQuestions(prev => prev + 1);

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    // Move to next question after a short delay
    setTimeout(() => {
      generateQuestion();
    }, 1500);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (timeLeft / GAME_DURATION) * 100;

  // Text-to-Speech function
  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // English
      utterance.rate = 0.8; // Slightly slower for clarity
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('הדפדפן שלך לא תומך בקריאה קולית');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, direction: 'rtl' }}>
      {/* Setup Dialog */}
      <Dialog open={gameState === 'setup'} disableEscapeKeyDown>
        <DialogTitle sx={{ textAlign: 'center' }}>
          🎮 אימון אנגלית - מילות SQL
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              ברוכים הבאים למשחק הלימודי! 🎯
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>איך משחקים?</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ marginRight: 20 }}>
                <li>תוצג בפניכם מילה באנגלית מעולם ה-SQL</li>
                <li>עליכם לבחור את המשמעות הנכונה בעברית מתוך 4 אפשרויות</li>
                <li>🔊 לחצו על כפתור הרמקול כדי לשמוע את המילה באנגלית!</li>
                <li>המשחק נמשך 4 דקות</li>
                <li>כל תשובה נכונה שווה 10 נקודות</li>
                <li>תשובה שגויה לא מפחיתה ניקוד</li>
              </ul>
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="הזן שם משתמש"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError('');
            }}
            error={!!usernameError}
            helperText={usernameError}
            autoFocus
            sx={{ direction: 'rtl' }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => navigate('/games')} variant="outlined">
            חזור
          </Button>
          <Button onClick={startGame} variant="contained" size="large">
            התחל משחק
          </Button>
        </DialogActions>
      </Dialog>

      {/* Playing State */}
      {gameState === 'playing' && currentQuestion && (
        <Box>
          {/* Header with timer and score */}
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon color={timeLeft < 30 ? 'error' : 'primary'} />
                <Typography variant="h5" color={timeLeft < 30 ? 'error' : 'inherit'}>
                  {formatTime(timeLeft)}
                </Typography>
              </Box>
              <Typography variant="h5">
                ניקוד: {score}
              </Typography>
              <Typography variant="body1">
                שאלה {totalQuestions + 1} | נכונות: {correctAnswers}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ height: 8, borderRadius: 1 }}
              color={timeLeft < 30 ? 'error' : 'primary'}
            />
          </Paper>

          {/* Question */}
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              מה המשמעות של:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, my: 4 }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {currentQuestion.word.englishTerm}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => speakWord(currentQuestion.word.englishTerm)}
                disabled={isSpeaking}
                sx={{ 
                  minWidth: 60, 
                  height: 60,
                  borderRadius: '50%',
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'scale(1.1)',
                    transition: 'transform 0.2s'
                  }
                }}
              >
                <VolumeUpIcon sx={{ fontSize: 32 }} />
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ({currentQuestion.word.role})
            </Typography>

            {/* Feedback */}
            {feedback && (
              <Alert 
                severity={feedback === 'correct' ? 'success' : 'error'}
                icon={feedback === 'correct' ? <CheckCircleIcon /> : <CancelIcon />}
                sx={{ mb: 3 }}
              >
                {feedback === 'correct' ? 'כל הכבוד! תשובה נכונה! 🎉' : `התשובה הנכונה היא: ${currentQuestion.correctAnswer}`}
              </Alert>
            )}

            {/* Options */}
            <FormControl component="fieldset" fullWidth sx={{ mt: 3 }}>
              <RadioGroup value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)}>
                {currentQuestion.options.map((option, index) => (
                  <Paper 
                    key={index} 
                    elevation={selectedAnswer === option ? 4 : 1}
                    sx={{ 
                      mb: 2, 
                      p: 2,
                      border: selectedAnswer === option ? 2 : 0,
                      borderColor: 'primary.main',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => !feedback && setSelectedAnswer(option)}
                  >
                    <FormControlLabel
                      value={option}
                      control={<Radio />}
                      label={<Typography variant="h6">{option}</Typography>}
                      disabled={!!feedback}
                      sx={{ width: '100%', margin: 0 }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>

            <Button 
              variant="contained" 
              size="large" 
              fullWidth
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer || !!feedback}
              sx={{ mt: 3, py: 2 }}
            >
              אשר תשובה
            </Button>
          </Paper>
        </Box>
      )}

      {/* Finished State */}
      {gameState === 'finished' && (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            🎉 המשחק הסתיים!
          </Typography>
          <Box sx={{ my: 4 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              הניקוד שלך: {score}
            </Typography>
            <Typography variant="h6">
              ענית נכון על {correctAnswers} מתוך {totalQuestions} שאלות
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              אחוז הצלחה: {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" onClick={() => {
              setGameState('setup');
              setUsername('');
            }}>
              שחק שוב
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/games/sql-english/leaderboard')}>
              טבלת מובילים
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/games/sql-english/history')}>
              ההיסטוריה שלי
            </Button>
            <Button variant="outlined" onClick={() => navigate('/games')}>
              חזור למשחקים
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
}
