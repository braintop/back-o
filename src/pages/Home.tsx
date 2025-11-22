import { Container, Typography, Box } from '@mui/material';
import ChatBot from '../components/ChatBot';

export default function Home() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, dir: 'rtl' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    עמוד הבית
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                    שאל את עוזר AI שאלות על הקורסים והשיעורים
                </Typography>
            </Box>
            <ChatBot />
        </Container>
    );
}