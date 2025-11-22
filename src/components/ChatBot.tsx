import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    CircularProgress,
    Avatar,
    Tooltip
} from '@mui/material';
import { Send as SendIcon, SmartToy as BotIcon, Mic as MicIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';
import { askAI } from '../services/aiService';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export default function ChatBot() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'שלום! אני עוזר AI. אני יכול לענות על שאלות על הקורסים והשיעורים. איך אוכל לעזור?',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // אתחול Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'he-IL'; // עברית
                recognition.continuous = false;
                recognition.interimResults = false;

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                    setIsListening(false);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }

        // אתחול Speech Synthesis
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthesisRef.current = window.speechSynthesis;
        }
    }, []);

    // פונקציה להתחלת זיהוי דיבור
    const handleStartListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    // פונקציה להפסקת זיהוי דיבור
    const handleStopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // פונקציה להשמעת תשובה בקול
    const handleSpeak = (text: string) => {
        if (synthesisRef.current) {
            // עצירת דיבור קודם אם יש
            synthesisRef.current.cancel();
            
            // ניקוי הטקסט מסימנים שלא רוצים לשמוע
            let cleanText = text;
            // הסרת כוכביות (*)
            cleanText = cleanText.replace(/\*/g, '');
            // הסרת סימני markdown נוספים אם יש
            cleanText = cleanText.replace(/\*\*/g, ''); // הסרת **
            cleanText = cleanText.replace(/#{1,6}\s/g, ''); // הסרת כותרות markdown
            cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // הסרת לינקים markdown
            // ניקוי רווחים כפולים
            cleanText = cleanText.replace(/\s+/g, ' ').trim();
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'he-IL'; // עברית
            utterance.rate = 1; // מהירות
            utterance.pitch = 1; // גובה קול
            utterance.volume = 1; // עוצמה

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            synthesisRef.current.speak(utterance);
        }
    };


    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await askAI(input);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            // לא משמיעים אוטומטית - רק לחיצה ידנית על כפתור הרמקול
        } catch (error: any) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `שגיאה: ${error.message || 'שגיאה לא ידועה'}`,
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '600px',
            maxWidth: '800px',
            margin: '0 auto',
            dir: 'rtl'
        }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    borderRadius: 2
                }}
            >
                {/* Header */}
                <Box sx={{ 
                    p: 2, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'primary.main',
                    color: 'white'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BotIcon />
                        <Typography variant="h6" component="h2">
                            עוזר AI - שאל על קורסים ושיעורים
                        </Typography>
                    </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {messages.map((message) => (
                        <Box
                            key={message.id}
                            sx={{
                                display: 'flex',
                                justifyContent: message.isUser ? 'flex-start' : 'flex-end',
                                gap: 1
                            }}
                        >
                            {!message.isUser && (
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <BotIcon />
                                </Avatar>
                            )}
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    maxWidth: '70%',
                                    backgroundColor: message.isUser ? 'primary.light' : 'grey.100',
                                    color: message.isUser ? 'white' : 'text.primary',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                                    {message.text}
                                </Typography>
                                {!message.isUser && (
                                    <Tooltip title="השמע בקול">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleSpeak(message.text)}
                                            disabled={isSpeaking}
                                            sx={{ color: 'inherit' }}
                                        >
                                            <VolumeUpIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Paper>
                            {message.isUser && (
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                    אתה
                                </Avatar>
                            )}
                        </Box>
                    ))}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    backgroundColor: 'grey.100',
                                    borderRadius: 2
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    מחשב...
                                </Typography>
                            </Paper>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input */}
                <Box sx={{ 
                    p: 2, 
                    borderTop: 1, 
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1
                }}>
                    <TextField
                        fullWidth
                        placeholder="שאל שאלה על קורסים או שיעורים..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading || isListening}
                        multiline
                        maxRows={3}
                        inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                        InputLabelProps={{ style: { direction: 'rtl' } }}
                    />
                    <Tooltip title={isListening ? "עצור הקלטה" : "הקלט בקול"}>
                        <IconButton
                            color={isListening ? "error" : "primary"}
                            onClick={isListening ? handleStopListening : handleStartListening}
                            disabled={loading}
                            sx={{ alignSelf: 'flex-end' }}
                        >
                            <MicIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={loading || !input.trim() || isListening}
                        sx={{ alignSelf: 'flex-end' }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
}

