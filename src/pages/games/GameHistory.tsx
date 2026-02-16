import { useState } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Box, Button, CircularProgress,
  TextField
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import type { GameScore } from '../../firebase/gamesApi';
import { getUserGameHistory } from '../../firebase/gamesApi';

const GAME_TYPE_MAP: Record<string, string> = {
  'sql-english': 'sql-english-trainer'
};

const GAME_NAME_MAP: Record<string, string> = {
  'sql-english': 'אימון אנגלית - מילות SQL'
};

export default function GameHistory() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const [username, setUsername] = useState('');
  const [history, setHistory] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    if (!username.trim()) {
      setError('אנא הזן שם משתמש');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    
    try {
      const gameType = gameId ? GAME_TYPE_MAP[gameId] : undefined;
      const userHistory = await getUserGameHistory(username.trim(), gameType);
      setHistory(userHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      setError('שגיאה בטעינת ההיסטוריה');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, direction: 'rtl' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/games')}
          sx={{ ml: 2 }}
        >
          חזור
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
          <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 40 }} />
          היסטוריית משחקים
        </Typography>
      </Box>

      {gameId && (
        <Typography variant="h6" align="center" gutterBottom>
          {GAME_NAME_MAP[gameId]}
        </Typography>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="הזן שם משתמש"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && loadHistory()}
            error={!!error}
            helperText={error}
          />
          <Button 
            variant="contained" 
            onClick={loadHistory}
            startIcon={<SearchIcon />}
            sx={{ minWidth: 120, height: 56 }}
          >
            חפש
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : searched && history.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            לא נמצאה היסטוריה עבור המשתמש "{username}"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {gameId 
              ? 'נראה שעדיין לא שיחקת במשחק זה'
              : 'נראה שעדיין לא שיחקת באף משחק'}
          </Typography>
          {gameId && (
            <Button 
              variant="contained" 
              onClick={() => navigate(`/games/${gameId}`)}
              sx={{ mt: 3 }}
            >
              שחק עכשיו
            </Button>
          )}
        </Paper>
      ) : history.length > 0 ? (
        <>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light' }}>
            <Typography variant="h6" gutterBottom>
              סטטיסטיקות של {username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  משחקים ששוחקו
                </Typography>
                <Typography variant="h5">
                  {history.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  ניקוד הכי גבוה
                </Typography>
                <Typography variant="h5" color="primary">
                  {Math.max(...history.map(h => h.score))}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  ניקוד ממוצע
                </Typography>
                <Typography variant="h5">
                  {Math.round(history.reduce((acc, h) => acc + h.score, 0) / history.length)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  אחוז הצלחה ממוצע
                </Typography>
                <Typography variant="h5">
                  {Math.round(
                    history.reduce((acc, h) => acc + (h.correctAnswers / h.totalQuestions), 0) / history.length * 100
                  )}%
                </Typography>
              </Box>
            </Box>
          </Paper>

          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>תאריך</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>ניקוד</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>תשובות נכונות</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>אחוז הצלחה</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>זמן משחק</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((game, index) => {
                  const successRate = Math.round((game.correctAnswers / game.totalQuestions) * 100);
                  const isTopScore = game.score === Math.max(...history.map(h => h.score));
                  
                  return (
                    <TableRow 
                      key={game.id || index}
                      sx={{
                        bgcolor: isTopScore ? 'success.light' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(game.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="h6" 
                          color={isTopScore ? 'success.dark' : 'primary'}
                          fontWeight={isTopScore ? 'bold' : 'normal'}
                        >
                          {game.score}
                          {isTopScore && ' 🏆'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {game.correctAnswers} / {game.totalQuestions}
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          color={successRate >= 80 ? 'success.main' : successRate >= 60 ? 'warning.main' : 'error.main'}
                        >
                          {successRate}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {formatDuration(game.duration)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}

      {searched && history.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate(gameId ? `/games/${gameId}` : '/games')}
          >
            {gameId ? 'שחק שוב' : 'בחר משחק'}
          </Button>
        </Box>
      )}
    </Container>
  );
}
