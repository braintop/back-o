import { useState } from 'react';
import { 
    Container, 
    Paper, 
    TextField, 
    Button, 
    Typography, 
    Box,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { registerUser } from '../firebase/api';

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        email: '',
        password: '',
        role: 'student' as 'user' | 'admin' | 'student' | 'teacher'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name as keyof typeof prev]: value as any
        }));
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const user = await registerUser(formData);
            console.log('User registered successfully:', user);
            setSuccess(true);
            setFormData({ firstName: '', email: '', password: '', role: 'student' });
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'שגיאה ברישום המשתמש');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        הרשמה
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            ההרשמה בוצעה בהצלחה!
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="שם פרטי"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange as any}
                            margin="normal"
                            required
                            autoComplete="given-name"
                        />
                        <TextField
                            fullWidth
                            label="אימייל"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange as any}
                            margin="normal"
                            required
                            autoComplete="email"
                        />
                        <TextField
                            fullWidth
                            label="סיסמה"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange as any}
                            margin="normal"
                            required
                            autoComplete="new-password"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>תפקיד</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                label="תפקיד"
                                onChange={handleChange}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="student">Student</MenuItem>
                                <MenuItem value="teacher">Teacher</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'הרשמה'}
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
}