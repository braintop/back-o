import { useEffect, useState } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Box, Button, CircularProgress,
  Avatar
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { GameScore } from '../../firebase/gamesApi';
import { getTopScores } from '../../firebase/gamesApi';

const GAME_TYPE_MAP: Record<string, string> = {
  'sql-english': 'sql-english-trainer'
};

const GAME_NAME_MAP: Record<string, string> = {
  'sql-english': 'אימון אנגלית - מילות SQL'
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScores();
  }, [gameId]);

  const loadScores = async () => {
    if (!gameId) return;
    
    setLoading(true);
    try {
      const gameType = GAME_TYPE_MAP[gameId];
      const topScores = await getTopScores(gameType, 10);
      setScores(topScores);
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRowStyle = (position: number) => {
    switch (position) {
      case 1:
        return { bgcolor: 'gold', fontWeight: 'bold' };
      case 2:
        return { bgcolor: 'silver', fontWeight: 'bold' };
      case 3:
        return { bgcolor: '#CD7F32', fontWeight: 'bold' };
      default:
        return {};
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, direction: 'rtl' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/games')}
          sx={{ ml: 2 }}
        >
          חזור
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
          <EmojiEventsIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 40 }} />
          טבלת מובילים
        </Typography>
      </Box>

      <Typography variant="h6" align="center" gutterBottom>
        {gameId && GAME_NAME_MAP[gameId]}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : scores.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            עדיין אין ציונים במשחק זה
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            היה הראשון לשחק ולהופיע בטבלה!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate(`/games/${gameId}`)}
            sx={{ mt: 3 }}
          >
            שחק עכשיו
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>מקום</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>שחקן</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>ניקוד</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>תשובות נכונות</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>אחוז הצלחה</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scores.map((score, index) => {
                const position = index + 1;
                const medal = getMedalIcon(position);
                const successRate = Math.round((score.correctAnswers / score.totalQuestions) * 100);
                
                return (
                  <TableRow 
                    key={score.id} 
                    sx={{
                      ...getRowStyle(position),
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: position <= 3 ? 'transparent' : 'primary.main' }}>
                          {medal || position}
                        </Avatar>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={position <= 3 ? 'bold' : 'normal'}>
                        {score.username}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" color="primary">
                        {score.score}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {score.correctAnswers} / {score.totalQuestions}
                    </TableCell>
                    <TableCell align="center">
                      {successRate}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate(`/games/${gameId}`)}
        >
          שחק עכשיו
        </Button>
      </Box>
    </Container>
  );
}
