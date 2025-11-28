import { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Button, Alert, CircularProgress } from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function Profile() {
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        setEmail(user?.email || null);
    }, []);

    const handleSendResetLink = async () => {
        if (!email) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess('קישור להחלפת סיסמה נשלח למייל שלך.');
        } catch (err: any) {
            setError(err.message || 'שגיאה בשליחת קישור לאיפוס סיסמה');
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        פרופיל
                    </Typography>
                    <Alert severity="warning">
                        לא נמצא משתמש מחובר.
                    </Alert>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    פרופיל משתמש
                </Typography>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        אימייל:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        {email}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSendResetLink}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'החלפת סיסמה - שלח קישור למייל'}
                </Button>
            </Paper>
        </Container>
    );
}


