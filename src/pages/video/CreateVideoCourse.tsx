import { useState } from 'react';
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
    FormControlLabel,
    Switch
} from '@mui/material';
import { createVideoCourse } from '../../firebase/videoCoursesApi';
import { auth } from '../../firebase/firebase';

export default function CreateVideoCourse() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        syllabusLink: '',
        imageUrl: '',
        editorName: '',
        introVideoUrl: '',
        isVisible: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const availableImages = [
        { value: '/da1.png', label: 'da1.png' },
        { value: '/full1.png', label: 'full1.png' },
        { value: '/full2.png', label: 'full2.png' },
        { value: '/full3.png', label: 'full3.png' },
        { value: '/full4.png', label: 'full4.png' }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const handleSelectChange = (e: { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const handleToggleVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            isVisible: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!auth.currentUser) {
            setError('אתה צריך להיות מחובר כדי ליצור קורס וידאו');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const courseId = await createVideoCourse({
                name: formData.name,
                description: formData.description,
                syllabusLink: formData.syllabusLink.trim() || undefined,
                imageUrl: formData.imageUrl || undefined,
                editorName: formData.editorName.trim() || undefined,
                introVideoUrl: formData.introVideoUrl.trim() || undefined,
                isVisible: formData.isVisible,
                createdBy: auth.currentUser.uid
            });

            navigate(`/video-courses/${courseId}`);
        } catch (err: any) {
            setError(err.message || 'שגיאה ביצירת קורס וידאו');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" dir="rtl">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        הוספת קורס וידאו
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
                            inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                            InputLabelProps={{ style: { direction: 'rtl' } }}
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
                            inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                            InputLabelProps={{ style: { direction: 'rtl' } }}
                        />
                        <TextField
                            fullWidth
                            label="סילבוס הקורס (לינק)"
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
                        <TextField
                            fullWidth
                            label="עורך הקורס"
                            name="editorName"
                            value={formData.editorName}
                            onChange={handleChange}
                            margin="normal"
                            inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                            InputLabelProps={{ style: { direction: 'rtl' } }}
                        />
                        <TextField
                            fullWidth
                            label="לינק לוידאו פתיחה של הקורס"
                            name="introVideoUrl"
                            value={formData.introVideoUrl}
                            onChange={handleChange}
                            margin="normal"
                            placeholder="https://..."
                            type="url"
                        />
                        <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isVisible}
                                        onChange={handleToggleVisible}
                                        color="primary"
                                    />
                                }
                                label="להציג את הקורס"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                onClick={() => navigate('/video-courses')}
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
                                {loading ? <CircularProgress size={24} /> : 'צור קורס וידאו'}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
}


