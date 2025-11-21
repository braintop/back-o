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
    Grid,
    Rating,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { createLesson } from '../firebase/lessonsApi';
import { auth } from '../firebase/firebase';
import { getUsers, type User } from '../firebase/usersApi';
import { getSharedFiles, type SharedFile } from '../firebase/sharedFilesApi';

export default function CreateLesson() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        description: '',
        rating: 0,
        instructorId: '',
        files: [] as Array<{ id: string; name: string; url: string; type: string }>
    });
    const [users, setUsers] = useState<User[]>([]);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileDialogOpen, setFileDialogOpen] = useState(false);
    const [customFileUrl, setCustomFileUrl] = useState('');
    const [customFileName, setCustomFileName] = useState('');
    const [customFileType, setCustomFileType] = useState<'presentation' | 'worksheet' | 'solutions'>('presentation');
    const [customFileDialogOpen, setCustomFileDialogOpen] = useState(false);

    useEffect(() => {
        loadUsers();
        loadSharedFiles();
    }, []);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const usersList = await getUsers();
            setUsers(usersList);
            // אם המשתמש המחובר קיים, נבחר אותו כברירת מחדל
            if (auth.currentUser) {
                const currentUser = usersList.find(u => u.uid === auth.currentUser?.uid);
                if (currentUser) {
                    setFormData(prev => ({ ...prev, instructorId: currentUser.uid }));
                }
            }
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת משתמשים');
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadSharedFiles = async () => {
        try {
            const files = await getSharedFiles();
            setSharedFiles(files);
        } catch (err: any) {
            console.error('Error loading shared files:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError(null);
    };

    const handleSelectChange = (e: { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError(null);
    };


    const handleRatingChange = (_event: React.SyntheticEvent, newValue: number | null) => {
        setFormData({
            ...formData,
            rating: newValue || 0
        });
    };

    const handleOpenFileDialog = () => {
        setFileDialogOpen(true);
    };

    const handleCloseFileDialog = () => {
        setFileDialogOpen(false);
    };

    const handleSelectFile = (file: SharedFile) => {
        // בודק אם הקובץ כבר קיים ברשימה
        if (!formData.files.find(f => f.id === file.id)) {
            setFormData({
                ...formData,
                files: [...formData.files, {
                    id: file.id!,
                    name: file.name,
                    url: file.url,
                    type: file.type
                }]
            });
        }
        handleCloseFileDialog();
    };

    const handleRemoveFile = (index: number) => {
        setFormData({
            ...formData,
            files: formData.files.filter((_, i) => i !== index)
        });
    };

    const handleAddCustomFile = () => {
        if (customFileUrl.trim() && customFileName.trim()) {
            setFormData({
                ...formData,
                files: [...formData.files, {
                    id: '',
                    name: customFileName.trim(),
                    url: customFileUrl.trim(),
                    type: customFileType
                }]
            });
            setCustomFileUrl('');
            setCustomFileName('');
            setCustomFileDialogOpen(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!courseId) {
            setError('קורס לא נמצא');
            return;
        }

        if (!auth.currentUser) {
            setError('אתה צריך להיות מחובר כדי ליצור שיעור');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // יצירת השיעור עם לינקי דרייב
            if (!formData.instructorId) {
                setError('יש לבחור מדריך');
                return;
            }

            const selectedInstructor = users.find(u => u.uid === formData.instructorId);
            if (!selectedInstructor) {
                setError('מדריך לא נמצא');
                return;
            }

            const lessonData: any = {
                courseId,
                title: formData.title,
                date: new Date(formData.date),
                startTime: formData.startTime,
                endTime: formData.endTime,
                instructorId: formData.instructorId,
                instructorName: selectedInstructor.name,
                files: formData.files
            };

            // מוסיף רק שדות שיש להם ערך
            if (formData.description) {
                lessonData.description = formData.description;
            }
            if (formData.rating > 0) {
                lessonData.rating = formData.rating;
            }

            await createLesson(lessonData);

            navigate(`/courses/${courseId}`);
        } catch (err: any) {
            setError(err.message || 'שגיאה ביצירת שיעור');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        הוספת שיעור חדש
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="שם השיעור"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="תאריך"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    required
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="שעת התחלה"
                                    name="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    required
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="שעת סיום"
                                    name="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    required
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="תיאור השיעור"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>מדריך</InputLabel>
                                    <Select
                                        name="instructorId"
                                        value={formData.instructorId}
                                        onChange={handleSelectChange}
                                        label="מדריך"
                                        disabled={loadingUsers}
                                    >
                                        {users.map((user) => (
                                            <MenuItem key={user.uid} value={user.uid}>
                                                {user.name} ({user.email})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12}>
                                <Box>
                                    <Typography component="legend" gutterBottom>
                                        דירוג
                                    </Typography>
                                    <Rating
                                        name="rating"
                                        value={formData.rating}
                                        onChange={handleRatingChange}
                                    />
                                </Box>
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid types issue */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>קבצים</Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleOpenFileDialog}
                                    >
                                        הוסף קובץ מהמאגר
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setCustomFileDialogOpen(true)}
                                    >
                                        הוסף לינק פרטי
                                    </Button>
                                </Box>
                                {formData.files.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        {formData.files.map((file, index) => (
                                            <Box 
                                                key={index}
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'space-between',
                                                    p: 1,
                                                    mb: 1,
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 1
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {file.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {file.type === 'presentation' ? 'מצגת' : 
                                                         file.type === 'worksheet' ? 'דף עבודה' : 
                                                         'פתרונות'}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveFile(index)}
                                                >
                                                    הסר
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                onClick={() => navigate(`/courses/${courseId}`)}
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
                                {loading ? <CircularProgress size={24} /> : 'צור שיעור'}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Box>

            <Dialog 
                open={fileDialogOpen} 
                onClose={handleCloseFileDialog} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>
                    בחר קובץ מהמאגר
                </DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>שם</TableCell>
                                    <TableCell>סוג</TableCell>
                                    <TableCell>תיאור</TableCell>
                                    <TableCell>לינק</TableCell>
                                    <TableCell>פעולה</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sharedFiles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                אין קבצים במאגר
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sharedFiles.map((file) => {
                                        const isSelected = formData.files.find(f => f.id === file.id);
                                        return (
                                            <TableRow key={file.id} hover>
                                                <TableCell>{file.name}</TableCell>
                                                <TableCell>
                                                    {file.type === 'presentation' ? 'מצגת' : 
                                                     file.type === 'worksheet' ? 'דף עבודה' : 
                                                     'פתרונות'}
                                                </TableCell>
                                                <TableCell>{file.description || '-'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        startIcon={<LinkIcon />}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        פתח
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleSelectFile(file)}
                                                        disabled={!!isSelected}
                                                    >
                                                        {isSelected ? 'נבחר' : 'בחר'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseFileDialog}>ביטול</Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={customFileDialogOpen} 
                onClose={() => setCustomFileDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
            >
                <DialogTitle>
                    הוסף לינק פרטי
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            fullWidth
                            label="שם הקובץ"
                            value={customFileName}
                            onChange={(e) => setCustomFileName(e.target.value)}
                            placeholder="הזן שם לקובץ"
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>סוג קובץ</InputLabel>
                            <Select
                                value={customFileType}
                                onChange={(e) => setCustomFileType(e.target.value as any)}
                                label="סוג קובץ"
                            >
                                <MenuItem value="presentation">מצגת</MenuItem>
                                <MenuItem value="worksheet">דף עבודה</MenuItem>
                                <MenuItem value="solutions">פתרונות</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="לינק"
                            value={customFileUrl}
                            onChange={(e) => setCustomFileUrl(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCustomFileDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleAddCustomFile} variant="contained">הוסף</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

