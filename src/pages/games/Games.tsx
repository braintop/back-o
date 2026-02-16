import { Container, Typography, Card, CardContent, CardActions, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HistoryIcon from '@mui/icons-material/History';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const games: Game[] = [
  {
    id: 'sql-english',
    title: 'אימון אנגלית - מילות SQL',
    description: 'משחק לימודי שנועד ללמד אנשים חדשים בשפה האנגלית מילים הקשורות לעולם ה-SQL וה-Data Analyst. המשחק מציג מילות SQL באנגלית ועליך לבחור את המשמעות הנכונה בעברית תוך 4 דקות. כולל קריאה קולית לכל מילה! 🔊',
    icon: <SchoolIcon sx={{ fontSize: 60 }} />,
    route: '/games/sql-english'
  }
];

export default function Games() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, direction: 'rtl' }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        🎮 משחקים לימוdiים
      </Typography>
      
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        בחר משחק והתחל ללמוד בצורה מהנה ואינטראקטיבית!
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {games.map((game) => (
          <Card 
            key={game.id}
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {game.icon}
              </Box>
              <Typography variant="h5" component="h2" gutterBottom>
                {game.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {game.description}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate(game.route)}
                startIcon={<SchoolIcon />}
              >
                שחק עכשיו
              </Button>
              <Button 
                variant="outlined"
                onClick={() => navigate(`${game.route}/leaderboard`)}
                startIcon={<EmojiEventsIcon />}
              >
                טבלת מובילים
              </Button>
              <Button 
                variant="outlined"
                onClick={() => navigate(`${game.route}/history`)}
                startIcon={<HistoryIcon />}
              >
                היסטוריה
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          💡 טיפים למשחק:
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ marginRight: 20 }}>
            <li>כל משחק נמשך 4 דקות - נסה לענות על כמה שיותר שאלות!</li>
            <li>ככל שתענה יותר תשובות נכונות, הניקוד שלך יהיה גבוה יותר</li>
            <li>שים לב - תשובה שגויה לא תפחית ניקוד, אז אל תפחד לנסות!</li>
            <li>🔊 לחץ על כפתור הרמקול כדי לשמוע את הביטוי הנכון של המילה באנגלית!</li>
            <li>תוכל לראות את ההיסטוריה שלך ולהשוות את עצמך לשחקנים אחרים</li>
            <li>התחרו עם חברים ושפרו את האנגלית שלכם בתחום ה-SQL!</li>
          </ul>
        </Typography>
      </Box>
    </Container>
  );
}
