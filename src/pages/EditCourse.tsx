import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    MenuItem,
    Card,
    CardMedia,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { getCourseById, updateCourse, type Course } from '../firebase/coursesApi';
import { auth } from '../firebase/firebase';
import { getUsers, getUserByUid, type User } from '../firebase/usersApi';

export default function EditCourse() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        syllabusLink: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedEditors, setSelectedEditors] = useState<User[]>([]);
    const [editorsDialogOpen, setEditorsDialogOpen] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [courseEditors, setCourseEditors] = useState<string[] | undefined>(undefined);

    // רשימת תמונות מתיקיית public
    const availableImages = [
        { value: '/da1.png', label: 'da1.png' },
        { value: '/full1.png', label: 'full1.png' },
        { value: '/full2.png', label: 'full2.png' },
        { value: '/full3.png', label: 'full3.png' },
        { value: '/full4.png', label: 'full4.png' }
    ];

    useEffect(() => {
        if (courseId) {
            initialize();
        }
    }, [courseId]);

    const initialize = async () => {
        try {
            let isCurrentAdmin = false;
            if (auth.currentUser) {
                const current = await getUserByUid(auth.currentUser.uid);
                if (current?.role === 'admin') {
                    isCurrentAdmin = true;
                    setIsAdmin(true);
                }
            }

            if (isCurrentAdmin) {
                await Promise.all([loadUsers(), loadCourse()]);
            } else {
                await loadCourse();
            }
        } catch (err) {
            console.error('Error initializing EditCourse:', err);
            await loadCourse();
        }
    };

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

    const loadCourse = async () => {
        if (!courseId) return;
        
        try {
            setLoading(true);
            setError(null);
            const course = await getCourseById(courseId);
            
            if (course) {
                setFormData({
                    name: course.name,
                    description: course.description || '',
                    imageUrl: course.imageUrl || '',
                    syllabusLink: course.syllabusLink || ''
                });

                // נשמור את רשימת ה-editors מהקורס כדי שנוכל להצליב עם המשתמשים כשייטענו
                setCourseEditors((course as Course).editors || []);
            } else {
                setError('קורס לא נמצא');
            }
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת קורס');
        } finally {
            setLoading(false);
        }
    };

    // ברגע שיש לנו גם משתמשים וגם editors מהקורס – נבנה את רשימת העורכים להצגה מתחת לכפתור
    useEffect(() => {
        if (!isAdmin) return;
        if (!courseEditors || courseEditors.length === 0) {
            setSelectedEditors([]);
            return;
        }
        if (users.length === 0) return;

        const editorsUsers = users.filter((u) => courseEditors.includes(u.uid));
        setSelectedEditors(editorsUsers);
    }, [isAdmin, users, courseEditors]);

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
        
        if (!courseId) {
            setError('קורס לא נמצא');
            return;
        }

        if (!auth.currentUser) {
            setError('אתה צריך להיות מחובר כדי לערוך קורס');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await updateCourse(courseId, {
                name: formData.name,
                description: formData.description,
                imageUrl: formData.imageUrl || undefined,
                syllabusLink: formData.syllabusLink.trim() || undefined,
                editors: isAdmin ? selectedEditors.map(u => u.uid) : undefined
            });
            navigate(`/courses/${courseId}`);
        } catch (err: any) {
            setError(err.message || 'שגיאה בעדכון קורס');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        עריכת קורס
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
                            <Box sx={{ mt: 2, mb: 2, position: 'relative' }}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={formData.imageUrl}
                                        alt="תמונת הקורס"
                                        sx={{ objectFit: 'contain' }}
                                    />
                                </Card>
                                <IconButton
                                    color="error"
                                    sx={{ position: 'absolute', top: 8, left: 8 }}
                                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        )}
                        {isAdmin && (
                            <Box sx={{ mt: 2, mb: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setEditorsDialogOpen(true)}
                                    disabled={loadingUsers}
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
                                onClick={() => navigate(`/courses/${courseId}`)}
                                disabled={saving}
                            >
                                ביטול
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={saving}
                            >
                                {saving ? <CircularProgress size={24} /> : 'שמור שינויים'}
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

