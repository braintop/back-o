import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Card,
    CardMedia,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Chip
} from '@mui/material';
import { createCourse } from '../firebase/coursesApi';
import { auth } from '../firebase/firebase';
import { getUsers, getUserByUid, type User } from '../firebase/usersApi';

export default function CreateCourse() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        syllabusLink: ''
    });
    
    // רשימת תמונות מתיקיית public
    const availableImages = [
        { value: '/da1.png', label: 'da1.png' },
        { value: '/full1.png', label: 'full1.png' },
        { value: '/full2.png', label: 'full2.png' },
        { value: '/full3.png', label: 'full3.png' },
        { value: '/full4.png', label: 'full4.png' }
    ];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedEditors, setSelectedEditors] = useState<User[]>([]);
    const [editorsDialogOpen, setEditorsDialogOpen] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!auth.currentUser) return;
            try {
                const current = await getUserByUid(auth.currentUser.uid);
                if (current?.role === 'admin') {
                    setIsAdmin(true);
                    await loadUsers();
                }
            } catch (err) {
                console.error('Error determining admin role:', err);
            }
        };
        init();
    }, []);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const list = await getUsers();
            setUsers(list);
        } catch (err) {
            console.error('Error loading users for course editors:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(null);
    };

    const handleSelectChange = (e: { target: { name: string; value: string } }) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!auth.currentUser) {
            setError('אתה צריך להיות מחובר כדי ליצור קורס');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const courseId = await createCourse({
                name: formData.name,
                description: formData.description,
                imageUrl: formData.imageUrl || undefined,
                syllabusLink: formData.syllabusLink.trim() || undefined,
                createdBy: auth.currentUser.uid,
                editors: selectedEditors.map((u) => u.uid)
            });
            navigate(`/courses/${courseId}`);
        } catch (err: any) {
            setError(err.message || 'שגיאה ביצירת קורס');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        יצירת קורס חדש
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="שם הקורס"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="תיאור הקורס"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <TextField
                            fullWidth
                            label="לינק לסילבוס"
                            name="syllabusLink"
                            value={formData.syllabusLink}
                            onChange={handleChange}
                            margin="normal"
                            placeholder="https://..."
                            type="url"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>תמונת הקורס</InputLabel>
                            <Select
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleSelectChange}
                                label="תמונת הקורס"
                            >
                                <MenuItem value="">ללא תמונה</MenuItem>
                                {availableImages.map((img) => (
                                    <MenuItem key={img.value} value={img.value}>
                                        {img.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {formData.imageUrl && (
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={formData.imageUrl}
                                        alt="תמונת הקורס"
                                        sx={{ objectFit: 'contain' }}
                                    />
                                </Card>
                            </Box>
                        )}
                        {isAdmin && (
                            <Box sx={{ mt: 2, mb: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setEditorsDialogOpen(true)}
                                >
                                    נהל עורכי קורס (CRUD)
                                </Button>
                                {selectedEditors.length > 0 && (
                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedEditors.map((u) => (
                                            <Chip
                                                key={u.uid}
                                                label={`${u.name} (${u.email})`}
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                onClick={() => navigate('/courses')}
                                disabled={loading}
                            >
                                ביטול
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'צור קורס'}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Box>

            {isAdmin && (
                <Dialog
                    open={editorsDialogOpen}
                    onClose={() => setEditorsDialogOpen(false)}
                    fullWidth
                    maxWidth="sm"
                    dir="rtl"
                >
                    <DialogTitle>בחר משתמשים עם הרשאת CRUD על הקורס</DialogTitle>
                    <DialogContent>
                        <Autocomplete
                            multiple
                            options={users}
                            getOptionLabel={(option) => `${option.name} (${option.email})`}
                            value={selectedEditors}
                            onChange={(_, value) => setSelectedEditors(value)}
                            loading={loadingUsers}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="משתמשים"
                                    placeholder="התחל להקליד שם או אימייל..."
                                />
                            )}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditorsDialogOpen(false)}>סגור</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Container>
    );
}

